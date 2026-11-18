"""
Network traffic CSV loader, validator, and column-role detector.
Supports CIC-IDS2017, UNSW-NB15, custom NetFlow exports, and synthetic demo CSVs.
"""

import io
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd

from src.utils import COLUMN_ROLE_ALIASES, NON_FEATURE_KEYWORDS, setup_logger

logger = setup_logger("sentinelmesh.data_loader")


class DatasetValidationError(ValueError):
    """Raised when an uploaded CSV file fails structural or content validation."""


def load_csv_data(
    source: Union[str, bytes, io.BytesIO, Any],
    filename: str = "uploaded.csv",
    max_rows: Optional[int] = None,
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Safely load a network traffic CSV from a file path, raw bytes, or file-like
    upload object. Normalizes leading/trailing whitespace in column headers
    (common in CIC-IDS2017) and returns (df, metadata).
    """
    if source is None:
        raise DatasetValidationError("No file provided.")

    if isinstance(source, (str,)):
        raw_bytes = open(source, "rb").read()
    elif isinstance(source, bytes):
        raw_bytes = source
    elif hasattr(source, "getvalue"):
        raw_bytes = source.getvalue()
    elif hasattr(source, "read"):
        raw_bytes = source.read()
        if isinstance(raw_bytes, str):
            raw_bytes = raw_bytes.encode("utf-8")
    else:
        raise DatasetValidationError(f"Unsupported CSV input type: {type(source).__name__}")

    if not raw_bytes or len(raw_bytes.strip()) == 0:
        raise DatasetValidationError(f"File '{filename}' is empty.")

    df = None
    last_err = None
    for encoding in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            df = pd.read_csv(
                io.BytesIO(raw_bytes),
                encoding=encoding,
                low_memory=False,
                nrows=max_rows,
            )
            break
        except Exception as exc:
            last_err = exc

    if df is None:
        raise DatasetValidationError(
            f"Could not parse '{filename}' as a valid CSV file. Error: {last_err}"
        )

    if df.empty or len(df.columns) == 0:
        raise DatasetValidationError(
            f"CSV file '{filename}' contains no data rows or columns."
        )

    # Strip whitespace around column names (CIC-IDS2017 often has leading spaces)
    df.columns = [str(c).strip() for c in df.columns]

    # Deduplicate identical column names if present
    seen: Dict[str, int] = {}
    new_cols: List[str] = []
    for col in df.columns:
        if col in seen:
            seen[col] += 1
            new_cols.append(f"{col}_{seen[col]}")
        else:
            seen[col] = 0
            new_cols.append(col)
    df.columns = new_cols

    metadata = inspect_dataframe(df, filename=filename)
    logger.info(
        "Loaded CSV '%s': %d rows x %d columns (%d numeric)",
        filename,
        metadata["n_rows"],
        metadata["n_cols"],
        len(metadata["numeric_columns"]),
    )
    return df, metadata


def inspect_dataframe(df: pd.DataFrame, filename: str = "dataset.csv") -> Dict[str, Any]:
    """Inspect column types, missing values, infinite values, duplicates, and suggested roles."""
    numeric_cols: List[str] = []
    categorical_cols: List[str] = []
    col_summary: List[Dict[str, Any]] = []

    for col in df.columns:
        series = df[col]
        is_num = pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_bool_dtype(series)
        if is_num:
            numeric_cols.append(col)
            inf_count = int(np.isinf(series.to_numpy(dtype=float, na_value=np.nan)).sum())
        else:
            categorical_cols.append(col)
            inf_count = 0

        missing_count = int(series.isna().sum())
        col_summary.append(
            {
                "column": col,
                "dtype": str(series.dtype),
                "kind": "numeric" if is_num else "categorical",
                "missing_count": missing_count,
                "missing_pct": round((missing_count / max(len(df), 1)) * 100.0, 2),
                "infinite_count": inf_count,
                "unique_values": int(series.nunique(dropna=True)),
            }
        )

    total_missing = int(df.isna().sum().sum())
    duplicate_rows = int(df.duplicated().sum())
    suggested_mapping = auto_detect_column_mapping(df)
    candidate_ml_features = suggest_ml_feature_columns(df, suggested_mapping)

    is_synthetic = False
    if "is_synthetic_demo" in df.columns:
        try:
            is_synthetic = bool(df["is_synthetic_demo"].astype(bool).any())
        except Exception:
            is_synthetic = False

    return {
        "filename": filename,
        "n_rows": int(len(df)),
        "n_cols": int(len(df.columns)),
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols,
        "total_missing_cells": total_missing,
        "duplicate_rows": duplicate_rows,
        "column_summary": col_summary,
        "suggested_mapping": suggested_mapping,
        "candidate_ml_features": candidate_ml_features,
        "is_synthetic_demo": is_synthetic,
    }


def auto_detect_column_mapping(df: pd.DataFrame) -> Dict[str, Optional[str]]:
    """
    Attempt to map common network traffic roles (src_ip, dst_ip, src_port,
    dst_port, protocol, timestamp, label, record_id) across CIC-IDS2017,
    UNSW-NB15, and standard flow CSV formats.
    """
    lower_to_actual = {c.lower().strip(): c for c in df.columns}
    mapping: Dict[str, Optional[str]] = {}

    for role, aliases in COLUMN_ROLE_ALIASES.items():
        matched = None
        for alias in aliases:
            if alias in lower_to_actual:
                matched = lower_to_actual[alias]
                break
        if matched is None:
            # Soft substring fallback for label or IP columns
            for col_lower, actual in lower_to_actual.items():
                if role == "label" and col_lower in ("label", "attack_cat", "class"):
                    matched = actual
                    break
        mapping[role] = matched

    return mapping


def suggest_ml_feature_columns(
    df: pd.DataFrame,
    column_mapping: Dict[str, Optional[str]],
) -> List[str]:
    """
    Return clean numeric feature columns suitable for ML training/inference,
    explicitly excluding label columns, IDs, IP addresses, timestamps, and
    synthetic marker columns to prevent data leakage.
    """
    excluded = {
        column_mapping.get("label"),
        column_mapping.get("record_id"),
        column_mapping.get("src_ip"),
        column_mapping.get("dst_ip"),
        column_mapping.get("timestamp"),
    }
    excluded.discard(None)

    features: List[str] = []
    for col in df.columns:
        if col in excluded:
            continue
        col_lower = col.lower()
        if any(kw in col_lower for kw in NON_FEATURE_KEYWORDS):
            continue
        series = df[col]
        if pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_bool_dtype(series):
            # Exclude constant-NaN columns
            if series.notna().any():
                features.append(col)

    return features


def validate_dataset_for_analysis(
    df: pd.DataFrame,
    selected_features: List[str],
    min_rows: int = 10,
) -> Tuple[bool, List[str]]:
    """
    Validate that the dataset and selected features are sufficient for ML
    analysis. Returns (is_valid, list_of_messages).
    """
    errors: List[str] = []
    if df is None or df.empty:
        errors.append("Dataset is empty.")
        return False, errors

    if len(df) < min_rows:
        errors.append(
            f"Dataset has only {len(df)} rows; at least {min_rows} rows are required for reliable ML analysis."
        )

    if not selected_features:
        errors.append(
            "No valid numeric feature columns selected. Select at least one numerical network metric column."
        )
    else:
        missing_cols = [c for c in selected_features if c not in df.columns]
        if missing_cols:
            errors.append(f"Selected feature columns not found in dataset: {missing_cols}")

    return len(errors) == 0, errors
