"""
Transparent feature engineering and dataset baseline statistics for SENTINELMESH.
"""

from typing import Dict, List, Tuple
import numpy as np
import pandas as pd


def add_derived_network_features(
    df: pd.DataFrame,
    selected_features: List[str],
) -> Tuple[pd.DataFrame, List[str]]:
    """
    Add transparent, explainable derived ratio features when matching base
    columns exist in the dataframe. Returns (enriched_df, updated_feature_list).
    """
    out = df.copy()
    new_features = list(selected_features)

    # Outbound-to-inbound byte asymmetry (strong signal for data exfiltration / floods)
    if "bytes_sent" in out.columns and "bytes_recv" in out.columns:
        if "bytes_asymmetry_ratio" not in out.columns:
            sent = pd.to_numeric(out["bytes_sent"], errors="coerce").fillna(0.0)
            recv = pd.to_numeric(out["bytes_recv"], errors="coerce").fillna(0.0)
            out["bytes_asymmetry_ratio"] = np.round((sent + 1.0) / (recv + 1.0), 4)
            if "bytes_asymmetry_ratio" not in new_features:
                new_features.append("bytes_asymmetry_ratio")

    # Outbound-to-inbound packet ratio (floods & scans exhibit strong asymmetry)
    if "packets_sent" in out.columns and "packets_recv" in out.columns:
        if "packets_asymmetry_ratio" not in out.columns:
            psent = pd.to_numeric(out["packets_sent"], errors="coerce").fillna(0.0)
            precv = pd.to_numeric(out["packets_recv"], errors="coerce").fillna(0.0)
            out["packets_asymmetry_ratio"] = np.round((psent + 1.0) / (precv + 1.0), 4)
            if "packets_asymmetry_ratio" not in new_features:
                new_features.append("packets_asymmetry_ratio")

    return out, new_features


def compute_feature_baselines(
    df: pd.DataFrame,
    feature_columns: List[str],
) -> Dict[str, Dict[str, float]]:
    """
    Compute robust summary statistics (mean, std, median, p95, p99) per numeric
    feature to support evidence-backed explainability.
    """
    baselines: Dict[str, Dict[str, float]] = {}
    for col in feature_columns:
        if col not in df.columns:
            continue
        series = pd.to_numeric(df[col], errors="coerce").replace([np.inf, -np.inf], np.nan).dropna()
        if series.empty:
            continue
        std_val = float(series.std(ddof=0))
        baselines[col] = {
            "mean": float(series.mean()),
            "std": std_val if std_val > 1e-9 else 1.0,
            "median": float(series.median()),
            "p05": float(series.quantile(0.05)),
            "p95": float(series.quantile(0.95)),
            "p99": float(series.quantile(0.99)),
            "min": float(series.min()),
            "max": float(series.max()),
        }
    return baselines
