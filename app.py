"""
SENTINELMESH — AI-Powered Intelligent Cybersecurity Threat Detection
and Network Monitoring System (PRASUNEX INNOVATHON 2026 | AI/ML Track).

Main Streamlit entry point.
Launch with: streamlit run app.py
"""

import streamlit as st

# Page config MUST be the first Streamlit command
st.set_page_config(
    page_title="SENTINELMESH | AI Cybersecurity & Network Monitoring",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

from src.ui_helpers import init_session_state, inject_custom_css
from pages.overview import render_overview_page, run_one_click_demo_workflow
from pages.traffic_analysis import render_traffic_analysis_page
from pages.threat_detection import render_threat_detection_page
from pages.threat_investigation import render_threat_investigation_page
from pages.model_center import render_model_center_page
from pages.reports import render_reports_page
from pages.about import render_about_page


NAV_ITEMS = [
    "Security Overview",
    "Traffic Analysis",
    "Threat Detection",
    "Incident Investigation",
    "ML Model Center",
    "Reports",
    "About SENTINELMESH",
]


def render_sidebar() -> str:
    with st.sidebar:
        st.markdown(
            """
            <div style="padding: 6px 2px 14px 2px; border-bottom: 1px solid #1E293B; margin-bottom: 14px;">
                <div style="font-size:1.25rem; font-weight:800; color:#F8FAFC; letter-spacing:0.04em;">
                    SENTINEL<span style="color:#06B6D4;">MESH</span>
                </div>
                <div style="font-size:0.74rem; color:#94A3B8; margin-top:2px;">
                    AI/ML Threat Detection &amp; Monitoring
                </div>
                <div style="margin-top:8px;">
                    <span class="sm-badge sm-badge-cyan">PRASUNEX 2026 • R3</span>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        current_page = st.session_state.get("nav_page", "Security Overview")
        if current_page not in NAV_ITEMS:
            current_page = "Security Overview"

        selected = st.radio(
            "Navigation",
            options=NAV_ITEMS,
            index=NAV_ITEMS.index(current_page),
            label_visibility="collapsed",
        )
        if selected != current_page:
            st.session_state["nav_page"] = selected
            st.rerun()

        st.markdown("---")
        st.markdown(
            '<div style="font-size:0.72rem;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Quick Demo Action</div>',
            unsafe_allow_html=True,
        )
        if st.button(
            "Load & Run Synthetic Demo",
            use_container_width=True,
            help="Loads 1,200 clearly labeled synthetic network flow records, trains Random Forest + Isolation Forest, and populates all dashboard views.",
        ):
            with st.spinner("Running synthetic demo ML pipeline..."):
                run_one_click_demo_workflow()
            st.session_state["nav_page"] = "Security Overview"
            st.rerun()

        # Compact live status footer
        meta = st.session_state.get("dataset_meta")
        analysis = st.session_state.get("analysis_output")
        rf_art = st.session_state.get("rf_artifact")
        iso_art = st.session_state.get("iso_artifact")

        st.markdown("---")
        st.markdown(
            '<div style="font-size:0.72rem;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Session Telemetry</div>',
            unsafe_allow_html=True,
        )
        ds_status = f"{meta['n_rows']:,} rows" if meta else "None"
        rf_status = f"Acc {rf_art['metrics']['accuracy']*100:.1f}%" if rf_art else "Not trained"
        iso_status = f"{iso_art['summary']['anomaly_count']} outliers" if iso_art else "Idle"
        an_status = f"{analysis['summary']['high_critical_alerts']} high/crit" if analysis else "Not run"

        st.caption(
            f"**Dataset:** {ds_status}\n\n"
            f"**RF Classifier:** {rf_status}\n\n"
            f"**IsoForest:** {iso_status}\n\n"
            f"**Alerts:** {an_status}"
        )

    return st.session_state["nav_page"]


def main() -> None:
    inject_custom_css()
    init_session_state()

    active_page = render_sidebar()

    if active_page == "Security Overview":
        render_overview_page()
    elif active_page == "Traffic Analysis":
        render_traffic_analysis_page()
    elif active_page == "Threat Detection":
        render_threat_detection_page()
    elif active_page == "Incident Investigation":
        render_threat_investigation_page()
    elif active_page == "ML Model Center":
        render_model_center_page()
    elif active_page == "Reports":
        render_reports_page()
    elif active_page == "About SENTINELMESH":
        render_about_page()


if __name__ == "__main__":
    main()
