import pytest
import datetime
import json
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    require_roles
)
from app.models import User, AuditEvent, IntegrityRecord, TamperAlert
from app.integrity.verifier import IntegrityVerifier

def test_password_hashing_and_verification():
    plain = "SuperSecurePassword999!"
    hashed = hash_password(plain)
    assert hashed.startswith("pbkdf2:sha256:100000$")
    assert verify_password(plain, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

def test_jwt_generation_and_validation():
    payload = {
        "sub": "usr_test_123",
        "username": "testanalyst",
        "role": "SECURITY_ANALYST",
        "name": "Test Analyst"
    }
    token = create_access_token(payload, expires_delta=datetime.timedelta(minutes=15))
    decoded = decode_access_token(token)
    assert decoded["username"] == "testanalyst"
    assert decoded["role"] == "SECURITY_ANALYST"
    assert decoded["sub"] == "usr_test_123"

def test_jwt_tampering_rejected():
    payload = {"sub": "usr_test", "role": "VIEWER"}
    token = create_access_token(payload)
    # Tamper with the payload portion
    parts = token.split(".")
    tampered_token = f"{parts[0]}.eyJzdWIiOiAidXNyX3Rlc3QiLCAicm9sZSI6ICJBRE1JTiJ9.{parts[2]}"
    with pytest.raises(Exception):
        decode_access_token(tampered_token)

def test_jwt_expiration():
    payload = {"sub": "usr_expired", "role": "VIEWER"}
    # Token expired 1 hour ago
    expired_token = create_access_token(payload, expires_delta=datetime.timedelta(hours=-1))
    with pytest.raises(Exception):
        decode_access_token(expired_token)

def test_rbac_role_enforcement():
    checker = require_roles(["ADMIN"])
    admin_user = User(id="u1", username="admin", role="ADMIN", email="a@a.com", full_name="Admin", password_hash="")
    analyst_user = User(id="u2", username="analyst", role="SECURITY_ANALYST", email="b@b.com", full_name="Analyst", password_hash="")
    viewer_user = User(id="u3", username="viewer", role="VIEWER", email="c@c.com", full_name="Viewer", password_hash="")

    # Admin passes
    assert checker(current_user=admin_user) == admin_user

    # Analyst and Viewer fail with 403 Forbidden
    with pytest.raises(Exception) as exc_info:
        checker(current_user=analyst_user)
    assert exc_info.value.status_code == 403

    with pytest.raises(Exception) as exc_info:
        checker(current_user=viewer_user)
    assert exc_info.value.status_code == 403
