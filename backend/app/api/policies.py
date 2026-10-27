from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import SecurityPolicy
from app.schemas import SecurityPolicyResponse

router = APIRouter(prefix="/api/policies", tags=["Policies"])

@router.get("", response_model=List[SecurityPolicyResponse])
def get_policies(db: Session = Depends(get_db)):
    policies = db.query(SecurityPolicy).filter(SecurityPolicy.is_active == True).all()
    return [SecurityPolicyResponse.model_validate(p) for p in policies]
