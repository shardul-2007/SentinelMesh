"""
Security Reports & Export Center for SENTINELMESH.
Generates real downloadable CSV, JSON, and PDF security analysis reports
grounded solely in the active analysis session.
"""

from datetime import datetime, timezone
import pandas as pd
import streamlit as st

from src.report_generator import (
    SYSTEM_LIMITATIONS,
    build_report_payload,
    export_report_json,
    export_report_pdf,
    export_results_csv,
)
from src.ui_helpers import (
    render_demo_notice_if_synthetic,
    render_kpi_card,
    render_page_header,
)


def render_reports_page() -> None:
    render_page_header(
        "Security Reports & Export Center",
        "Export analyzed traffic records, correlated incidents, model metadata, and executive summaries in CSV, JSON, and PDF formats.",
        badge_text="REPORTING",
    )
    render_demo_notice_if_synthetic()

    analysis = st.session_state.get("analysis_output")
    meta = st.session_state.get("dataset_meta")
    incidents_df = st.session_state.get("incidents_df")

    if analysis is None or meta is None:
        st.markdown(
            """
            <div class="sm-empty-state">
                <h4 style="color:#F1F5F9;">No Analysis Ready for Export</h4>
                <p style="color:#94A3B8;font-size:0.9rem;">
                    Run network traffic analysis first before generating security reports.
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )
        if st.button("Go to Traffic Analysis", type="primary"):
            st.session_state["nav_page"] = "Traffic Analysis"
            st.rerun()
        return

    results_df: pd.DataFrame = analysis["results_df"]
    summary = analysis["summary"]
    rf_artifact = st.session_state.get("rf_artifact")
    iso_artifact = st.session_state.get("iso_artifact")
    alerts_df = st.session_state.get("alerts_df")

    # Report Scope Options
    only_suspicious = st.checkbox(
        "Export Only Suspicious / Flagged Alerts in CSV",
        value=False,
        help="When enabled, the CSV download includes structured alerts with Alert IDs and investigation statuses.",
    )
    if only_suspicious and alerts_df is not None and not alerts_df.empty:
        export_df = alerts_df
    else:
        export_df = results_df[results_df["is_suspicious"] == True] if only_suspicious else results_df  # noqa: E712

    payload = build_report_payload(
        results_df=results_df,
        incidents_df=incidents_df,
        summary=summary,
        dataset_name=meta["filename"],
        is_synthetic_demo=bool(meta.get("is_synthetic_demo")),
        classifier_artifact=rf_artifact if summary.get("used_supervised") else None,
        iso_artifact=iso_artifact,
        alerts_df=alerts_df,
    )

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    csv_bytes = export_results_csv(export_df)
    json_bytes = export_report_json(payload)
    pdf_bytes = export_report_pdf(payload)

    # Preview Summary KPIs
    st.markdown("### Executive Report Summary Preview")
    k1, k2, k3, k4 = st.columns(4)
    with k1:
        render_kpi_card("Dataset", meta["filename"][:22], "Synthetic Demo" if meta.get("is_synthetic_demo") else "Uploaded CSV", "#38BDF8")
    with k2:
        render_kpi_card("Records Analyzed", f"{summary['total_records']:,}", f"Export CSV rows: {len(export_df):,}", "#F1F5F9")
    with k3:
        render_kpi_card("Suspicious / Anomalies", f"{summary['suspicious_records']:,}", f"Anomalies: {summary['anomaly_count']:,}", "#F59E0B")
    with k4:
        render_kpi_card("High & Critical", f"{summary['high_critical_alerts']:,}", f"Correlated incidents: {len(incidents_df) if incidents_df is not None else 0}", "#EF4444")

    # Download Buttons Row
    st.markdown("### Download Analysis Reports")
    d1, d2, d3 = st.columns(3)
    with d1:
        st.download_button(
            label=f"Download Detection Results (CSV • {len(export_df):,} rows)",
            data=csv_bytes,
            file_name=f"sentinelmesh_results_{stamp}.csv",
            mime="text/csv",
            type="primary",
            use_container_width=True,
        )
    with d2:
        st.download_button(
            label="Download Structured Security Findings (JSON)",
            data=json_bytes,
            file_name=f"sentinelmesh_report_{stamp}.json",
            mime="application/json",
            use_container_width=True,
        )
    with d3:
        if pdf_bytes is not None:
            st.download_button(
                label="Download Executive Security Report (PDF)",
                data=pdf_bytes,
                file_name=f"sentinelmesh_report_{stamp}.pdf",
                mime="application/pdf",
                use_container_width=True,
            )
        else:
            st.warning("PDF export unavailable (install `fpdf2`). CSV and JSON exports remain fully operational.")

    # Structured Preview & Limitations
    with st.expander("Preview Structured JSON Report Metadata & Model Details", expanded=False):
        preview = {
            "report_title": payload["report_title"],
            "generated_at_utc": payload["generated_at_utc"],
            "dataset": payload["dataset"],
            "detection_summary": payload["detection_summary"],
            "model_information": payload["model_information"],
            "correlated_incidents_count": payload["correlated_incidents_count"],
        }
        st.json(preview)

    st.markdown("### Transparent System Limitations Included in Report")
    for lim in SYSTEM_LIMITATIONS:
        st.markdown(f"- {lim}")
