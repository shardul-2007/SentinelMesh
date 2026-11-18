"""
Machine Learning Model Center for SENTINELMESH.
Provides genuine Random Forest training & evaluation, Isolation Forest tuning,
interactive confusion matrix, classification report, feature importances, and
joblib model persistence management.
"""

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

from src.anomaly_detection import AnomalyDetectionError, train_and_score_isolation_forest
from src.classification import ClassificationError, train_random_forest
from src.feature_engineering import add_derived_network_features
from src.ui_helpers import (
    load_demo_into_session,
    render_demo_notice_if_synthetic,
    render_kpi_card,
    render_page_header,
    style_plotly_fig,
)
from src.utils import ISO_MODEL_PATH, RF_MODEL_PATH


def render_model_center_page() -> None:
    render_page_header(
        "Machine Learning Model Center",
        "Train, evaluate, inspect, and persist genuine Scikit-learn models (Random Forest Classifier & Isolation Forest).",
        badge_text="SCIKIT-LEARN",
    )
    render_demo_notice_if_synthetic()

    raw_df = st.session_state.get("raw_df")
    meta = st.session_state.get("dataset_meta")
    rf_artifact = st.session_state.get("rf_artifact")
    iso_artifact = st.session_state.get("iso_artifact")

    # Top Model Availability Summary
    c1, c2 = st.columns(2)
    with c1:
        if rf_artifact:
            m = rf_artifact["metrics"]
            render_kpi_card(
                "Random Forest Classifier (Supervised)",
                "TRAINED & PERSISTED",
                f"Dataset: {rf_artifact['dataset_name']} | Train: {m['train_samples']} / Test: {m['test_samples']} | "
                f"Trained: {rf_artifact['trained_at'][:19]} UTC",
                accent_color="#22C55E",
            )
        else:
            render_kpi_card(
                "Random Forest Classifier (Supervised)",
                "NOT TRAINED",
                "Requires a dataset with a valid multi-class target label column.",
                accent_color="#F59E0B",
            )
    with c2:
        if iso_artifact:
            isum = iso_artifact["summary"]
            render_kpi_card(
                "Isolation Forest (Unsupervised)",
                "TRAINED & PERSISTED",
                f"Dataset: {iso_artifact['dataset_name']} | {isum['anomaly_count']:,}/{isum['total_records']:,} anomalies | "
                f"Trained: {iso_artifact['trained_at'][:19]} UTC",
                accent_color="#06B6D4",
            )
        else:
            render_kpi_card(
                "Isolation Forest (Unsupervised)",
                "NOT TRAINED",
                "Fit on numerical traffic features below or via Traffic Analysis.",
                accent_color="#94A3B8",
            )

    if raw_df is None or meta is None:
        st.warning("No dataset is currently loaded for training. Load the synthetic demo dataset or upload a CSV in Traffic Analysis.")
        if st.button("Load Synthetic Demo Dataset for Model Training", type="primary"):
            load_demo_into_session()
            st.rerun()
    else:
        st.markdown("---")
        tab_rf, tab_iso = st.tabs([
            "Supervised Classification (Random Forest)",
            "Unsupervised Anomaly Detection (Isolation Forest)",
        ])

        mapping = st.session_state.get("column_mapping") or meta["suggested_mapping"]
        selected_feats = st.session_state.get("selected_features") or meta["candidate_ml_features"]

        # TAB 1: RANDOM FOREST TRAINING
        with tab_rf:
            st.markdown("#### Train & Evaluate Random Forest Classifier")
            st.caption(
                "Target label and identifier columns are automatically excluded from input features to prevent data leakage. "
                "Uses `class_weight='balanced'` to mitigate class imbalance."
            )
            all_cols = ["(None — Unlabeled Dataset)"] + list(raw_df.columns)
            cur_lbl = mapping.get("label")
            lbl_idx = all_cols.index(cur_lbl) if cur_lbl in all_cols else 0

            r1, r2, r3, r4 = st.columns(4)
            with r1:
                chosen_label = st.selectbox("Target Label Column", all_cols, index=lbl_idx, key="mc_label")
            with r2:
                n_est = st.slider("Trees (n_estimators)", 20, 300, 120, step=20, key="mc_rf_est")
            with r3:
                max_d = st.slider("Max Depth (0 = Unlimited)", 0, 30, 16, step=2, key="mc_rf_depth")
            with r4:
                test_split = st.slider("Held-out Test Split", 0.15, 0.40, 0.25, step=0.05, key="mc_rf_split")

            include_proto = st.checkbox(
                "Include Categorical Protocol Column (One-Hot Encoded)",
                value=mapping.get("protocol") is not None,
                disabled=mapping.get("protocol") is None,
            )

            btn_c1, btn_c2 = st.columns([2, 1])
            with btn_c1:
                train_rf_btn = st.button(
                    "Train & Evaluate Random Forest Classifier",
                    type="primary",
                    use_container_width=True,
                )
            with btn_c2:
                if st.button("Delete Persisted RF Model", use_container_width=True):
                    if RF_MODEL_PATH.exists():
                        RF_MODEL_PATH.unlink()
                    st.session_state["rf_artifact"] = None
                    st.info("Removed persisted Random Forest model.")
                    st.rerun()

            if train_rf_btn:
                if chosen_label == "(None — Unlabeled Dataset)":
                    st.error(
                        "Cannot train a supervised classifier without a target label column. "
                        "Use Isolation Forest (Unsupervised tab) for unlabeled network traffic."
                    )
                else:
                    try:
                        with st.spinner("Training Random Forest on train split and evaluating on held-out test set..."):
                            enriched_df, derived_feats = add_derived_network_features(raw_df, selected_feats)
                            cat_cols = [mapping["protocol"]] if (include_proto and mapping.get("protocol")) else []
                            artifact = train_random_forest(
                                df=enriched_df,
                                feature_columns=derived_feats,
                                label_column=chosen_label,
                                categorical_columns=cat_cols,
                                test_size=test_split,
                                n_estimators=n_est,
                                max_depth=max_d if max_d > 0 else None,
                                dataset_name=meta["filename"],
                                is_synthetic_demo=bool(meta.get("is_synthetic_demo")),
                                save_path=RF_MODEL_PATH,
                            )
                            st.session_state["rf_artifact"] = artifact
                            st.session_state["column_mapping"]["label"] = chosen_label
                        st.success(
                            f"Random Forest trained & persisted! Held-out test Accuracy: "
                            f"{artifact['metrics']['accuracy']*100:.2f}% | Macro F1: {artifact['metrics']['f1_macro']:.4f}"
                        )
                        st.rerun()
                    except ClassificationError as exc:
                        st.error(f"Training halted: {exc}")
                    except Exception as exc:
                        st.error(f"Unexpected training error: {exc}")

        # TAB 2: ISOLATION FOREST TRAINING
        with tab_iso:
            st.markdown("#### Fit & Run Unsupervised Isolation Forest")
            st.caption(
                "Learns normal baseline density from numerical network features without needing labels. "
                "Note: Flagged records represent statistical outliers, not necessarily confirmed attacks."
            )
            i1, i2 = st.columns(2)
            with i1:
                iso_cont = st.slider("Contamination (Expected Outlier Fraction)", 0.02, 0.45, 0.18, step=0.01, key="mc_iso_cont")
            with i2:
                iso_est = st.slider("Estimators (n_estimators)", 50, 300, 150, step=25, key="mc_iso_est")

            if st.button("Fit Isolation Forest & Score Dataset", type="primary", use_container_width=True):
                try:
                    with st.spinner("Fitting Isolation Forest baseline and scoring traffic records..."):
                        enriched_df, derived_feats = add_derived_network_features(raw_df, selected_feats)
                        out = train_and_score_isolation_forest(
                            df=enriched_df,
                            feature_columns=derived_feats,
                            label_column=mapping.get("label"),
                            contamination=iso_cont,
                            n_estimators=iso_est,
                            dataset_name=meta["filename"],
                            is_synthetic_demo=bool(meta.get("is_synthetic_demo")),
                            save_path=ISO_MODEL_PATH,
                        )
                        st.session_state["iso_artifact"] = out["artifact"]
                    s = out["artifact"]["summary"]
                    st.success(
                        f"Isolation Forest fitted & persisted: flagged {s['anomaly_count']:,} / {s['total_records']:,} "
                        f"records ({s['anomaly_rate_pct']:.2f}%) as statistical anomalies."
                    )
                    st.rerun()
                except AnomalyDetectionError as exc:
                    st.error(f"Anomaly detection failed: {exc}")

    # REAL EVALUATION REPORT SECTION (only shown if RF model is actually trained)
    rf_artifact = st.session_state.get("rf_artifact")
    if rf_artifact:
        st.markdown("---")
        st.markdown("### Supervised Model Evaluation Report (Held-Out Test Split)")
        if rf_artifact.get("is_synthetic_demo"):
            st.info(
                "**Evaluation Scope Note:** These metrics were computed on the held-out test split of the "
                "locally generated **synthetic demonstration dataset**, NOT on real-world production traffic or CIC-IDS2017."
            )
        for w in rf_artifact.get("warnings", []):
            st.warning(w)

        m = rf_artifact["metrics"]
        k1, k2, k3, k4 = st.columns(4)
        with k1:
            render_kpi_card("Test Accuracy", f"{m['accuracy']*100:.2f}%", f"{m['test_samples']} held-out samples", "#22C55E")
        with k2:
            render_kpi_card("Precision (Weighted)", f"{m['precision_weighted']*100:.2f}%", f"Macro: {m['precision_macro']*100:.2f}%", "#38BDF8")
        with k3:
            render_kpi_card("Recall (Weighted)", f"{m['recall_weighted']*100:.2f}%", f"Macro: {m['recall_macro']*100:.2f}%", "#06B6D4")
        with k4:
            render_kpi_card("F1-Score (Weighted)", f"{m['f1_weighted']*100:.2f}%", f"Macro: {m['f1_macro']*100:.2f}%", "#3B82F6")

        e1, e2 = st.columns(2)
        with e1:
            cm = m["confusion_matrix"]
            classes = m["classes"]
            fig_cm = go.Figure(
                data=go.Heatmap(
                    z=cm,
                    x=classes,
                    y=classes,
                    text=cm,
                    texttemplate="%{text}",
                    colorscale="Blues",
                    showscale=True,
                )
            )
            style_plotly_fig(fig_cm, title="Confusion Matrix (Actual vs Predicted)", height=360)
            fig_cm.update_layout(xaxis_title="Predicted Class", yaxis_title="Actual Class", yaxis=dict(autorange="reversed"))
            st.plotly_chart(fig_cm, use_container_width=True)

        with e2:
            imp_df = pd.DataFrame(rf_artifact["feature_importances"][:12])
            fig_imp = px.bar(
                imp_df,
                x="importance",
                y="feature",
                orientation="h",
                color="importance",
                color_continuous_scale=["#1D4ED8", "#06B6D4"],
            )
            style_plotly_fig(fig_imp, title="Top Random Forest Feature Importances", height=360)
            fig_imp.update_layout(
                xaxis_title="Gini Importance",
                yaxis_title="",
                yaxis=dict(autorange="reversed"),
                coloraxis_showscale=False,
            )
            st.plotly_chart(fig_imp, use_container_width=True)

        # Classification Report Table
        st.markdown("#### Per-Class Classification Report")
        rep_rows = []
        for cls_name, vals in m["classification_report"].items():
            if isinstance(vals, dict):
                rep_rows.append(
                    {
                        "Class / Average": cls_name,
                        "Precision": round(float(vals.get("precision", 0)), 4),
                        "Recall": round(float(vals.get("recall", 0)), 4),
                        "F1-Score": round(float(vals.get("f1-score", 0)), 4),
                        "Support": int(vals.get("support", 0)),
                    }
                )
        st.dataframe(pd.DataFrame(rep_rows), use_container_width=True, hide_index=True)

        with st.expander("Model Configuration, Saved Artifact Info & Selected Features"):
            rf_size_kb = round(RF_MODEL_PATH.stat().st_size / 1024.0, 1) if RF_MODEL_PATH.exists() else None
            iso_size_kb = round(ISO_MODEL_PATH.stat().st_size / 1024.0, 1) if ISO_MODEL_PATH.exists() else None
            st.json(
                {
                    "model_type": rf_artifact["model_type"],
                    "trained_at": rf_artifact["trained_at"],
                    "dataset_name": rf_artifact["dataset_name"],
                    "saved_rf_artifact_path": str(RF_MODEL_PATH) if RF_MODEL_PATH.exists() else "Not persisted",
                    "saved_rf_size_kb": rf_size_kb,
                    "saved_iso_artifact_path": str(ISO_MODEL_PATH) if ISO_MODEL_PATH.exists() else "Not persisted",
                    "saved_iso_size_kb": iso_size_kb,
                    "hyperparameters": rf_artifact["hyperparameters"],
                    "numeric_features": rf_artifact["numeric_features"],
                    "categorical_features": rf_artifact["categorical_features"],
                }
            )

    st.markdown("---")
    st.markdown("### Model Limitations & Responsible ML Notes")
    st.caption(
        "- **Random Forest Classifier** can only classify traffic categories present in the training labels and requires re-training when dataset schemas change. Tree vote share is not a calibrated probability.\n"
        "- **Isolation Forest** detects statistical outliers relative to the loaded dataset baseline; an anomaly is not automatically a confirmed cyberattack.\n"
        "- Metrics computed on the synthetic demo dataset reflect synthetic class separability and should not be cited as real-world enterprise benchmark scores."
    )
