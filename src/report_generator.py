"""
Security Analysis Report Generator for SENTINELMESH.

Supports:
  - CSV export of full or filtered detection results
  - JSON export of structured summary, findings, model info, and incidents
  - Concise PDF security report (via fpdf2) with transparent limitations disclosure
"""

import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import pandas as pd

from src.utils import setup_logger

logger = setup_logger("sentinelmesh.report_generator")

SYSTEM_LIMITATIONS = [
    "Batch CSV analysis only: SENTINELMESH analyzes uploaded or demonstration CSV flow records; live packet capture (PCAP/NIC sniffing) is not implemented in this MVP.",
    "Unsupervised anomaly detection (Isolation Forest) identifies statistical deviations from the dataset baseline, which may include benign operational spikes rather than confirmed attacks.",
    "Supervised classification (Random Forest) requires a labeled dataset and only classifies traffic categories present during training; tree vote proportions are not calibrated probabilities.",
    "Incident correlation uses transparent rule-based host/protocol aggregation, not a graph neural network or distributed enterprise SIEM.",
    "No destructive automated remediation or live firewall blocking is executed by this prototype.",
]


def _safe_ascii(text: Any) -> str:
    """Sanitize text for standard Helvetica PDF fonts."""
    s = str(text)
    replacements = {
        "\u2014": "-",
        "\u2013": "-",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2192": "->",
        "\u03c3": " sigma",
        "\u2265": ">=",
        "\u2264": "<=",
    }
    for k, v in replacements.items():
        s = s.replace(k, v)
    return s.encode("latin-1", errors="replace").decode("latin-1")


def export_results_csv(results_df: pd.DataFrame) -> bytes:
    """Export detection results DataFrame to UTF-8 CSV bytes."""
    if results_df is None or results_df.empty:
        return b""
    return results_df.to_csv(index=False).encode("utf-8")


def build_report_payload(
    results_df: pd.DataFrame,
    incidents_df: Optional[pd.DataFrame],
    summary: Dict[str, Any],
    dataset_name: str,
    is_synthetic_demo: bool,
    classifier_artifact: Optional[Dict[str, Any]] = None,
    iso_artifact: Optional[Dict[str, Any]] = None,
    alerts_df: Optional[pd.DataFrame] = None,
    max_findings: int = 50,
) -> Dict[str, Any]:
    """Assemble a complete structured security report dictionary."""
    now_iso = datetime.now(timezone.utc).isoformat()

    top_findings = []
    triage_summary: Dict[str, int] = {}
    if alerts_df is not None and not alerts_df.empty:
        triage_summary = {
            str(k): int(v)
            for k, v in alerts_df["investigation_status"].value_counts().items()
        }
        alert_cols = [
            "alert_id",
            "record_id",
            "timestamp",
            "src_ip",
            "dst_ip",
            "dst_port",
            "protocol",
            "detection_category",
            "anomaly_status",
            "anomaly_score",
            "severity",
            "detection_method",
            "investigation_status",
            "analyst_note",
            "detection_reason",
            "recommended_action",
        ]
        avail = [c for c in alert_cols if c in alerts_df.columns]
        top_findings = alerts_df[avail].head(max_findings).to_dict(orient="records")
    elif results_df is not None and not results_df.empty:
        flagged = results_df[results_df["is_suspicious"] == True].copy()  # noqa: E712
        if flagged.empty:
            flagged = results_df.head(min(10, len(results_df)))
        else:
            sev_map = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
            flagged["_r"] = flagged["severity"].map(sev_map).fillna(0)
            flagged = flagged.sort_values(
                by=["_r", "anomaly_score"], ascending=[False, False]
            ).drop(columns=["_r"]).head(max_findings)

        cols = [
            "record_id",
            "timestamp",
            "src_ip",
            "dst_ip",
            "dst_port",
            "protocol",
            "predicted_category",
            "anomaly_status",
            "anomaly_score",
            "severity",
            "detection_method",
            "detection_reason",
            "recommended_action",
        ]
        available_cols = [c for c in cols if c in flagged.columns]
        top_findings = flagged[available_cols].to_dict(orient="records")

    incidents_list = []
    if incidents_df is not None and not incidents_df.empty:
        incidents_list = incidents_df.head(25).to_dict(orient="records")

    model_info: Dict[str, Any] = {
        "supervised_classifier": None,
        "unsupervised_anomaly_detector": None,
    }
    if classifier_artifact is not None:
        m = classifier_artifact.get("metrics", {})
        model_info["supervised_classifier"] = {
            "model_type": classifier_artifact.get("model_type"),
            "trained_at": classifier_artifact.get("trained_at"),
            "training_dataset": classifier_artifact.get("dataset_name"),
            "is_synthetic_training_data": classifier_artifact.get("is_synthetic_demo"),
            "feature_count": len(classifier_artifact.get("numeric_features", []))
            + len(classifier_artifact.get("categorical_features", [])),
            "test_accuracy": m.get("accuracy"),
            "test_f1_macro": m.get("f1_macro"),
            "test_f1_weighted": m.get("f1_weighted"),
            "test_samples": m.get("test_samples"),
        }
    if iso_artifact is not None:
        model_info["unsupervised_anomaly_detector"] = {
            "model_type": iso_artifact.get("model_type"),
            "trained_at": iso_artifact.get("trained_at"),
            "hyperparameters": iso_artifact.get("hyperparameters"),
            "summary": iso_artifact.get("summary"),
        }

    return {
        "report_title": "SENTINELMESH Cybersecurity Threat Analysis Report",
        "track": "PRASUNEX INNOVATHON 2026 — AI/ML Track",
        "generated_at_utc": now_iso,
        "dataset": {
            "filename": dataset_name,
            "is_synthetic_demo": bool(is_synthetic_demo),
            "data_source_notice": (
                "SYNTHETIC DEMONSTRATION DATA (locally generated, not real production traffic)"
                if is_synthetic_demo
                else "User-uploaded CSV network traffic dataset"
            ),
            "total_records_analyzed": summary.get("total_records", 0),
        },
        "detection_summary": summary,
        "alert_triage_summary": triage_summary,
        "model_information": model_info,
        "correlated_incidents_count": len(incidents_list),
        "correlated_incidents": incidents_list,
        "key_findings": top_findings,
        "limitations": SYSTEM_LIMITATIONS,
    }


def export_report_json(payload: Dict[str, Any]) -> bytes:
    """Serialize report payload to pretty UTF-8 JSON bytes."""
    return json.dumps(payload, indent=2, default=str).encode("utf-8")


def export_report_pdf(payload: Dict[str, Any]) -> Optional[bytes]:
    """
    Generate a concise executive PDF security report using fpdf2.
    Returns PDF bytes, or None if fpdf2 is unavailable.
    """
    try:
        from fpdf import FPDF
        from fpdf.enums import XPos, YPos
    except ImportError:
        logger.warning("fpdf2 is not installed; skipping PDF generation.")
        return None

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    usable_w = pdf.epw

    def _heading(title: str) -> None:
        pdf.set_x(pdf.l_margin)
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(usable_w, 8, _safe_ascii(title), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def _paragraph(text: str, size: float = 9.5, line_h: float = 5.5) -> None:
        pdf.set_x(pdf.l_margin)
        pdf.set_font("Helvetica", "", size)
        pdf.multi_cell(usable_w, line_h, _safe_ascii(text), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # Header banner
    pdf.set_fill_color(11, 17, 32)
    pdf.rect(0, 0, 210, 32, "F")
    pdf.set_text_color(241, 245, 249)
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_xy(pdf.l_margin, 8)
    pdf.cell(
        usable_w,
        8,
        _safe_ascii("SENTINELMESH - Security Analysis Report"),
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT,
    )
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(148, 163, 184)
    pdf.set_x(pdf.l_margin)
    pdf.cell(
        usable_w,
        6,
        _safe_ascii(
            f"PRASUNEX INNOVATHON 2026 (AI/ML Track) | Generated: {payload['generated_at_utc'][:19]} UTC"
        ),
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT,
    )

    pdf.ln(10)
    pdf.set_text_color(15, 23, 42)

    # Dataset & Analysis Summary
    ds = payload["dataset"]
    summ = payload["detection_summary"]
    sev = summ.get("severity_counts", {})

    _heading("1. Dataset & Detection Summary")
    lines = [
        f"Dataset Filename: {ds['filename']}",
        f"Data Classification: {ds['data_source_notice']}",
        f"Total Records Analyzed: {summ.get('total_records', 0):,}",
        f"Normal Records: {summ.get('normal_records', 0):,} | Suspicious Records: {summ.get('suspicious_records', 0):,}",
        f"Isolation Forest Anomalies: {summ.get('anomaly_count', 0):,} | High/Critical Alerts: {summ.get('high_critical_alerts', 0):,}",
        f"Severity Breakdown -> CRITICAL: {sev.get('CRITICAL', 0)} | HIGH: {sev.get('HIGH', 0)} | MEDIUM: {sev.get('MEDIUM', 0)} | LOW: {sev.get('LOW', 0)}",
    ]
    for line in lines:
        _paragraph(line, size=10, line_h=6)

    pdf.ln(4)
    _heading("2. Machine Learning Models Used")

    sup = payload["model_information"].get("supervised_classifier")
    if sup:
        _paragraph(
            f"Supervised Model: {sup['model_type']} (Test Accuracy: {sup.get('test_accuracy')}, "
            f"Macro F1: {sup.get('test_f1_macro')}, Weighted F1: {sup.get('test_f1_weighted')}, "
            f"Test Samples: {sup.get('test_samples')}, Trained on: {sup.get('training_dataset')})",
            size=9.5,
            line_h=5.5,
        )
    else:
        _paragraph("Supervised Model: Not active for this analysis run.", size=9.5, line_h=5.5)

    iso = payload["model_information"].get("unsupervised_anomaly_detector")
    if iso:
        hp = iso.get("hyperparameters", {})
        isum = iso.get("summary", {})
        _paragraph(
            f"Unsupervised Model: {iso['model_type']} (Contamination: {hp.get('contamination')}, "
            f"Estimators: {hp.get('n_estimators')}, Anomalies: {isum.get('anomaly_count')} / {isum.get('total_records')})",
            size=9.5,
            line_h=5.5,
        )

    # Top Correlated Incidents
    incidents = payload.get("correlated_incidents", [])
    pdf.ln(4)
    _heading(f"3. Top Correlated Incidents ({len(incidents)} total)")
    if not incidents:
        _paragraph("No correlated suspicious incidents identified.", size=9)
    else:
        for inc in incidents[:8]:
            inc_status = inc.get("investigation_status", "OPEN")
            line = (
                f"[{inc.get('incident_id')} | {inc_status}] {inc.get('highest_severity')} | "
                f"{inc.get('grouping_key')} | Records: {inc.get('related_record_count')} | "
                f"Categories: {inc.get('predicted_categories')} | Avg Anomaly: {inc.get('avg_anomaly_score')}"
            )
            _paragraph(line, size=8.8, line_h=5.2)

    # Key Flagged Records / Alerts
    findings = payload.get("key_findings", [])
    triage = payload.get("alert_triage_summary", {})
    pdf.ln(4)
    _heading(f"4. Top Security Alerts & Investigation Findings (showing up to 10 of {len(findings)})")
    if triage:
        triage_str = " | ".join(f"{k}: {v}" for k, v in triage.items())
        _paragraph(f"Alert Investigation Status Breakdown -> {triage_str}", size=8.8, line_h=5.0)
    for rec in findings[:10]:
        aid = rec.get("alert_id") or rec.get("record_id")
        cat = rec.get("detection_category") or rec.get("predicted_category")
        status_tag = f" | Status: {rec.get('investigation_status')}" if rec.get("investigation_status") else ""
        note_line = f"\n  Analyst Note: {rec.get('analyst_note')}" if rec.get("analyst_note") else ""
        line = (
            f"- {aid} ({rec.get('record_id')}) [{rec.get('severity')}{status_tag}] "
            f"{rec.get('src_ip')} -> {rec.get('dst_ip')}:{rec.get('dst_port')} ({rec.get('protocol')}) "
            f"| Category: {cat} | Anomaly: {rec.get('anomaly_score')}/100\n"
            f"  Reason: {rec.get('detection_reason')}{note_line}"
        )
        _paragraph(line, size=8.2, line_h=4.6)
        pdf.ln(1)

    # Explicit Limitations
    pdf.ln(4)
    _heading("5. Scope & Limitations Disclosure")
    for lim in payload.get("limitations", []):
        _paragraph(f"- {lim}", size=8.8, line_h=5.2)

    output = pdf.output()
    if isinstance(output, (bytes, bytearray)):
        return bytes(output)
    return str(output).encode("latin-1")
