"""
Unsupervised Anomaly Detection Engine (Isolation Forest) for SENTINELMESH.

Learns a baseline distribution from numerical network traffic features and flags
statistically unusual records. Note: Anomalies indicate unusual behavior relative
to the baseline, not necessarily confirmed cyberattacks.
"""

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from src.preprocessing import prepare_feature_frame, sanitize_feature_list
from src.utils import ISO_MODEL_PATH, setup_logger

logger = setup_logger("sentinelmesh.anomaly_detection")


class AnomalyDetectionError(ValueError):
    """Raised when Isolation Forest training or scoring cannot proceed."""


def train_and_score_isolation_forest(
    df: pd.DataFrame,
    feature_columns: List[str],
    label_column: Optional[str] = None,
    contamination: float = 0.15,
    n_estimators: int = 150,
    random_state: int = 42,
    dataset_name: str = "uploaded_dataset.csv",
    is_synthetic_demo: bool = False,
    save_path: Optional[Path] = ISO_MODEL_PATH,
) -> Dict[str, Any]:
    """
    Fit an Isolation Forest pipeline (median imputation + StandardScaler +
    IsolationForest) on numerical network features and compute anomaly flags
    and scores for the dataset.
    """
    if df is None or len(df) < 5:
        raise AnomalyDetectionError("At least 5 rows are required for Isolation Forest anomaly detection.")

    safe_num, _ = sanitize_feature_list(
        df,
        feature_columns=feature_columns,
        label_column=label_column,
    )
    if not safe_num:
        raise AnomalyDetectionError(
            "No valid numerical features available for Isolation Forest anomaly detection."
        )

    contamination = float(np.clip(contamination, 0.01, 0.50))
    X = prepare_feature_frame(df, safe_num)

    pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            (
                "isolation_forest",
                IsolationForest(
                    n_estimators=int(n_estimators),
                    contamination=contamination,
                    random_state=int(random_state),
                    n_jobs=-1,
                ),
            ),
        ]
    )

    pipeline.fit(X)
    raw_preds = pipeline.predict(X)  # -1 = anomaly, 1 = normal
    decision_scores = pipeline.decision_function(X)  # lower = more anomalous

    anomaly_scores = _normalize_anomaly_scores(decision_scores)
    anomaly_flags = np.where(raw_preds == -1, "ANOMALY", "NORMAL")

    n_anomalies = int((raw_preds == -1).sum())
    anomaly_rate = round((n_anomalies / max(len(df), 1)) * 100.0, 2)

    artifact = {
        "model_type": "IsolationForest",
        "pipeline": pipeline,
        "numeric_features": safe_num,
        "hyperparameters": {
            "contamination": contamination,
            "n_estimators": int(n_estimators),
            "random_state": int(random_state),
        },
        "summary": {
            "total_records": int(len(df)),
            "anomaly_count": n_anomalies,
            "normal_count": int(len(df) - n_anomalies),
            "anomaly_rate_pct": anomaly_rate,
            "min_decision_score": round(float(np.min(decision_scores)), 4),
            "max_decision_score": round(float(np.max(decision_scores)), 4),
            "mean_anomaly_score": round(float(np.mean(anomaly_scores)), 2),
        },
        "dataset_name": dataset_name,
        "is_synthetic_demo": bool(is_synthetic_demo),
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }

    if save_path is not None:
        save_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(artifact, save_path)
        logger.info(
            "Saved IsolationForest to %s (%d/%d anomalies, contamination=%.2f)",
            save_path,
            n_anomalies,
            len(df),
            contamination,
        )

    return {
        "artifact": artifact,
        "anomaly_status": anomaly_flags,
        "raw_decision_score": np.round(decision_scores, 5),
        "anomaly_score": np.round(anomaly_scores, 2),
    }


def score_with_isolation_forest(
    df: pd.DataFrame,
    artifact: Dict[str, Any],
) -> Dict[str, Any]:
    """Score a DataFrame using an already persisted Isolation Forest artifact."""
    num_feats = artifact["numeric_features"]
    missing = [c for c in num_feats if c not in df.columns]
    if missing:
        raise AnomalyDetectionError(
            f"Dataset is missing required feature columns for the loaded Isolation Forest: {missing}"
        )

    X = prepare_feature_frame(df, num_feats)
    pipeline: Pipeline = artifact["pipeline"]
    raw_preds = pipeline.predict(X)
    decision_scores = pipeline.decision_function(X)
    anomaly_scores = _normalize_anomaly_scores(decision_scores)
    anomaly_flags = np.where(raw_preds == -1, "ANOMALY", "NORMAL")

    return {
        "anomaly_status": anomaly_flags,
        "raw_decision_score": np.round(decision_scores, 5),
        "anomaly_score": np.round(anomaly_scores, 2),
    }


def load_anomaly_artifact(model_path: Path = ISO_MODEL_PATH) -> Optional[Dict[str, Any]]:
    """Load persisted Isolation Forest artifact if available."""
    if not model_path.exists():
        return None
    try:
        return joblib.load(model_path)
    except Exception as exc:
        logger.error("Failed to load anomaly artifact from %s: %s", model_path, exc)
        return None


def _normalize_anomaly_scores(decision_scores: np.ndarray) -> np.ndarray:
    """
    Convert raw Isolation Forest decision_function scores (higher = more normal,
    negative = anomalous) into a 0-100 anomaly intensity scale where higher
    values indicate stronger deviation from the learned baseline.
    This is a relative min-max scaling, NOT a calibrated probability.
    """
    inverted = -decision_scores
    min_v = float(np.min(inverted))
    max_v = float(np.max(inverted))
    if max_v - min_v < 1e-9:
        return np.zeros_like(inverted, dtype=float)
    return ((inverted - min_v) / (max_v - min_v)) * 100.0
