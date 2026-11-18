"""
Shared Streamlit UI Styling, Session Helpers, and Plotly Theme Utilities
for SENTINELMESH (Dark Cybersecurity Analytics Palette).
"""

from typing import Any, Dict, Optional
import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from src.classification import load_classifier_artifact
from src.anomaly_detection import load_anomaly_artifact
from src.data_loader import inspect_dataframe
from src.demo_data import load_or_create_demo_dataset
from src.utils import SEVERITY_COLORS, THEME_COLORS


CUSTOM_CSS = """
<style>
/* Global Layout */
.stApp {
    background-color: #0B1120;
    color: #F1F5F9;
}
[data-testid="stSidebar"] {
    background-color: #0F172A;
    border-right: 1px solid #1E293B;
}
[data-testid="stHeader"] {
    background-color: rgba(11, 17, 32, 0.85);
}

/* Metric Cards */
.sm-card {
    background-color: #111827;
    border: 1px solid #24344D;
    border-radius: 10px;
    padding: 16px 18px;
    margin-bottom: 12px;
}
.sm-card-title {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #94A3B8;
    margin-bottom: 6px;
}
.sm-card-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: #F1F5F9;
    line-height: 1.15;
}
.sm-card-sub {
    font-size: 0.78rem;
    color: #94A3B8;
    margin-top: 6px;
}

/* Badges */
.sm-badge {
    display: inline-block;
    padding: 2px 9px;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}
.sm-badge-critical { background: rgba(239,68,68,0.18); color: #FCA5A5; border: 1px solid rgba(239,68,68,0.45); }
.sm-badge-high     { background: rgba(249,115,22,0.18); color: #FDBA74; border: 1px solid rgba(249,115,22,0.45); }
.sm-badge-medium   { background: rgba(245,158,11,0.18); color: #FDE68A; border: 1px solid rgba(245,158,11,0.45); }
.sm-badge-low      { background: rgba(34,197,94,0.16);  color: #86EFAC; border: 1px solid rgba(34,197,94,0.4); }
.sm-badge-cyan     { background: rgba(6,182,212,0.16);  color: #67E8F9; border: 1px solid rgba(6,182,212,0.4); }
.sm-badge-demo     { background: rgba(59,130,246,0.18); color: #93C5FD; border: 1px solid rgba(59,130,246,0.45); }

/* Section headers */
.sm-page-header {
    border-bottom: 1px solid #1E293B;
    padding-bottom: 12px;
    margin-bottom: 18px;
}
.sm-page-title {
    font-size: 1.6rem;
    font-weight: 700;
    color: #F8FAFC;
    margin: 0;
}
.sm-page-subtitle {
    font-size: 0.9rem;
    color: #94A3B8;
    margin-top: 4px;
}

/* Explanation / evidence callout */
.sm-evidence-box {
    background-color: #0F172A;
    border-left: 3px solid #06B6D4;
    border-top: 1px solid #1E293B;
    border-right: 1px solid #1E293B;
    border-bottom: 1px solid #1E293B;
    border-radius: 6px;
    padding: 14px 16px;
    margin: 10px 0;
    font-size: 0.9rem;
    color: #E2E8F0;
}

/* Empty state */
.sm-empty-state {
    background-color: #111827;
    border: 1px dashed #334155;
    border-radius: 12px;
    padding: 36px 24px;
    text-align: center;
    margin: 18px 0;
}
</style>
"""


def inject_custom_css() -> None:
    st.markdown(CUSTOM_CSS, unsafe_allow_html=True)


def init_session_state() -> None:
    """Initialize required Streamlit session state keys and reload persisted models if present."""
    defaults: Dict[str, Any] = {
        "nav_page": "Security Overview",
        "raw_df": None,
        "dataset_meta": None,
        "column_mapping": {},
        "selected_features": [],
        "analysis_output": None,
        "alerts_df": None,
        "incidents_df": None,
        "selected_record_id": None,
        "rf_artifact": None,
        "iso_artifact": None,
        "models_checked": False,
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v

    if not st.session_state["models_checked"]:
        st.session_state["rf_artifact"] = load_classifier_artifact()
        st.session_state["iso_artifact"] = load_anomaly_artifact()
        st.session_state["models_checked"] = True


def load_demo_into_session() -> None:
    """Load the clearly labeled synthetic demonstration CSV into session state."""
    df = load_or_create_demo_dataset()
    meta = inspect_dataframe(df, filename="synthetic_network_traffic.csv (SYNTHETIC DEMO)")
    meta["is_synthetic_demo"] = True
    st.session_state["raw_df"] = df
    st.session_state["dataset_meta"] = meta
    st.session_state["column_mapping"] = dict(meta["suggested_mapping"])
    st.session_state["selected_features"] = list(meta["candidate_ml_features"])
    st.session_state["analysis_output"] = None
    st.session_state["alerts_df"] = None
    st.session_state["incidents_df"] = None
    st.session_state["selected_record_id"] = None


def render_page_header(title: str, subtitle: str, badge_text: Optional[str] = None) -> None:
    badge_html = f'<span class="sm-badge sm-badge-cyan" style="margin-left:10px;vertical-align:middle;">{badge_text}</span>' if badge_text else ""
    st.markdown(
        f"""
        <div class="sm-page-header">
            <h1 class="sm-page-title">{title}{badge_html}</h1>
            <div class="sm-page-subtitle">{subtitle}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_kpi_card(title: str, value: Any, subtitle: str = "", accent_color: str = "#F1F5F9") -> None:
    st.markdown(
        f"""
        <div class="sm-card">
            <div class="sm-card-title">{title}</div>
            <div class="sm-card-value" style="color:{accent_color};">{value}</div>
            <div class="sm-card-sub">{subtitle}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def severity_badge_html(severity: str) -> str:
    sev = str(severity or "LOW").upper()
    cls = {
        "CRITICAL": "sm-badge-critical",
        "HIGH": "sm-badge-high",
        "MEDIUM": "sm-badge-medium",
        "LOW": "sm-badge-low",
    }.get(sev, "sm-badge-low")
    return f'<span class="sm-badge {cls}">{sev}</span>'


def style_plotly_fig(fig: go.Figure, title: str = "", height: int = 340) -> go.Figure:
    """Apply consistent dark navy cybersecurity theme to Plotly figures."""
    fig.update_layout(
        title=dict(text=title, font=dict(size=14, color="#E2E8F0")),
        paper_bgcolor="rgba(17, 24, 39, 0.0)",
        plot_bgcolor="rgba(15, 23, 42, 0.65)",
        font=dict(color="#CBD5E1", size=12),
        height=height,
        margin=dict(l=20, r=20, t=44 if title else 20, b=24),
        legend=dict(bgcolor="rgba(0,0,0,0)", font=dict(color="#CBD5E1", size=11)),
        xaxis=dict(gridcolor="#1E293B", zerolinecolor="#334155"),
        yaxis=dict(gridcolor="#1E293B", zerolinecolor="#334155"),
    )
    return fig


def render_demo_notice_if_synthetic() -> None:
    """Display an explicit banner whenever synthetic demo data is active."""
    meta = st.session_state.get("dataset_meta")
    if meta and meta.get("is_synthetic_demo"):
        st.info(
            "**SYNTHETIC DEMONSTRATION DATA ACTIVE:** You are analyzing locally generated synthetic "
            "network flow records created for reproducible hackathon testing — NOT live production "
            "network captures. Upload any CIC-IDS2017, UNSW-NB15, or NetFlow CSV in **Traffic Analysis** "
            "to analyze external data."
        )
