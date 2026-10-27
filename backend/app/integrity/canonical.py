import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional

CANONICAL_VERSION = "1.0.0"
HASH_ALGORITHM = "SHA-256"

def normalize_utc_timestamp(dt_input: Any) -> str:
    """
    Deterministically normalize any datetime or timestamp string to UTC ISO-8601 with trailing 'Z'.
    Format: YYYY-MM-DDTHH:MM:SS.ffffffZ
    """
    if dt_input is None:
        raise ValueError("Timestamp cannot be None in canonical representation")

    if isinstance(dt_input, str):
        # Strip trailing Z or +00:00 if present for parsing
        clean_str = dt_input.strip()
        if clean_str.endswith("Z"):
            clean_str = clean_str[:-1] + "+00:00"
        try:
            dt = datetime.fromisoformat(clean_str)
        except Exception:
            # Fallback parsing
            dt = datetime.strptime(clean_str[:19], "%Y-%m-%dT%H:%M:%S")
    elif isinstance(dt_input, datetime):
        dt = dt_input
    else:
        raise ValueError(f"Unsupported timestamp format: {type(dt_input)}")

    # Ensure timezone is UTC
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)

    # Output strictly formatted microsecond UTC ISO string ending in 'Z'
    return dt.strftime("%Y-%m-%dT%H:%M:%S.%fZ")


class CanonicalAuditEvent:
    """
    Deterministic canonical payload representation of an immutable audit event.
    Mutable fields (like blockchain transaction hashes, block numbers, verification timestamps)
    are strictly excluded from the canonical hash input.
    """

    def __init__(
        self,
        event_id: str,
        timestamp: Any,
        agent_id: str,
        action_type: str,
        resource: str,
        policy_decision: str,
        policy_id: str,
        policy_version: str = "1.0.0",
        reason: str = "",
        execution_mode: str = "SIMULATED",
        parameters: Optional[Dict[str, Any]] = None,
        canonical_version: str = CANONICAL_VERSION
    ):
        if not event_id:
            raise ValueError("event_id must not be empty")
        if not agent_id:
            raise ValueError("agent_id must not be empty")
        if not action_type:
            raise ValueError("action_type must not be empty")
        if not resource:
            raise ValueError("resource must not be empty")
        if not policy_decision:
            raise ValueError("policy_decision must not be empty")

        self.canonical_version = str(canonical_version).strip()
        self.event_id = str(event_id).strip()
        self.timestamp = normalize_utc_timestamp(timestamp)
        self.agent_id = str(agent_id).strip()
        self.action_type = str(action_type).strip().upper()
        self.resource = str(resource).strip()
        self.policy_decision = str(policy_decision).strip().upper()
        self.policy_id = str(policy_id).strip()
        self.policy_version = str(policy_version).strip()
        self.reason = str(reason or "").strip()
        self.execution_mode = str(execution_mode or "SIMULATED").strip().upper()
        self.parameters = parameters or {}

    def to_canonical_dict(self) -> Dict[str, Any]:
        """
        Return ordered dictionary of immutable audit fields.
        """
        return {
            "action_type": self.action_type,
            "agent_id": self.agent_id,
            "canonical_version": self.canonical_version,
            "event_id": self.event_id,
            "execution_mode": self.execution_mode,
            "parameters": self.parameters,
            "policy_decision": self.policy_decision,
            "policy_id": self.policy_id,
            "policy_version": self.policy_version,
            "reason": self.reason,
            "resource": self.resource,
            "timestamp": self.timestamp,
        }

    def serialize(self) -> bytes:
        """
        Deterministic canonical serialization:
        - Sorted keys
        - Compact separators without whitespace: (',', ':')
        - UTF-8 encoded bytes
        - No mutable blockchain metadata
        """
        dict_payload = self.to_canonical_dict()
        canonical_json_str = json.dumps(
            dict_payload,
            sort_keys=True,
            separators=(",", ":"),
            ensure_ascii=False
        )
        return canonical_json_str.encode("utf-8")

    def compute_hash(self) -> str:
        """
        Returns the 64-character lowercase hexadecimal SHA-256 digest.
        """
        raw_bytes = self.serialize()
        return hashlib.sha256(raw_bytes).hexdigest()

    def compute_bytes32_hex(self) -> str:
        """
        Returns the 0x-prefixed 64-hex-char format suitable for EVM bytes32 smart contract calls.
        """
        h = self.compute_hash()
        return f"0x{h}"


def compute_canonical_event_hash(
    event_id: str,
    timestamp: Any,
    agent_id: str,
    action_type: str,
    resource: str,
    policy_decision: str,
    policy_id: str,
    policy_version: str = "1.0.0",
    reason: str = "",
    execution_mode: str = "SIMULATED",
    parameters: Optional[Dict[str, Any]] = None,
    canonical_version: str = CANONICAL_VERSION
) -> str:
    """Convenience helper to compute 64-char hex SHA-256 hash."""
    canonical = CanonicalAuditEvent(
        event_id=event_id,
        timestamp=timestamp,
        agent_id=agent_id,
        action_type=action_type,
        resource=resource,
        policy_decision=policy_decision,
        policy_id=policy_id,
        policy_version=policy_version,
        reason=reason,
        execution_mode=execution_mode,
        parameters=parameters,
        canonical_version=canonical_version
    )
    return canonical.compute_hash()


def hash_to_bytes32_hex(hash_str: str) -> str:
    """Format 64-character hex hash into 0x-prefixed 32-byte representation."""
    cleaned = hash_str.strip()
    if cleaned.startswith("0x"):
        cleaned = cleaned[2:]
    if len(cleaned) != 64:
        raise ValueError(f"Expected 64 hex characters for SHA-256, got {len(cleaned)}")
    return f"0x{cleaned.lower()}"
