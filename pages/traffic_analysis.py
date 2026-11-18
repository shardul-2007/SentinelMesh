"""
Traffic Analysis Page for SENTINELMESH.
Handles CSV upload, schema inspection, feature & role mapping, validation,
ML analysis execution, and paginated/filterable result inspection.
"""

import math
from typing import Dict, List, Optional
import pandas as pd
import plotly.express as px
import streamlit as st

from src.alert_manager import build_alerts_table, merge_incident_statuses
from src.classification import ClassificationError, train_random_forest
from src.data_loader import (
    DatasetValidationError,
    load_csv_data,
    validate_dataset_for_analysis,
)
from src.feature_engineering import add_derived_network_features
from src.hybrid_detection import run_hybrid_detection
from src.incident_correlation import correlate_incidents
from src.ui_helpers import (
    load_demo_into_session,
    render_demo_notice_if_synthetic,
    render_page_header,
    style_plotly_fig,
)


def render_traffic_analysis_page() -> None:
    render_page_header(
        "Network Traffic Analysis",
        "Upload network flow CSV files (CIC-IDS2017, UNSW-NB15, NetFlow) or load synthetic demo data to inspect, validate, and run ML detection.",
        badge_text="DATA PIPELINE",
    )

    # 1. Data Ingestion Row
    col_up, col_demo = st.columns([2.2, 1])
    with col_up:
        uploaded = st.file_uploader(
            "Upload Network Traffic CSV",
            type=["csv"],
            help="Supports standard flow CSVs including CIC-IDS2017 and UNSW-NB15 exports. Column names are auto-trimmed and mapped.",
        )
        if uploaded is not None:
            # Load only if new file or not yet loaded
            current_meta = st.session_state.get("dataset_meta")
            if current_meta is None or current_meta.get("filename") != uploaded.name:
                try:
                    df, meta = load_csv_data(uploaded, filename=uploaded.name)
                    st.session_state["raw_df"] = df
                    st.session_state["dataset_meta"] = meta
                    st.session_state["column_mapping"] = dict(meta["suggested_mapping"])
                    st.session_state["selected_features"] = list(meta["candidate_ml_features"])
                    st.session_state["analysis_output"] = None
                    st.session_state["incidents_df"] = None
                    st.success(f"Loaded '{uploaded.name}' ({meta['n_rows']:,} rows x {meta['n_cols']} columns).")
                except DatasetValidationError as exc:
                    st.error(f"Dataset validation failed: {exc}")

    with col_demo:
        st.markdown("<div style='height:28px;'></div>", unsafe_allow_html=True)
        if st.button(
            "Load Synthetic Demo Dataset",
            type="secondary",
            use_container_width=True,
            help="Loads 1,200 reproducible synthetic network flow records clearly labeled for demonstration.",
        ):
            load_demo_into_session()
            st.success("Loaded synthetic demonstration dataset (1,200 flow records).")
            st.rerun()

    render_demo_notice_if_synthetic()

    raw_df: Optional[pd.DataFrame] = st.session_state.get("raw_df")
    meta = st.session_state.get("dataset_meta")

    if raw_df is None or meta is None:
        st.markdown(
            """
            <div class="sm-empty-state">
                <h4 style="color:#F1F5F9;">Waiting for Network Traffic Dataset</h4>
                <p style="color:#94A3B8;font-size:0.9rem;">
                    Upload a CSV file above or click <strong>Load Synthetic Demo Dataset</strong> to inspect columns and run threat detection.
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )
        return

    # 2. Dataset Preview, Column Inspection & Traffic Statistics
    with st.expander(f"Dataset Preview, Schema & Traffic Statistics ({meta['n_rows']:,} rows × {meta['n_cols']} cols)", expanded=True):
        tab_prev, tab_schema, tab_stats = st.tabs([
            "Record Preview (First 20 Rows)",
            "Column Quality & Data Types",
            "Traffic Statistics & Distributions",
        ])
        with tab_prev:
            st.dataframe(raw_df.head(20), use_container_width=True, hide_index=True)
        with tab_schema:
            st.caption(
                f"Missing cells: **{meta['total_missing_cells']:,}** | "
                f"Duplicate rows: **{meta['duplicate_rows']:,}** | "
                f"Numeric columns: **{len(meta['numeric_columns'])}**"
            )
            st.dataframe(pd.DataFrame(meta["column_summary"]), use_container_width=True, hide_index=True)
        with tab_stats:
            if meta["numeric_columns"]:
                desc = raw_df[meta["numeric_columns"]].describe().T[["count", "mean", "std", "min", "50%", "max"]]
                desc = desc.rename(columns={"50%": "median"}).round(2).reset_index().rename(columns={"index": "Feature"})
                st.dataframe(desc, use_container_width=True, hide_index=True)
            s_v1, s_v2 = st.columns(2)
            sugg = meta["suggested_mapping"]
            with s_v1:
                if sugg.get("dst_port") and sugg["dst_port"] in raw_df.columns:
                    top_ports = raw_df[sugg["dst_port"]].astype(str).value_counts().head(10).reset_index()
                    top_ports.columns = ["Destination Port", "Flow Count"]
                    fig_p = px.bar(top_ports, x="Destination Port", y="Flow Count", color_discrete_sequence=["#06B6D4"])
                    style_plotly_fig(fig_p, title="Top 10 Destination Ports in Dataset", height=270)
                    st.plotly_chart(fig_p, use_container_width=True)
            with s_v2:
                if sugg.get("protocol") and sugg["protocol"] in raw_df.columns:
                    proto_c = raw_df[sugg["protocol"]].astype(str).value_counts().head(8).reset_index()
                    proto_c.columns = ["Protocol", "Flow Count"]
                    fig_pr = px.pie(proto_c, names="Protocol", values="Flow Count", hole=0.45, color_discrete_sequence=["#3B82F6", "#06B6D4", "#F59E0B", "#EF4444"])
                    style_plotly_fig(fig_pr, title="Protocol Breakdown in Uploaded Dataset", height=270)
                    st.plotly_chart(fig_pr, use_container_width=True)

    # 3. Column Mapping & Feature Selection
    st.markdown("### Column Role Mapping & ML Configuration")
    all_cols = ["(None)"] + list(raw_df.columns)
    cur_map: Dict[str, Optional[str]] = st.session_state.get("column_mapping") or meta["suggested_mapping"]

    def _idx(role: str) -> int:
        val = cur_map.get(role)
        return all_cols.index(val) if val in all_cols else 0

    m1, m2, m3, m4 = st.columns(4)
    with m1:
        src_ip_col = st.selectbox("Source IP Column", all_cols, index=_idx("src_ip"))
        src_port_col = st.selectbox("Source Port Column", all_cols, index=_idx("src_port"))
    with m2:
        dst_ip_col = st.selectbox("Destination IP Column", all_cols, index=_idx("dst_ip"))
        dst_port_col = st.selectbox("Destination Port Column", all_cols, index=_idx("dst_port"))
    with m3:
        proto_col = st.selectbox("Protocol Column", all_cols, index=_idx("protocol"))
        ts_col = st.selectbox("Timestamp Column", all_cols, index=_idx("timestamp"))
    with m4:
        label_col = st.selectbox(
            "Target Label Column (Optional)",
            all_cols,
            index=_idx("label"),
            help="Required only for supervised Random Forest training. Automatically excluded from ML input features to prevent leakage.",
        )
        rec_id_col = st.selectbox("Record ID Column", all_cols, index=_idx("record_id"))

    updated_mapping: Dict[str, Optional[str]] = {
        "src_ip": None if src_ip_col == "(None)" else src_ip_col,
        "dst_ip": None if dst_ip_col == "(None)" else dst_ip_col,
        "src_port": None if src_port_col == "(None)" else src_port_col,
        "dst_port": None if dst_port_col == "(None)" else dst_port_col,
        "protocol": None if proto_col == "(None)" else proto_col,
        "timestamp": None if ts_col == "(None)" else ts_col,
        "label": None if label_col == "(None)" else label_col,
        "record_id": None if rec_id_col == "(None)" else rec_id_col,
    }
    st.session_state["column_mapping"] = updated_mapping

    # Numeric feature multiselect (excluding selected label column)
    eligible_numeric = [c for c in meta["numeric_columns"] if c != updated_mapping["label"]]
    default_feats = [
        f for f in st.session_state.get("selected_features", eligible_numeric) if f in eligible_numeric
    ]
    if not default_feats:
        default_feats = eligible_numeric

    selected_features: List[str] = st.multiselect(
        "Numerical Features for Machine Learning",
        options=eligible_numeric,
        default=default_feats,
        help="These numerical columns are scaled and fed into Isolation Forest and Random Forest. Target labels are strictly excluded.",
    )
    st.session_state["selected_features"] = selected_features

    # Execution Controls
    c_opt1, c_opt2, c_opt3 = st.columns(3)
    with c_opt1:
        contamination = st.slider(
            "Isolation Forest Contamination (Sensitivity)",
            min_value=0.02,
            max_value=0.45,
            value=0.20 if meta.get("is_synthetic_demo") else 0.10,
            step=0.01,
            help="Expected proportion of anomalous records in the dataset.",
        )
    with c_opt2:
        drop_dups = st.checkbox("Remove Exact Duplicate Rows", value=False)
    with c_opt3:
        has_label = updated_mapping["label"] is not None
        auto_train_rf = st.checkbox(
            "Train / Refresh Random Forest if Label Column Exists",
            value=has_label and st.session_state.get("rf_artifact") is None,
            disabled=not has_label,
            help="Trains a fresh Random Forest classifier on a held-out train/test split using the selected label column before running hybrid detection.",
        )

    is_valid, validation_errors = validate_dataset_for_analysis(raw_df, selected_features)
    if not is_valid:
        for err in validation_errors:
            st.error(err)

    if st.button(
        "Start ML Traffic Analysis",
        type="primary",
        disabled=not is_valid,
        use_container_width=True,
    ):
        with st.spinner("Cleaning data, running Isolation Forest anomaly detection, supervised classification, and incident correlation..."):
            rf_artifact = st.session_state.get("rf_artifact")
            if auto_train_rf and updated_mapping["label"]:
                try:
                    enriched_df, derived_feats = add_derived_network_features(raw_df, selected_features)
                    cat_cols = [updated_mapping["protocol"]] if updated_mapping.get("protocol") else []
                    rf_artifact = train_random_forest(
                        df=enriched_df,
                        feature_columns=derived_feats,
                        label_column=updated_mapping["label"],
                        categorical_columns=cat_cols,
                        dataset_name=meta["filename"],
                        is_synthetic_demo=bool(meta.get("is_synthetic_demo")),
                    )
                    st.session_state["rf_artifact"] = rf_artifact
                except ClassificationError as exc:
                    st.warning(f"Supervised classification skipped: {exc}")
                    rf_artifact = None

            analysis = run_hybrid_detection(
                df=raw_df,
                selected_features=selected_features,
                column_mapping=updated_mapping,
                classifier_artifact=rf_artifact,
                contamination=contamination,
                drop_duplicates=drop_dups,
                dataset_name=meta["filename"],
                is_synthetic_demo=bool(meta.get("is_synthetic_demo")),
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

        st.success(
            f"Analysis complete: {analysis['summary']['total_records']:,} flows analyzed — "
            f"{analysis['summary']['suspicious_records']:,} suspicious, "
            f"{analysis['summary']['anomaly_count']:,} anomalies, "
            f"{analysis['summary']['high_critical_alerts']:,} high/critical alerts."
        )

    # 4. Detection Results Table with Filters, Search, Sorting & Pagination
    analysis = st.session_state.get("analysis_output")
    if analysis is None:
        return

    results_df: pd.DataFrame = analysis["results_df"]
    clean_rep = analysis["cleaning_report"]
    st.markdown("---")
    st.markdown("### Detection Results")
    st.caption(
        f"Cleaned rows: **{clean_rep['final_rows']:,}** | "
        f"Infinite values replaced: **{clean_rep['infinite_values_replaced']}** | "
        f"Duplicates removed: **{clean_rep['duplicates_removed']}** | "
        f"Supervised model active: **{'Yes' if analysis['used_supervised'] else 'No (Unsupervised + Heuristics Only)'}**"
    )

    f1, f2, f3, f4 = st.columns(4)
    with f1:
        sev_filter = st.multiselect(
            "Severity",
            options=["CRITICAL", "HIGH", "MEDIUM", "LOW"],
            default=["CRITICAL", "HIGH", "MEDIUM", "LOW"],
            key="ta_sev_filter",
        )
    with f2:
        anom_filter = st.selectbox("Anomaly Status", ["ALL", "ANOMALY", "NORMAL"], key="ta_anom_filter")
    with f3:
        cats = ["ALL"] + sorted(results_df["predicted_category"].unique().tolist())
        cat_filter = st.selectbox("Predicted Category", cats, key="ta_cat_filter")
    with f4:
        search_q = st.text_input("Search IP / Port / ID / Reason", key="ta_search")

    filtered = results_df[results_df["severity"].isin(sev_filter)].copy()
    if anom_filter != "ALL":
        filtered = filtered[filtered["anomaly_status"] == anom_filter]
    if cat_filter != "ALL":
        filtered = filtered[filtered["predicted_category"] == cat_filter]
    if search_q.strip():
        q = search_q.strip().lower()
        mask = (
            filtered["record_id"].astype(str).str.lower().str.contains(q, regex=False)
            | filtered["src_ip"].astype(str).str.lower().str.contains(q, regex=False)
            | filtered["dst_ip"].astype(str).str.lower().str.contains(q, regex=False)
            | filtered["dst_port"].astype(str).str.lower().str.contains(q, regex=False)
            | filtered["protocol"].astype(str).str.lower().str.contains(q, regex=False)
            | filtered["detection_reason"].astype(str).str.lower().str.contains(q, regex=False)
        )
        filtered = filtered[mask]

    # Sorting & Pagination
    s_col1, s_col2, s_col3 = st.columns([1.2, 1, 1])
    with s_col1:
        sort_by = st.selectbox("Sort By", ["anomaly_score", "severity", "record_id", "dst_port"], key="ta_sort")
    with s_col2:
        page_size = st.selectbox("Rows per Page", [25, 50, 100], index=0, key="ta_psize")
    total_pages = max(1, math.ceil(len(filtered) / page_size))
    with s_col3:
        page_num = st.number_input("Page", min_value=1, max_value=total_pages, value=1, step=1, key="ta_page")

    if sort_by == "severity":
        order_map = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
        filtered = filtered.assign(_s=filtered["severity"].map(order_map)).sort_values(
            by=["_s", "anomaly_score"], ascending=[False, False]
        ).drop(columns=["_s"])
    elif sort_by == "anomaly_score":
        filtered = filtered.sort_values(by="anomaly_score", ascending=False)
    else:
        filtered = filtered.sort_values(by=sort_by, ascending=True)

    start_i = (page_num - 1) * page_size
    page_df = filtered.iloc[start_i : start_i + page_size]

    st.caption(f"Showing **{len(page_df)}** of **{len(filtered):,}** matching records (Page {page_num}/{total_pages}).")
    display_cols = [
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
    ]
    st.dataframe(page_df[display_cols], use_container_width=True, hide_index=True)
