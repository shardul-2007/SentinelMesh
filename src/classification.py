"""
Supervised Threat Classification Engine (Random Forest Classifier) for SENTINELMESH.

Implements genuine Scikit-learn model training, held-out test evaluation,
class-imbalance handling, feature importance extraction, and joblib persistence.
"""

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from src.preprocessing import (
    build_preprocessor,
    prepare_feature_frame,
    sanitize_feature_list,
)
from src.utils import RF_MODEL_PATH, setup_logger

logger = setup_logger("sentinelmesh.classification")


class ClassificationError(ValueError):
    """Raised when supervised training or inference cannot be performed safely."""


def validate_label_column(
    df: pd.DataFrame,
    label_column: str,
) -> Tuple[pd.Series, List[str]]:
    """
    Validate target label column before training.
    Returns (cleaned_label_series, warning_messages).
    """
    if not label_column or label_column not in df.columns:
        raise ClassificationError(
            f"Target label column '{label_column}' not found in dataset."
        )

    y = df[label_column].astype(str).str.strip()
    valid_mask = df[label_column].notna() & (y != "") & (y.str.lower() != "nan")
    if int(valid_mask.sum()) < 10:
        raise ClassificationError(
            "Target label column has fewer than 10 valid non-null rows; cannot train classifier."
        )

    y_valid = y[valid_mask]
    class_counts = y_valid.value_counts()
    if len(class_counts) < 2:
        raise ClassificationError(
            f"Target column '{label_column}' contains only {len(class_counts)} unique class "
            f"({list(class_counts.index)}). At least 2 distinct classes are required for supervised classification."
        )

    warnings: List[str] = []
    max_c = int(class_counts.max())
    min_c = int(class_counts.min())
    imbalance_ratio = max_c / max(min_c, 1)
    if imbalance_ratio >= 5.0:
        warnings.append(
            f"Class imbalance detected (majority/minority ratio = {imbalance_ratio:.1f}:1; "
            f"smallest class '{class_counts.idxmin()}' has {min_c} samples). "
            "RandomForestClassifier uses class_weight='balanced'; inspect macro F1 and per-class recall alongside accuracy."
        )

    return y, warnings


def train_random_forest(
    df: pd.DataFrame,
    feature_columns: List[str],
    label_column: str,
    categorical_columns: Optional[List[str]] = None,
    test_size: float = 0.25,
    n_estimators: int = 120,
    max_depth: Optional[int] = 16,
    random_state: int = 42,
    dataset_name: str = "uploaded_dataset.csv",
    is_synthetic_demo: bool = False,
    save_path: Optional[Path] = RF_MODEL_PATH,
) -> Dict[str, Any]:
    """
    Train and evaluate a Random Forest Classifier with leakage-free preprocessing.
    Persists the trained artifact to disk via joblib if save_path is provided.
    Returns the complete model artifact dictionary including real test metrics.
    """
    y_raw, warnings = validate_label_column(df, label_column)

    # Keep only rows with valid labels
    valid_mask = df[label_column].notna() & (y_raw != "") & (y_raw.str.lower() != "nan")
    work_df = df.loc[valid_mask].reset_index(drop=True)
    y = y_raw.loc[valid_mask].reset_index(drop=True)

    safe_num, safe_cat = sanitize_feature_list(
        work_df,
        feature_columns=feature_columns,
        label_column=label_column,
        categorical_columns=categorical_columns,
    )
    if not safe_num and not safe_cat:
        raise ClassificationError(
            "No valid non-label feature columns remain after leakage sanitization."
        )

    X = prepare_feature_frame(work_df, safe_num, safe_cat)

    # Check whether stratified split is feasible
    min_class_count = int(y.value_counts().min())
    use_stratify = min_class_count >= 2 and (len(y) * test_size) >= len(y.unique())
    if not use_stratify:
        warnings.append(
            "Stratified split disabled because at least one class has too few samples for the test split."
        )

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=random_state,
        stratify=y if use_stratify else None,
    )

    preprocessor = build_preprocessor(safe_num, safe_cat)
    clf = RandomForestClassifier(
        n_estimators=int(n_estimators),
        max_depth=int(max_depth) if max_depth is not None and max_depth > 0 else None,
        class_weight="balanced",
        random_state=int(random_state),
        n_jobs=-1,
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", clf),
        ]
    )

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    classes = sorted(list(set(y.unique())))
    cm = confusion_matrix(y_test, y_pred, labels=classes)
    report_dict = classification_report(
        y_test,
        y_pred,
        labels=classes,
        output_dict=True,
        zero_division=0,
    )

    metrics = {
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision_weighted": round(float(precision_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
        "recall_weighted": round(float(recall_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
        "f1_weighted": round(float(f1_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
        "precision_macro": round(float(precision_score(y_test, y_pred, average="macro", zero_division=0)), 4),
        "recall_macro": round(float(recall_score(y_test, y_pred, average="macro", zero_division=0)), 4),
        "f1_macro": round(float(f1_score(y_test, y_pred, average="macro", zero_division=0)), 4),
        "classes": classes,
        "confusion_matrix": cm.tolist(),
        "classification_report": report_dict,
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "total_samples": int(len(work_df)),
        "class_distribution": {str(k): int(v) for k, v in y.value_counts().items()},
    }

    # Map feature importances cleanly back to transformed feature names
    transformed_names = _extract_transformed_feature_names(
        pipeline.named_steps["preprocessor"], safe_num, safe_cat
    )
    raw_importances = pipeline.named_steps["classifier"].feature_importances_
    feature_importances = sorted(
        [
            {"feature": name, "importance": round(float(imp), 5)}
            for name, imp in zip(transformed_names, raw_importances)
        ],
        key=lambda item: item["importance"],
        reverse=True,
    )

    artifact = {
        "model_type": "RandomForestClassifier",
        "pipeline": pipeline,
        "numeric_features": safe_num,
        "categorical_features": safe_cat,
        "label_column": label_column,
        "classes": list(pipeline.named_steps["classifier"].classes_),
        "metrics": metrics,
        "feature_importances": feature_importances,
        "warnings": warnings,
        "hyperparameters": {
            "n_estimators": int(n_estimators),
            "max_depth": int(max_depth) if max_depth is not None and max_depth > 0 else None,
            "class_weight": "balanced",
            "test_size": float(test_size),
            "random_state": int(random_state),
        },
        "dataset_name": dataset_name,
        "is_synthetic_demo": bool(is_synthetic_demo),
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }

    if save_path is not None:
        save_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(artifact, save_path)
        logger.info(
            "Saved RandomForestClassifier to %s (accuracy=%.4f, f1_macro=%.4f)",
            save_path,
            metrics["accuracy"],
            metrics["f1_macro"],
        )

    return artifact


def _extract_transformed_feature_names(
    preprocessor: Any,
    numeric_features: List[str],
    categorical_features: List[str],
) -> List[str]:
    """Extract readable feature names after ColumnTransformer expansion."""
    try:
        raw_names = list(preprocessor.get_feature_names_out())
        return [n.replace("num__", "").replace("cat__", "") for n in raw_names]
    except Exception:
        return list(numeric_features) + list(categorical_features)


def load_classifier_artifact(model_path: Path = RF_MODEL_PATH) -> Optional[Dict[str, Any]]:
    """Load persisted Random Forest artifact from disk if available."""
    if not model_path.exists():
        return None
    try:
        return joblib.load(model_path)
    except Exception as exc:
        logger.error("Failed to load classifier artifact from %s: %s", model_path, exc)
        return None


def predict_with_classifier(
    df: pd.DataFrame,
    artifact: Dict[str, Any],
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Run Random Forest inference on a DataFrame using a trained artifact.
    Returns (predicted_labels, max_tree_vote_proportions).
    Note: Random Forest tree vote proportion is NOT a calibrated probability.
    """
    num_feats = artifact["numeric_features"]
    cat_feats = artifact.get("categorical_features", [])

    required_cols = list(num_feats) + list(cat_feats)
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ClassificationError(
            f"Dataset is missing required feature columns for the loaded classifier: {missing}"
        )

    X = prepare_feature_frame(df, num_feats, cat_feats)
    pipeline: Pipeline = artifact["pipeline"]
    preds = pipeline.predict(X)
    probas = pipeline.predict_proba(X)
    max_votes = np.max(probas, axis=1)
    return preds, max_votes
