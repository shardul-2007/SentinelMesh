# SentinelMesh — Trust, Without Blind Faith

> **Enterprise Agent-Action Governance, Deterministic Policy Enforcement, Cryptographic Canonical Evidence & MST Blockchain Anchoring**

[![Production Deployment](https://img.shields.io/badge/Vercel-Production%20Live-171A1F?logo=vercel&logoColor=white)](https://frontend-seven-ecru-61la4jq9i8.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-shardul--2007%2FSentinelMesh-171A1F?logo=github&logoColor=white)](https://github.com/shardul-2007/SentinelMesh)
[![Backend Tests](https://img.shields.io/badge/Pytest-65%20Passed%20(100%25)-287653)](backend/tests)
[![Contract Tests](https://img.shields.io/badge/Hardhat-27%20Passed%20(100%25)-315C78)](contracts/test)
[![MST Blockchain](https://img.shields.io/badge/MST%20Blockchain-Testnet%2091562037%20%2F%20Mainnet%204646-171A1F)](https://mstscan.com)

---

## 1. Executive Summary & Problem Statement

Autonomous AI agents (code generators, data analysts, automated traders, database operators, and DevOps orchestrators) are executing actions across enterprise systems. Today, organizations face a critical security challenge: **Blind faith vs. Paralyzing fear.**

- **Probabilistic Guardrails Fail:** Traditional AI prompt defenses can be bypassed or jailbroken.
- **Mutable Audit Logs:** Standard SQL logs can be altered by compromised credentials or malicious insiders without detection.
- **Missing Verifiability:** No cryptographic trail proves what an agent intended to do, what policy governed it, and what commitment was anchored immutably to a public ledger.

**SentinelMesh** solves this problem by delivering a zero-trust governance and cryptographic accountability layer for AI agent interactions:

1. **Deterministic Policy Enforcement:** Intercepts agent actions on the backend, enforcing `ALLOW`, `BLOCK`, or `REQUIRE_APPROVAL` decisions with strict precedence.
2. **RFC-8785 Canonical Serialization:** Creates deterministic, normalized JSON byte sequences representing the complete evidence lifecycle.
3. **SHA-256 Cryptographic Commitment:** Generates unique, immutable 32-byte digests linked in an append-only cryptographic hash chain.
4. **MST Blockchain Smart Contract Anchoring:** Anchors evidence commitments to the `EvidenceRegistry` smart contract on **MST Blockchain** (`https://testnetrpc.mstblockchain.com`, Chain ID `91562037`).
5. **Independent Read-Back & Verification:** Reads on-chain commitments back from the smart contract, comparing the on-chain digest against the locally recomputed digest to detect any evidence mutation.
6. **Execution Containment Boundary:** Gated actions and simulated operations run in a strictly safe containment sandbox, preventing arbitrary shell command execution or destructive production database writes.

---

## 2. The Critical End-to-End Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Agent as Autonomous Agent
    participant Gateway as Action Gateway (:8000)
    participant Engine as Policy Engine
    participant Store as Audit & Evidence Store
    participant Verifier as Integrity Verifier
    participant Contract as MST EvidenceRegistry (EVM)

    Agent->>Gateway: POST /api/actions/evaluate (Action, Resource, Metadata)
    Gateway->>Engine: Deterministic Policy Evaluation (Rule Precedence)
    Engine-->>Gateway: Decision: ALLOW | BLOCK | REQUIRE_APPROVAL
    Gateway->>Store: Persist ActionRequest & AuditEvent (Append-only)
    Gateway->>Store: Generate Canonical RFC-8785 JSON & SHA-256 Digest
    alt Policy = BLOCK
        Gateway-->>Agent: Action Halted at Gateway (Zero Execution)
    else Policy = REQUIRE_APPROVAL
        Gateway-->>Agent: Action Quarantined (Awaiting Human Authorization)
    else Policy = ALLOW or Approved
        Gateway->>Store: Record Isolated Execution Outcome
        Gateway->>Contract: Submit recordEvidence(evidenceId, evidenceHash)
        Contract-->>Store: Transaction Receipt (Block Number, Tx Hash)
        Gateway->>Verifier: Independent Read-Back & Hash Comparison
        Verifier->>Contract: verifyEvidence(evidenceId, expectedHash)
        Contract-->>Verifier: (matches == true, exists == true)
        Verifier->>Store: Persist VERIFIED Status & Timestamp
        Gateway-->>Agent: Response with Audit Reference & MST Explorer Link
    end
```

---

## 3. Product Architecture

```
SentinelMesh/
├── backend/                        # FastAPI Core API & Security Engine
│   ├── app/
│   │   ├── api/                    # REST API routers
│   │   │   ├── actions.py          # Action evaluation & gateway containment
│   │   │   ├── integrity.py        # Canonical hashing, anchoring & evidence inspector
│   │   │   ├── policies.py         # Deterministic policy catalog
│   │   │   ├── approvals.py        # Human-in-the-loop review & authorization
│   │   │   ├── threats.py          # Behavioral threat detection & lab scenarios
│   │   │   └── governance.py       # End-to-end evidence provenance
│   │   ├── blockchain/             # MST Blockchain Web3 integration
│   │   │   ├── service.py          # RPC provider, contract calls & tx signer
│   │   │   └── EvidenceRegistry.json # Contract ABI & bytecode metadata
│   │   ├── integrity/              # Canonicalization & verification engine
│   │   │   ├── canonical.py        # RFC-8785 deterministic JSON & SHA-256
│   │   │   └── verifier.py         # Independent local & on-chain verification
│   │   ├── policy_engine/          # Deterministic rule evaluator (POL-A..G)
│   │   └── database.py             # SQLAlchemy ORM (SQLite / PostgreSQL)
│   └── tests/                      # 65 automated pytest test cases
├── contracts/                      # Hardhat EVM Smart Contracts
│   ├── contracts/
│   │   ├── EvidenceRegistry.sol    # Primary MST Evidence Registry contract
│   │   └── SentinelMeshAuditAnchor.sol # Backward-compatible audit anchor
│   ├── scripts/
│   │   └── deploy.js               # Network deployment script for MST Testnet/Mainnet
│   ├── test/                       # 27 comprehensive Hardhat unit tests
│   └── hardhat.config.js           # Multi-network EVM config (MST Testnet 91562037)
├── frontend/                       # Next.js 14 Security Console (App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Security Operations Overview
│   │   │   ├── simulator/page.tsx  # Action Gateway
│   │   │   ├── policies/page.tsx   # Policy Studio
│   │   │   ├── approvals/page.tsx  # Approval Queue
│   │   │   ├── audit/page.tsx      # Audit Explorer
│   │   │   ├── integrity/page.tsx  # Integrity Center & Tamper Alerts
│   │   │   ├── blockchain/page.tsx # Blockchain Activity & Evidence Inspector
│   │   │   ├── threats/page.tsx    # Threat Intelligence Center
│   │   │   ├── governance/page.tsx # Autonomous Governance & Provenance
│   │   │   └── settings/page.tsx   # Settings & Node Diagnostics
│   │   ├── components/             # Reusable UI primitives (AppShell, Header, Sidebar)
│   │   └── lib/                    # API client & TypeScript interfaces
│   └── tailwind.config.js          # Security console design tokens
└── README.md                       # Product documentation
```

---

## 4. MST Blockchain Network Specifications

SentinelMesh is engineered for native deployment on **MST Blockchain**:

| Parameter | MST Testnet | MST Mainnet |
| :--- | :--- | :--- |
| **Network Name** | MST Testnet | MST Mainnet |
| **Chain ID** | `91562037` (`0x5752035`) | `4646` (`0x1226`) |
| **RPC Endpoint** | `https://testnetrpc.mstblockchain.com` | `https://mariorpc.mstblockchain.com/` |
| **Native Gas Token** | `tMSTC` | `MSTC` |
| **Block Explorer** | [https://testnet.mstscan.com](https://testnet.mstscan.com) | [https://mstscan.com](https://mstscan.com) |
| **Public Faucet** | [https://faucet.mstblockchain.com](https://faucet.mstblockchain.com) | N/A (Funded Mainnet Address) |
| **Contract** | `EvidenceRegistry.sol` | `EvidenceRegistry.sol` |

### Smart Contract Specification (`EvidenceRegistry.sol`)

- `recordEvidence(string evidenceId, bytes32 evidenceHash)`: Records an immutable evidence commitment with submitter and block timestamp. Prevents duplicate evidence IDs from being overwritten.
- `recordEvidenceWithPolicy(string evidenceId, bytes32 evidenceHash, bytes32 policyCommitment)`: Records evidence alongside the active policy commitment hash.
- `getEvidence(string evidenceId)`: Returns `(bytes32 evidenceHash, uint256 timestamp, uint256 blockNumber, address submitter, bytes32 policyCommitment)`.
- `verifyEvidence(string evidenceId, bytes32 expectedHash)`: Public view function returning `(bool matches, bool exists)`.
- **Backward-Compatible Interface:** Implements `anchorEvent`, `getAnchor`, and `verifyAnchor` for legacy integrations.

---

## 5. Visual Language & Design Tokens

SentinelMesh adheres to an enterprise security-console visual language:

- **Primary Workspace:** Warm off-white (`#F5F4F0`)
- **Card & Table Surfaces:** Pure white (`#FFFFFF`) with fine borders (`#D9DDE2`)
- **Navigation Rail:** Deep graphite (`#171A1F`), dark slate (`#242A32`), text (`#F5F4F0`)
- **Typography:** Sans-serif for interface text, monospace for event IDs, SHA-256 digests, and transaction hashes
- **Accents:** Restrained security blue (`#315C78`), success green (`#287653`), warning amber (`#98661C`), critical red (`#B53A3A`)
- **Responsive Layout:** Adaptive desktop navigation rail with a collapsible off-canvas mobile drawer (<1024px) for seamless usability across 360px, 768px, 1024px, and 1440px viewports.

---

## 6. Installation & Local Development

### Prerequisites

- **Python:** 3.10+ (tested on Python 3.12 / 3.14)
- **Node.js:** v18+ (tested on Node.js v24)
- **Hardhat:** v2.22+

### Step 1: Clone & Setup

```bash
git clone https://github.com/shardul-2007/SentinelMesh.git
cd SentinelMesh
```

### Step 2: Backend Setup & Testing

```powershell
# 1. Activate virtual environment
.\venv\Scripts\Activate.ps1

# 2. Run automated backend test suite (65 passing tests)
pytest -v backend/tests

# 3. Start the FastAPI backend
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

*Swagger API docs:* `http://127.0.0.1:8000/docs`

### Step 3: Smart Contract Compilation & Testing

```bash
cd contracts
npm install

# Run 27 Hardhat unit tests
npx hardhat test

# Deploy to MST Testnet (requires funded signer key in .env)
npx hardhat run scripts/deploy.js --network mstTestnet
```

### Step 4: Frontend Development Server

```bash
cd frontend
npm install

# Run TypeScript type check
npx tsc --noEmit

# Start development server
npm run dev
```

*Console URL:* `http://localhost:3000`

---

## 7. Configuration Reference (`.env.example`)

```ini
# Environment
ENV=development
APP_SECRET_KEY=change_this_to_a_secure_random_secret_in_production
ADMIN_KEY=sentinel-admin-dev-key-phase1

# Database Configuration
DATABASE_URL=sqlite:///./sentinelmesh.db
# For PostgreSQL production: postgresql://user:password@localhost:5432/sentinelmesh

# MST Blockchain Network Configuration
BLOCKCHAIN_RPC_URL=https://testnetrpc.mstblockchain.com
BLOCKCHAIN_CHAIN_ID=91562037
BLOCKCHAIN_NETWORK_NAME=MST Testnet
BLOCKCHAIN_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
BLOCKCHAIN_SIGNER_KEY=

# Explorer Configuration
MSTSCAN_EXPLORER_URL=https://testnet.mstscan.com
MST_FAUCET_URL=https://faucet.mstblockchain.com
```

---

## 8. Automated Verification & Test Results

### 1. Smart Contract Test Suite (27/27 Passing)
```
  EvidenceRegistry Contract
    Deployment & Access Control
      ✔ should set deployer as owner and initial authorized submitter
      ✔ should allow owner to revoke or grant submitter role
      ✔ should reject non-owner attempting to grant submitter role
    Evidence Recording
      ✔ should allow authorized submitter to record evidence and emit events
      ✔ should allow recording evidence with policy commitment
      ✔ should reject duplicate evidence ID recording
      ✔ should reject unauthorized callers from recording
      ✔ should reject empty evidence ID or empty hash
      ✔ should support batch recording with length matching
    Evidence Verification
      ✔ should verify matching on-chain evidence correctly
      ✔ should detect hash mismatch for tampered hash
      ✔ should return false for unrecorded evidence ID
      ✔ should support backward-compatible verifyAnchor and getAnchor calls

  SentinelMeshAuditAnchor Contract
    ... 14 tests passing ...

  27 passing (2s)
```

### 2. Backend Integration Test Suite (65/65 Passing)
```
backend/tests/test_api.py .............................. [ 46%]
backend/tests/test_approvals.py .                        [ 47%]
backend/tests/test_auth_and_reports.py ......            [ 56%]
backend/tests/test_canonical_hashing.py .......          [ 67%]
backend/tests/test_end_to_end_flow.py ..                 [ 70%]
backend/tests/test_governance_provenance.py .            [ 72%]
backend/tests/test_integrity_api.py .....                [ 80%]
backend/tests/test_integrity_verification.py ....        [ 86%]
backend/tests/test_multi_agent_incidents.py .            [ 87%]
backend/tests/test_policy_engine.py ..........           [100%]

====================== 65 passed in 5.86s ======================
```

### 3. Frontend Production Build (13/13 Routes Compiled)
```
Route (app)                              Size     First Load JS
┌ ○ /                                    6.67 kB         110 kB
├ ○ /_not-found                          873 B          88.1 kB
├ ○ /approvals                           5.54 kB        99.4 kB
├ ○ /audit                               6.13 kB         100 kB
├ ○ /blockchain                          6.97 kB         103 kB
├ ○ /governance                          7.55 kB         108 kB
├ ○ /integrity                           5.61 kB        99.4 kB
├ ○ /policies                            3.48 kB        94.4 kB
├ ○ /settings                            4.17 kB        95.1 kB
├ ○ /simulator                           6.08 kB         106 kB
└ ○ /threats                             10.5 kB         111 kB
+ First Load JS shared by all            87.3 kB
```

---

## 9. Security Boundaries & Operational Invariants

1. **Client Risk Inputs Discarded:** Client-provided risk ratings are untrusted. The backend policy engine derives risk from resource classification and operation type.
2. **Append-Only Evidence:** Neither the REST API nor the database schema expose delete or update methods for `AuditEvent` or `IntegrityRecord`.
3. **Execution Containment:** High-risk or approved actions run in an isolated execution environment; destructive host OS commands or uncontrolled network calls are strictly prevented.
4. **Offline Resilience:** If the blockchain node or network is unreachable, SentinelMesh continues operating in local verified mode and clearly reports node status as disconnected without generating fake transaction hashes.
5. **Secret Redaction:** Backend transaction submission redacts private keys from all logs, exception strings, and API responses.

---

## 10. License

Distributed under the MIT License. Copyright (c) 2026 SentinelMesh Team.
