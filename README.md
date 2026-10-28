# SentinelMesh — Trust, Without Blind Faith

> **Zero-Trust Security, Deterministic Policy Enforcement, Cryptographic Blockchain Anchoring, Adaptive Threat Detection, Multi-Agent Orchestration & Autonomous Governance for Autonomous AI Agents**  
> *Complete Full-Stack Platform (Phases 1–8)*

[![Live Deployment](https://img.shields.io/badge/Vercel-Live%20Platform-000000?logo=vercel&logoColor=white)](https://sentinelmesh-five.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-shardul--2007%2FSentinelMesh-181717?logo=github&logoColor=white)](https://github.com/shardul-2007/SentinelMesh)
[![FastAPI](https://img.shields.io/badge/FastAPI-2.0.0-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity&logoColor=white)](https://soliditylang.org)
[![Web3.py](https://img.shields.io/badge/Web3.py-8.0.0-F16822?logo=ethereum&logoColor=white)](https://web3py.readthedocs.io)
[![Tests](https://img.shields.io/badge/Pytest-63%20Passed%20(100%25)-emerald)](backend/tests)

---

## 🌐 Live Deployments & Repository Links

- **Production Application URL:** [https://sentinelmesh-five.vercel.app](https://sentinelmesh-five.vercel.app)
- **Deployment Alternate URL:** [https://sentinelmesh-3x6wees20-shardulparihar2007-3775s-projects.vercel.app](https://sentinelmesh-3x6wees20-shardulparihar2007-3775s-projects.vercel.app)
- **GitHub Repository:** [https://github.com/shardul-2007/SentinelMesh](https://github.com/shardul-2007/SentinelMesh)
- **Vercel Project Dashboard:** [https://vercel.com/shardulparihar2007-3775s-projects/sentinelmesh](https://vercel.com/shardulparihar2007-3775s-projects/sentinelmesh)

---

## 1. Executive Summary & Problem Statement

Autonomous AI agents (such as code executors, financial assistants, customer data assistants, and DevOps agents) are rapidly acquiring the agency to invoke external APIs, read confidential files, delete databases, and make financial disbursements.

Today, enterprise adoption is throttled by a fundamental dilemma: **Blind faith vs. Paralyzing fear.**
- Existing AI guardrails rely on probabilistic prompt filters that can be jailbroken.
- Traditional audit logging stores mutable rows in SQL databases where administrators or compromised credentials can alter historical logs with impunity.
- There is no cryptographic link between what an agent *intended* to do, what *policy* permitted, and what was *anchored* to immutable history.

**SentinelMesh** solves this by establishing a zero-trust policy enforcement and cryptographic accountability gateway:
1. **Deterministic Policy Enforcement:** Every AI agent request is intercepted and evaluated against strict, versioned policies before execution.
2. **Deterministic Canonical Hashing:** Generates an immutable, normalized SHA-256 digest of every decision.
3. **EVM Smart Contract Anchoring:** Submits canonical event hashes to an EVM blockchain (`SentinelMeshAuditAnchor.sol`) with block-timestamped receipts.
4. **Independent Cryptographic Verification & Tamper Detection:** Continuously compares live database records against both local canonical hashes and on-chain contract storage, immediately raising **Tamper Alerts** if a single byte has been mutated.
5. **Human-in-the-Loop Approval Center:** High-risk actions (e.g. database purge, PII export) are quarantined in pending state until an authorized administrator approves or rejects them.
6. **Execution Boundary Safety:** Permitted simulator actions execute strictly in `SIMULATED` mode—preventing arbitrary shell execution or destructive database modifications.

---

## 2. System Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Client["AI Agent / Operator Interface"]
        Agent[Autonomous AI Agent]
        Admin[Security Operations Center / Admin]
    end

    subgraph SentinelMeshCore["SentinelMesh Policy & Integrity Gateway"]
        API[FastAPI Gateway :8000]
        RBAC[RBAC Auth Guard: Admin / Analyst / Viewer]
        PE[Policy Evaluation Engine POL-A..G]
        CH[Canonical Event Serializer & SHA-256]
        DB[(Persistent Audit Store: SQLite / Postgres)]
        IV[Integrity Verifier Service]
    end

    subgraph Blockchain["Decentralized Trust Ledger"]
        Web3Client[Web3.py Client v8.0]
        Contract[SentinelMeshAuditAnchor.sol]
        EVMNode[(EVM Network: Hardhat / Sepolia / Mainnet)]
    end

    Agent -->|1. Submit Action Request| API
    API --> RBAC
    RBAC -->|2. Evaluate Context| PE
    PE -->|3. Decision: ALLOW / BLOCK / REQUIRE_APPROVAL| API
    
    API -->|4. Record Immutable Audit Event| DB
    API -->|5. Compute Canonical SHA-256| CH
    CH -->|6. Store Integrity Record| DB

    Admin -->|7. Authorize On-Chain Anchor| API
    API --> Web3Client
    Web3Client -->|8. anchorEvent(eventId, eventHash)| Contract
    Contract --> EVMNode
    EVMNode -->|9. Tx Hash & Block Receipt| DB

    Admin -->|10. Verify Record Integrity| IV
    IV -->|11. Compare Local DB vs Stored Hash| DB
    IV -->|12. verifyAnchor(eventId, expectedHash)| Contract
    IV -->|13. Tamper Alert if Mismatch| Admin
```

---

## 3. Implemented Capabilities Matrix

| Feature | Status | Verification Evidence |
| :--- | :---: | :--- |
| **Deterministic Policy Engine** | **Operational** | Rules POL-A through POL-G; default-deny fallback; untrusted client risk rejection |
| **Simulated Action Workflow** | **Operational** | Allow, block, and approval flows executed strictly in `SIMULATED` mode |
| **Canonical SHA-256 Hashing** | **Operational** | Sorted keys, compact `(,)`, UTC normalization, mutable field exclusion |
| **EVM Smart Contract** | **Operational** | `SentinelMeshAuditAnchor.sol` with access control, duplicate prevention, events |
| **Web3.py Blockchain Service** | **Operational** | Non-blocking socket probe, raw transaction signing, on-chain `verifyAnchor` |
| **Cryptographic Tamper Detection** | **Operational** | Immediate detection of mutated database records against local & on-chain hashes |
| **Role-Based Access Control (RBAC)**| **Operational** | `ADMIN`, `SECURITY_ANALYST`, and `VIEWER` roles enforced on server endpoints |
| **Interactive Integrity Center** | **Operational** | Live verification, on-chain anchoring, tamper alerts table, 1-click tamper simulation |
| **Approval Center** | **Operational** | Pending review queue, risk justification, administrative approve/reject modal |
| **Audit Trail & Evidence Export** | **Operational** | Pagination, multi-field search, filters, CSV and JSON compliance export (formula-safe) |
| **Security Analytics Dashboard** | **Operational** | Velocity charts, decision breakdowns, agent activity summaries from persisted DB |
| **Phase 6: Threat Detection Engine** | **Operational** | 6 deterministic rules (RULE-REP-BLK-01 to RULE-INTEG-FAIL-06) with SHA-256 deduplication |
| **Phase 6: Agent Trust Profiles** | **Operational** | Explainable 0-100 Risk Score, factor breakdowns, INSUFFICIENT_DATA thresholds |
| **Phase 6: Interactive Testing Lab** | **Operational** | 5 deterministic attack scenarios with 1-click state reset & negative controls |
| **Phase 7: Multi-Agent Registry** | **Operational** | Agent registration, dynamic capability binding, operational states (`ACTIVE`, `QUARANTINED`) |
| **Phase 7: Centralized Gateway** | **Operational** | Idempotency key tracking, automatic containment quarantine enforcement |
| **Phase 7: Real-Time SSE Stream** | **Operational** | `/api/monitoring/stream` with 15s heartbeats, instant UI notifications |
| **Phase 7: Incident Correlation** | **Operational** | Automatic correlation for multi-finding bursts & critical escalations |
| **Phase 8: Provenance Chain** | **Operational** | Cryptographic verification link from Request -> Policy -> Hash -> EVM Anchor -> Findings |
| **Phase 8: Policy Versioning** | **Operational** | Audit-logged policy change history with version pinning and side-by-side diffs |
| **Phase 8: Governance Assurance** | **Operational** | Formula-neutralized executive compliance exports in CSV/JSON formats |

---

## 4. Technology Stack

- **Frontend:** Next.js 14 (React 18, TypeScript, App Router)
- **Styling:** Tailwind CSS (Enterprise dark graphite theme `#0B0F17`)
- **Icons:** Lucide React
- **Backend:** Python 3.10+ with FastAPI
- **Database:** SQLAlchemy ORM with SQLite (local) / PostgreSQL (production)
- **Cryptography:** RFC 7519 HMAC-SHA256 JWT, PBKDF2-HMAC-SHA256, SHA-256 canonical hashing
- **Smart Contracts:** Solidity `^0.8.20` with OpenZeppelin contracts
- **Blockchain Integration:** `web3.py` v8.0.0
- **Testing:** Pytest (39 automated backend tests covering all workflows)

---

## 5. Local Setup & Quick Start

### Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- Node.js v18+ (Tested on Node.js v24)
- Git

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd SentinelMesh
```

### Step 2: Configure & Start Backend
```powershell
# 1. Activate Python virtual environment:
.\venv\Scripts\Activate.ps1

# 2. Run database migration and test suite:
pytest -v backend/tests

# 3. Start the FastAPI backend server:
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*API Swagger Documentation will be available at:* `http://127.0.0.1:8000/docs`

### Step 3: Configure & Start Frontend
```bash
cd frontend
npm install
npm run dev
```
*Dashboard will be accessible at:* `http://localhost:3000`

### Step 4 (Optional): Start Local EVM Blockchain Node
```bash
cd contracts
npx hardhat node
# In another terminal:
npx hardhat run scripts/deploy.js --network localhost
```

---

## 6. Pre-Configured Demo Accounts (RBAC)

SentinelMesh features server-side Role-Based Access Control. You can easily switch roles in the header dropdown during demo evaluation:

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin` | `AdminPassword123!` | Full control: Policy management, approving sensitive actions, anchoring to EVM blockchain, resolving tamper alerts |
| **SECURITY_ANALYST** | `analyst` | `AnalystPassword123!` | Operational: Verify audit records, inspect blockchain evidence, export compliance reports, investigate alerts |
| **VIEWER** | `viewer` | `ViewerPassword123!` | Read-only: View dashboard, audit trail, policies, and action simulator |

---

## 7. 2-to-3 Minute Hackathon Demo Walkthrough Script

Follow this script to demonstrate SentinelMesh's core security workflows to judges:

### 1. Zero-Trust Action Evaluation (0:00 - 0:45)
1. Open `http://localhost:3000/simulator`.
2. Select **Data Analyzer Agent** requesting action **READ** on `public/financial_quarterly_report.pdf`. Click **Evaluate Action**.
   - Result: Decision is **ALLOW** (Policy `POL-A`). Derived risk is **LOW**.
   - Notice the canonical SHA-256 hash generated instantly.
3. Switch target to `restricted/vault_signing_keys.env` and click **Evaluate Action**.
   - Result: Decision is **BLOCK** (Policy `POL-B`). The agent has no secret access permissions.
   - Status: `BLOCKED` with zero execution.

### 2. Human-in-the-Loop Governance (0:45 - 1:15)
1. In the simulator, select **Financial Bot** requesting action **DELETE** on `db://financial/wire_transfers`. Click **Evaluate Action**.
   - Result: Decision is **REQUIRE_APPROVAL** (Policy `POL-D`). Execution status is `PENDING_APPROVAL`.
2. Navigate to `/approvals` (Approval Center).
   - Review the quarantined request and risk justification.
   - Click **Decide (Admin)**, enter approval rationale, and click **Approve Action**.
   - Status updates to `APPROVED_SIMULATED` with an immutable approval decision record.

### 3. Cryptographic Verification & Blockchain Anchoring (1:15 - 2:00)
1. Navigate to `/integrity` (Integrity Center).
2. Find the evaluated audit event and click **Verify**.
   - Independent verifier recalculates the canonical SHA-256 hash from the database and confirms record integrity.
3. Click **Anchor (Admin)**.
   - The backend signs a transaction to `SentinelMeshAuditAnchor.sol` and records block number and transaction hash.
4. Click **Verify** again.
   - Status updates to **ANCHORED_AND_VERIFIED**, proving cryptographic parity against the smart contract.

### 4. Live Tamper Detection Demo (2:00 - 2:45)
1. In the Integrity Center, click the **Simulate Tamper** button in the judge demo banner.
   - This directly alters an audit record in the database (simulating a database compromise or insider attack) without updating the stored canonical hash.
2. Observe the immediate reaction:
   - Verification status switches to **TAMPERED** with a pulse alert.
   - An active **Tamper Alert** is recorded with the expected hash vs calculated hash evidence.
   - A critical security warning banner appears across the dashboard.
3. Click **Restore Data** to restore canonical consistency and resolve the alert.

### 5. Compliance Export & Reporting (2:45 - 3:00)
1. Navigate to `/audit` (Audit Trail).
2. Click **Export CSV** or **Export JSON**.
   - Demonstrates formula-injection sanitized, cryptographically verifiable compliance evidence ready for external audit.

---

## 8. Automated Test Results

Run the full automated test suite:
```bash
pytest -v backend/tests
```

**Actual Output:**
```
============================= test session starts =============================
platform win32 -- Python 3.14.6, pytest-8.4.2 -- SQLite persistence
collected 39 items

backend/tests/test_api.py::test_health_endpoint PASSED                   [  2%]
backend/tests/test_api.py::test_get_policies PASSED                      [  5%]
backend/tests/test_api.py::test_action_evaluate_allow_flow PASSED        [  7%]
backend/tests/test_api.py::test_action_evaluate_block_flow PASSED        [ 10%]
backend/tests/test_api.py::test_action_evaluate_approval_required_flow PASSED [ 12%]
backend/tests/test_api.py::test_dashboard_stats_and_event_persistence PASSED [ 15%]
backend/tests/test_approvals.py::test_approval_auth_protection_and_workflow PASSED [ 17%]
backend/tests/test_auth_and_reports.py::test_password_hashing_and_verification PASSED [ 20%]
backend/tests/test_auth_and_reports.py::test_jwt_generation_and_validation PASSED [ 23%]
backend/tests/test_auth_and_reports.py::test_jwt_tampering_rejected PASSED [ 25%]
backend/tests/test_auth_and_reports.py::test_jwt_expiration PASSED       [ 28%]
backend/tests/test_auth_and_reports.py::test_rbac_role_enforcement PASSED [ 30%]
backend/tests/test_canonical_hashing.py::test_deterministic_canonicalization PASSED [ 33%]
backend/tests/test_canonical_hashing.py::test_hash_to_bytes32_hex PASSED [ 35%]
backend/tests/test_canonical_hashing.py::test_timestamp_normalization PASSED [ 38%]
backend/tests/test_canonical_hashing.py::test_unicode_and_special_characters PASSED [ 41%]
backend/tests/test_canonical_hashing.py::test_hash_mismatch_on_tampering PASSED [ 43%]
backend/tests/test_canonical_hashing.py::test_mandatory_fields_validation PASSED [ 46%]
backend/tests/test_canonical_hashing.py::test_mutable_fields_are_excluded PASSED [ 48%]
backend/tests/test_integrity_api.py::test_integrity_hash_and_get_endpoints PASSED [ 51%]
backend/tests/test_integrity_api.py::test_integrity_status_endpoint PASSED [ 53%]
backend/tests/test_integrity_api.py::test_anchor_auth_protection PASSED  [ 56%]
backend/tests/test_integrity_api.py::test_list_integrity_records_and_alerts PASSED [ 58%]
backend/tests/test_integrity_api.py::test_simulate_and_restore_tamper_endpoints PASSED [ 61%]
backend/tests/test_integrity_verification.py::test_verify_intact_local_record PASSED [ 64%]
backend/tests/test_integrity_verification.py::test_tamper_detection_on_mutated_database_record PASSED [ 66%]
backend/tests/test_integrity_verification.py::test_blockchain_anchored_and_verified_scenario PASSED [ 69%]
backend/tests/test_integrity_verification.py::test_blockchain_rpc_outage_reported_as_unavailable PASSED [ 71%]
backend/tests/test_policy_engine.py::test_policy_a_public_read_allowed PASSED [ 74%]
backend/tests/test_policy_engine.py::test_policy_b_restricted_resource_blocked_without_permission PASSED [ 76%]
backend/tests/test_policy_engine.py::test_policy_b_restricted_resource_allowed_with_permission PASSED [ 79%]
backend/tests/test_policy_engine.py::test_policy_c_db_update_requires_permission PASSED [ 82%]
backend/tests/test_policy_engine.py::test_policy_d_db_delete_requires_approval PASSED [ 84%]
backend/tests/test_policy_engine.py::test_policy_e_customer_export_requires_approval PASSED [ 87%]
backend/tests/test_policy_engine.py::test_policy_f_admin_command_blocked PASSED [ 89%]
backend/tests/test_policy_engine.py::test_policy_g_unknown_action_default_deny PASSED [ 92%]
backend/tests/test_policy_engine.py::test_malformed_empty_inputs_denied PASSED [ 94%]
backend/tests/test_policy_engine.py::test_client_risk_level_is_not_trusted PASSED [ 97%]
backend/tests/test_policy_engine.py::test_cryptographic_integrity_hash PASSED [100%]

======================= 39 passed in 6.36s =======================
```

---

## 9. Security Model & Threat Invariants

1. **Client Risk Levels Are Untrusted:** Client-provided risk ratings in simulator requests are ignored. Risk tier is derived strictly on the backend by matching requested action and resource patterns against policy rules.
2. **Immutable Append-Only Audit:** No deletion or mutation endpoints exist for `AuditEvent` or `IntegrityRecord`.
3. **Canonical Field Ordering:** Timestamps are normalized to UTC ISO-8601 with microsecond precision (`Z`). Dictionaries are serialized with strictly sorted keys and no extraneous whitespace.
4. **Offline Resilience:** If the EVM blockchain node is offline, the gateway continues functioning in local verified mode and honestly reports blockchain verification as `DISCONNECTED` or `VERIFICATION_UNAVAILABLE` rather than fabricating transactions.
5. **Simulated Execution Boundaries:** Approved operations execute strictly in simulated mode with synthetic feedback; no raw shell commands or direct database drops occur.

---

## 10. License & Acknowledgments

Built for the Blockchain Buildathon MVP. Distributed under the MIT License.
SentinelMesh — *Trust, Without Blind Faith.*
