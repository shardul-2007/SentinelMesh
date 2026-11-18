"""
About SENTINELMESH Page — PRASUNEX INNOVATHON 2026 | Round 3 (AI/ML Track).
Includes the dedicated 'Securing the Digital Education Ecosystem' section,
technical architecture overview, honest limitations, and future roadmap.
"""

import streamlit as st

from src.report_generator import SYSTEM_LIMITATIONS
from src.ui_helpers import render_kpi_card, render_page_header


def render_about_page() -> None:
    render_page_header(
        "About SENTINELMESH",
        "AI-Powered Intelligent Cybersecurity Threat Detection and Network Monitoring System",
        badge_text="PRASUNEX INNOVATHON 2026 • ROUND 3 • AI/ML TRACK",
    )

    st.markdown(
        """
        ### Project Identity & Vision
        **SENTINELMESH** is an independent AI/ML-powered cybersecurity proof-of-concept developed for
        **PRASUNEX INNOVATHON 2026 (Round 3 — Prototype Development & Demonstration)** in the
        **Artificial Intelligence & Machine Learning** domain. It demonstrates how supervised classification,
        unsupervised anomaly detection, and explainable analytics can help security teams monitor network
        traffic and investigate suspicious activity without relying solely on static signatures.
        """
    )

    st.markdown("---")
    st.markdown("## Securing the Digital Education Ecosystem")
    st.info(
        "**Scope & Independence Note:** SENTINELMESH is an independent cybersecurity project in the AI/ML domain. "
        "It is **not** a School ERP and is **not** claimed to be an officially integrated PRASUNEX product. "
        "The scenarios below illustrate how AI-driven network monitoring could eventually complement digital education ecosystems."
    )

    st.markdown(
        """
        As modern educational ecosystems connect students, parents, teachers, recruiters, and administrators
        across cloud portals and institutional networks, defending the underlying network infrastructure becomes
        essential. SENTINELMESH explores how explainable ML detection could help protect:
        """
    )

    u1, u2, u3 = st.columns(3)
    with u1:
        render_kpi_card(
            "School ERP Infrastructure",
            "Admin & Finance",
            "Monitor database & ERP server traffic for brute-force login attempts or unusual query bursts.",
            "#06B6D4",
        )
        render_kpi_card(
            "Digital Learning Platforms",
            "LMS & Online Exams",
            "Detect sudden packet-rate surges (DDoS-like behavior) that could disrupt live exams or classes.",
            "#3B82F6",
        )
    with u2:
        render_kpi_card(
            "Student & Parent Portals",
            "Identity & Access",
            "Surface repeated authentication failures and automated credential-stuffing patterns early.",
            "#F59E0B",
        )
        render_kpi_card(
            "Institutional Networks",
            "Campus LAN / Wi-Fi",
            "Identify internal or external port scanning probing exposed campus services (SSH, RDP, SMB, DB).",
            "#F97316",
        )
    with u3:
        render_kpi_card(
            "Teacher & Admin Systems",
            "Endpoint Oversight",
            "Correlate repeated suspicious flows from a single compromised administrative workstation.",
            "#22C55E",
        )
        render_kpi_card(
            "Sensitive Data Environments",
            "Student Records",
            "Flag highly asymmetric outbound byte volumes over unusual ports that may warrant DLP review.",
            "#EF4444",
        )

    st.markdown(
        """
        #### Potential Benefits for Institutional Cybersecurity Operations
        - **Earlier identification of suspicious network behavior** beyond rigid static signatures.
        - **Improved visibility into network activity** across institutional subnets, protocols, and ports.
        - **Faster security investigation** through feature-level Z-score explanations and host incident grouping.
        - **Better awareness of potential digital threats** via readable dashboards and exportable audit reports.
        - **Support for institutional cybersecurity operations** without requiring expensive enterprise SIEM deployments.
        """
    )

    st.markdown("---")
    st.markdown("## Implemented Architecture & ML Pipeline")

    c1, c2 = st.columns(2)
    with c1:
        st.markdown(
            """
            1. **Data Ingestion & Validation (`src/data_loader.py`)**
               - Loads uploaded CSV flow datasets (compatible with CIC-IDS2017, UNSW-NB15, NetFlow, and synthetic demo data).
               - Trims header whitespace, detects numeric/categorical types, flags missing/infinite values, and auto-maps network columns.
            2. **Leakage-Safe Preprocessing (`src/preprocessing.py`)**
               - Replaces `+/-inf` with `NaN`, applies median/constant imputation, standardizes numeric features (`StandardScaler`), one-hot encodes low-cardinality protocol values, and strips labels/IDs from ML inputs.
            3. **Supervised Classification (`src/classification.py`)**
               - Trains a balanced Scikit-learn `RandomForestClassifier` on a held-out train/test split and reports genuine Accuracy, Precision, Recall, F1, Confusion Matrix, and Feature Importances.
            """
        )
    with c2:
        st.markdown(
            """
            4. **Unsupervised Anomaly Detection (`src/anomaly_detection.py`)**
               - Fits a Scikit-learn `IsolationForest` baseline with configurable contamination to surface statistical outliers even on unlabeled datasets.
            5. **Alert Management & Correlation (`src/alert_manager.py`, `src/incident_correlation.py`)**
               - Assigns Alert IDs (`ALT-0001`, ...), persists analyst investigation statuses & notes in local SQLite, and aggregates related suspicious host flows into Incidents (`INC-0001`, ...).
            6. **Explainability & Reporting (`src/explainability.py`, `src/report_generator.py`)**
               - Computes per-record feature deviations (Z-scores vs. dataset baseline) and exports real CSV, JSON, and PDF security reports.
            """
        )

    st.markdown("---")
    st.markdown("## Transparency: Honest Limitations & Future Roadmap")

    l1, l2 = st.columns(2)
    with l1:
        lim_md = "**Current MVP Limitations (Honest Disclosure):**\n" + "\n".join(f"- {l}" for l in SYSTEM_LIMITATIONS)
        st.warning(lim_md)
    with l2:
        st.info(
            """
            **Future Development Roadmap (Not Yet Implemented):**
            - Live network packet capture & real-time flow streaming (Zeek / Suricata).
            - Advanced intrusion detection models & SHAP-based local tree attributions.
            - Deeper multi-stage temporal attack correlation.
            - Role-based access control (RBAC) & secure multi-user institutional deployment.
            - Integration with institutional security infrastructure & privacy-preserving analytics.
            - Scalable cloud deployment with model drift monitoring.
            """
        )
