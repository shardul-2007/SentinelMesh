"""
SentinelMesh Governance & Evidence Provenance Service
Phase 8: Traceable Evidence Provenance & Cryptographic Chain of Custody
"""

import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models import (
    AuditEvent, ActionRequest, SecurityPolicy, IntegrityRecord,
    ApprovalDecision, SecurityFinding, SecurityIncident, Agent
)
from app.schemas import GovernanceExplanationResponse
from app.integrity.canonical import compute_canonical_event_hash, hash_to_bytes32_hex
from app.blockchain.service import get_blockchain_service
from app.threats.risk_scorer import calculate_agent_risk_score

PROVENANCE_DISCLAIMER = (
    "Cryptographic provenance links the action request, evaluation decision, and persistent audit record. "
    "A verified hash guarantees the record has not been altered since creation; it does not constitute "
    "endorsement of untrusted payload contents."
)


class GovernanceProvenanceService:
    def __init__(self, db: Session):
        self.db = db

    def explain_event(self, event_id: str) -> Optional[GovernanceExplanationResponse]:
        event = self.db.query(AuditEvent).filter(
            (AuditEvent.id == event_id) | (AuditEvent.request_id == event_id)
        ).first()

        if not event:
            return None

        # 1. Resolve ActionRequest and parameters
        req = self.db.query(ActionRequest).filter(ActionRequest.id == event.request_id).first() if event.request_id else None
        try:
            params = json.loads(req.parameters) if req and req.parameters else {}
        except Exception:
            params = {}

        # 2. Resolve Agent and risk tier
        agent = self.db.query(Agent).filter(Agent.id == event.agent_id).first()
        agent_name = agent.name if agent else event.agent_id
        risk_profile = calculate_agent_risk_score(self.db, event.agent_id, window_hours=24)
        agent_risk_tier = risk_profile["risk_tier"]

        # 3. Local cryptographic verification: recompute canonical hash
        try:
            recomputed_raw = compute_canonical_event_hash(
                event_id=event.id,
                timestamp=event.timestamp,
                agent_id=event.agent_id,
                action_type=event.action_type,
                resource=event.resource,
                policy_decision=event.policy_decision,
                policy_id=event.policy_id,
                policy_version=event.policy_version,
                reason=event.reason,
                execution_mode=event.execution_mode,
                parameters=params
            )
            recomputed_hex = hash_to_bytes32_hex(recomputed_raw)
        except Exception:
            recomputed_hex = "ERROR"

        # Check local match
        irec = self.db.query(IntegrityRecord).filter(IntegrityRecord.event_id == event.id).first()
        if irec:
            stored_hash = irec.event_hash
            local_matches = (recomputed_hex.lower() == stored_hash.lower())
            local_verification_status = "INTACT" if local_matches else "TAMPERED"
            anchoring_status = irec.anchoring_status
            tx_hash = irec.transaction_hash
            contract_addr = irec.contract_address
        else:
            stored_hash = None
            local_verification_status = "UNVERIFIED"
            anchoring_status = "NOT_ANCHORED"
            tx_hash = None
            contract_addr = None

        # 4. Blockchain verification check
        b_service = get_blockchain_service()
        b_status = b_service.get_status()
        if not b_status["connected"]:
            blockchain_verification_status = "RPC_DISCONNECTED"
        elif irec and irec.anchoring_status == "ANCHORED":
            # Verify on-chain anchor
            onchain_res = b_service.verify_anchor(event.id, irec.event_hash)
            blockchain_verification_status = "ANCHORED_AND_VERIFIED" if onchain_res["verified"] else "ONCHAIN_MISMATCH"
        else:
            blockchain_verification_status = "NOT_ANCHORED"

        # 5. Resolve Approval Decision
        appr = self.db.query(ApprovalDecision).filter(ApprovalDecision.event_id == event.id).first()
        appr_dict = None
        if appr:
            appr_dict = {
                "decision_id": appr.id,
                "decision": appr.decision,
                "approver_id": appr.approver_id,
                "note": appr.note,
                "decided_at": appr.decided_at.isoformat() if appr.decided_at else None
            }

        # 6. Correlated Security Findings
        findings = self.db.query(SecurityFinding).filter(
            SecurityFinding.agent_id == event.agent_id
        ).all()
        matched_findings = []
        for f in findings:
            try:
                ev_ids = json.loads(f.evidence_event_ids) if f.evidence_event_ids else []
                if event.id in ev_ids:
                    matched_findings.append({
                        "finding_id": f.finding_id or f.id,
                        "rule_id": f.rule_id,
                        "title": f.title,
                        "severity": f.severity,
                        "status": f.status
                    })
            except Exception:
                pass

        # 7. Correlated Incidents
        incidents = self.db.query(SecurityIncident).filter(
            SecurityIncident.agent_id == event.agent_id
        ).all()
        matched_incidents = []
        for inc in incidents:
            try:
                ev_ids = json.loads(inc.evidence_event_ids) if inc.evidence_event_ids else []
                if event.id in ev_ids:
                    matched_incidents.append({
                        "incident_id": inc.incident_id or inc.id,
                        "title": inc.title,
                        "severity": inc.severity,
                        "status": inc.status
                    })
            except Exception:
                pass

        provenance_chain_complete = (
            req is not None and
            event is not None and
            irec is not None and
            local_verification_status == "INTACT"
        )

        return GovernanceExplanationResponse(
            event_id=event.id,
            request_id=event.request_id,
            agent_id=event.agent_id,
            agent_name=agent_name,
            action_type=event.action_type,
            resource=event.resource,
            parameters=params,
            policy_id=event.policy_id,
            policy_version=event.policy_version,
            policy_decision=event.policy_decision,
            decision_reason=event.reason,
            derived_risk_level=req.derived_risk_level if req else "UNKNOWN",
            agent_behavioral_risk_tier=agent_risk_tier,
            integrity_hash=event.integrity_hash,
            local_verification_status=local_verification_status,
            blockchain_anchoring_status=anchoring_status,
            blockchain_verification_status=blockchain_verification_status,
            transaction_hash=tx_hash,
            contract_address=contract_addr,
            approval_status=event.approval_status,
            approval_decision=appr_dict,
            related_findings=matched_findings,
            related_incidents=matched_incidents,
            timestamp=event.timestamp,
            provenance_chain_complete=provenance_chain_complete,
            provenance_disclaimer=PROVENANCE_DISCLAIMER
        )
