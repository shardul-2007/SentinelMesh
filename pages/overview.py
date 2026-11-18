"""
Security Overview Dashboard Page for SENTINELMESH.
Displays live metrics, severity/detection distributions, traffic timeline,
recent security alerts, and model status computed exclusively from active data.
"""

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

from src.alert_manager import build_alerts_table, merge_incident_statuses
from src.classification import train_random_forest
from src.feature_engineering import add_derived_network_features
from src.hybrid_detection import run_hybrid_detection
from src.incident_correlation import correlate_incidents
from src.ui_helpers import (
    load_demo_into_session,
    render_demo_notice_if_synthetic,
    render_kpi_card,
    render_page_header,
    style_plotly_fig,
)
from src.utils import SEVERITY_COLORS


def run_one_click_demo_workflow() -> None:
    """
    Convenience Round 3 hackathon demo helper:
    1. Loads clearly labeled synthetic demo dataset (1,200 network flows)
    2. Trains Random Forest classifier on train split & evaluates on held-out test split
    3. Runs Hybrid Detection (Random Forest + Isolation Forest + Heuristics)
    4. Builds structured Alerts (ALT-0001...) and Correlated Incidents (INC-0001...)
    """
    load_demo_into_session()
    raw_df = st.session_state["raw_df"]
    meta = st.session_state["dataset_meta"]
    mapping = st.session_state["column_mapping"]
    feats = st.session_state["selected_features"]

    enriched_df, derived_feats = add_derived_network_features(raw_df, feats)
    cat_cols = [mapping["protocol"]] if mapping.get("protocol") else []

    rf_artifact = train_random_forest(
        df=enriched_df,
        feature_columns=derived_feats,
        label_column=mapping["label"],
        categorical_columns=cat_cols,
        test_size=0.25,
        n_estimators=100,
        max_depth=16,
        dataset_name=meta["filename"],
        is_synthetic_demo=True,
    )
    st.session_state["rf_artifact"] = rf_artifact

    analysis = run_hybrid_detection(
        df=raw_df,
        selected_features=feats,
        column_mapping=mapping,
        classifier_artifact=rf_artifact,
        contamination=0.22,
        n_estimators_iso=120,
        dataset_name=meta["filename"],
        is_synthetic_demo=True,
        save_iso_model=True,
    )
    dataset_key = meta["filename"]
    incidents_raw = correlate_incidents(analysis["results_df"])
    incidents_df = merge_incident_statuses(incidents_raw, dataset_key=dataset_key)
    alerts_df = build_alerts_table(
        results_df=analysis["results_df"],
        cleaned_df=analysis["cleaned_df"],
        active_features=analysis["active_features"],
        dataset_key=dataset_key,
    )

    st.session_state["iso_artifact"] = analysis["iso_artifact"]
    st.session_state["analysis_output"] = analysis
    st.session_state["incidents_df"] = incidents_df
    st.session_state["alerts_df"] = alerts_df


def _render_traffic_timeline(results_df: pd.DataFrame) -> None:
    """Render an interactive Traffic & Alert Timeline chart when valid timestamps exist."""
    if "timestamp" not in results_df.columns or not (results_df["timestamp"] != "N/A").any():
        st.info("No timestamp column available in this dataset to plot a traffic analysis timeline.")
        return

    ts_parsed = pd.to_datetime(results_df["timestamp"], errors="coerce")
    valid_mask = ts_parsed.notna()
    if int(valid_mask.sum()) < 2:
        st.info("Timestamps could not be parsed into a time series for timeline visualization.")
        return

    tl_df = pd.DataFrame(
        {
            "ts": ts_parsed[valid_mask],
            "Traffic": results_df.loc[valid_mask, "is_suspicious"].map(
                {True: "Suspicious / Alert", False: "Normal Traffic"}
            ),
        }
    )
    span_seconds = (tl_df["ts"].max() - tl_df["ts"].min()).total_seconds()
    freq = "5min" if span_seconds <= 14400 else "15min" if span_seconds <= 86400 else "1h"

    tl_df["bucket"] = tl_df["ts"].dt.floor(freq)
    grouped = tl_df.groupby(["bucket", "Traffic"]).size().reset_index(name="Flow Count")

    fig_tl = px.area(
        grouped,
        x="bucket",
        y="Flow Count",
        color="Traffic",
        color_discrete_map={
            "Normal Traffic": "#06B6D4",
            "Suspicious / Alert": "#EF4444",
        },
    )
    style_plotly_fig(fig_tl, title=f"Traffic Analysis & Alert Timeline ({freq} intervals)", height=300)
    fig_tl.update_layout(xaxis_title="Observed Timestamp", yaxis_title="Network Flows")
    st.plotly_chart(fig_tl, use_container_width=True)


def render_overview_page() -> None:
    render_page_header(
        "Security Overview",
        "AI-Powered Intelligent Cybersecurity Threat Detection & Network Monitoring System",
        badge_text="PRASUNEX 2026 • ROUND 3 • AI/ML",
    )

    render_demo_notice_if_synthetic()

    analysis = st.session_state.get("analysis_output")
    meta = st.session_state.get("dataset_meta")
    rf_artifact = st.session_state.get("rf_artifact")
    iso_artifact = st.session_state.get("iso_artifact")

    # Model & Dataset Status Strip (always live & honest)
    st.markdown("#### System & ML Model Status")
    s1, s2, s3 = st.columns(3)
    with s1:
        if meta:
            ds_label = "Synthetic Demo" if meta.get("is_synthetic_demo") else "Uploaded CSV"
            render_kpi_card(
                "Active Dataset",
                f"{meta['n_rows']:,} rows",
                f"{meta['filename']} ({ds_label})",
                accent_color="#38BDF8",
            )
        else:
            render_kpi_card(
                "Active Dataset",
                "None Loaded",
                "Upload a CSV or load synthetic demo data to start",
                accent_color="#94A3B8",
            )
    with s2:
        if rf_artifact:
            m = rf_artifact["metrics"]
            render_kpi_card(
                "Supervised Classifier (RF)",
                f"F1: {m['f1_macro']:.2f}",
                f"Acc: {m['accuracy']*100:.1f}% ({m['test_samples']} test rows) | {len(m['classes'])} classes",
                accent_color="#22C55E",
            )
        else:
            render_kpi_card(
                "Supervised Classifier (RF)",
                "Not Trained",
                "Train on a labeled CSV in ML Model Center",
                accent_color="#F59E0B",
            )
    with s3:
        if iso_artifact:
            isum = iso_artifact["summary"]
            render_kpi_card(
                "Anomaly Detector (IsoForest)",
                f"{isum['anomaly_rate_pct']:.1f}% Outliers",
                f"{isum['anomaly_count']:,} anomalies | contamination={iso_artifact['hyperparameters']['contamination']}",
                accent_color="#06B6D4",
            )
        else:
            render_kpi_card(
                "Anomaly Detector (IsoForest)",
                "Idle",
                "Runs automatically during Traffic Analysis",
                accent_color="#94A3B8",
            )

    # Proper Empty State when no analysis has been executed yet
    if analysis is None:
        st.markdown(
            """
            <div class="sm-empty-state">
                <h3 style="color:#F1F5F9;margin-bottom:8px;">No Network Traffic Analysis Loaded Yet</h3>
                <p style="color:#94A3B8;max-width:680px;margin:0 auto 18px auto;font-size:0.92rem;">
                    SENTINELMESH never displays hardcoded or fabricated metrics. Upload a network flow CSV
                    (CIC-IDS2017, UNSW-NB15, or custom NetFlow) in <strong>Traffic Analysis</strong>, or launch
                    the clearly labeled synthetic demonstration workflow below.
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )
        c1, c2, c3 = st.columns([1, 1.5, 1])
        with c2:
            if st.button(
                "Run Complete Synthetic Demo Workflow (Train ML + Analyze)",
                type="primary",
                use_container_width=True,
            ):
                with st.spinner("Generating synthetic demo data, training Random Forest & Isolation Forest, generating alerts & incidents..."):
                    run_one_click_demo_workflow()
                st.success("Synthetic demo analysis completed! Dashboard metrics updated from real ML outputs.")
                st.rerun()

            if st.button("Go to Traffic Analysis (Upload CSV)", use_container_width=True):
                st.session_state["nav_page"] = "Traffic Analysis"
                st.rerun()

        st.markdown("---")
        st.markdown("#### Securing the Digital Education Ecosystem (Potential Institutional Application)")
        st.caption(
            "SENTINELMESH is an independent AI/ML cybersecurity prototype (not an officially integrated PRASUNEX product or School ERP). "
            "It demonstrates how ML-based network monitoring could help protect educational infrastructure:"
        )
        e1, e2, e3 = st.columns(3)
        with e1:
            render_kpi_card("School ERP & Databases", "Brute-Force & Exfil", "Detect anomalous login bursts or large outbound student-record transfers.", "#06B6D4")
        with e2:
            render_kpi_card("Student & Exam Portals", "Traffic Surge / DDoS", "Identify abnormal packet rates targeting online exam or portal endpoints.", "#3B82F6")
        with e3:
            render_kpi_card("Campus & Admin Networks", "Recon / Port Scans", "Surface unauthorized internal or external probing across institutional hosts.", "#F59E0B")
        return

    # Live KPI Metrics from Actual Analysis
    results_df: pd.DataFrame = analysis["results_df"]
    summary = analysis["summary"]
    incidents_df: pd.DataFrame = st.session_state.get("incidents_df")
    alerts_df: pd.DataFrame = st.session_state.get("alerts_df")

    st.markdown("#### Real-Time Analysis Summary (Current Dataset)")
    k1, k2, k3, k4, k5 = st.columns(5)
    with k1:
        render_kpi_card(
            "Total Analyzed",
            f"{summary['total_records']:,}",
            "Network traffic records",
            accent_color="#F1F5F9",
        )
    with k2:
        norm_pct = (summary["normal_records"] / max(summary["total_records"], 1)) * 100
        render_kpi_card(
            "Normal Traffic",
            f"{summary['normal_records']:,}",
            f"{norm_pct:.1f}% baseline aligned",
            accent_color="#22C55E",
        )
    with k3:
        susp_pct = (summary["suspicious_records"] / max(summary["total_records"], 1)) * 100
        render_kpi_card(
            "Suspicious Records",
            f"{summary['suspicious_records']:,}",
            f"{susp_pct:.1f}% flagged ({summary['anomaly_count']:,} anomalies)",
            accent_color="#F59E0B",
        )
    with k4:
        pot_atk = summary.get("potential_attack_records")
        if pot_atk is not None:
            render_kpi_card(
                "Potential Attacks (RF)",
                f"{pot_atk:,}",
                "Supervised non-benign predictions",
                accent_color="#F97316",
            )
        else:
            render_kpi_card(
                "Potential Attacks (RF)",
                "N/A",
                "Train supervised RF model first",
                accent_color="#94A3B8",
            )
    with k5:
        render_kpi_card(
            "High & Critical Alerts",
            f"{summary['high_critical_alerts']:,}",
            f"{len(incidents_df) if incidents_df is not None else 0} correlated incidents",
            accent_color="#EF4444" if summary["high_critical_alerts"] > 0 else "#22C55E",
        )

    if not summary.get("used_supervised"):
        st.warning(
            f"**Unsupervised + Heuristics Mode:** {summary.get('supervised_skip_reason')} "
            "No supervised threat categories were invented."
        )

    # Traffic Analysis Timeline
    _render_traffic_timeline(results_df)

    # Charts Row 1: Severity Distribution + Detection / Category Distribution
    ch1, ch2 = st.columns(2)
    with ch1:
        sev_order = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
        sev_counts = [summary["severity_counts"].get(s, 0) for s in sev_order]
        fig_sev = go.Figure(
            data=[
                go.Bar(
                    x=sev_order,
                    y=sev_counts,
                    marker_color=[SEVERITY_COLORS[s] for s in sev_order],
                    text=sev_counts,
                    textposition="outside",
                )
            ]
        )
        style_plotly_fig(fig_sev, title="Alert Severity Distribution", height=320)
        fig_sev.update_layout(xaxis_title="Severity", yaxis_title="Record Count")
        st.plotly_chart(fig_sev, use_container_width=True)

    with ch2:
        if summary.get("used_supervised"):
            cat_counts = results_df["predicted_category"].value_counts().reset_index()
            cat_counts.columns = ["Category", "Count"]
            fig_cat = px.pie(
                cat_counts,
                names="Category",
                values="Count",
                hole=0.48,
                color_discrete_sequence=["#06B6D4", "#EF4444", "#F97316", "#F59E0B", "#3B82F6", "#8B5CF6"],
            )
            style_plotly_fig(fig_cat, title="Detection Category Distribution (Random Forest)", height=320)
            st.plotly_chart(fig_cat, use_container_width=True)
        else:
            anom_counts = results_df["anomaly_status"].value_counts().reset_index()
            anom_counts.columns = ["Status", "Count"]
            fig_anom = px.pie(
                anom_counts,
                names="Status",
                values="Count",
                hole=0.48,
                color="Status",
                color_discrete_map={"NORMAL": "#22C55E", "ANOMALY": "#EF4444"},
            )
            style_plotly_fig(fig_anom, title="Detection Distribution (Isolation Forest)", height=320)
            st.plotly_chart(fig_anom, use_container_width=True)

    # Charts Row 2: Protocol Distribution + Anomaly Score Histogram
    ch3, ch4 = st.columns(2)
    with ch3:
        if (results_df["protocol"] != "N/A").any():
            proto_df = (
                results_df.groupby(["protocol", "is_suspicious"]).size().reset_index(name="Count")
            )
            proto_df["Traffic"] = proto_df["is_suspicious"].map({True: "Suspicious", False: "Normal"})
            fig_proto = px.bar(
                proto_df,
                x="protocol",
                y="Count",
                color="Traffic",
                barmode="group",
                color_discrete_map={"Normal": "#3B82F6", "Suspicious": "#EF4444"},
            )
            style_plotly_fig(fig_proto, title="Traffic Protocol Distribution", height=305)
            fig_proto.update_layout(xaxis_title="Protocol", yaxis_title="Flow Count")
            st.plotly_chart(fig_proto, use_container_width=True)
        else:
            st.info("Protocol column not mapped in this dataset; protocol chart unavailable.")

    with ch4:
        fig_hist = px.histogram(
            results_df,
            x="anomaly_score",
            color="anomaly_status",
            nbins=30,
            color_discrete_map={"NORMAL": "#06B6D4", "ANOMALY": "#EF4444"},
        )
        style_plotly_fig(fig_hist, title="Isolation Forest Anomaly Score Distribution (0-100)", height=305)
        fig_hist.update_layout(xaxis_title="Normalized Anomaly Score (Higher = More Unusual)", yaxis_title="Flows")
        st.plotly_chart(fig_hist, use_container_width=True)

    # Recent Security Alerts (with Alert IDs and Investigation Status)
    st.markdown("#### Recent Security Alerts")
    if alerts_df is not None and not alerts_df.empty:
        alert_cols = [
            "alert_id",
            "timestamp",
            "src_ip",
            "dst_ip",
            "protocol",
            "detection_category",
            "severity",
            "investigation_status",
            "anomaly_score",
            "detection_reason",
        ]
        st.dataframe(alerts_df[alert_cols].head(15), use_container_width=True, hide_index=True)
    else:
        st.success("No security alerts were triggered in the current analysis.")
