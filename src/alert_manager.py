"""
Alert & Incident Triage State Manager for SENTINELMESH.

Generates structured security alerts with Alert IDs (ALT-0001, ...) from
hybrid detection results and persists analyst investigation statuses and notes
in a lightweight local SQLite store (no external services required).
"""

import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import pandas as pd

from src.utils import DATA_DIR, SEVERITY_ORDER, setup_logger

logger = setup_logger("sentinelmesh.alert_manager")

TRIAGE_DB_PATH = DATA_DIR / "triage_state.db"

ALERT_STATUSES = [
    "OPEN",
    "IN_PROGRESS",
    "INVESTIGATED",
    "FALSE_POSITIVE",
    "RESOLVED",
]

INCIDENT_STATUSES = [
    "OPEN",
    "INVESTIGATING",
    "CONTAINED",
    "CLOSED",
]


def _get_connection(db_path: Path = TRIAGE_DB_PATH) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS alert_triage (
            dataset_key TEXT NOT NULL,
            alert_id TEXT NOT NULL,
            record_id TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'OPEN',
            analyst_note TEXT DEFAULT '',
            updated_at TEXT NOT NULL,
            PRIMARY KEY (dataset_key, alert_id)
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS incident_triage (
            dataset_key TEXT NOT NULL,
            incident_id TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'OPEN',
            analyst_note TEXT DEFAULT '',
            updated_at TEXT NOT NULL,
            PRIMARY KEY (dataset_key, incident_id)
        )
        """
    )
    conn.commit()
    return conn


def build_alerts_table(
    results_df: pd.DataFrame,
    cleaned_df: pd.DataFrame,
    active_features: List[str],
    dataset_key: str = "default",
    db_path: Path = TRIAGE_DB_PATH,
) -> pd.DataFrame:
    """
    Build structured security alerts from suspicious or elevated-severity records,
    assign deterministic Alert IDs (ALT-0001, ...), attach relevant network
    feature snapshots, and merge any persisted analyst investigation statuses.
    """
    columns = [
        "alert_id",
        "record_id",
        "row_index",
        "timestamp",
        "src_ip",
        "dst_ip",
        "src_port",
        "dst_port",
        "protocol",
        "detection_category",
        "anomaly_status",
        "anomaly_score",
        "severity",
        "detection_method",
        "detection_reason",
        "relevant_features",
        "recommended_action",
        "investigation_status",
        "analyst_note",
    ]
    if results_df is None or results_df.empty:
        return pd.DataFrame(columns=columns)

    flagged = results_df[
        (results_df["is_suspicious"] == True)  # noqa: E712
        | (results_df["severity"].isin(["MEDIUM", "HIGH", "CRITICAL"]))
    ].copy()

    if flagged.empty:
        return pd.DataFrame(columns=columns)

    # Deterministic priority sort before assigning Alert IDs
    flagged["_sev_rank"] = flagged["severity"].map(SEVERITY_ORDER).fillna(0)
    flagged = flagged.sort_values(
        by=["_sev_rank", "anomaly_score", "record_id"],
        ascending=[False, False, True],
    ).reset_index(drop=True)

    saved_states = load_alert_triage_map(dataset_key=dataset_key, db_path=db_path)

    # Pick up to 4 readable numeric features to include in each alert's feature snapshot
    preview_feats = [f for f in active_features if f in cleaned_df.columns][:4]

    alert_rows: List[Dict[str, Any]] = []
    for idx, row in flagged.iterrows():
        alert_id = f"ALT-{idx + 1:04d}"
        rec_id = str(row["record_id"])
        raw_idx = int(row["row_index"])

        feat_parts: List[str] = []
        if 0 <= raw_idx < len(cleaned_df):
            raw_row = cleaned_df.iloc[raw_idx]
            for f in preview_feats:
                val = raw_row.get(f)
                if pd.notna(val):
                    try:
                        feat_parts.append(f"{f}={float(val):,.1f}")
                    except (ValueError, TypeError):
                        feat_parts.append(f"{f}={val}")
        relevant_str = ", ".join(feat_parts) if feat_parts else "N/A"

        pred_cat = str(row["predicted_category"])
        if pred_cat == "N/A (No Supervised Model)":
            det_cat = "Statistical Anomaly" if row["anomaly_status"] == "ANOMALY" else "Heuristic Alert"
        else:
            det_cat = pred_cat

        saved = saved_states.get(alert_id, {})
        alert_rows.append(
            {
                "alert_id": alert_id,
                "record_id": rec_id,
                "row_index": raw_idx,
                "timestamp": str(row["timestamp"]),
                "src_ip": str(row["src_ip"]),
                "dst_ip": str(row["dst_ip"]),
                "src_port": row["src_port"],
                "dst_port": row["dst_port"],
                "protocol": str(row["protocol"]),
                "detection_category": det_cat,
                "anomaly_status": str(row["anomaly_status"]),
                "anomaly_score": float(row["anomaly_score"]),
                "severity": str(row["severity"]),
                "detection_method": str(row["detection_method"]),
                "detection_reason": str(row["detection_reason"]),
                "relevant_features": relevant_str,
                "recommended_action": str(row["recommended_action"]),
                "investigation_status": saved.get("status", "OPEN"),
                "analyst_note": saved.get("analyst_note", ""),
            }
        )

    return pd.DataFrame(alert_rows)


def update_alert_status(
    dataset_key: str,
    alert_id: str,
    record_id: str,
    status: str,
    analyst_note: str = "",
    db_path: Path = TRIAGE_DB_PATH,
) -> Dict[str, Any]:
    """Persist an updated investigation status and note for an alert."""
    norm_status = status.strip().upper()
    if norm_status not in ALERT_STATUSES:
        raise ValueError(f"Invalid alert status '{status}'. Must be one of {ALERT_STATUSES}.")

    now_iso = datetime.now(timezone.utc).isoformat()
    conn = _get_connection(db_path)
    try:
        conn.execute(
            """
            INSERT INTO alert_triage (dataset_key, alert_id, record_id, status, analyst_note, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(dataset_key, alert_id) DO UPDATE SET
                status = excluded.status,
                analyst_note = excluded.analyst_note,
                updated_at = excluded.updated_at
            """,
            (dataset_key, alert_id, record_id, norm_status, analyst_note.strip(), now_iso),
        )
        conn.commit()
    finally:
        conn.close()

    return {
        "alert_id": alert_id,
        "record_id": record_id,
        "status": norm_status,
        "analyst_note": analyst_note.strip(),
        "updated_at": now_iso,
    }


def load_alert_triage_map(
    dataset_key: str = "default",
    db_path: Path = TRIAGE_DB_PATH,
) -> Dict[str, Dict[str, str]]:
    """Return {alert_id: {'status': ..., 'analyst_note': ..., 'updated_at': ...}}."""
    conn = _get_connection(db_path)
    try:
        rows = conn.execute(
            "SELECT alert_id, status, analyst_note, updated_at FROM alert_triage WHERE dataset_key = ?",
            (dataset_key,),
        ).fetchall()
    finally:
        conn.close()

    return {
        r[0]: {"status": r[1], "analyst_note": r[2] or "", "updated_at": r[3]}
        for r in rows
    }


def update_incident_status(
    dataset_key: str,
    incident_id: str,
    status: str,
    analyst_note: str = "",
    db_path: Path = TRIAGE_DB_PATH,
) -> Dict[str, Any]:
    """Persist an updated investigation status and note for a correlated incident."""
    norm_status = status.strip().upper()
    if norm_status not in INCIDENT_STATUSES:
        raise ValueError(f"Invalid incident status '{status}'. Must be one of {INCIDENT_STATUSES}.")

    now_iso = datetime.now(timezone.utc).isoformat()
    conn = _get_connection(db_path)
    try:
        conn.execute(
            """
            INSERT INTO incident_triage (dataset_key, incident_id, status, analyst_note, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(dataset_key, incident_id) DO UPDATE SET
                status = excluded.status,
                analyst_note = excluded.analyst_note,
                updated_at = excluded.updated_at
            """,
            (dataset_key, incident_id, norm_status, analyst_note.strip(), now_iso),
        )
        conn.commit()
    finally:
        conn.close()

    return {
        "incident_id": incident_id,
        "status": norm_status,
        "analyst_note": analyst_note.strip(),
        "updated_at": now_iso,
    }


def load_incident_triage_map(
    dataset_key: str = "default",
    db_path: Path = TRIAGE_DB_PATH,
) -> Dict[str, Dict[str, str]]:
    """Return {incident_id: {'status': ..., 'analyst_note': ..., 'updated_at': ...}}."""
    conn = _get_connection(db_path)
    try:
        rows = conn.execute(
            "SELECT incident_id, status, analyst_note, updated_at FROM incident_triage WHERE dataset_key = ?",
            (dataset_key,),
        ).fetchall()
    finally:
        conn.close()

    return {
        r[0]: {"status": r[1], "analyst_note": r[2] or "", "updated_at": r[3]}
        for r in rows
    }


def merge_incident_statuses(
    incidents_df: pd.DataFrame,
    dataset_key: str = "default",
    db_path: Path = TRIAGE_DB_PATH,
) -> pd.DataFrame:
    """Attach persisted investigation_status and analyst_note columns to incidents_df."""
    if incidents_df is None or incidents_df.empty:
        out = pd.DataFrame() if incidents_df is None else incidents_df.copy()
        if "investigation_status" not in out.columns:
            out["investigation_status"] = pd.Series(dtype=str)
        if "analyst_note" not in out.columns:
            out["analyst_note"] = pd.Series(dtype=str)
        return out

    out = incidents_df.copy()
    triage_map = load_incident_triage_map(dataset_key=dataset_key, db_path=db_path)
    out["investigation_status"] = out["incident_id"].map(
        lambda iid: triage_map.get(str(iid), {}).get("status", "OPEN")
    )
    out["analyst_note"] = out["incident_id"].map(
        lambda iid: triage_map.get(str(iid), {}).get("analyst_note", "")
    )
    return out
