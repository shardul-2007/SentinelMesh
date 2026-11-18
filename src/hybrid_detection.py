"""
Hybrid Threat Detection Engine for SENTINELMESH.

Combines available detection signals transparently:
  1. Supervised Random Forest Classifier (when trained and feature-compatible)
  2. Unsupervised Isolation Forest Anomaly Detection
  3. Transparent Rule-Based Security Heuristics

Never fabricates supervised predictions if no compatible classification model exists.
"""

from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

from src.anomaly_detection import train_and_score_isolation_forest
from src.classification import predict_with_classifier
from src.explainability import (
    build_detection_explanation,
    evaluate_record_heuristics,
    get_top_deviated_features,
    recommend_next_action,
)
from src.feature_engineering import add_derived_network_features, compute_feature_baselines
from src.preprocessing import clean_traffic_dataframe
from src.utils import is_benign_label, setup_logger

logger = setup_logger("sentinelmesh.hybrid_detection")


def compute_severity(
    is_supervised_threat: bool,
    anomaly_status: str,
    anomaly_score: Optional[float],
    heuristic_count: int,
    high_anomaly_threshold: float = 75.0,
    critical_anomaly_threshold: float = 85.0,
) -> str:
    """
    Transparent, deterministic severity mapping (LOW / MEDIUM / HIGH / CRITICAL).
    This is a documented operational triage rule, NOT a calibrated probability.
    """
    is_anomaly = anomaly_status == "ANOMALY"
    score_val = float(anomaly_score) if anomaly_score is not None else 0.0

    if is_supervised_threat and (is_anomaly or heuristic_count >= 2):
        return "CRITICAL"
    if is_anomaly and score_val >= critical_anomaly_threshold and heuristic_count >= 2:
        return "CRITICAL"
    if is_supervised_threat:
        return "HIGH"
    if is_anomaly and (heuristic_count >= 1 or score_val >= high_anomaly_threshold):
        return "HIGH"
    if is_anomaly or heuristic_count >= 2:
        return "MEDIUM"
    if heuristic_count == 1:
        return "MEDIUM"
    return "LOW"


def run_hybrid_detection(
    df: pd.DataFrame,
    selected_features: List[str],
    column_mapping: Dict[str, Optional[str]],
    classifier_artifact: Optional[Dict[str, Any]] = None,
    contamination: float = 0.15,
    n_estimators_iso: int = 150,
    drop_duplicates: bool = False,
    dataset_name: str = "uploaded.csv",
    is_synthetic_demo: bool = False,
    save_iso_model: bool = True,
) -> Dict[str, Any]:
    """
    Execute the complete hybrid detection pipeline on the provided dataframe.

    Returns a dictionary with:
      - results_df: Unified per-record detection DataFrame
      - cleaned_df: Cleaned input DataFrame (with derived features)
      - cleaning_report: Data hygiene metrics
      - baselines: Feature statistics used for explainability
      - iso_artifact: Fitted Isolation Forest artifact
      - used_supervised: Whether supervised classification actually executed
      - supervised_skip_reason: Transparent reason if supervised model did not run
      - active_features: Exact numerical features used
      - summary: Real computed summary metrics
    """
    cleaned_df, cleaning_report = clean_traffic_dataframe(df, drop_duplicates=drop_duplicates)
    enriched_df, active_features = add_derived_network_features(cleaned_df, selected_features)

    # Ensure label column is never leaked into feature baselines/anomaly model
    label_col = column_mapping.get("label")
    active_features = [f for f in active_features if f != label_col and f in enriched_df.columns]
    baselines = compute_feature_baselines(enriched_df, active_features)

    # 1. Unsupervised Isolation Forest (always runs on selected numeric features)
    from src.utils import ISO_MODEL_PATH

    iso_output = train_and_score_isolation_forest(
        df=enriched_df,
        feature_columns=active_features,
        label_column=label_col,
        contamination=contamination,
        n_estimators=n_estimators_iso,
        dataset_name=dataset_name,
        is_synthetic_demo=is_synthetic_demo,
        save_path=ISO_MODEL_PATH if save_iso_model else None,
    )
    iso_artifact = iso_output["artifact"]
    anomaly_statuses = iso_output["anomaly_status"]
    anomaly_scores = iso_output["anomaly_score"]
    raw_iso_scores = iso_output["raw_decision_score"]

    # 2. Supervised Random Forest (only if a compatible artifact is available)
    used_supervised = False
    supervised_skip_reason: Optional[str] = None
    predicted_labels: Optional[np.ndarray] = None
    model_confidences: Optional[np.ndarray] = None

    if classifier_artifact is not None:
        try:
            predicted_labels, model_confidences = predict_with_classifier(
                enriched_df, classifier_artifact
            )
            used_supervised = True
        except Exception as exc:
            supervised_skip_reason = str(exc)
            logger.warning("Skipping supervised classifier: %s", exc)
    else:
        supervised_skip_reason = (
            "No trained supervised classification model is currently loaded. "
            "Train a Random Forest model in the ML Model Center using a labeled dataset."
        )

    # 3. Unified per-record assembly, heuristics, severity, and explainability
    rec_id_col = column_mapping.get("record_id") or "record_id"
    src_ip_col = column_mapping.get("src_ip")
    dst_ip_col = column_mapping.get("dst_ip")
    src_port_col = column_mapping.get("src_port")
    dst_port_col = column_mapping.get("dst_port")
    proto_col = column_mapping.get("protocol")
    ts_col = column_mapping.get("timestamp")

    unified_rows: List[Dict[str, Any]] = []
    for idx, row in enriched_df.iterrows():
        rec_id = str(row[rec_id_col]) if rec_id_col in row.index else f"REC-{idx + 1:05d}"
        a_status = str(anomaly_statuses[idx])
        a_score = float(anomaly_scores[idx])
        raw_score = float(raw_iso_scores[idx])

        if used_supervised and predicted_labels is not None and model_confidences is not None:
            pred_cat = str(predicted_labels[idx])
            conf = round(float(model_confidences[idx]), 4)
            is_sup_threat = not is_benign_label(pred_cat)
        else:
            pred_cat = "N/A (No Supervised Model)"
            conf = None
            is_sup_threat = False

        h_flags = evaluate_record_heuristics(row, baselines, column_mapping)
        deviations = get_top_deviated_features(row, baselines, active_features, top_n=5)

        severity = compute_severity(
            is_supervised_threat=is_sup_threat,
            anomaly_status=a_status,
            anomaly_score=a_score,
            heuristic_count=len(h_flags),
        )

        # Determine which methods contributed to flagging
        methods: List[str] = []
        if is_sup_threat:
            methods.append("RandomForest")
        if a_status == "ANOMALY":
            methods.append("IsolationForest")
        if h_flags:
            methods.append("Heuristics")
        if not methods:
            detection_method = (
                "Hybrid (RandomForest + IsolationForest)"
                if used_supervised
                else "Unsupervised (IsolationForest)"
            )
        else:
            detection_method = " + ".join(methods)

        is_suspicious = is_sup_threat or (a_status == "ANOMALY") or (severity in ("HIGH", "CRITICAL")) or (len(h_flags) >= 2)

        explanation = build_detection_explanation(
            predicted_category=pred_cat,
            model_confidence=conf,
            anomaly_status=a_status,
            anomaly_score=a_score,
            heuristic_flags=h_flags,
            deviated_features=deviations,
        )
        next_action = recommend_next_action(severity, pred_cat, a_status, h_flags)

        unified_rows.append(
            {
                "row_index": int(idx),
                "record_id": rec_id,
                "timestamp": str(row[ts_col]) if ts_col and ts_col in row.index and pd.notna(row[ts_col]) else "N/A",
                "src_ip": str(row[src_ip_col]) if src_ip_col and src_ip_col in row.index and pd.notna(row[src_ip_col]) else "N/A",
                "dst_ip": str(row[dst_ip_col]) if dst_ip_col and dst_ip_col in row.index and pd.notna(row[dst_ip_col]) else "N/A",
                "src_port": row[src_port_col] if src_port_col and src_port_col in row.index and pd.notna(row[src_port_col]) else "N/A",
                "dst_port": row[dst_port_col] if dst_port_col and dst_port_col in row.index and pd.notna(row[dst_port_col]) else "N/A",
                "protocol": str(row[proto_col]) if proto_col and proto_col in row.index and pd.notna(row[proto_col]) else "N/A",
                "predicted_category": pred_cat,
                "rf_vote_proportion": conf,
                "anomaly_status": a_status,
                "anomaly_score": round(a_score, 2),
                "raw_iso_score": round(raw_score, 5),
                "heuristic_flags": " | ".join(h_flags) if h_flags else "None",
                "heuristic_count": len(h_flags),
                "detection_method": detection_method,
                "is_suspicious": bool(is_suspicious),
                "severity": severity,
                "detection_reason": explanation,
                "recommended_action": next_action,
            }
        )

    results_df = pd.DataFrame(unified_rows)

    total = len(results_df)
    suspicious_count = int(results_df["is_suspicious"].sum()) if total else 0
    normal_count = total - suspicious_count
    anomaly_count = int((results_df["anomaly_status"] == "ANOMALY").sum()) if total else 0
    high_critical_count = int(results_df["severity"].isin(["HIGH", "CRITICAL"]).sum()) if total else 0

    if used_supervised and total:
        potential_attack_count = int(
            results_df["predicted_category"].apply(lambda c: not is_benign_label(c)).sum()
        )
    else:
        potential_attack_count = None

    summary = {
        "total_records": total,
        "normal_records": normal_count,
        "suspicious_records": suspicious_count,
        "potential_attack_records": potential_attack_count,
        "anomaly_count": anomaly_count,
        "high_critical_alerts": high_critical_count,
        "severity_counts": {
            sev: int((results_df["severity"] == sev).sum()) if total else 0
            for sev in ("LOW", "MEDIUM", "HIGH", "CRITICAL")
        },
        "used_supervised": used_supervised,
        "supervised_skip_reason": supervised_skip_reason,
    }

    return {
        "results_df": results_df,
        "cleaned_df": enriched_df,
        "cleaning_report": cleaning_report,
        "baselines": baselines,
        "iso_artifact": iso_artifact,
        "used_supervised": used_supervised,
        "supervised_skip_reason": supervised_skip_reason,
        "active_features": active_features,
        "summary": summary,
    }
