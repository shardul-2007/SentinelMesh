const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SentinelMeshAuditAnchor Contract", function () {
  let anchorContract;
  let owner;
  let authorizedSigner;
  let unauthorizedUser;

  const sampleEventId = "evt_demo_test_001";
  // 32-byte hash
  const sampleEventHash = ethers.keccak256(ethers.toUtf8Bytes("canonical-audit-payload-001"));
  const alteredHash = ethers.keccak256(ethers.toUtf8Bytes("tampered-audit-payload-001"));

  beforeEach(async function () {
    [owner, authorizedSigner, unauthorizedUser] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("SentinelMeshAuditAnchor");
    anchorContract = await Factory.deploy();
    await anchorContract.waitForDeployment();

    // Authorize authorizedSigner
    await anchorContract.setAuthorizedAnchorer(authorizedSigner.address, true);
  });

  describe("Deployment & Access Control", function () {
    it("should set deployer as owner and initial authorized anchorer", async function () {
      expect(await anchorContract.owner()).to.equal(owner.address);
      expect(await anchorContract.authorizedAnchorers(owner.address)).to.be.true;
      expect(await anchorContract.authorizedAnchorers(authorizedSigner.address)).to.be.true;
      expect(await anchorContract.authorizedAnchorers(unauthorizedUser.address)).to.be.false;
    });

    it("should allow owner to revoke or grant anchorer role", async function () {
      await anchorContract.setAuthorizedAnchorer(authorizedSigner.address, false);
      expect(await anchorContract.authorizedAnchorers(authorizedSigner.address)).to.be.false;
    });

    it("should reject non-owner attempting to grant anchorer role", async function () {
      await expect(
        anchorContract.connect(unauthorizedUser).setAuthorizedAnchorer(unauthorizedUser.address, true)
      ).to.be.revertedWithCustomError(anchorContract, "UnauthorizedCaller");
    });
  });

  describe("Audit Hash Anchoring", function () {
    it("should allow owner to anchor an event hash and emit EventAnchored", async function () {
      const tx = await anchorContract.anchorEvent(sampleEventId, sampleEventHash);
      const receipt = await tx.wait();

      // Verify event was emitted
      await expect(tx)
        .to.emit(anchorContract, "EventAnchored")
        .withArgs(sampleEventId, sampleEventHash, owner.address, (val) => val > 0, receipt.blockNumber);

      // Verify anchor retrieval
      const anchor = await anchorContract.getAnchor(sampleEventId);
      expect(anchor.eventHash).to.equal(sampleEventHash);
      expect(anchor.submitter).to.equal(owner.address);
      expect(anchor.blockNumber).to.equal(receipt.blockNumber);
    });

    it("should allow authorized signer to anchor an event hash", async function () {
      await expect(
        anchorContract.connect(authorizedSigner).anchorEvent("evt_from_authorized", sampleEventHash)
      ).to.emit(anchorContract, "EventAnchored");
    });

    it("should reject unauthorized caller attempting to anchor", async function () {
      await expect(
        anchorContract.connect(unauthorizedUser).anchorEvent(sampleEventId, sampleEventHash)
      ).to.be.revertedWithCustomError(anchorContract, "UnauthorizedCaller");
    });

    it("should reject duplicate anchor for the same event ID (Immutable)", async function () {
      await anchorContract.anchorEvent(sampleEventId, sampleEventHash);

      // Attempting to overwrite with another hash must revert
      await expect(
        anchorContract.anchorEvent(sampleEventId, alteredHash)
      ).to.be.revertedWithCustomError(anchorContract, "AlreadyAnchored");
    });

    it("should reject empty event ID or zero hash", async function () {
      await expect(
        anchorContract.anchorEvent("", sampleEventHash)
      ).to.be.revertedWithCustomError(anchorContract, "EmptyEventId");

      await expect(
        anchorContract.anchorEvent(sampleEventId, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(anchorContract, "EmptyEventHash");
    });
  });

  describe("Public Verification", function () {
    beforeEach(async function () {
      await anchorContract.anchorEvent(sampleEventId, sampleEventHash);
    });

    it("should return (true, true) when verifying the exact anchored hash", async function () {
      const [matches, exists] = await anchorContract.verifyAnchor(sampleEventId, sampleEventHash);
      expect(matches).to.be.true;
      expect(exists).to.be.true;
    });

    it("should return (false, true) when verifying an altered hash (Tamper Detection)", async function () {
      const [matches, exists] = await anchorContract.verifyAnchor(sampleEventId, alteredHash);
      expect(matches).to.be.false;
      expect(exists).to.be.true;
    });

    it("should return (false, false) for non-existent event ID", async function () {
      const [matches, exists] = await anchorContract.verifyAnchor("non_existent_evt", sampleEventHash);
      expect(matches).to.be.false;
      expect(exists).to.be.false;
    });

    it("should revert getAnchor for non-existent event ID", async function () {
      await expect(
        anchorContract.getAnchor("non_existent_evt")
      ).to.be.revertedWithCustomError(anchorContract, "AnchorNotFound");
    });
  });

  describe("Batch Anchoring", function () {
    it("should anchor multiple events in a single transaction", async function () {
      const ids = ["evt_batch_1", "evt_batch_2"];
      const hashes = [
        ethers.keccak256(ethers.toUtf8Bytes("payload-1")),
        ethers.keccak256(ethers.toUtf8Bytes("payload-2")),
      ];

      await expect(anchorContract.anchorEventBatch(ids, hashes))
        .to.emit(anchorContract, "EventAnchored");

      const [m1] = await anchorContract.verifyAnchor(ids[0], hashes[0]);
      const [m2] = await anchorContract.verifyAnchor(ids[1], hashes[1]);
      expect(m1).to.be.true;
      expect(m2).to.be.true;
    });

    it("should revert if array lengths mismatch", async function () {
      await expect(
        anchorContract.anchorEventBatch(["evt_1"], [sampleEventHash, alteredHash])
      ).to.be.revertedWithCustomError(anchorContract, "ArrayLengthMismatch");
    });
  });
});
