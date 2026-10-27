# SentinelMesh Architecture Overview

**SentinelMesh — Trust, Without Blind Faith** is a security and accountability platform for autonomous AI agents, designed as the foundation for cryptographic audit trails and decentralized smart contract settlement.

---

## 1. High-Level Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Next.js Frontend                     │
│  - Security Dashboard (Overview)                       │
│  - AI Action Simulator                                 │
│  - Cryptographic Audit Trail                           │
│  - Policy Catalog & Rules Explorer                     │
│  - System Settings & Hash Verification                 │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP REST (JSON)
                           ▼
┌────────────────────────────────────────────────────────┐
│              FastAPI Policy Enforcement                │
│  ┌──────────────────────┐  ┌────────────────────────┐  │
│  │ Zero-Trust Evaluator │  │ Administrative Guard   │  │
│  │ (Policies POL-A..G)  │  │ (Auth Key Protected)   │  │
│  └──────────┬───────────┘  └───────────┬────────────┘  │
│             │                          │               │
│             ▼                          ▼               │
│  ┌──────────────────────────────────────────────────┐  │
│  │       Cryptographic Integrity Hash Chaining      │  │
│  │  SHA-256(Event_N | Prev_Hash_N-1 | Metadata)     │  │
│  └──────────────────────┬───────────────────────────┘  │
└─────────────────────────┼──────────────────────────────┘
                          │ Parameterized SQL (SQLAlchemy)
                          ▼
┌────────────────────────────────────────────────────────┐
│                  Persistent Database                   │
│  - Agents (Identities & Roles)                         │
│  - Security Policies (Rules POL-A through G)           │
│  - Action Requests (Stated intent & params)            │
│  - Audit Events (Append-only hash-chained logs)        │
│  - Approval Decisions (Human-in-the-loop audit logs)   │
└─────────────────────────┬──────────────────────────────┘
                          │ (Phase 2 Foundation)
                          ▼
┌────────────────────────────────────────────────────────┐
│       Phase 2: Decentralized Blockchain Rollup         │
│  (Merkle Root Settlement on Arbitrum / Base / L2)      │
│  * NOT CONNECTED IN PHASE 1 - PREPARED INTERFACE *     │
└────────────────────────────────────────────────────────┘
```

---

## 2. Core Components

### 2.1 Deterministic Policy Engine (`app.policy_engine`)
Separated from the API route layer, the engine evaluates agent requests according to strict precedence rules:
1. **Administrative Command Isolation (POL-F):** Any shell command, OS binary execution, or `sys://` URI is immediately blocked.
2. **Restricted Resource Shield (POL-B):** Access to `restricted/*`, `secret/*`, or credential paths is blocked unless the requesting agent holds explicit `sec:restricted_access` credentials.
3. **Public Read Operations (POL-A):** Read-only operations on verified `public/*` resources are permitted (`ALLOW`).
4. **Database Record Deletion (POL-D):** Destructive table deletions always require human authorization (`REQUIRE_APPROVAL`).
5. **Customer Data Exports (POL-E):** Bulk data extraction on user/customer tables requires administrative approval (`REQUIRE_APPROVAL`).
6. **Database Updates (POL-C):** Updates are permitted if the agent has `db:write` permission, otherwise blocked.
7. **Default Deny (POL-G):** Any unrecognized action, empty parameter set, or unclassified resource is blocked by default.

### 2.2 Client Risk Independence
Client-supplied risk levels are intentionally discarded by the server. Risk tiers (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) are derived deterministically server-side based on the operation and resource sensitivity.

### 2.3 Simulated Execution Sandbox (Phase 1)
All permitted or approved operations execute strictly in `SIMULATED` mode:
- Blocked actions are assigned `execution_status = "BLOCKED"` and never execute.
- Pending actions remain `execution_status = "PENDING_APPROVAL"` until authorized.
- Approved actions transition to `APPROVED_SIMULATED`, recording the approver's note and timestamp while remaining safely contained within the simulation environment.

### 2.4 Cryptographic Hash Chaining
Every audit event generates a canonical SHA-256 hash:
$$\text{hash}_n = \text{SHA256}(\text{ID}_n \,\|\, \text{Timestamp}_n \,\|\, \text{Agent}_n \,\|\, \text{Action}_n \,\|\, \text{Resource}_n \,\|\, \text{Decision}_n \,\|\, \text{Policy}_n \,\|\, \text{hash}_{n-1})$$

This creates a local blockchain-ready tamper-evident chain that will feed directly into Phase 2 Merkle tree batching and on-chain contract commits.

---

## 3. Database Schema

- `agents`: Identity, role, permission tags (JSON list), status.
- `security_policies`: Rule definitions, action and resource match patterns, enforced decision, risk tier, version.
- `action_requests`: Raw input payload, stated reason, agent ID, client risk, derived risk.
- `audit_events`: Unique event ID (`evt_...`), timestamp, agent ID, action, resource, decision, reason, execution status, approval status, SHA-256 hash, previous event hash link.
- `approval_decisions`: Event ID reference, decision (`APPROVED`/`REJECTED`), approver ID, review note, UTC decided timestamp.
