import json
import uuid
import datetime
from sqlalchemy.orm import Session
from app.models import Agent, SecurityPolicy, AuditEvent, User
from app.policy_engine.policies import DEFAULT_POLICIES
from app.policy_engine.evaluator import PolicyEvaluator
from app.auth import hash_password

def seed_database(db: Session):
    # 0. Seed Default RBAC Users (Phase 3)
    default_users = [
        {
            "id": "usr_admin",
            "username": "admin",
            "password": "AdminPassword123!",
            "email": "admin@sentinelmesh.io",
            "full_name": "Chief Security Officer",
            "role": "ADMIN"
        },
        {
            "id": "usr_analyst",
            "username": "analyst",
            "password": "AnalystPassword123!",
            "email": "analyst@sentinelmesh.io",
            "full_name": "Senior Security Analyst",
            "role": "SECURITY_ANALYST"
        },
        {
            "id": "usr_viewer",
            "username": "viewer",
            "password": "ViewerPassword123!",
            "email": "viewer@sentinelmesh.io",
            "full_name": "Audit Auditor / Viewer",
            "role": "VIEWER"
        }
    ]
    for u in default_users:
        existing_user = db.query(User).filter(User.username == u["username"]).first()
        if not existing_user:
            new_user = User(
                id=u["id"],
                username=u["username"],
                password_hash=hash_password(u["password"]),
                email=u["email"],
                full_name=u["full_name"],
                role=u["role"],
                is_active=True
            )
            db.add(new_user)
    db.commit()

    # 1. Seed Security Policies
    for pol in DEFAULT_POLICIES:
        existing = db.query(SecurityPolicy).filter(SecurityPolicy.id == pol.id).first()
        if not existing:
            new_policy = SecurityPolicy(
                id=pol.id,
                name=pol.name,
                description=pol.description,
                action_pattern=pol.action_pattern,
                resource_pattern=pol.resource_pattern,
                decision=pol.decision,
                risk_tier=pol.risk_tier,
                version=pol.version,
                is_active=True
            )
            db.add(new_policy)

    # 2. Seed Default Agents
    default_agents = [
        {
            "id": "agent-data-analyzer",
            "name": "Data Analyzer Agent",
            "role": "Analytics & Reporting",
            "permissions": ["db:read", "db:write"],
            "status": "ACTIVE"
        },
        {
            "id": "agent-financial-bot",
            "name": "Financial Bot",
            "role": "Ledger Automation",
            "permissions": ["db:read"],
            "status": "ACTIVE"
        },
        {
            "id": "agent-devops-orchestrator",
            "name": "DevOps Orchestrator",
            "role": "Infrastructure Management",
            "permissions": ["sec:restricted_access"],
            "status": "ACTIVE"
        },
        {
            "id": "agent-guest",
            "name": "Guest / Sandbox Agent",
            "role": "Untrusted Sandbox",
            "permissions": [],
            "status": "ACTIVE"
        }
    ]

    for a in default_agents:
        existing_agent = db.query(Agent).filter(Agent.id == a["id"]).first()
        if not existing_agent:
            new_agent = Agent(
                id=a["id"],
                name=a["name"],
                role=a["role"],
                permissions=json.dumps(a["permissions"]),
                status=a["status"]
            )
            db.add(new_agent)

    db.commit()

    # 3. If no audit events exist, seed 3 initial reproducible demo baseline events
    # Clearly labeled as "DEMO_SEED"
    event_count = db.query(AuditEvent).count()
    if event_count == 0:
        base_time = datetime.datetime.utcnow() - datetime.timedelta(hours=2)

        # Baseline seed 1: Allowed public read
        res1 = PolicyEvaluator.evaluate(
            agent_id="agent-data-analyzer",
            action_type="READ",
            resource="public/financial_quarterly_report.pdf",
            agent_permissions=["db:read", "db:write"]
        )
        evt1_id = f"evt_{uuid.uuid4().hex[:12]}"
        t1_iso = base_time.isoformat()
        hash1 = PolicyEvaluator.compute_integrity_hash(
            evt1_id, t1_iso, "agent-data-analyzer", "READ", "public/financial_quarterly_report.pdf",
            res1.decision.value, res1.policy_id, None
        )
        evt1 = AuditEvent(
            id=evt1_id,
            timestamp=base_time,
            agent_id="agent-data-analyzer",
            action_type="READ",
            resource="public/financial_quarterly_report.pdf",
            policy_decision=res1.decision.value,
            policy_id=res1.policy_id,
            policy_version=res1.policy_version,
            reason=res1.reason,
            execution_mode="SIMULATED",
            execution_status=res1.execution_status.value,
            approval_status=res1.approval_status,
            event_metadata=json.dumps({"demo_seed": True, "note": "Initial baseline demo event"}),
            integrity_hash=hash1,
            previous_event_hash="GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000"
        )
        db.add(evt1)
        db.commit()

        # Baseline seed 2: Blocked restricted secret read
        base_time_2 = base_time + datetime.timedelta(minutes=30)
        res2 = PolicyEvaluator.evaluate(
            agent_id="agent-financial-bot",
            action_type="READ",
            resource="restricted/vault_signing_keys.env",
            agent_permissions=["db:read"]
        )
        evt2_id = f"evt_{uuid.uuid4().hex[:12]}"
        t2_iso = base_time_2.isoformat()
        hash2 = PolicyEvaluator.compute_integrity_hash(
            evt2_id, t2_iso, "agent-financial-bot", "READ", "restricted/vault_signing_keys.env",
            res2.decision.value, res2.policy_id, hash1
        )
        evt2 = AuditEvent(
            id=evt2_id,
            timestamp=base_time_2,
            agent_id="agent-financial-bot",
            action_type="READ",
            resource="restricted/vault_signing_keys.env",
            policy_decision=res2.decision.value,
            policy_id=res2.policy_id,
            policy_version=res2.policy_version,
            reason=res2.reason,
            execution_mode="SIMULATED",
            execution_status=res2.execution_status.value,
            approval_status=res2.approval_status,
            event_metadata=json.dumps({"demo_seed": True, "note": "Initial baseline demo event"}),
            integrity_hash=hash2,
            previous_event_hash=hash1
        )
        db.add(evt2)
        db.commit()
