// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SentinelMeshAuditAnchor
 * @notice Immutable, cryptographically verifiable anchoring of SentinelMesh AI agent audit hashes.
 * @dev Anchors a 32-byte SHA-256 event digest associated with an event ID. 
 *      Never stores sensitive event payloads on-chain.
 */
contract SentinelMeshAuditAnchor {
    address public owner;

    struct AnchorRecord {
        bytes32 eventHash;
        uint64 timestamp;
        uint64 blockNumber;
        address submitter;
        bool exists;
    }

    // Mapping from event ID string to its immutable AnchorRecord
    mapping(string => AnchorRecord) private anchors;
    // Authorized anchorers map (authorized automated backend signers)
    mapping(address => bool) public authorizedAnchorers;

    // Custom errors for clarity and gas efficiency
    error UnauthorizedCaller(address caller);
    error EmptyEventId();
    error EmptyEventHash();
    error AlreadyAnchored(string eventId, bytes32 existingHash);
    error AnchorNotFound(string eventId);
    error ArrayLengthMismatch();

    // Events emitted for off-chain indexing and receipt validation
    event EventAnchored(
        string indexed eventId,
        bytes32 indexed eventHash,
        address indexed submitter,
        uint256 timestamp,
        uint256 blockNumber
    );

    event AnchorerUpdated(address indexed anchorer, bool isAuthorized);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert UnauthorizedCaller(msg.sender);
        }
        _;
    }

    modifier onlyAuthorized() {
        if (msg.sender != owner && !authorizedAnchorers[msg.sender]) {
            revert UnauthorizedCaller(msg.sender);
        }
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedAnchorers[msg.sender] = true;
        emit OwnershipTransferred(address(0), msg.sender);
        emit AnchorerUpdated(msg.sender, true);
    }

    /**
     * @notice Anchor an audit event's canonical SHA-256 hash.
     * @param eventId Unique identifier of the audit event (e.g. evt_...).
     * @param eventHash 32-byte SHA-256 digest of the canonicalized audit event.
     */
    function anchorEvent(string calldata eventId, bytes32 eventHash) external onlyAuthorized {
        if (bytes(eventId).length == 0) revert EmptyEventId();
        if (eventHash == bytes32(0)) revert EmptyEventHash();
        
        AnchorRecord storage record = anchors[eventId];
        if (record.exists) {
            revert AlreadyAnchored(eventId, record.eventHash);
        }

        record.eventHash = eventHash;
        record.timestamp = uint64(block.timestamp);
        record.blockNumber = uint64(block.number);
        record.submitter = msg.sender;
        record.exists = true;

        emit EventAnchored(eventId, eventHash, msg.sender, block.timestamp, block.number);
    }

    /**
     * @notice Batch anchor multiple audit hashes in a single transaction.
     */
    function anchorEventBatch(
        string[] calldata eventIds,
        bytes32[] calldata eventHashes
    ) external onlyAuthorized {
        if (eventIds.length != eventHashes.length) revert ArrayLengthMismatch();
        
        for (uint256 i = 0; i < eventIds.length; i++) {
            string calldata eventId = eventIds[i];
            bytes32 eventHash = eventHashes[i];

            if (bytes(eventId).length == 0) revert EmptyEventId();
            if (eventHash == bytes32(0)) revert EmptyEventHash();

            AnchorRecord storage record = anchors[eventId];
            if (record.exists) {
                revert AlreadyAnchored(eventId, record.eventHash);
            }

            record.eventHash = eventHash;
            record.timestamp = uint64(block.timestamp);
            record.blockNumber = uint64(block.number);
            record.submitter = msg.sender;
            record.exists = true;

            emit EventAnchored(eventId, eventHash, msg.sender, block.timestamp, block.number);
        }
    }

    /**
     * @notice Retrieve an anchored event record.
     */
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
        AnchorRecord storage record = anchors[eventId];
        if (!record.exists) {
            revert AnchorNotFound(eventId);
        }
        return (record.eventHash, record.timestamp, record.blockNumber, record.submitter);
    }

    /**
     * @notice Public verification endpoint.
     * @return matches True if on-chain hash matches expectedHash.
     * @return exists True if an anchor exists for this eventId.
     */
    function verifyAnchor(string calldata eventId, bytes32 expectedHash)
        external
        view
        returns (bool matches, bool exists)
    {
        AnchorRecord storage record = anchors[eventId];
        if (!record.exists) {
            return (false, false);
        }
        return (record.eventHash == expectedHash, true);
    }

    /**
     * @notice Manage authorized automated anchorer addresses.
     */
    function setAuthorizedAnchorer(address anchorer, bool status) external onlyOwner {
        authorizedAnchorers[anchorer] = status;
        emit AnchorerUpdated(anchorer, status);
    }

    /**
     * @notice Transfer contract ownership.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert UnauthorizedCaller(address(0));
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}
