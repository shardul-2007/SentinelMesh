"""
Incident Investigation & Forensic Explainability Page for SENTINELMESH (Module E).
Displays rule-based correlated incidents with persistent status tracking,
interactive incident timelines, and deep-dive per-record explainability.
"""

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

from src.alert_manager import (
    INCIDENT_STATUSES,
    merge_incident_statuses,
    update_incident_status,
)
from src.explainability import get_top_deviated_features
from src.ui_helpers import (
    render_demo_notice_if_synthetic,
    render_kpi_card,
    render_page_header,
    severity_badge_html,
    style_plotly_fig,
)
from src.utils import SEVERITY_COLORS


def render_threat_investigation_page() -> None:
    render_page_header(
        "Incident Investigation & Explainability",
        "Investigate rule-based correlated host incidents, track investigation status, inspect event timelines, and examine feature-level ML explanations.",
        badge_text="INCIDENT INVESTIGATION",
    )
    render_demo_notice_if_synthetic()

    analysis = st.session_state.get("analysis_output")
    meta = st.session_state.get("dataset_meta")
    incidents_df: pd.DataFrame = st.session_state.get("incidents_df")

    if analysis is None or meta is None:
        st.markdown(
            """
            <div class="sm-empty-state">
                <h4 style="color:#F1F5F9;">No Analysis Available to Investigate</h4>
                <p style="color:#94A3B8;font-size:0.9rem;">
                    Run traffic analysis first to generate correlated incidents and record-level explanations.
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )
        if st.button("Go to Traffic Analysis", type="primary"):
            st.session_state["nav_page"] = "Traffic Analysis"
            st.rerun()
        return

    dataset_key = meta["filename"]
    results_df: pd.DataFrame = analysis["results_df"]
    cleaned_df: pd.DataFrame = analysis["cleaned_df"]
    baselines = analysis["baselines"]
    active_features = analysis["active_features"]

    if incidents_df is not None and not incidents_df.empty and "investigation_status" not in incidents_df.columns:
        incidents_df = merge_incident_statuses(incidents_df, dataset_key=dataset_key)
        st.session_state["incidents_df"] = incidents_df

    # Section 1: Correlated Security Incidents + Persistent Status Workflow
    st.markdown("### 1. Correlated Security Incidents (Rule-Based Host & Protocol Aggregation)")
    st.caption(
        "Transparent rule-based grouping of suspicious flows sharing source/destination host pairs, protocol, and observed time range. "
        "(Note: Deterministic correlation, not a graph neural network.)"
    )

    selected_incident_row = None
    if incidents_df is None or incidents_df.empty:
        st.success("No correlated suspicious incidents were generated for this dataset.")
    else:
        inc_cols = [
            "incident_id",
            "investigation_status",
            "highest_severity",
            "grouping_key",
            "related_record_count",
            "predicted_categories",
            "avg_anomaly_score",
            "first_seen",
            "last_seen",
            "analyst_note",
        ]
        avail_inc_cols = [c for c in inc_cols if c in incidents_df.columns]
        st.dataframe(incidents_df[avail_inc_cols], use_container_width=True, hide_index=True)

        inc_options = ["All Flagged Records"] + [
            f"{row['incident_id']} — {row['grouping_key']} ({row['related_record_count']} records | {row['highest_severity']} | {row.get('investigation_status', 'OPEN')})"
            for _, row in incidents_df.iterrows()
        ]
        chosen_inc_label = st.selectbox("Select Correlated Incident to Investigate & Update Status", inc_options)

        if chosen_inc_label != "All Flagged Records":
            inc_id = chosen_inc_label.split(" — ")[0].strip()
            selected_incident_row = incidents_df[incidents_df["incident_id"] == inc_id].iloc[0]

            # Incident Status Update Panel
            st.markdown(
                f"#### Incident `{inc_id}` &nbsp; {severity_badge_html(selected_incident_row['highest_severity'])} "
                f"&nbsp; <span class='sm-badge sm-badge-cyan'>{selected_incident_row.get('investigation_status', 'OPEN')}</span>",
                unsafe_allow_html=True,
            )
            st.caption(
                f"**Hosts:** {selected_incident_row['source_hosts']} → {selected_incident_row['destination_hosts']} | "
                f"**Protocols:** {selected_incident_row['protocols']} | "
                f"**Observed Window:** {selected_incident_row['first_seen']} to {selected_incident_row['last_seen']}"
            )

            ic1, ic2, ic3 = st.columns([1.2, 2.0, 1])
            cur_inc_status = str(selected_incident_row.get("investigation_status", "OPEN"))
            with ic1:
                new_inc_status = st.selectbox(
                    "Incident Status",
                    options=INCIDENT_STATUSES,
                    index=INCIDENT_STATUSES.index(cur_inc_status) if cur_inc_status in INCIDENT_STATUSES else 0,
                    key=f"inc_stat_{inc_id}",
                )
            with ic2:
                new_inc_note = st.text_input(
                    "Incident Investigation Notes",
                    value=str(selected_incident_row.get("analyst_note", "") or ""),
                    placeholder="Document root cause findings, affected institutional host, or escalation ticket...",
                    key=f"inc_note_{inc_id}",
                )
            with ic3:
                st.markdown("<div style='height:28px;'></div>", unsafe_allow_html=True)
                if st.button("Update Incident Status", type="primary", use_container_width=True):
                    update_incident_status(
                        dataset_key=dataset_key,
                        incident_id=inc_id,
                        status=new_inc_status,
                        analyst_note=new_inc_note,
                    )
                    st.session_state["incidents_df"] = merge_incident_statuses(
                        incidents_df.drop(columns=["investigation_status", "analyst_note"], errors="ignore"),
                        dataset_key=dataset_key,
                    )
                    st.success(f"Incident {inc_id} status updated to '{new_inc_status}'.")
                    st.rerun()

            # Incident Supporting Records Timeline
            src_host_str = str(selected_incident_row["source_hosts"])
            dst_host_str = str(selected_incident_row["destination_hosts"])
            inc_records = results_df[
                (results_df["is_suspicious"] == True)  # noqa: E712
                & (results_df["src_ip"].isin([h.strip() for h in src_host_str.split(",")]))
            ].copy()
            if dst_host_str != "N/A" and not inc_records.empty:
                dst_match = inc_records[
                    inc_records["dst_ip"].isin([h.strip() for h in dst_host_str.split(",")])
                ]
                if not dst_match.empty:
                    inc_records = dst_match

            if not inc_records.empty and (inc_records["timestamp"] != "N/A").any():
                inc_records["_ts"] = pd.to_datetime(inc_records["timestamp"], errors="coerce")
                valid_tl = inc_records.dropna(subset=["_ts"]).sort_values("_ts")
                if len(valid_tl) >= 2:
                    fig_inc_tl = px.scatter(
                        valid_tl,
                        x="_ts",
                        y="anomaly_score",
                        color="severity",
                        color_discrete_map=SEVERITY_COLORS,
                        hover_data=["record_id", "dst_port", "protocol", "predicted_category", "detection_reason"],
                    )
                    style_plotly_fig(fig_inc_tl, title=f"Incident {inc_id} Activity Timeline ({len(valid_tl)} events)", height=270)
                    fig_inc_tl.update_layout(xaxis_title="Event Timestamp", yaxis_title="Anomaly Score (0-100)")
                    st.plotly_chart(fig_inc_tl, use_container_width=True)

    st.markdown("---")
    st.markdown("### 2. Single-Record Forensic XAI Inspector")

    sev_rank = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
    ordered = results_df.assign(_r=results_df["severity"].map(sev_rank)).sort_values(
        by=["_r", "anomaly_score"], ascending=[False, False]
    ).drop(columns=["_r"])

    if selected_incident_row is not None:
        sample_ids = [s.strip() for s in str(selected_incident_row["sample_record_ids"]).split(",") if s.strip()]
        candidate_df = ordered[ordered["record_id"].isin(sample_ids)]
        if candidate_df.empty:
            candidate_df = ordered
    else:
        susp_only = ordered[ordered["is_suspicious"] == True]  # noqa: E712
        candidate_df = susp_only if not susp_only.empty else ordered

    candidate_ids = candidate_df["record_id"].tolist()[:300]
    default_idx = 0
    saved_id = st.session_state.get("selected_record_id")
    if saved_id in candidate_ids:
        default_idx = candidate_ids.index(saved_id)

    selected_id = st.selectbox(
        "Select Supporting Traffic Record to Inspect",
        options=candidate_ids,
        index=default_idx,
        format_func=lambda rid: (
            f"{rid} | "
            f"{ordered.loc[ordered['record_id'] == rid, 'severity'].iloc[0]} | "
            f"{ordered.loc[ordered['record_id'] == rid, 'predicted_category'].iloc[0]} | "
            f"Anomaly: {ordered.loc[ordered['record_id'] == rid, 'anomaly_score'].iloc[0]}/100"
        ),
    )
    st.session_state["selected_record_id"] = selected_id

    rec = results_df[results_df["record_id"] == selected_id].iloc[0]
    raw_row = cleaned_df.iloc[int(rec["row_index"])]

    st.markdown(
        f"#### Record `{rec['record_id']}` &nbsp; {severity_badge_html(rec['severity'])}",
        unsafe_allow_html=True,
    )
    k1, k2, k3, k4 = st.columns(4)
    with k1:
        render_kpi_card(
            "Source -> Destination",
            f"{rec['src_ip']}",
            f"-> {rec['dst_ip']} (Port {rec['dst_port']} / {rec['protocol']})",
            "#38BDF8",
        )
    with k2:
        vote_txt = (
            f"RF Vote Share: {rec['rf_vote_proportion']*100:.1f}% (not calibrated prob.)"
            if pd.notna(rec["rf_vote_proportion"]) and rec["rf_vote_proportion"] is not None
            else "No supervised classifier active"
        )
        render_kpi_card("Predicted Category", str(rec["predicted_category"]), vote_txt, "#F1F5F9")
    with k3:
        render_kpi_card(
            "Anomaly Score",
            f"{rec['anomaly_score']:.1f} / 100",
            f"Status: {rec['anomaly_status']} (raw: {rec['raw_iso_score']})",
            "#EF4444" if rec["anomaly_status"] == "ANOMALY" else "#22C55E",
        )
    with k4:
        render_kpi_card(
            "Detection Method",
            str(rec["detection_method"]),
            f"Timestamp: {rec['timestamp']}",
            "#06B6D4",
        )

    st.markdown(
        f"""
        <div class="sm-evidence-box">
            <strong style="color:#67E8F9;">Why This Record Was Flagged:</strong><br/>
            {rec['detection_reason']}<br/><br/>
            <strong style="color:#86EFAC;">Recommended Next Investigation Action (Non-Destructive):</strong><br/>
            {rec['recommended_action']}<br/><br/>
            <strong style="color:#FDBA74;">Triggered Heuristics:</strong> {rec['heuristic_flags']}
        </div>
        """,
        unsafe_allow_html=True,
    )

    deviations = get_top_deviated_features(raw_row, baselines, active_features, top_n=8)
    col_chart, col_tbl = st.columns([1.2, 1])

    with col_chart:
        if deviations:
            dev_df = pd.DataFrame(deviations)
            bar_colors = ["#EF4444" if abs(z) >= 2.5 else "#F59E0B" if abs(z) >= 1.5 else "#06B6D4" for z in dev_df["z_score"]]
            fig_dev = go.Figure(
                data=[
                    go.Bar(
                        x=dev_df["z_score"],
                        y=dev_df["feature"],
                        orientation="h",
                        marker_color=bar_colors,
                        text=[f"{z:+.2f}σ" for z in dev_df["z_score"]],
                        textposition="outside",
                    )
                ]
            )
            style_plotly_fig(fig_dev, title="Top Feature Deviations vs Dataset Baseline (Z-Score)", height=340)
            fig_dev.update_layout(
                xaxis_title="Standard Deviations from Dataset Mean (σ)",
                yaxis=dict(autorange="reversed"),
            )
            st.plotly_chart(fig_dev, use_container_width=True)
        else:
            st.info("No numeric feature deviation statistics available for this record.")

    with col_tbl:
        st.markdown("##### Observed Feature Values vs Dataset Baseline")
        if deviations:
            st.dataframe(
                pd.DataFrame(deviations)[["feature", "value", "dataset_median", "p95", "z_score"]],
                use_container_width=True,
                hide_index=True,
            )

    with st.expander("View All Raw Columns for This Record", expanded=False):
        raw_kv = pd.DataFrame(
            [{"Field": k, "Observed Value": str(v)} for k, v in raw_row.items()]
        )
        st.dataframe(raw_kv, use_container_width=True, hide_index=True)

    if rec["src_ip"] != "N/A":
        related = results_df[
            (results_df["src_ip"] == rec["src_ip"]) & (results_df["record_id"] != rec["record_id"])
        ]
        st.markdown(f"#### Supporting Traffic Records from Source Host `{rec['src_ip']}` ({len(related)} other flows)")
        if related.empty:
            st.caption("No other flows from this source IP exist in the current dataset.")
        else:
            rel_cols = [
                "record_id",
                "timestamp",
                "dst_ip",
                "dst_port",
                "protocol",
                "predicted_category",
                "anomaly_status",
                "anomaly_score",
                "severity",
            ]
            st.dataframe(related[rel_cols].head(25), use_container_width=True, hide_index=True)
