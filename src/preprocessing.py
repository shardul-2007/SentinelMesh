"""
Data cleaning, leakage prevention, and Scikit-learn preprocessing pipeline
for SENTINELMESH.
"""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from src.utils import NON_FEATURE_KEYWORDS, setup_logger

logger = setup_logger("sentinelmesh.preprocessing")


def clean_traffic_dataframe(
    df: pd.DataFrame,
    drop_duplicates: bool = False,
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Clean raw traffic dataframe:
      - Normalize whitespace in column names
      - Replace +/-inf with NaN on numeric columns
      - Optionally drop exact duplicate rows
      - Ensure a stable 'record_id' column exists
    Returns (cleaned_df, cleaning_report).
    """
    cleaned = df.copy()
    cleaned.columns = [str(c).strip() for c in cleaned.columns]

    initial_rows = len(cleaned)
    inf_replaced = 0

    for col in cleaned.columns:
        if pd.api.types.is_numeric_dtype(cleaned[col]) and not pd.api.types.is_bool_dtype(cleaned[col]):
            arr = cleaned[col].to_numpy(dtype=float, na_value=np.nan)
            inf_mask = np.isinf(arr)
            if inf_mask.any():
                inf_replaced += int(inf_mask.sum())
                cleaned.loc[inf_mask, col] = np.nan

    duplicates_removed = 0
    if drop_duplicates:
        before = len(cleaned)
        cleaned = cleaned.drop_duplicates().reset_index(drop=True)
        duplicates_removed = before - len(cleaned)
    else:
        cleaned = cleaned.reset_index(drop=True)

    if "record_id" not in cleaned.columns:
        cleaned.insert(0, "record_id", [f"REC-{i + 1:05d}" for i in range(len(cleaned))])

    report = {
        "initial_rows": initial_rows,
        "final_rows": len(cleaned),
        "infinite_values_replaced": inf_replaced,
        "duplicates_removed": duplicates_removed,
        "remaining_missing_cells": int(cleaned.isna().sum().sum()),
    }
    logger.info("Data cleaning report: %s", report)
    return cleaned, report


def sanitize_feature_list(
    df: pd.DataFrame,
    feature_columns: List[str],
    label_column: Optional[str] = None,
    categorical_columns: Optional[List[str]] = None,
) -> Tuple[List[str], List[str]]:
    """
    Strictly remove target labels, label-derived columns, and missing columns
    from feature lists to prevent data leakage.
    Returns (safe_numeric_features, safe_categorical_features).
    """
    forbidden = set()
    if label_column:
        forbidden.add(label_column)

    safe_numeric: List[str] = []
    for col in feature_columns:
        if col not in df.columns or col in forbidden:
            continue
        col_lower = col.lower()
        if any(kw in col_lower for kw in NON_FEATURE_KEYWORDS):
            continue
        # Verify convertible to numeric
        coerced = pd.to_numeric(df[col], errors="coerce")
        if coerced.notna().any():
            safe_numeric.append(col)

    safe_categorical: List[str] = []
    for col in (categorical_columns or []):
        if col not in df.columns or col in forbidden or col in safe_numeric:
            continue
        col_lower = col.lower()
        if any(kw in col_lower for kw in NON_FEATURE_KEYWORDS):
            continue
        # Only include low-cardinality categorical columns (e.g., protocol)
        if 1 < df[col].nunique(dropna=True) <= 20:
            safe_categorical.append(col)

    return safe_numeric, safe_categorical


def build_preprocessor(
    numeric_features: List[str],
    categorical_features: Optional[List[str]] = None,
) -> ColumnTransformer:
    """
    Build a Scikit-learn ColumnTransformer with median imputation + StandardScaler
    for numerical features, and constant imputation + OneHotEncoder for low-cardinality
    categorical features (such as protocol).
    """
    transformers = []

    if numeric_features:
        numeric_pipe = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
            ]
        )
        transformers.append(("num", numeric_pipe, numeric_features))

    cat_cols = categorical_features or []
    if cat_cols:
        cat_pipe = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="constant", fill_value="UNKNOWN")),
                ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
            ]
        )
        transformers.append(("cat", cat_pipe, cat_cols))

    if not transformers:
        raise ValueError("Cannot build preprocessor without at least one feature column.")

    return ColumnTransformer(transformers=transformers, remainder="drop")


def prepare_feature_frame(
    df: pd.DataFrame,
    numeric_features: List[str],
    categorical_features: Optional[List[str]] = None,
) -> pd.DataFrame:
    """
    Create a clean feature DataFrame with numeric coercion and inf->NaN replacement
    ready for ColumnTransformer.fit/transform.
    """
    cols = list(numeric_features) + list(categorical_features or [])
    X = df[cols].copy()

    for col in numeric_features:
        X[col] = pd.to_numeric(X[col], errors="coerce")
        X[col] = X[col].replace([np.inf, -np.inf], np.nan)

    for col in (categorical_features or []):
        X[col] = X[col].astype(str).fillna("UNKNOWN").str.strip()

    return X
