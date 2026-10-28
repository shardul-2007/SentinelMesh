// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EvidenceRegistry
 * @notice Immutable, cryptographically verifiable anchoring of SentinelMesh AI agent audit evidence on MST Blockchain.
 * @dev Anchors a 32-byte SHA-256 canonical digest and optional policy commitment associated with an evidence ID.
 *      Never stores sensitive event payloads on-chain.
 */
contract EvidenceRegistry {
    address public owner;

    struct EvidenceRecord {
        bytes32 evidenceHash;
        bytes32 policyCommitment;
        uint64 timestamp;
        uint64 blockNumber;
        address submitter;
        bool exists;
    }

    // Mapping from evidence ID string to its immutable EvidenceRecord
    mapping(string => EvidenceRecord) private registry;
    // Authorized submitters map (authorized automated backend signers / operators)
    mapping(address => bool) public authorizedSubmitters;

    // Custom errors for gas efficiency and clear reverts
    error UnauthorizedCaller(address caller);
    error EmptyEvidenceId();
    error EmptyEvidenceHash();
    error AlreadyRecorded(string evidenceId, bytes32 existingHash);
    error EvidenceNotFound(string evidenceId);
    error ArrayLengthMismatch();

    // Events emitted for off-chain indexing, receipt validation, and block exploration
    event EvidenceRecorded(
        string indexed evidenceId,
        bytes32 indexed evidenceHash,
        address indexed submitter,
        uint256 timestamp,
        uint256 blockNumber
    );

    event EvidenceRecordedWithPolicy(
        string indexed evidenceId,
        bytes32 indexed evidenceHash,
        bytes32 policyCommitment,
        address indexed submitter,
        uint256 timestamp,
        uint256 blockNumber
    );

    // Backward compatibility event for existing listeners
    event EventAnchored(
        string indexed eventId,
        bytes32 indexed eventHash,
        address indexed submitter,
        uint256 timestamp,
        uint256 blockNumber
    );

    event SubmitterAuthorized(address indexed submitter, bool isAuthorized);
    event AnchorerUpdated(address indexed anchorer, bool isAuthorized);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert UnauthorizedCaller(msg.sender);
        }
        _;
    }

    modifier onlyAuthorized() {
        if (msg.sender != owner && !authorizedSubmitters[msg.sender]) {
            revert UnauthorizedCaller(msg.sender);
        }
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedSubmitters[msg.sender] = true;
        emit OwnershipTransferred(address(0), msg.sender);
        emit SubmitterAuthorized(msg.sender, true);
        emit AnchorerUpdated(msg.sender, true);
    }

    /**
     * @notice Record a canonical evidence SHA-256 hash.
     * @param evidenceId Unique identifier of the audit event / evidence (e.g. evt_...).
     * @param evidenceHash 32-byte SHA-256 digest of the canonicalized evidence document.
     */
    function recordEvidence(string calldata evidenceId, bytes32 evidenceHash) public onlyAuthorized {
        if (bytes(evidenceId).length == 0) revert EmptyEvidenceId();
        if (evidenceHash == bytes32(0)) revert EmptyEvidenceHash();

        EvidenceRecord storage record = registry[evidenceId];
        if (record.exists) {
            revert AlreadyRecorded(evidenceId, record.evidenceHash);
        }

        record.evidenceHash = evidenceHash;
        record.policyCommitment = bytes32(0);
        record.timestamp = uint64(block.timestamp);
        record.blockNumber = uint64(block.number);
        record.submitter = msg.sender;
        record.exists = true;

        emit EvidenceRecorded(evidenceId, evidenceHash, msg.sender, block.timestamp, block.number);
        emit EventAnchored(evidenceId, evidenceHash, msg.sender, block.timestamp, block.number);
    }

    /**
     * @notice Record evidence along with its governing policy commitment.
     * @param evidenceId Unique identifier of the audit evidence.
     * @param evidenceHash 32-byte SHA-256 digest of canonical evidence.
     * @param policyCommitment 32-byte hash of the governing policy version.
     */
    function recordEvidenceWithPolicy(
        string calldata evidenceId,
        bytes32 evidenceHash,
        bytes32 policyCommitment
    ) external onlyAuthorized {
        if (bytes(evidenceId).length == 0) revert EmptyEvidenceId();
        if (evidenceHash == bytes32(0)) revert EmptyEvidenceHash();

        EvidenceRecord storage record = registry[evidenceId];
        if (record.exists) {
            revert AlreadyRecorded(evidenceId, record.evidenceHash);
        }

        record.evidenceHash = evidenceHash;
        record.policyCommitment = policyCommitment;
        record.timestamp = uint64(block.timestamp);
        record.blockNumber = uint64(block.number);
        record.submitter = msg.sender;
        record.exists = true;

        emit EvidenceRecordedWithPolicy(
            evidenceId,
            evidenceHash,
            policyCommitment,
            msg.sender,
            block.timestamp,
            block.number
        );
        emit EventAnchored(evidenceId, evidenceHash, msg.sender, block.timestamp, block.number);
    }

    /**
     * @notice Batch record multiple evidence records in a single transaction.
     */
    function recordEvidenceBatch(
        string[] calldata evidenceIds,
        bytes32[] calldata evidenceHashes
    ) external onlyAuthorized {
        if (evidenceIds.length != evidenceHashes.length) revert ArrayLengthMismatch();

        for (uint256 i = 0; i < evidenceIds.length; i++) {
            recordEvidence(evidenceIds[i], evidenceHashes[i]);
        }
    }

    /**
     * @notice Retrieve an anchored evidence record.
     */
    function getEvidence(string calldata evidenceId)
        external
        view
        returns (
            bytes32 evidenceHash,
            bytes32 policyCommitment,
            uint256 timestamp,
            uint256 blockNumber,
            address submitter
        )
    {
        EvidenceRecord storage record = registry[evidenceId];
        if (!record.exists) {
            revert EvidenceNotFound(evidenceId);
        }
        return (
            record.evidenceHash,
            record.policyCommitment,
            record.timestamp,
            record.blockNumber,
            record.submitter
        );
    }

    /**
     * @notice Check whether evidence exists.
     */
    function evidenceExists(string calldata evidenceId) external view returns (bool) {
        return registry[evidenceId].exists;
    }

    /**
     * @notice Public verification endpoint.
     * @return matches True if on-chain hash matches expectedHash.
     * @return exists True if an evidence record exists for this evidenceId.
     */
    function verifyEvidence(string calldata evidenceId, bytes32 expectedHash)
        public
        view
        returns (bool matches, bool exists)
    {
        EvidenceRecord storage record = registry[evidenceId];
        if (!record.exists) {
            return (false, false);
        }
        return (record.evidenceHash == expectedHash, true);
    }

    // =========================================================================
    // Backward Compatibility Interfaces (for existing SentinelMesh clients)
    // =========================================================================

    function anchorEvent(string calldata eventId, bytes32 eventHash) external onlyAuthorized {
        recordEvidence(eventId, eventHash);
    }

    function anchorEventBatch(
        string[] calldata eventIds,
        bytes32[] calldata eventHashes
    ) external onlyAuthorized {
        if (eventIds.length != eventHashes.length) revert ArrayLengthMismatch();
        for (uint256 i = 0; i < eventIds.length; i++) {
            recordEvidence(eventIds[i], eventHashes[i]);
        }
    }

    function getAnchor(string calldata eventId)
        external
        view
        returns (
            bytes32 eventHash,
            uint256 timestamp,
            uint256 blockNumber,
            address submitter
        )
    {
        EvidenceRecord storage record = registry[eventId];
        if (!record.exists) {
            revert EvidenceNotFound(eventId);
        }
        return (record.evidenceHash, record.timestamp, record.blockNumber, record.submitter);
    }

    function verifyAnchor(string calldata eventId, bytes32 expectedHash)
        external
        view
        returns (bool matches, bool exists)
    {
        return verifyEvidence(eventId, expectedHash);
    }

    function authorizedAnchorers(address anchorer) external view returns (bool) {
        return authorizedSubmitters[anchorer];
    }

    function setAuthorizedAnchorer(address anchorer, bool status) external onlyOwner {
        authorizedSubmitters[anchorer] = status;
        emit SubmitterAuthorized(anchorer, status);
        emit AnchorerUpdated(anchorer, status);
    }

    // =========================================================================
    // Access Control Management
    // =========================================================================

    function setAuthorizedSubmitter(address submitter, bool status) external onlyOwner {
        authorizedSubmitters[submitter] = status;
        emit SubmitterAuthorized(submitter, status);
        emit AnchorerUpdated(submitter, status);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert UnauthorizedCaller(address(0));
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}
