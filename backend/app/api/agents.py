"""
SentinelMesh Agent Registry & Management API Routes
Phase 7
"""

import json
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.auth import get_current_user, require_roles
from app.models import Agent, AuditEvent, SecurityFinding, SecurityIncident, User
from app.schemas import AgentCreateRequest, AgentStatusUpdateRequest, AgentDetailResponse
from app.threats.risk_scorer import calculate_agent_risk_score
from app.monitoring.events import get_broadcaster

agents_router = APIRouter(prefix="/api/agents", tags=["Agent Registry"])


@agents_router.get("", response_model=List[AgentDetailResponse])
def list_agents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns all registered simulated agents with their current operational status,
    risk tiers, and active alert counters.
    """
    agents = db.query(Agent).order_by(Agent.id).all()
    results = []

    for a in agents:
        results.append(_build_agent_detail(db, a))
    return results


@agents_router.post("", response_model=AgentDetailResponse, status_code=status.HTTP_201_CREATED)
def create_agent(
    payload: AgentCreateRequest,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Registers a new simulated AI agent. Enforces unique identifier constraint.
    Restricted to ADMIN role.
    """
    existing = db.query(Agent).filter(Agent.id == payload.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Agent with ID '{payload.id}' already exists."
        )

    now_utc = datetime.now(timezone.utc)
    new_agent = Agent(
        id=payload.id,
        name=payload.name,
        role=payload.role,
        description=payload.description,
        permissions=json.dumps(payload.permissions),
        assigned_policies=json.dumps(payload.assigned_policies),
        status="ACTIVE",
        created_at=now_utc,
        last_active_at=None
    )
    db.add(new_agent)
    db.commit()
    db.refresh(new_agent)

    get_broadcaster().publish_nowait("AGENT_STATUS_CHANGED", {
        "agent_id": new_agent.id,
        "name": new_agent.name,
        "status": "ACTIVE",
        "action": "CREATED"
    })

    return _build_agent_detail(db, new_agent)


@agents_router.get("/{agent_id}", response_model=AgentDetailResponse)
def get_agent(
    agent_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves full profile details for a specific simulated agent.
    """
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found.")
    return _build_agent_detail(db, agent)


@agents_router.post("/{agent_id}/status")
def update_agent_status(
    agent_id: str,
    payload: AgentStatusUpdateRequest,
    current_user: User = Depends(require_roles(["ADMIN", "SECURITY_ANALYST"])),
    db: Session = Depends(get_db)
):
    """
    Updates an agent's operational status (ACTIVE, DEACTIVATED, QUARANTINED).
    Deactivated or Quarantined agents are prohibited from executing actions at the gateway.
    """
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found.")

    prev_status = agent.status
    agent.status = payload.status.value
    db.commit()

    get_broadcaster().publish_nowait("AGENT_STATUS_CHANGED", {
        "agent_id": agent.id,
        "name": agent.name,
        "previous_status": prev_status,
        "new_status": agent.status,
        "updated_by": current_user.username,
        "reason": payload.reason
    })

    return {
        "status": "UPDATED",
        "agent_id": agent.id,
        "previous_status": prev_status,
        "new_status": agent.status,
        "reason": payload.reason,
        "updated_by": current_user.username
    }


def _build_agent_detail(db: Session, agent: Agent) -> AgentDetailResponse:
    try:
        perms = json.loads(agent.permissions) if agent.permissions else []
    except Exception:
        perms = []
    try:
        policies = json.loads(agent.assigned_policies) if agent.assigned_policies else []
    except Exception:
        policies = []

    total_actions = db.query(AuditEvent).filter(AuditEvent.agent_id == agent.id).count()
    active_findings = db.query(SecurityFinding).filter(
        SecurityFinding.agent_id == agent.id,
        SecurityFinding.status.in_(["ACTIVE", "INVESTIGATING"])
    ).count()
    open_incidents = db.query(SecurityIncident).filter(
        SecurityIncident.agent_id == agent.id,
        SecurityIncident.status.in_(["OPEN", "INVESTIGATING"])
    ).count()

    risk_info = calculate_agent_risk_score(db, agent.id, window_hours=24)

    return AgentDetailResponse(
        id=agent.id,
        name=agent.name,
        role=agent.role,
        description=agent.description,
        permissions=perms,
        assigned_policies=policies,
        status=agent.status or "ACTIVE",
        created_at=agent.created_at,
        last_active_at=agent.last_active_at,
        total_actions=total_actions,
        active_findings_count=active_findings,
        open_incidents_count=open_incidents,
        risk_tier=risk_info["risk_tier"]
    )
