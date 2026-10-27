import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.auth import (
    verify_password,
    create_access_token,
    get_current_user,
    require_roles
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    username: str
    password: str

class UserProfileResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user credentials and issue signed JWT access token.
    Enforces Role-Based Access Control (RBAC).
    """
    username = payload.username.strip()
    user = db.query(User).filter(User.username == username).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password."
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password."
        )

    token_payload = {
        "sub": user.id,
        "username": user.username,
        "role": user.role,
        "name": user.full_name
    }
    access_token = create_access_token(token_payload)

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserProfileResponse.model_validate(user)
    )

@router.get("/me", response_model=UserProfileResponse)
def get_authenticated_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieve current authenticated user profile and active security role."""
    return UserProfileResponse.model_validate(current_user)

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Gracefully terminate authenticated session."""
    return {"status": "success", "message": f"User '{current_user.username}' successfully logged out."}

@router.get("/demo-accounts", response_model=List[dict])
def list_demo_accounts():
    """
    Returns public demo credentials for quick switching in the Buildathon UI.
    Does not expose sensitive production credentials.
    """
    return [
        {
            "username": "admin",
            "role": "ADMIN",
            "name": "Chief Security Officer",
            "description": "Full access: Policy management, approving sensitive actions, anchoring to blockchain, resolving alerts."
        },
        {
            "username": "analyst",
            "role": "SECURITY_ANALYST",
            "name": "Senior Security Analyst",
            "description": "Operational access: Verify audit records, inspect blockchain evidence, export compliance reports, investigate alerts."
        },
        {
            "username": "viewer",
            "role": "VIEWER",
            "name": "Compliance Auditor",
            "description": "Read-only access: View dashboard, audit trail, policies, and simulator."
        }
    ]
