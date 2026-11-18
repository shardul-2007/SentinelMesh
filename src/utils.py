import logging
import os
from pathlib import Path
from typing import Dict, List, Optional

# Project root paths
ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
DEMO_DATA_DIR = DATA_DIR / "demo"
DEMO_CSV_PATH = DEMO_DATA_DIR / "synthetic_network_traffic.csv"
MODELS_DIR = ROOT_DIR / "models"
RF_MODEL_PATH = MODELS_DIR / "rf_classifier.joblib"
ISO_MODEL_PATH = MODELS_DIR / "isolation_forest.joblib"

# Ensure required directories exist
DEMO_DATA_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Severity ordering and color mapping (dark cybersecurity palette)
SEVERITY_ORDER: Dict[str, int] = {
    "LOW": 1,
    "MEDIUM": 2,
    "HIGH": 3,
    "CRITICAL": 4,
}

SEVERITY_COLORS: Dict[str, str] = {
    "LOW": "#22C55E",       # Restrained emerald/green
    "MEDIUM": "#F59E0B",    # Amber
    "HIGH": "#F97316",      # Orange
    "CRITICAL": "#EF4444",  # Red
}

THEME_COLORS: Dict[str, str] = {
    "bg_primary": "#0B1120",
    "bg_secondary": "#111827",
    "bg_card": "#162032",
    "border": "#24344D",
    "accent_cyan": "#06B6D4",
    "accent_blue": "#3B82F6",
    "text_primary": "#F1F5F9",
    "text_secondary": "#94A3B8",
}

# Benign label tokens commonly found in CIC-IDS2017, UNSW-NB15, and custom datasets
BENIGN_LABEL_TOKENS = {
    "benign",
    "normal",
    "0",
    "0.0",
    "false",
    "clean",
    "safe",
    "legitimate",
}

# Sensitive / commonly targeted network ports for transparent heuristic checks
SENSITIVE_PORTS = {
    21: "FTP",
    22: "SSH",
    23: "Telnet",
    25: "SMTP",
    135: "MSRPC",
    139: "NetBIOS",
    445: "SMB",
    1433: "MSSQL",
    3306: "MySQL",
    3389: "RDP",
    4444: "Common Reverse Shell / Metasploit Default",
    5900: "VNC",
    6379: "Redis",
    8443: "Alt-HTTPS / C2 Common",
}

# Auto-detection aliases for common cybersecurity CSV datasets (CIC-IDS2017, UNSW-NB15, NetFlow, Demo)
COLUMN_ROLE_ALIASES: Dict[str, List[str]] = {
    "src_ip": ["src_ip", "source_ip", "srcip", "source ip", "src_addr", "ipv4_src_addr", "sip"],
    "dst_ip": ["dst_ip", "dest_ip", "destination_ip", "dstip", "destination ip", "dst_addr", "ipv4_dst_addr", "dip"],
    "src_port": ["src_port", "source_port", "sport", "source port", "l4_src_port"],
    "dst_port": ["dst_port", "dest_port", "destination_port", "dport", "dsport", "destination port", "l4_dst_port"],
    "protocol": ["protocol", "proto", "ip_proto", "l4_proto"],
    "timestamp": ["timestamp", "time", "stime", "flow_start", "start_time", "datetime", "date"],
    "label": ["label", "attack_cat", "class", "category", "target", "attack_type", "traffic_type", "is_attack"],
    "record_id": ["record_id", "flow_id", "flow id", "id", "event_id"],
}

# Columns that must NEVER be used as ML input features (leakage & identifier guard)
NON_FEATURE_KEYWORDS = {
    "label",
    "attack_cat",
    "attack_type",
    "target",
    "is_attack",
    "is_synthetic",
    "predicted_",
    "anomaly_",
    "severity",
    "detection_",
    "record_id",
    "flow_id",
    "flow id",
}


def setup_logger(name: str = "sentinelmesh") -> logging.Logger:
    """Configure and return a clean application logger."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            "[%(asctime)s] %(levelname)s %(name)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


def is_benign_label(value: object) -> bool:
    """Determine if a classification label represents normal/benign traffic."""
    if value is None:
        return True
    token = str(value).strip().lower()
    return token in BENIGN_LABEL_TOKENS


def max_severity(severities: List[str]) -> str:
    """Return the highest severity level from a list of severity strings."""
    if not severities:
        return "LOW"
    return max(severities, key=lambda s: SEVERITY_ORDER.get(str(s).upper(), 0))


def format_number(val: float, decimals: int = 2) -> str:
    """Safely format a number for display."""
    try:
        if abs(val) >= 1_000_000:
            return f"{val / 1_000_000:.{decimals}f}M"
        if abs(val) >= 1_000:
            return f"{val / 1_000:.{decimals}f}K"
        return f"{val:.{decimals}f}"
    except Exception:
        return str(val)
