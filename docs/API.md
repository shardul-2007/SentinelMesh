# SentinelMesh API Documentation

The SentinelMesh FastAPI backend exposes standard REST endpoints adhering to OpenAPI 3.1 specifications.

- Interactive Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc UI: `http://127.0.0.1:8000/redoc`
- OpenAPI JSON Schema: `http://127.0.0.1:8000/openapi.json`

---

## 1. System Health

### `GET /health`
Returns system status, active database connectivity, and Phase 1 blockchain integration boundary notice.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "SentinelMesh Policy Engine",
  "version": "1.0.0",
  "environment": "LOCAL DEVELOPMENT",
  "timestamp": "2026-10-27T09:15:13.523832",
  "database": "CONNECTED",
  "blockchain_integration": {
    "status": "NOT CONNECTED",
    "phase": "PHASE_1_SIMULATION",
    "readiness": "Cryptographic SHA-256 hash chaining active. Ready for Phase 2 smart contract settlement."
  }
}
```

---

## 2. Dashboard Statistics

### `GET /api/dashboard/stats`
Retrieves live counts calculated directly from persistent database records.

**Response (200 OK):**
```json
{
  "total_events": 14,
  "allowed_count": 8,
  "blocked_count": 4,
  "pending_approvals_count": 2,
  "system_status": {
    "frontend": "OPERATIONAL",
    "backend": "OPERATIONAL",
    "database": "CONNECTED",
    "blockchain": "NOT CONNECTED"
  },
  "recent_events": [ ... ],
  "events_by_date": [
    { "date": "Oct 21", "total": 2, "allowed": 2, "blocked": 0 },
    ...
  ]
}
```

---

## 3. Action Evaluation

### `POST /api/actions/evaluate`
Evaluates an incoming AI agent operation request against the deterministic policy engine and persists an immutable audit event.

**Request Body:**
```json
{
  "agent_id": "agent-data-analyzer",
  "action_type": "READ",
  "resource": "public/quarterly_security_metrics.pdf",
  "client_risk_level": "LOW",
  "reason": "Auditing monthly security KPIs",
  "parameters": {}
}
```

**Response (200 OK):**
```json
{
  "event_id": "evt_7d8a9f4c3b21",
  "decision": "ALLOW",
  "policy_id": "POL-A",
  "policy_name": "Public Resource Read Access",
  "reason": "Allowed by POL-A: Resource 'public/quarterly_security_metrics.pdf' is verified public and action is read-only.",
  "derived_risk_level": "LOW",
  "execution_mode": "SIMULATED",
  "execution_status": "EXECUTED_SIMULATED",
  "approval_status": "NONE",
  "timestamp": "2026-10-27T09:15:14.120000",
  "integrity_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "previous_event_hash": "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b"
}
```

---

## 4. Audit Trail

### `GET /api/events`
Query parameters:
- `page` (default: 1)
- `page_size` (default: 10, max: 100)
- `decision` (optional: `ALLOW`, `BLOCK`, `REQUIRE_APPROVAL`, `ALL`)
- `agent_id` (optional)
- `search` (optional text search over resource, reason, action, or ID)

**Response (200 OK):**
```json
{
  "total": 14,
  "page": 1,
  "page_size": 10,
  "events": [
    {
      "id": "evt_7d8a9f4c3b21",
      "timestamp": "2026-10-27T09:15:14.120000",
      "agent_id": "agent-data-analyzer",
      "action_type": "READ",
      "resource": "public/quarterly_security_metrics.pdf",
      "policy_decision": "ALLOW",
      "policy_id": "POL-A",
      "policy_version": "1.0.0",
      "reason": "Allowed by POL-A...",
      "execution_mode": "SIMULATED",
      "execution_status": "EXECUTED_SIMULATED",
      "approval_status": "NONE",
      "integrity_hash": "e3b0c442..."
    }
  ]
}
```

### `GET /api/events/{event_id}`
Returns the comprehensive event record including previous chained hash, structured metadata JSON, and approval decision history.

---

## 5. Security Policies

### `GET /api/policies`
Returns the active policies (POL-A through POL-G) registered in the engine.

---

## 6. Approvals (Protected Workflow)

### `GET /api/approvals`
Lists all events that triggered `REQUIRE_APPROVAL`.

### `POST /api/approvals/{event_id}/decision`
Authorizes or rejects an action on hold.

**Required Header:**
`X-Admin-Key: sentinel-admin-dev-key-phase1`

**Request Body:**
```json
{
  "decision": "APPROVED",
  "approver_id": "security-lead",
  "note": "Verified maintenance ticket #4082"
}
```

**Response (200 OK):**
```json
{
  "event_id": "evt_7d8a9f4c3b21",
  "status": "APPROVED",
  "execution_status": "APPROVED_SIMULATED",
  "decision": "APPROVED",
  "approver_id": "security-lead",
  "decided_at": "2026-10-27T09:20:00",
  "integrity_hash": "e3b0c442...",
  "message": "Request 'evt_...' was approved by 'security-lead'. Operation marked as APPROVED_SIMULATED (simulated execution only)."
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or incorrect `X-Admin-Key` header.
- `400 Bad Request`: Event is already finalized or did not require approval.
- `404 Not Found`: Event ID does not exist.
