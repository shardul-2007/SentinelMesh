from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import SecurityPolicy, User
from app.auth import require_roles
from app.schemas import SecurityPolicyResponse, SecurityPolicyCreateRequest

router = APIRouter(prefix="/api/policies", tags=["Policies"])

@router.get("", response_model=List[SecurityPolicyResponse])
def get_policies(db: Session = Depends(get_db)):
    """All roles (Admin, Analyst, Compliance Auditor) can inspect active security policies."""
    policies = db.query(SecurityPolicy).all()
    return [SecurityPolicyResponse.model_validate(p) for p in policies]

@router.post("", response_model=SecurityPolicyResponse, status_code=status.HTTP_201_CREATED)
def create_policy(
    payload: SecurityPolicyCreateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["ADMIN"]))
):
    """
    Administrative policy authoring.
    Only Chief Security Officer (ADMIN) can author new security policies.
    """
    existing = db.query(SecurityPolicy).filter(SecurityPolicy.id == payload.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Policy with ID '{payload.id}' already exists."
        )

    policy = SecurityPolicy(
        id=payload.id,
        name=payload.name,
        description=payload.description,
        action_pattern=payload.action_pattern,
        resource_pattern=payload.resource_pattern,
        decision=payload.decision,
        risk_tier=payload.risk_tier,
        version=payload.version,
        is_active=True
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return SecurityPolicyResponse.model_validate(policy)

@router.post("/{policy_id}/toggle", response_model=SecurityPolicyResponse)
def toggle_policy_status(
    policy_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["ADMIN"]))
):
    """
    Administrative policy activation/deactivation.
    Only Chief Security Officer (ADMIN) can activate or deactivate security policies.
    """
    policy = db.query(SecurityPolicy).filter(SecurityPolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy '{policy_id}' not found."
        )

    policy.is_active = not policy.is_active
    db.commit()
    db.refresh(policy)
    return SecurityPolicyResponse.model_validate(policy)
