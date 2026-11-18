"""
Unit & Integration Tests for SENTINELMESH AI/ML Cybersecurity Engine.
Verifies data loading, validation, cleaning, Random Forest training/inference,
Isolation Forest anomaly detection, hybrid scoring, explainability,
incident correlation, and CSV/JSON/PDF report generation.
"""

import io
import json
import numpy as np
import pandas as pd
import pytest

from src.demo_data import generate_synthetic_demo_dataset
from src.data_loader import (
    DatasetValidationError,
    load_csv_data,
    validate_dataset_for_analysis,
)
from src.preprocessing import clean_traffic_dataframe, sanitize_feature_list
from src.feature_engineering import add_derived_network_features, compute_feature_baselines
from src.classification import (
    ClassificationError,
    load_classifier_artifact,
    predict_with_classifier,
    train_random_forest,
)
from src.anomaly_detection import train_and_score_isolation_forest
from src.hybrid_detection import run_hybrid_detection
from src.incident_correlation import correlate_incidents
from src.alert_manager import (
    build_alerts_table,
    merge_incident_statuses,
    update_alert_status,
    update_incident_status,
)
from src.report_generator import (
    build_report_payload,
    export_report_json,
    export_report_pdf,
    export_results_csv,
)


@pytest.fixture(scope="module")
def demo_df():
    return generate_synthetic_demo_dataset(n_samples=400, seed=42, save_path=None)


def test_demo_dataset_generation_and_labeling(demo_df):
    assert len(demo_df) == 400
    assert "label" in demo_df.columns
    assert "is_synthetic_demo" in demo_df.columns
    assert bool(demo_df["is_synthetic_demo"].all()) is True
    assert set(demo_df["label"].unique()) >= {
        "BENIGN",
        "DDoS_Flood",
        "Port_Scan",
        "Brute_Force",
        "Data_Exfiltration",
    }


def test_csv_loader_handles_cicids_style_whitespace_headers():
    csv_text = (
        " Source IP , Destination IP , Destination Port , Flow Duration , Total Fwd Packets , Label \n"
        "10.0.0.1,10.0.0.2,443,1200,14,BENIGN\n"
        "10.0.0.9,10.0.0.2,22,40,350,DDoS\n"
    ).encode("utf-8")
    df, meta = load_csv_data(io.BytesIO(csv_text), filename="cic_sample.csv")
    assert "Source IP" in df.columns
    assert "Destination Port" in df.columns
    assert meta["suggested_mapping"]["src_ip"] == "Source IP"
    assert meta["suggested_mapping"]["dst_ip"] == "Destination IP"
    assert meta["suggested_mapping"]["dst_port"] == "Destination Port"
    assert meta["suggested_mapping"]["label"] == "Label"


def test_csv_loader_rejects_empty_and_invalid_inputs():
    with pytest.raises(DatasetValidationError):
        load_csv_data(b"", filename="empty.csv")

    with pytest.raises(DatasetValidationError):
        load_csv_data(None, filename="missing.csv")


def test_preprocessing_handles_missing_and_infinite_values_and_prevents_leakage(demo_df):
    corrupted = demo_df.head(50).copy()
    corrupted.loc[0, "packet_rate"] = np.inf
    corrupted.loc[1, "byte_rate"] = -np.inf
    corrupted.loc[2, "flow_duration_ms"] = np.nan
    # Add duplicate row
    corrupted = pd.concat([corrupted, corrupted.iloc[[0]]], ignore_index=True)

    cleaned, report = clean_traffic_dataframe(corrupted, drop_duplicates=True)
    # Row 0 (inf), Row 1 (-inf), and duplicated Row 0 (inf) = 3 infinite values replaced before dedup
    assert report["infinite_values_replaced"] == 3
    assert report["duplicates_removed"] == 1
    assert not np.isinf(cleaned["packet_rate"].dropna()).any()

    # Leakage guard must never allow label or synthetic flag into ML features
    safe_num, safe_cat = sanitize_feature_list(
        cleaned,
        feature_columns=["packet_rate", "bytes_sent", "label", "is_synthetic_demo", "record_id"],
        label_column="label",
        categorical_columns=["protocol", "label"],
    )
    assert "label" not in safe_num
    assert "is_synthetic_demo" not in safe_num
    assert "record_id" not in safe_num
    assert "label" not in safe_cat
    assert "packet_rate" in safe_num
    assert "protocol" in safe_cat


def test_supervised_random_forest_training_persistence_and_metrics(demo_df, tmp_path):
    enriched, feats = add_derived_network_features(
        demo_df,
        [
            "dst_port",
            "flow_duration_ms",
            "packets_sent",
            "packets_recv",
            "bytes_sent",
            "bytes_recv",
            "packet_rate",
            "byte_rate",
            "syn_flag_count",
            "failed_conn_count",
            "avg_packet_size",
        ],
    )
    model_file = tmp_path / "rf_test.joblib"
    artifact = train_random_forest(
        df=enriched,
        feature_columns=feats,
        label_column="label",
        categorical_columns=["protocol"],
        test_size=0.25,
        n_estimators=40,
        max_depth=12,
        dataset_name="synthetic_demo_test.csv",
        is_synthetic_demo=True,
        save_path=model_file,
    )

    assert model_file.exists()
    metrics = artifact["metrics"]
    assert 0.0 <= metrics["accuracy"] <= 1.0
    assert metrics["accuracy"] >= 0.80  # Realistic strong separation on synthetic demo
    assert metrics["test_samples"] == 100
    assert len(metrics["confusion_matrix"]) == len(metrics["classes"])
    assert len(artifact["feature_importances"]) > 0

    reloaded = load_classifier_artifact(model_file)
    assert reloaded is not None
    preds, votes = predict_with_classifier(enriched.head(20), reloaded)
    assert len(preds) == 20
    assert np.all((votes >= 0.0) & (votes <= 1.0))


def test_supervised_classifier_rejects_single_class_label(demo_df):
    single_class = demo_df.head(40).copy()
    single_class["label"] = "BENIGN"
    with pytest.raises(ClassificationError):
        train_random_forest(
            df=single_class,
            feature_columns=["packet_rate", "bytes_sent"],
            label_column="label",
            save_path=None,
        )


def test_isolation_forest_anomaly_detection(demo_df, tmp_path):
    iso_file = tmp_path / "iso_test.joblib"
    res = train_and_score_isolation_forest(
        df=demo_df,
        feature_columns=["packet_rate", "byte_rate", "bytes_sent", "syn_flag_count", "failed_conn_count"],
        label_column="label",
        contamination=0.20,
        n_estimators=50,
        save_path=iso_file,
    )
    assert iso_file.exists()
    assert len(res["anomaly_status"]) == len(demo_df)
    assert set(res["anomaly_status"]).issubset({"ANOMALY", "NORMAL"})
    assert res["artifact"]["summary"]["anomaly_count"] > 0
    assert np.min(res["anomaly_score"]) >= 0.0
    assert np.max(res["anomaly_score"]) <= 100.0


def test_hybrid_unsupervised_only_mode_does_not_fabricate_classification(demo_df):
    unlabeled = demo_df.drop(columns=["label"]).head(120).copy()
    mapping = {
        "record_id": "record_id",
        "src_ip": "src_ip",
        "dst_ip": "dst_ip",
        "src_port": "src_port",
        "dst_port": "dst_port",
        "protocol": "protocol",
        "timestamp": "timestamp",
        "label": None,
    }
    output = run_hybrid_detection(
        df=unlabeled,
        selected_features=["packet_rate", "byte_rate", "bytes_sent", "syn_flag_count", "failed_conn_count"],
        column_mapping=mapping,
        classifier_artifact=None,
        contamination=0.20,
        n_estimators_iso=40,
        save_iso_model=False,
    )
    results_df = output["results_df"]
    assert output["used_supervised"] is False
    assert (results_df["predicted_category"] == "N/A (No Supervised Model)").all()
    assert output["summary"]["anomaly_count"] > 0
    assert all(isinstance(r, str) and len(r) > 10 for r in results_df["detection_reason"])


def test_full_hybrid_correlation_and_report_exports(demo_df):
    enriched, feats = add_derived_network_features(
        demo_df,
        [
            "dst_port",
            "flow_duration_ms",
            "packets_sent",
            "packets_recv",
            "bytes_sent",
            "bytes_recv",
            "packet_rate",
            "byte_rate",
            "syn_flag_count",
            "failed_conn_count",
            "avg_packet_size",
        ],
    )
    clf_artifact = train_random_forest(
        df=enriched,
        feature_columns=feats,
        label_column="label",
        categorical_columns=["protocol"],
        n_estimators=40,
        save_path=None,
    )
    mapping = {
        "record_id": "record_id",
        "src_ip": "src_ip",
        "dst_ip": "dst_ip",
        "src_port": "src_port",
        "dst_port": "dst_port",
        "protocol": "protocol",
        "timestamp": "timestamp",
        "label": "label",
    }
    hybrid = run_hybrid_detection(
        df=demo_df,
        selected_features=feats,
        column_mapping=mapping,
        classifier_artifact=clf_artifact,
        contamination=0.22,
        n_estimators_iso=50,
        is_synthetic_demo=True,
        save_iso_model=False,
    )
    results_df = hybrid["results_df"]
    assert hybrid["used_supervised"] is True
    assert hybrid["summary"]["suspicious_records"] > 0
    assert hybrid["summary"]["high_critical_alerts"] > 0

    incidents_df = correlate_incidents(results_df)
    assert not incidents_df.empty
    assert incidents_df["incident_id"].iloc[0] == "INC-0001"

    # CSV, JSON, and PDF exports
    csv_bytes = export_results_csv(results_df)
    assert len(csv_bytes) > 100

    payload = build_report_payload(
        results_df=results_df,
        incidents_df=incidents_df,
        summary=hybrid["summary"],
        dataset_name="synthetic_network_traffic.csv",
        is_synthetic_demo=True,
        classifier_artifact=clf_artifact,
        iso_artifact=hybrid["iso_artifact"],
    )
    json_bytes = export_report_json(payload)
    parsed = json.loads(json_bytes.decode("utf-8"))
    assert parsed["dataset"]["is_synthetic_demo"] is True
    assert len(parsed["limitations"]) >= 4

    pdf_bytes = export_report_pdf(payload)
    assert pdf_bytes is not None
    assert pdf_bytes[:4] == b"%PDF"


def test_alert_and_incident_triage_persistence(demo_df, tmp_path):
    """Verify Alert ID generation, SQLite status persistence, and PDF triage reporting."""
    db_file = tmp_path / "test_triage.db"
    mapping = {
        "record_id": "record_id",
        "src_ip": "src_ip",
        "dst_ip": "dst_ip",
        "src_port": "src_port",
        "dst_port": "dst_port",
        "protocol": "protocol",
        "timestamp": "timestamp",
        "label": "label",
    }
    hybrid = run_hybrid_detection(
        df=demo_df.head(150),
        selected_features=["packet_rate", "byte_rate", "bytes_sent", "syn_flag_count", "failed_conn_count"],
        column_mapping=mapping,
        classifier_artifact=None,
        contamination=0.22,
        n_estimators_iso=40,
        is_synthetic_demo=True,
        save_iso_model=False,
    )
    alerts_df = build_alerts_table(
        results_df=hybrid["results_df"],
        cleaned_df=hybrid["cleaned_df"],
        active_features=hybrid["active_features"],
        dataset_key="unit_test_ds",
        db_path=db_file,
    )
    assert not alerts_df.empty
    first_alert = alerts_df.iloc[0]
    assert first_alert["alert_id"] == "ALT-0001"
    assert first_alert["investigation_status"] == "OPEN"

    # Update alert status & verify persistence
    update_alert_status(
        dataset_key="unit_test_ds",
        alert_id="ALT-0001",
        record_id=str(first_alert["record_id"]),
        status="INVESTIGATED",
        analyst_note="Verified synthetic port scan alert",
        db_path=db_file,
    )
    reloaded_alerts = build_alerts_table(
        results_df=hybrid["results_df"],
        cleaned_df=hybrid["cleaned_df"],
        active_features=hybrid["active_features"],
        dataset_key="unit_test_ds",
        db_path=db_file,
    )
    assert reloaded_alerts.loc[reloaded_alerts["alert_id"] == "ALT-0001", "investigation_status"].iloc[0] == "INVESTIGATED"
    assert "port scan" in reloaded_alerts.loc[reloaded_alerts["alert_id"] == "ALT-0001", "analyst_note"].iloc[0]

    # Incident correlation + status persistence
    inc_df = correlate_incidents(hybrid["results_df"])
    assert not inc_df.empty
    first_inc_id = str(inc_df.iloc[0]["incident_id"])
    update_incident_status(
        dataset_key="unit_test_ds",
        incident_id=first_inc_id,
        status="INVESTIGATING",
        analyst_note="Escalated to campus security team",
        db_path=db_file,
    )
    merged_inc = merge_incident_statuses(inc_df, dataset_key="unit_test_ds", db_path=db_file)
    assert merged_inc.loc[merged_inc["incident_id"] == first_inc_id, "investigation_status"].iloc[0] == "INVESTIGATING"

    # Verify JSON & PDF include alert triage summary cleanly
    payload = build_report_payload(
        results_df=hybrid["results_df"],
        incidents_df=merged_inc,
        summary=hybrid["summary"],
        dataset_name="unit_test_ds.csv",
        is_synthetic_demo=True,
        alerts_df=reloaded_alerts,
    )
    assert payload["alert_triage_summary"].get("INVESTIGATED") == 1
    pdf_bytes = export_report_pdf(payload)
    assert pdf_bytes is not None and pdf_bytes[:4] == b"%PDF"
