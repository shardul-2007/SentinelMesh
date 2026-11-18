"""
Threat Detection & Alert Management Page for SENTINELMESH (Module D).
Provides interactive alert triage with Alert IDs (ALT-0001...), multi-filtering,
search, sorting, persistent investigation status updates, visual anomaly mapping,
and one-click handoff to Incident Investigation.
"""

import pandas as pd
import plotly.express as px
import streamlit as st

from src.alert_manager import (
    ALERT_STATUSES,
    build_alerts_table,
    update_alert_status,
)
from src.ui_helpers import (
    render_demo_notice_if_synthetic,
    render_kpi_card,
    render_page_header,
    severity_badge_html,
    style_plotly_fig,
)
from src.utils import SEVERITY_COLORS


def render_threat_detection_page() -> None:
    render_page_header(
        "Threat Detection & Alert Management",
        "Triage structured security alerts, filter by severity/host/category/status, mark alerts investigated, and hand off to Incident Investigation.",
        badge_text="ALERT MANAGEMENT",
    )
    render_demo_notice_if_synthetic()

    analysis = st.session_state.get("analysis_output")
    meta = st.session_state.get("dataset_meta")
    if analysis is None or meta is None:
        st.markdown(
            """
            <div class="sm-empty-state">
                <h4 style="color:#F1F5F9;">No Detection Results Available</h4>
                <p style="color:#94A3B8;font-size:0.9rem;">
                    Run analysis in <strong>Traffic Analysis</strong> (or click <strong>Load &amp; Run Synthetic Demo</strong> in the sidebar) to populate security alerts.
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
    active_features = analysis["active_features"]

    # Always ensure alerts_df is synchronized with persisted triage state
    alerts_df: pd.DataFrame = st.session_state.get("alerts_df")
    if alerts_df is None:
        alerts_df = build_alerts_table(results_df, cleaned_df, active_features, dataset_key=dataset_key)
        st.session_state["alerts_df"] = alerts_df

    # Summary strip
    sev_counts = analysis["summary"]["severity_counts"]
    investigated_count = (
        int(alerts_df["investigation_status"].isin(["INVESTIGATED", "RESOLVED", "FALSE_POSITIVE"]).sum())
        if not alerts_df.empty
        else 0
    )
    open_count = int((alerts_df["investigation_status"] == "OPEN").sum()) if not alerts_df.empty else 0

    c1, c2, c3, c4, c5 = st.columns(5)
    with c1:
        render_kpi_card("Critical Alerts", sev_counts.get("CRITICAL", 0), "Immediate triage", "#EF4444")
    with c2:
        render_kpi_card("High Alerts", sev_counts.get("HIGH", 0), "Priority review", "#F97316")
    with c3:
        render_kpi_card("Medium Alerts", sev_counts.get("MEDIUM", 0), "Anomalous / heuristic", "#F59E0B")
    with c4:
        render_kpi_card("Open Alerts", open_count, "Awaiting analyst review", "#38BDF8")
    with c5:
        render_kpi_card("Investigated / Closed", investigated_count, f"of {len(alerts_df):,} total alerts", "#22C55E")

    if alerts_df.empty:
        st.success("No suspicious alerts were generated for the current dataset.")
        return

    # Multi-filter bar (Filter, Search, Sort)
    st.markdown("### Filter & Search Security Alerts")
    f1, f2, f3, f4 = st.columns(4)
    with f1:
        sev_opts = st.multiselect(
            "Severity",
            ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
            default=["CRITICAL", "HIGH", "MEDIUM"],
            key="td_sev",
        )
        src_ips = ["ALL"] + sorted([v for v in alerts_df["src_ip"].unique() if v != "N/A"])
        src_filter = st.selectbox("Source IP", src_ips, key="td_src")
    with f2:
        cats = ["ALL"] + sorted(alerts_df["detection_category"].unique().tolist())
        cat_filter = st.selectbox("Detection Category", cats, key="td_cat")
        dst_ips = ["ALL"] + sorted([v for v in alerts_df["dst_ip"].unique() if v != "N/A"])
        dst_filter = st.selectbox("Destination IP", dst_ips, key="td_dst")
    with f3:
        status_filter = st.multiselect(
            "Investigation Status",
            ALERT_STATUSES,
            default=ALERT_STATUSES,
            key="td_status",
        )
        protos = ["ALL"] + sorted([v for v in alerts_df["protocol"].unique() if v != "N/A"])
        proto_filter = st.selectbox("Protocol", protos, key="td_proto")
    with f4:
        search_q = st.text_input("Search Alert ID / IP / Reason", key="td_search")
        sort_by = st.selectbox(
            "Sort Alerts By",
            ["Severity & Anomaly Score", "Anomaly Score (High->Low)", "Alert ID", "Timestamp"],
            key="td_sort",
        )

    filtered = alerts_df[
        alerts_df["severity"].isin(sev_opts) & alerts_df["investigation_status"].isin(status_filter)
    ].copy()
    if cat_filter != "ALL":
        filtered = filtered[filtered["detection_category"] == cat_filter]
    if src_filter != "ALL":
        filtered = filtered[filtered["src_ip"] == src_filter]
    if dst_filter != "ALL":
        filtered = filtered[filtered["dst_ip"] == dst_filter]
    if proto_filter != "ALL":
        filtered = filtered[filtered["protocol"] == proto_filter]
    if search_q.strip():
        q = search_q.strip().lower()
        mask = (
            filtered["alert_id"].astype(str).str.lower().str.contains(q, regex=False)
            | filtered["record_id"].astype(str).str.lower().str.contains(q, regex=False)
            | filtered["src_ip"].astype(str).str.lower().str.contains(q, regex=False)
            | filtered["dst_ip"].astype(str).str.lower().str.contains(q, regex=False)
            | filtered["detection_category"].astype(str).str.lower().str.contains(q, regex=False)
            | filtered["detection_reason"].astype(str).str.lower().str.contains(q, regex=False)
        )
        filtered = filtered[mask]

    if sort_by == "Severity & Anomaly Score":
        sev_rank = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
        filtered = filtered.assign(_r=filtered["severity"].map(sev_rank)).sort_values(
            by=["_r", "anomaly_score"], ascending=[False, False]
        ).drop(columns=["_r"])
    elif sort_by == "Anomaly Score (High->Low)":
        filtered = filtered.sort_values(by="anomaly_score", ascending=False)
    elif sort_by == "Alert ID":
        filtered = filtered.sort_values(by="alert_id", ascending=True)
    else:
        filtered = filtered.sort_values(by="timestamp", ascending=False)

    # Visual Analytics Row
    v1, v2 = st.columns(2)
    with v1:
        if active_features and not filtered.empty:
            x_feat = st.selectbox(
                "Plot Anomaly Score vs Network Feature",
                options=active_features,
                index=0,
                key="td_scatter_feat",
            )
            plot_df = filtered.head(500).copy()
            plot_df[x_feat] = cleaned_df.loc[plot_df["row_index"], x_feat].values
            fig_sc = px.scatter(
                plot_df,
                x=x_feat,
                y="anomaly_score",
                color="severity",
                color_discrete_map=SEVERITY_COLORS,
                hover_data=["alert_id", "src_ip", "dst_ip", "dst_port", "detection_category", "investigation_status"],
            )
            style_plotly_fig(fig_sc, title=f"Alert Anomaly Score vs {x_feat}", height=310)
            st.plotly_chart(fig_sc, use_container_width=True)
        else:
            st.info("Adjust filters above to visualize matching alerts.")

    with v2:
        if not filtered.empty and (filtered["src_ip"] != "N/A").any():
            top_hosts = (
                filtered[filtered["src_ip"] != "N/A"]["src_ip"]
                .value_counts()
                .head(10)
                .reset_index()
            )
            top_hosts.columns = ["Source IP", "Alert Count"]
            fig_hosts = px.bar(
                top_hosts,
                x="Alert Count",
                y="Source IP",
                orientation="h",
                color="Alert Count",
                color_continuous_scale=["#06B6D4", "#F97316", "#EF4444"],
            )
            style_plotly_fig(fig_hosts, title="Top Alert-Generating Source Hosts", height=355)
            fig_hosts.update_layout(yaxis=dict(autorange="reversed"), coloraxis_showscale=False)
            st.plotly_chart(fig_hosts, use_container_width=True)
        else:
            st.info("No source host IPs available in the filtered alerts.")

    # Alerts Table
    st.markdown(f"### Active Security Alerts ({len(filtered):,} matching)")
    if filtered.empty:
        st.info("No alerts match the current filter criteria.")
        return

    display_cols = [
        "alert_id",
        "timestamp",
        "src_ip",
        "dst_ip",
        "dst_port",
        "protocol",
        "detection_category",
        "severity",
        "investigation_status",
        "anomaly_score",
        "relevant_features",
        "detection_reason",
    ]
    st.dataframe(filtered[display_cols].head(200), use_container_width=True, hide_index=True)

    # Interactive Alert Triage & Investigation Status Update
    st.markdown("---")
    st.markdown("### Alert Triage & Investigation Status Update")
    alert_choices = filtered["alert_id"].head(200).tolist()
    chosen_alert_id = st.selectbox(
        "Select Alert to View Details or Update Investigation Status",
        options=alert_choices,
        format_func=lambda aid: (
            f"{aid} ({filtered.loc[filtered['alert_id'] == aid, 'severity'].iloc[0]} | "
            f"{filtered.loc[filtered['alert_id'] == aid, 'detection_category'].iloc[0]} | "
            f"Status: {filtered.loc[filtered['alert_id'] == aid, 'investigation_status'].iloc[0]})"
        ),
        key="td_selected_alert",
    )

    sel_alert = filtered[filtered["alert_id"] == chosen_alert_id].iloc[0]
    st.markdown(
        f"""
        <div class="sm-evidence-box">
            <strong>{sel_alert['alert_id']}</strong> (Flow <code>{sel_alert['record_id']}</code>) &nbsp;
            {severity_badge_html(sel_alert['severity'])}
            &nbsp; <span class="sm-badge sm-badge-cyan">{sel_alert['investigation_status']}</span><br/><br/>
            <strong>Host Pair:</strong> {sel_alert['src_ip']} &rarr; {sel_alert['dst_ip']}:{sel_alert['dst_port']} ({sel_alert['protocol']})<br/>
            <strong>Category:</strong> {sel_alert['detection_category']} | <strong>Anomaly Score:</strong> {sel_alert['anomaly_score']}/100 | <strong>Method:</strong> {sel_alert['detection_method']}<br/>
            <strong>Relevant Features:</strong> <code>{sel_alert['relevant_features']}</code><br/>
            <strong>Reason:</strong> {sel_alert['detection_reason']}<br/>
            <strong>Recommended Action:</strong> {sel_alert['recommended_action']}
        </div>
        """,
        unsafe_allow_html=True,
    )

    u1, u2, u3 = st.columns([1.2, 1.8, 1])
    with u1:
        cur_status = str(sel_alert["investigation_status"])
        new_status = st.selectbox(
            "Update Investigation Status",
            options=ALERT_STATUSES,
            index=ALERT_STATUSES.index(cur_status) if cur_status in ALERT_STATUSES else 0,
            key=f"td_new_status_{chosen_alert_id}",
        )
    with u2:
        new_note = st.text_input(
            "Analyst Investigation Note",
            value=str(sel_alert["analyst_note"] or ""),
            placeholder="e.g., Confirmed port probe from external scanner; escalated to campus network admin.",
            key=f"td_note_{chosen_alert_id}",
        )
    with u3:
        st.markdown("<div style='height:28px;'></div>", unsafe_allow_html=True)
        if st.button("Save Alert Status", type="primary", use_container_width=True):
            update_alert_status(
                dataset_key=dataset_key,
                alert_id=chosen_alert_id,
                record_id=str(sel_alert["record_id"]),
                status=new_status,
                analyst_note=new_note,
            )
            st.session_state["alerts_df"] = build_alerts_table(
                results_df, cleaned_df, active_features, dataset_key=dataset_key
            )
            st.success(f"Alert {chosen_alert_id} updated to '{new_status}'.")
            st.rerun()

    b1, b2 = st.columns(2)
    with b1:
        if st.button(f"Mark {chosen_alert_id} as INVESTIGATED", use_container_width=True):
            update_alert_status(
                dataset_key=dataset_key,
                alert_id=chosen_alert_id,
                record_id=str(sel_alert["record_id"]),
                status="INVESTIGATED",
                analyst_note=new_note or "Reviewed and verified by security analyst.",
            )
            st.session_state["alerts_df"] = build_alerts_table(
                results_df, cleaned_df, active_features, dataset_key=dataset_key
            )
            st.success(f"Alert {chosen_alert_id} marked as INVESTIGATED.")
            st.rerun()
    with b2:
        if st.button("Deep-Dive in Incident Investigation", use_container_width=True):
            st.session_state["selected_record_id"] = str(sel_alert["record_id"])
            st.session_state["nav_page"] = "Incident Investigation"
            st.rerun()
