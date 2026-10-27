import base64
import datetime
import hashlib
import hmac
import json
import secrets
from typing import Optional, List, Dict, Any
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import User

security_scheme = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with 100,000 iterations and 16-byte random salt."""
    salt = secrets.token_hex(16)
    iterations = 100000
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations
    )
    return f"pbkdf2:sha256:{iterations}${salt}${derived.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against PBKDF2 hashed password in constant time."""
    try:
        header, salt, expected_hex = hashed_password.split("$")
        parts = header.split(":")
        iterations = int(parts[2])
        derived = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            iterations
        )
        return hmac.compare_digest(derived.hex(), expected_hex)
    except Exception:
        return False

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")

def _b64url_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding and padding < 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data.encode("utf-8"))

def create_access_token(data: Dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    """
    Generate an RFC 7519 compliant JSON Web Token (JWT) using HMAC-SHA256 (HS256).
    Zero external dependencies, fast and secure.
    """
    to_encode = data.copy()
    now = datetime.datetime.now(datetime.timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp())
    })

    header = {"alg": "HS256", "typ": "JWT"}
    encoded_header = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    encoded_payload = _b64url_encode(json.dumps(to_encode, separators=(",", ":")).encode("utf-8"))

    signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    signature = hmac.new(settings.JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    encoded_signature = _b64url_encode(signature)

    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"

def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and verify an HS256 JWT access token."""
    parts = token.split(".")
    if len(parts) != 3:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token format."
        )

    encoded_header, encoded_payload, encoded_sig = parts
    signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    expected_sig = hmac.new(settings.JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    actual_sig = _b64url_decode(encoded_sig)

    if not hmac.compare_digest(expected_sig, actual_sig):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token signature verification failed."
        )

    payload = json.loads(_b64url_decode(encoded_payload).decode("utf-8"))
    exp = payload.get("exp")
    if exp and datetime.datetime.now(datetime.timezone.utc).timestamp() > exp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please sign in again."
        )

    return payload

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    db: Session = Depends(get_db)
) -> User:
    """
    Extracts and validates user authentication.
    Supports JWT Bearer token and developer X-Admin-Key fallback (for test scripts).
    """
    # 1. Bearer Token Auth
    if credentials and credentials.credentials:
        payload = decode_access_token(credentials.credentials)
        username = payload.get("username")
        if not username:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing user identity."
            )
        user = db.query(User).filter(User.username == username, User.is_active == True).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account not found or disabled."
            )
        return user

    # 2. Backward-compatible X-Admin-Key fallback
    if x_admin_key and x_admin_key.strip() == settings.ADMIN_API_KEY:
        admin_user = db.query(User).filter(User.username == "admin").first()
        if admin_user:
            return admin_user
        # Synthetic admin if user table not yet queried
        return User(
            id="usr_admin_system",
            username="admin",
            password_hash="",
            email="admin@sentinelmesh.io",
            full_name="System Administrator (API Key)",
            role="ADMIN",
            is_active=True
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Please provide a Bearer token or valid credentials."
    )

def require_roles(allowed_roles: List[str]):
    """
    Role-Based Access Control (RBAC) dependency factory.
    Enforces authorization check based on user role (ADMIN, SECURITY_ANALYST, VIEWER).
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Insufficient privileges. Required roles: {allowed_roles}, your role: '{current_user.role}'."
            )
        return current_user
    return role_checker
