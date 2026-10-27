import datetime
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    role = Column(String(64), nullable=False)
    permissions = Column(Text, default="[]")  # JSON encoded list of permission tags
    status = Column(String(32), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    events = relationship("AuditEvent", back_populates="agent")
    requests = relationship("ActionRequest", back_populates="agent")


class SecurityPolicy(Base):
    __tablename__ = "security_policies"

    id = Column(String(64), primary_key=True, index=True)  # e.g., POL-A, POL-B
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    action_pattern = Column(String(128), nullable=False)
    resource_pattern = Column(String(128), nullable=False)
    decision = Column(String(32), nullable=False)  # ALLOW, BLOCK, REQUIRE_APPROVAL
    risk_tier = Column(String(32), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    version = Column(String(16), default="1.0.0")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ActionRequest(Base):
    __tablename__ = "action_requests"

    id = Column(String(64), primary_key=True, index=True)
    agent_id = Column(String(64), ForeignKey("agents.id"), nullable=False)
    action_type = Column(String(64), nullable=False)
    resource = Column(String(256), nullable=False)
    client_risk_level = Column(String(32), nullable=True)
    derived_risk_level = Column(String(32), nullable=False)
    reason = Column(Text, nullable=True)
    parameters = Column(Text, default="{}")  # JSON encoded params
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    agent = relationship("Agent", back_populates="requests")
    audit_event = relationship("AuditEvent", back_populates="request", uselist=False)


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(64), primary_key=True, index=True)  # evt_...
    request_id = Column(String(64), ForeignKey("action_requests.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    agent_id = Column(String(64), ForeignKey("agents.id"), nullable=False, index=True)
    action_type = Column(String(64), nullable=False, index=True)
    resource = Column(String(256), nullable=False, index=True)
    policy_decision = Column(String(32), nullable=False, index=True)  # ALLOW, BLOCK, REQUIRE_APPROVAL
    policy_id = Column(String(64), nullable=False)
    policy_version = Column(String(16), default="1.0.0")
    reason = Column(Text, nullable=False)
    execution_mode = Column(String(32), default="SIMULATED", nullable=False)
    execution_status = Column(String(32), nullable=False)  # EXECUTED_SIMULATED, BLOCKED, PENDING_APPROVAL, APPROVED_SIMULATED, REJECTED
    approval_status = Column(String(32), default="NONE", nullable=False)  # NONE, PENDING, APPROVED, REJECTED
    event_metadata = Column(Text, default="{}")  # JSON string
    integrity_hash = Column(String(64), nullable=False)  # SHA-256 canonical hash
    previous_event_hash = Column(String(64), nullable=True)  # Cryptographic hash chain link

    agent = relationship("Agent", back_populates="events")
    request = relationship("ActionRequest", back_populates="audit_event")
    approval_decision = relationship("ApprovalDecision", back_populates="event", uselist=False)
    integrity_record = relationship("IntegrityRecord", back_populates="audit_event", uselist=False)


class IntegrityRecord(Base):
    __tablename__ = "integrity_records"

    id = Column(String(64), primary_key=True, index=True)  # int_...
    event_id = Column(String(64), ForeignKey("audit_events.id"), unique=True, nullable=False, index=True)
    hash_algorithm = Column(String(32), default="SHA-256", nullable=False)
    canonical_version = Column(String(16), default="1.0.0", nullable=False)
    event_hash = Column(String(66), nullable=False, index=True)  # 0x... 64-hex
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Blockchain anchor metadata
    blockchain_network = Column(String(64), nullable=True)  # e.g., hardhat-local, sepolia
    chain_id = Column(Integer, nullable=True)
    contract_address = Column(String(64), nullable=True)
    transaction_hash = Column(String(66), nullable=True, index=True)
    block_number = Column(Integer, nullable=True)
    anchoring_status = Column(String(32), default="NOT_ANCHORED", nullable=False, index=True)  # NOT_ANCHORED, PENDING, ANCHORED, FAILED
    anchored_at = Column(DateTime, nullable=True)

    # Verification state
    verification_status = Column(String(32), default="UNVERIFIED", nullable=False, index=True)  # INTACT, TAMPERED, ANCHORED_AND_VERIFIED, NOT_ANCHORED, VERIFICATION_UNAVAILABLE
    last_verified_at = Column(DateTime, nullable=True)
    verification_details = Column(Text, default="{}")  # JSON string

    audit_event = relationship("AuditEvent", back_populates="integrity_record")


class ApprovalDecision(Base):
    __tablename__ = "approval_decisions"

    id = Column(String(64), primary_key=True, index=True)
    event_id = Column(String(64), ForeignKey("audit_events.id"), unique=True, nullable=False)
    decision = Column(String(32), nullable=False)  # APPROVED, REJECTED
    approver_id = Column(String(64), nullable=False)
    note = Column(Text, nullable=True)
    decided_at = Column(DateTime, default=datetime.datetime.utcnow)

    event = relationship("AuditEvent", back_populates="approval_decision")


class User(Base):
    """
    User entity supporting Role-Based Access Control (RBAC).
    Roles: ADMIN, SECURITY_ANALYST, VIEWER.
    """
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    email = Column(String(128), nullable=False)
    full_name = Column(String(128), nullable=False)
    role = Column(String(32), default="VIEWER", nullable=False, index=True)  # ADMIN, SECURITY_ANALYST, VIEWER
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class TamperAlert(Base):
    """
    Security alert triggered when cryptographic verification detects
    tampering or hash divergence against local integrity records or on-chain anchors.
    """
    __tablename__ = "tamper_alerts"

    id = Column(String(64), primary_key=True, index=True)  # alt_...
    event_id = Column(String(64), ForeignKey("audit_events.id"), nullable=False, index=True)
    detection_timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    severity = Column(String(32), default="CRITICAL", nullable=False)  # CRITICAL, HIGH, MEDIUM
    status = Column(String(32), default="OPEN", nullable=False, index=True)  # OPEN, INVESTIGATING, RESOLVED
    trusted_source = Column(String(64), nullable=False)  # LOCAL_RECORD, BLOCKCHAIN_CONTRACT
    expected_hash = Column(String(66), nullable=False)
    calculated_hash = Column(String(66), nullable=False)
    details = Column(Text, default="{}")  # JSON string describing discrepancy
    resolved_by = Column(String(64), nullable=True)
    resolution_note = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    event = relationship("AuditEvent", backref="tamper_alerts")


class SecurityFinding(Base):
    """
    Explainable behavioral threat finding generated by the detection engine
    from real or simulated audit event patterns.
    """
    __tablename__ = "security_findings"

    id = Column(String(64), primary_key=True, index=True)  # fnd_...
    finding_id = Column(String(64), index=True)  # Human-readable FIND-20261027-...
    rule_id = Column(String(64), nullable=False, index=True)
    rule_version = Column(String(16), default="1.0.0", nullable=False)
    agent_id = Column(String(64), ForeignKey("agents.id"), nullable=False, index=True)
    severity = Column(String(32), nullable=False, index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(32), default="ACTIVE", nullable=False, index=True)  # ACTIVE, INVESTIGATING, RESOLVED, FALSE_POSITIVE
    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    evidence_event_ids = Column(Text, default="[]", nullable=False)  # JSON array of audit event IDs
    dedup_key = Column(String(128), unique=True, index=True, nullable=False)
    detected_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    is_simulation = Column(Boolean, default=False, index=True)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String(64), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    finding_metadata = Column(Text, default="{}", nullable=False)  # JSON dictionary with detection context

    agent = relationship("Agent", backref="findings")
    audit_logs = relationship("FindingAuditLog", back_populates="finding", cascade="all, delete-orphan")


class FindingAuditLog(Base):
    """
    Audit log tracking investigation lifecycle transitions and analyst notes
    for security findings.
    """
    __tablename__ = "finding_audit_logs"

    id = Column(String(64), primary_key=True, index=True)  # flog_...
    finding_id = Column(String(64), ForeignKey("security_findings.id"), nullable=False, index=True)
    action = Column(String(64), nullable=False)  # STATUS_CHANGE, NOTE_ADDED, CREATED
    previous_status = Column(String(32), nullable=True)
    new_status = Column(String(32), nullable=False)
    performed_by = Column(String(64), nullable=False)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    finding = relationship("SecurityFinding", back_populates="audit_logs")


class DetectionRun(Base):
    """
    Record of a threat detection engine execution for auditability and performance tracking.
    """
    __tablename__ = "detection_runs"

    id = Column(String(64), primary_key=True, index=True)  # drun_...
    run_timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    triggered_by = Column(String(64), default="MANUAL", nullable=False)  # MANUAL, EVENT_HOOK, SIMULATION, SCHEDULED
    agent_id = Column(String(64), nullable=True, index=True)
    events_scanned = Column(Integer, default=0, nullable=False)
    findings_generated = Column(Integer, default=0, nullable=False)
    status = Column(String(32), default="SUCCESS", nullable=False)
    details = Column(Text, default="{}", nullable=False)

