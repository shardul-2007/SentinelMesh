"""
Lightweight Rule-Based Incident Correlation Engine for SENTINELMESH.

Groups related suspicious traffic records by host pairs, source host + protocol,
or shared suspicious category when host IPs are absent. Transparently documented
as rule-based aggregation (NOT a graph neural network or distributed SIEM).
"""

from typing import Any, Dict, List
import pandas as pd

from src.utils import SEVERITY_ORDER, max_severity


def correlate_incidents(results_df: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate suspicious records from the hybrid detection output into
    correlated security incidents.
    """
    columns = [
        "incident_id",
        "grouping_key",
        "related_record_count",
        "source_hosts",
        "destination_hosts",
        "protocols",
        "predicted_categories",
        "highest_severity",
        "avg_anomaly_score",
        "first_seen",
        "last_seen",
        "top_reasons",
        "sample_record_ids",
    ]
    if results_df is None or results_df.empty:
        return pd.DataFrame(columns=columns)

    suspicious = results_df[
        (results_df["is_suspicious"] == True)  # noqa: E712
        | (results_df["severity"].isin(["MEDIUM", "HIGH", "CRITICAL"]))
    ].copy()

    if suspicious.empty:
        return pd.DataFrame(columns=columns)

    has_src_ip = (suspicious["src_ip"] != "N/A").any()
    has_dst_ip = (suspicious["dst_ip"] != "N/A").any()

    # Build a clean deterministic correlation key from available fields
    if has_src_ip and has_dst_ip:
        suspicious["_corr_key"] = (
            suspicious["src_ip"].astype(str)
            + " -> "
            + suspicious["dst_ip"].astype(str)
            + " ("
            + suspicious["protocol"].astype(str)
            + ")"
        )
    elif has_src_ip:
        suspicious["_corr_key"] = (
            suspicious["src_ip"].astype(str)
            + " ["
            + suspicious["protocol"].astype(str)
            + "]"
        )
    else:
        suspicious["_corr_key"] = (
            suspicious["predicted_category"].astype(str)
            + " ["
            + suspicious["protocol"].astype(str)
            + "]"
        )

    incidents: List[Dict[str, Any]] = []
    for key, group in suspicious.groupby("_corr_key", sort=False):
        severities = group["severity"].tolist()
        highest_sev = max_severity(severities)

        src_hosts = sorted({str(v) for v in group["src_ip"].dropna() if str(v) != "N/A"})
        dst_hosts = sorted({str(v) for v in group["dst_ip"].dropna() if str(v) != "N/A"})
        protocols = sorted({str(v) for v in group["protocol"].dropna() if str(v) != "N/A"})
        categories = sorted(
            {
                str(v)
                for v in group["predicted_category"].dropna()
                if str(v) != "N/A (No Supervised Model)"
            }
        )

        # First and last observed timestamps when available
        valid_ts = [str(t) for t in group["timestamp"].dropna() if str(t) != "N/A"]
        if valid_ts:
            valid_ts_sorted = sorted(valid_ts)
            first_seen = valid_ts_sorted[0]
            last_seen = valid_ts_sorted[-1]
        else:
            first_seen = "N/A"
            last_seen = "N/A"

        # Aggregate top unique detection reasons
        unique_reasons = list(dict.fromkeys(str(r) for r in group["detection_reason"].dropna()))
        top_reasons = " | ".join(unique_reasons[:2])

        record_ids = [str(rid) for rid in group["record_id"].tolist()[:10]]
        avg_anom = round(float(group["anomaly_score"].mean()), 2)

        incidents.append(
            {
                "grouping_key": str(key),
                "related_record_count": int(len(group)),
                "source_hosts": ", ".join(src_hosts[:5]) if src_hosts else "N/A",
                "destination_hosts": ", ".join(dst_hosts[:5]) if dst_hosts else "N/A",
                "protocols": ", ".join(protocols) if protocols else "N/A",
                "predicted_categories": ", ".join(categories) if categories else "Unclassified Anomaly",
                "highest_severity": highest_sev,
                "avg_anomaly_score": avg_anom,
                "first_seen": first_seen,
                "last_seen": last_seen,
                "top_reasons": top_reasons,
                "sample_record_ids": ", ".join(record_ids),
                "_sev_rank": SEVERITY_ORDER.get(highest_sev, 0),
            }
        )

    inc_df = pd.DataFrame(incidents)
    inc_df = inc_df.sort_values(
        by=["_sev_rank", "related_record_count", "avg_anomaly_score"],
        ascending=[False, False, False],
    ).reset_index(drop=True)
    inc_df.insert(0, "incident_id", [f"INC-{i + 1:04d}" for i in range(len(inc_df))])
    inc_df = inc_df.drop(columns=["_sev_rank"])
    return inc_df
