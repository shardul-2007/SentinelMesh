# Phase 2 Blockchain Integration Plan

## 1. Overview
In Phase 1, SentinelMesh successfully implements deterministic policy enforcement and records audit events using SHA-256 cryptographic hash chaining in a persistent local store.

In Phase 2, this local cryptographic foundation will bridge to a public or Layer-2 EVM blockchain (e.g. Arbitrum One, Base, or Ethereum Sepolia) to achieve trustless, non-repudiable audit verification.

---

## 2. Cryptographic Foundation Ready in Phase 1

Every Phase 1 audit event already calculates:
$$\text{hash}_n = \text{SHA256}(\text{ID}_n \,\|\, \text{Timestamp}_n \,\|\, \text{Agent}_n \,\|\, \text{Action}_n \,\|\, \text{Resource}_n \,\|\, \text{Decision}_n \,\|\, \text{Policy}_n \,\|\, \text{hash}_{n-1})$$

This creates an append-only linear hash chain directly analogous to blockchain blocks.

---

## 3. Phase 2 Smart Contract Architecture

```
┌──────────────────────────────────────────────┐
│           SentinelMesh Backend Engine        │
│  (Aggregates local events into Merkle Trees) │
└──────────────────────┬───────────────────────┘
                       │ Periodic Batch Rollup (e.g. every 100 events or 1 hour)
                       ▼
┌──────────────────────────────────────────────┐
│        SentinelMeshAuditAnchor.sol           │
│  (Solidity contract on EVM L2)               │
│                                              │
│  - commitBatch(bytes32 merkleRoot, ...)      │
│  - verifyEvent(bytes32 leaf, bytes32[] proof)│
│  - registeredAgents (Agent governance)       │
└──────────────────────┬───────────────────────┘
                       │ Event Emitted on-chain
                       ▼
┌──────────────────────────────────────────────┐
│           Decentralized Block Explorer       │
│  (Any third party can independently verify   │
│   tamper-evidence without trusting server)   │
└──────────────────────────────────────────────┘
```

### 3.1 Proposed Solidity Smart Contract Interface
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SentinelMeshAuditAnchor {
    address public securityOfficer;
    
    struct AuditBatch {
        bytes32 merkleRoot;
        uint256 startTimestamp;
        uint256 endTimestamp;
        uint256 eventCount;
        uint256 blockNumber;
    }

    AuditBatch[] public batches;
    mapping(bytes32 => bool) public anchoredRoots;

    event AuditBatchCommitted(
        uint256 indexed batchId,
        bytes32 indexed merkleRoot,
        uint256 eventCount,
        uint256 timestamp
    );

    function commitBatch(
        bytes32 merkleRoot,
        uint256 startTimestamp,
        uint256 endTimestamp,
        uint256 eventCount
    ) external returns (uint256 batchId) {
        // Only authorized security officer or decentralized sequencer
        batches.push(AuditBatch({
            merkleRoot: merkleRoot,
            startTimestamp: startTimestamp,
            endTimestamp: endTimestamp,
            eventCount: eventCount,
            blockNumber: block.number
        }));
        anchoredRoots[merkleRoot] = true;
        batchId = batches.length - 1;
        emit AuditBatchCommitted(batchId, merkleRoot, eventCount, block.timestamp);
    }

    function verifyEventProof(
        bytes32 leaf,
        bytes32[] calldata proof,
        bytes32 root
    ) external pure returns (bool) {
        require(anchoredRoots[root], "Unknown root");
        return MerkleProof.verify(proof, root, leaf);
    }
}
```

---

## 4. Why Application-Level Immutability Alone Is Insufficient
Application-level database constraints (e.g. removing edit/delete endpoints) prevent unauthorized users from tampering with records through the UI. However:
- A privileged database administrator could alter rows directly on disk.
- A compromised host server could silently rewrite historical records.

By publishing Merkle roots of audit batches to an immutable, decentralized ledger, any historical modification by an administrator or rogue attacker would cause the Merkle root to diverge, creating mathematically indisputable proof of tampering.
