"""
Explainable Security Intelligence Module for SENTINELMESH.

Generates transparent, evidence-backed explanations grounded solely in observed
traffic feature values, dataset baseline statistics, model outputs, and active
security heuristics. Never fabricates unsupported reasoning.
"""

from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

from src.utils import SENSITIVE_PORTS, is_benign_label


def evaluate_record_heuristics(
    row: pd.Series,
    baselines: Dict[str, Dict[str, float]],
    column_mapping: Dict[str, Optional[str]],
) -> List[str]:
    """
    Evaluate transparent, documented security heuristics on a single traffic record
    using only columns actually present in the dataset.
    """
    flags: List[str] = []

    # 1. Sensitive / high-risk destination port check
    dst_port_col = column_mapping.get("dst_port")
    if dst_port_col and dst_port_col in row.index and pd.notna(row[dst_port_col]):
        try:
            port = int(float(row[dst_port_col]))
            if port in SENSITIVE_PORTS:
                # Only treat common management/suspicious ports as notable if paired with unusual activity or known risk port
                if port in (23, 135, 139, 445, 3389, 4444, 5900, 6379, 8443):
                    flags.append(f"Sensitive destination port {port} ({SENSITIVE_PORTS[port]})")
        except (ValueError, TypeError):
            pass

    # 2. Failed connection bursts (if present)
    for col_name in ("failed_conn_count", "failed_connections", "auth_failures"):
        if col_name in row.index and pd.notna(row[col_name]):
            try:
                val = float(row[col_name])
                if val >= 15:
                    flags.append(f"High failed connection count ({int(val)})")
            except (ValueError, TypeError):
                pass

    # 3. SYN flood indicator (if present)
    if "syn_flag_count" in row.index and pd.notna(row["syn_flag_count"]):
        try:
            syn_val = float(row["syn_flag_count"])
            p95 = baselines.get("syn_flag_count", {}).get("p95", 50.0)
            if syn_val >= max(50.0, p95) and syn_val > 10:
                flags.append(f"Elevated SYN flag volume ({int(syn_val)})")
        except (ValueError, TypeError):
            pass

    # 4. Traffic rate spike (packet_rate / byte_rate > 95th percentile & > 2.5 std)
    for rate_col, label in (
        ("packet_rate", "Unusually high packet rate"),
        ("byte_rate", "Unexpected traffic byte rate"),
        ("bytes_sent", "Large outbound byte volume"),
    ):
        if rate_col in row.index and rate_col in baselines and pd.notna(row[rate_col]):
            try:
                val = float(row[rate_col])
                stats = baselines[rate_col]
                z = (val - stats["mean"]) / stats["std"]
                if z >= 2.5 and val >= stats["p95"]:
                    flags.append(f"{label} ({val:,.1f}, +{z:.1f}σ above mean)")
            except (ValueError, TypeError):
                pass

    # 5. Extreme outbound byte asymmetry (potential exfiltration pattern)
    if "bytes_asymmetry_ratio" in row.index and pd.notna(row["bytes_asymmetry_ratio"]):
        try:
            ratio = float(row["bytes_asymmetry_ratio"])
            if ratio >= 25.0:
                flags.append(f"Highly asymmetric outbound traffic ratio ({ratio:.1f}x sent vs received)")
        except (ValueError, TypeError):
            pass

    return flags


def get_top_deviated_features(
    row: pd.Series,
    baselines: Dict[str, Dict[str, float]],
    feature_columns: List[str],
    top_n: int = 5,
) -> List[Dict[str, Any]]:
    """
    Identify which numerical traffic features on this record deviate most from
    the dataset baseline (ranked by |z-score|).
    """
    deviations: List[Dict[str, Any]] = []
    for col in feature_columns:
        if col not in row.index or col not in baselines:
            continue
        val = row[col]
        if pd.isna(val):
            continue
        try:
            fval = float(val)
        except (ValueError, TypeError):
            continue
        stats = baselines[col]
        z_score = (fval - stats["mean"]) / stats["std"]
        deviations.append(
            {
                "feature": col,
                "value": round(fval, 3),
                "dataset_median": round(stats["median"], 3),
                "dataset_mean": round(stats["mean"], 3),
                "p95": round(stats["p95"], 3),
                "z_score": round(float(z_score), 2),
                "abs_z": abs(float(z_score)),
            }
        )

    deviations.sort(key=lambda d: d["abs_z"], reverse=True)
    return deviations[:top_n]


def build_detection_explanation(
    predicted_category: str,
    model_confidence: Optional[float],
    anomaly_status: str,
    anomaly_score: Optional[float],
    heuristic_flags: List[str],
    deviated_features: List[Dict[str, Any]],
) -> str:
    """
    Construct a concise, factual human-readable explanation grounded strictly
    in observed model outputs, anomaly score, heuristics, and top feature deviations.
    """
    reasons: List[str] = []

    if predicted_category and predicted_category != "N/A (No Supervised Model)":
        if not is_benign_label(predicted_category):
            conf_txt = (
                f" (RF vote proportion: {model_confidence * 100:.1f}%)"
                if model_confidence is not None
                else ""
            )
            reasons.append(f"Random Forest classified traffic as '{predicted_category}'{conf_txt}")

    if anomaly_status == "ANOMALY" and anomaly_score is not None:
        reasons.append(f"Isolation Forest flagged statistical anomaly (score: {anomaly_score:.1f}/100)")

    if heuristic_flags:
        reasons.extend(heuristic_flags[:3])

    if not reasons:
        # Check if any mild deviation exists
        strong_dev = [d for d in deviated_features if d["abs_z"] >= 2.0]
        if strong_dev:
            top = strong_dev[0]
            reasons.append(
                f"Within normal baseline; mild deviation in '{top['feature']}' ({top['value']} vs median {top['dataset_median']})"
            )
        else:
            return "Traffic features align with learned baseline; no suspicious patterns detected."

    return "; ".join(reasons) + "."


def recommend_next_action(
    severity: str,
    predicted_category: str,
    anomaly_status: str,
    heuristic_flags: List[str],
) -> str:
    """
    Provide a safe, non-destructive recommended security analyst investigation step.
    """
    cat_lower = str(predicted_category or "").lower()
    flags_joined = " ".join(heuristic_flags).lower()

    if severity == "LOW":
        return "No immediate action required; continue baseline monitoring."

    if "ddos" in cat_lower or "flood" in cat_lower or "syn" in flags_joined:
        return "Verify traffic spike against expected load; inspect upstream rate-limiting and firewall SYN logs."
    if "scan" in cat_lower or "probe" in cat_lower:
        return "Inspect source host for unauthorized port enumeration; verify firewall port exposure rules."
    if "brute" in cat_lower or "failed connection" in flags_joined:
        return "Audit authentication logs on target service (SSH/RDP/DB) for repeated login failures and account lockout status."
    if "exfil" in cat_lower or "asymmetric" in flags_joined or "outbound" in flags_joined:
        return "Investigate outbound data transfer destination and verify authorization with host owner / DLP logs."
    if anomaly_status == "ANOMALY":
        return "Review deviated flow metrics against host baseline to distinguish benign operational spikes from suspicious activity."

    return "Correlate host activity with adjacent network logs and validate whether traffic matches authorized services."
