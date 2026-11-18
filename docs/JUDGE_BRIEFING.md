# SENTINELMESH — Round 3 Technical Briefing for Judges
**Competition:** PRASUNEX INNOVATHON 2026 | **Track:** Artificial Intelligence & Machine Learning | **Stage:** Round 3 — Prototype Development & Demonstration

---

## 1. Elevator Pitch
SENTINELMESH is an AI/ML-powered network security monitoring and threat detection prototype. Instead of relying solely on brittle signatures, it combines **supervised Random Forest classification**, **unsupervised Isolation Forest anomaly detection**, and **transparent rule-based heuristics** to detect suspicious network activity, explain *why* each flow was flagged using Z-score feature deviations, group related host activity into incidents, and generate downloadable CSV/JSON/PDF security reports.

## 2. Alignment with Round 3 Evaluation Criteria

| Evaluation Criterion | How SENTINELMESH Demonstrates It |
| :--- | :--- |
| **Functionality & Implementation Quality** | 7 working Streamlit modules (`Security Overview`, `Traffic Analysis`, `Threat Detection`, `Incident Investigation`, `ML Model Center`, `Reports`, `About`), local SQLite triage persistence (`alert_manager.py`), CSV/JSON/PDF exports, and 100% passing automated tests. |
| **Technical Execution** | Genuine Scikit-learn pipelines (`ColumnTransformer`, `SimpleImputer`, `StandardScaler`, `OneHotEncoder`, `RandomForestClassifier(class_weight="balanced")`, `IsolationForest`), strict leakage prevention, held-out test metrics, and `joblib` persistence. |
| **User Experience & Usability** | Clean dark navy cybersecurity dashboard with Plotly charts, interactive filters, pagination, one-click synthetic demo workflow, and honest empty states. |
| **Innovation & Effectiveness** | Hybrid detection combining supervised + unsupervised + heuristic signals with feature-level Z-score explanations and non-destructive analyst recommendations. |
| **Practical Applicability & Scalability** | Modular `src/` architecture compatible with CIC-IDS2017, UNSW-NB15, and NetFlow CSV schemas; dedicated institutional cybersecurity use case (*Securing the Digital Education Ecosystem*). |
| **Demonstration Quality** | Self-contained local execution with zero API keys required; 3-minute reproducible live demo path from data ingestion to PDF report export. |

## 3. 3-Minute Live Demo Script for Judges
1. **Start at Security Overview:** Point out the clean empty state (zero hardcoded fake numbers). Click **"Load & Run Synthetic Demo"** in the sidebar.
2. **Walk Through Security Overview:** Show Total Analyzed, Normal, Suspicious, Potential Attacks (RF), High & Critical Alerts, the **Traffic & Alert Timeline**, Severity & Category distributions, and Protocol breakdown.
3. **Show Real ML Metrics in ML Model Center:** Display the held-out test split Accuracy, Precision, Recall, Macro/Weighted F1, interactive **Confusion Matrix**, per-class **Classification Report**, and **Feature Importances**.
4. **Demonstrate Alert Triage in Threat Detection:** Filter for `CRITICAL` alerts, inspect an Alert ID (`ALT-0001`), add an analyst note, and click **"Mark as INVESTIGATED"** (persisted in local SQLite).
5. **Investigate an Incident:** Click **"Deep-Dive in Incident Investigation"**, inspect a correlated host incident (`INC-0001`) + its **Activity Timeline**, update its incident status to `INVESTIGATING`, and examine the **Feature Z-Score Deviation Chart** explaining exactly why the flow was flagged.
6. **Export Reports:** Open **Reports** and download the generated **CSV**, **JSON**, and **PDF** executive report (containing the updated analyst triage statuses and explicit limitations).
7. **Review Educational Applicability:** Open **About SENTINELMESH** to show *"Securing the Digital Education Ecosystem"* and our transparent disclosure of MVP boundaries vs. production roadmap.

## 4. Honest Limitations Disclosure
- Analyzes batch CSV flow files (no live NIC packet capture).
- Built-in demo data is explicitly labeled synthetic data, not captured production attacks.
- Isolation Forest detects statistical outliers relative to the loaded dataset baseline, not guaranteed attacks.
- Random Forest tree vote shares are not calibrated probabilities.
- Independent AI/ML cybersecurity project (not an officially integrated PRASUNEX product or School ERP).
