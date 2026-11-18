# SENTINELMESH — AI-Powered Intelligent Cybersecurity Threat Detection & Network Monitoring System

> **PRASUNEX INNOVATHON 2026 | Artificial Intelligence & Machine Learning (AI/ML) Track**

SENTINELMESH is a working, explainable, machine-learning cybersecurity prototype that analyzes network flow CSV datasets, trains and evaluates supervised classification models, performs unsupervised anomaly detection, correlates related suspicious host events, and exports structured security reports.

---

## 1. Problem Statement

Traditional network security monitoring systems rely heavily on predefined signatures and rigid static rules. While effective against known attack fingerprints, signature-only systems struggle to surface novel anomalies, subtle behavioral deviations, or evolving network patterns—and often emit opaque alerts without explaining *why* a flow was flagged.

## 2. Proposed Solution

SENTINELMESH implements a transparent, hybrid **AI/ML Network Security Analytics Pipeline**:

1. **Flexible Network Flow Ingestion & Validation:** Accepts uploaded CSV files (compatible with CIC-IDS2017, UNSW-NB15, custom NetFlow exports, and a built-in clearly labeled synthetic demonstration dataset). Automatically strips whitespace from headers, detects column types, handles missing/infinite values, and allows configurable feature and role mapping.
2. **Supervised Threat Classification (`RandomForestClassifier`):** When a dataset contains a valid multi-class label column, trains a leakage-safe Scikit-learn Random Forest pipeline (`SimpleImputer` + `StandardScaler` + `OneHotEncoder` + balanced class weights), evaluates on a held-out test split, displays genuine metrics (Accuracy, Weighted/Macro Precision, Recall, F1, Confusion Matrix, Feature Importances), and persists the model via `joblib`.
3. **Unsupervised Anomaly Detection (`IsolationForest`):** Fits an Isolation Forest baseline on numerical flow metrics to detect unusual network behavior without requiring labels, with configurable contamination sensitivity.
4. **Hybrid Detection & Explainable Security Intelligence:** Combines available supervised predictions, Isolation Forest outlier scores, and transparent security heuristics (sensitive destination ports, traffic rate spikes, SYN surges, failed connection bursts, outbound byte asymmetry). Computes per-record feature deviations (Z-scores relative to dataset baselines) so analysts see *exact* evidence behind every alert.
5. **Alert Management & Rule-Based Incident Correlation (`src/alert_manager.py`, `src/incident_correlation.py`):** Assigns deterministic Alert IDs (`ALT-0001`, ...), persists analyst investigation statuses (`OPEN`, `IN_PROGRESS`, `INVESTIGATED`, `FALSE_POSITIVE`, `RESOLVED`) and notes in local SQLite, and aggregates related suspicious flows into prioritized host incidents (`INC-0001`, ...) with activity timelines.
6. **Multi-Format Security Reporting:** Generates real downloadable **CSV**, **JSON**, and **PDF** security analysis reports containing detection metrics, model results, analyst investigation findings, and explicit limitations disclosure.
7. **Securing the Digital Education Ecosystem:** Explores how explainable ML network monitoring can help protect School ERPs, student/parent portals, LMS exam platforms, and institutional networks (*clearly presented as a potential application, not an integrated PRASUNEX product*).

> 📄 **For Hackathon Judges:** See [docs/JUDGE_BRIEFING.md](docs/JUDGE_BRIEFING.md) for a concise Round 3 technical summary and 3-minute live demo walkthrough.

---

## 3. Actual Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Application & UI** | Python 3.11+ (verified on Python 3.14.6), Streamlit |
| **Data Processing** | Pandas, NumPy |
| **Machine Learning** | Scikit-learn (`RandomForestClassifier`, `IsolationForest`, `StandardScaler`, `ColumnTransformer`, `SimpleImputer`, `OneHotEncoder`) |
| **Model Persistence** | Joblib (`models/rf_classifier.joblib`, `models/isolation_forest.joblib`) |
| **Interactive Visualization** | Plotly |
| **Report Exports** | CSV, JSON, PDF (`fpdf2`) |
| **Testing** | Pytest, `streamlit.testing.v1.AppTest` |

---

## 4. Architecture & Project Structure

```text
SENTINELMESH/
├── app.py                              # Main Streamlit application & sidebar router
├── requirements.txt                    # Python dependencies
├── pytest.ini                          # Test configuration
├── .streamlit/config.toml              # Dark cybersecurity theme configuration
├── data/
│   └── demo/
│       └── synthetic_network_traffic.csv  # Reproducible synthetic demonstration dataset (1,200 flows)
├── models/                             # Persisted joblib artifacts (created on training)
│   ├── rf_classifier.joblib
│   └── isolation_forest.joblib
├── src/
│   ├── demo_data.py                    # Reproducible synthetic demo data generator
│   ├── data_loader.py                  # CSV ingestion, header normalization, validation & role mapping
│   ├── preprocessing.py                # Cleaning, inf/NaN handling, leakage guard & sklearn pipeline
│   ├── feature_engineering.py          # Transparent ratio features & baseline distribution statistics
│   ├── classification.py               # Random Forest training, held-out evaluation & inference
│   ├── anomaly_detection.py            # Isolation Forest fitting, scoring & persistence
│   ├── hybrid_detection.py             # Unified detection engine & deterministic severity triage
│   ├── explainability.py               # Feature Z-score deviations, heuristics & analyst recommendations
│   ├── incident_correlation.py         # Lightweight rule-based host/protocol incident aggregation
│   ├── report_generator.py             # CSV, JSON & PDF executive report builder
│   ├── ui_helpers.py                   # Dark cybersecurity CSS, KPI cards & Plotly theme
│   └── utils.py                        # Shared paths, constants, severity levels & logging
├── pages/
│   ├── overview.py                     # Executive Dashboard (KPIs, distributions, recent alerts)
│   ├── traffic_analysis.py             # CSV upload, schema inspector, feature mapping & results table
│   ├── threat_detection.py             # Multi-filter alert triage & anomaly scatter visualizations
│   ├── threat_investigation.py         # Correlated incidents & single-record forensic XAI inspector
│   ├── model_center.py                 # Train/evaluate RF & Isolation Forest, confusion matrix, importances
│   ├── reports.py                      # Downloadable CSV / JSON / PDF security reports
│   └── about.py                        # Architecture, ML methodology & honest limitations
├── tests/
│   ├── test_ml_pipeline.py             # Unit & integration tests for data/ML/reporting modules
│   └── test_streamlit_ui.py            # Automated AppTest UI tests across all 7 pages
└── docs/                               # Additional technical documentation
```

*(Note: Previously created workspace folders `backend/`, `frontend/`, and `contracts/` from earlier prototypes have been preserved intact and untouched.)*

---

## 5. Installation & Run Instructions

### 1. Create / Activate Virtual Environment & Install Dependencies
```bash
python -m venv venv
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS / Linux:
# source venv/bin/activate

pip install -r requirements.txt
```

### 2. Launch SENTINELMESH
```bash
streamlit run app.py
```
The application will open in your browser at `http://localhost:8501`.

### 3. Run Automated Tests
```bash
pytest -v tests/
```

---

## 6. Dataset Format & Compatibility

SENTINELMESH does **not** assume hardcoded column names. It automatically trims whitespace and detects common network columns across **CIC-IDS2017**, **UNSW-NB15**, custom NetFlow CSVs, and the synthetic demo dataset:

- **Optional Metadata Columns:** `src_ip`, `dst_ip`, `src_port`, `dst_port`, `protocol`, `timestamp`, `record_id`
- **Numerical Feature Columns:** Any numerical flow metrics (e.g., `flow_duration_ms`, `packets_sent`, `packets_recv`, `bytes_sent`, `bytes_recv`, `packet_rate`, `byte_rate`, `syn_flag_count`, `failed_conn_count`, or CIC-IDS2017 / UNSW-NB15 numeric columns).
- **Optional Target Label Column (for Supervised Classification):** `label`, `Label`, `attack_cat`, `class`, etc. (Must contain $\ge 2$ distinct classes; strictly excluded from ML input features to prevent leakage.)

---

## 7. Hackathon Judge Demo Workflow (No API Keys Required)

1. Launch the app via `streamlit run app.py`.
2. On **Overview** (or from the left sidebar), click **"Load & Run Synthetic Demo"**.
   - Loads 1,200 clearly labeled synthetic flow records (`BENIGN`, `DDoS_Flood`, `Port_Scan`, `Brute_Force`, `Data_Exfiltration`).
   - Trains a Random Forest classifier on a 75/25 stratified split and fits an Isolation Forest anomaly detector.
   - Runs hybrid detection and rule-based incident correlation.
3. Inspect live KPI metrics, severity distribution, predicted categories, protocol breakdown, and anomaly score histogram on **Overview**.
4. Visit **ML Model Center** to inspect real held-out test metrics (Accuracy, Precision, Recall, Macro/Weighted F1), Confusion Matrix heatmap, Classification Report, and Feature Importances.
5. Visit **Threat Detection** to filter alerts by Severity, Class, Source/Destination IP, Protocol, and Anomaly Status, then click **"Open in Incident Investigation"**.
6. On **Incident Investigation**, review correlated host incidents (`INC-0001`, ...) and inspect a flagged record's Z-score feature deviations, heuristic flags, and non-destructive investigation advice.
7. Visit **Reports** to download full **CSV**, structured **JSON**, and executive **PDF** reports.
8. Optional: Upload your own CIC-IDS2017, UNSW-NB15, or unlabeled CSV on **Traffic Analysis** to verify unsupervised-only fallback and schema flexibility.

---

## 8. Limitations & Honest Disclosure

- **Batch CSV Processing Only:** Analyzes uploaded or demonstration CSV flow records; live NIC packet capture (PCAP streaming) is not implemented in this MVP.
- **Synthetic Demo Data:** The built-in dataset (`data/demo/synthetic_network_traffic.csv`) is locally generated synthetic data created solely for reproducible demonstrations—never presented as captured real-world attacks.
- **Anomaly Detection Interpretation:** Isolation Forest flags statistical outliers relative to the loaded dataset baseline; unusual traffic may include legitimate operational spikes rather than confirmed attacks.
- **Classification Scope:** Random Forest classification only applies to classes observed during training, and tree vote proportions are not calibrated probabilities.
- **Lightweight Correlation:** Incident correlation uses transparent rule-based host/protocol aggregation rather than a graph neural network or distributed SIEM.
- **Non-Destructive:** The prototype does not modify firewalls or block live network hosts.

---

## 9. Future Improvements

- Streaming flow ingestion from Zeek / Suricata / NetFlow collectors.
- Local SHAP attribution plots for tree-based explanations on external benchmark datasets.
- Concept-drift monitoring and scheduled model retraining workflows.
- Webhook integrations for external SOC ticketing and SIEM alerting.

---

## 10. Credits & Dataset Acknowledgements

- Developed for **PRASUNEX INNOVATHON 2026 — Artificial Intelligence & Machine Learning Track**.
- Schema compatibility designed to support publicly researched intrusion datasets including **CIC-IDS2017** (Canadian Institute for Cybersecurity) and **UNSW-NB15** (UNSW Canberra Cyber). *(No external dataset files are bundled or claimed as pre-trained unless uploaded and trained by the user.)*
