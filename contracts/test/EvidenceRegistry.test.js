const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EvidenceRegistry Contract", function () {
  let registry;
  let owner;
  let authorizedSigner;
  let unauthorizedUser;

  const sampleEvidenceId = "evt_evidence_001";
  const sampleEvidenceHash = ethers.keccak256(ethers.toUtf8Bytes("canonical-evidence-payload-001"));
  const samplePolicyCommitment = ethers.keccak256(ethers.toUtf8Bytes("policy-v1.2.0-spec"));
  const alteredHash = ethers.keccak256(ethers.toUtf8Bytes("tampered-evidence-payload-001"));

  beforeEach(async function () {
    [owner, authorizedSigner, unauthorizedUser] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("EvidenceRegistry");
    registry = await Factory.deploy();
    await registry.waitForDeployment();

    // Authorize authorizedSigner
    await registry.setAuthorizedSubmitter(authorizedSigner.address, true);
  });

  describe("Deployment & Access Control", function () {
    it("should set deployer as owner and initial authorized submitter", async function () {
      expect(await registry.owner()).to.equal(owner.address);
      expect(await registry.authorizedSubmitters(owner.address)).to.be.true;
      expect(await registry.authorizedSubmitters(authorizedSigner.address)).to.be.true;
      expect(await registry.authorizedSubmitters(unauthorizedUser.address)).to.be.false;
    });

    it("should allow owner to revoke or grant submitter role", async function () {
      await registry.setAuthorizedSubmitter(authorizedSigner.address, false);
      expect(await registry.authorizedSubmitters(authorizedSigner.address)).to.be.false;
    });

    it("should reject non-owner attempting to grant submitter role", async function () {
      await expect(
        registry.connect(unauthorizedUser).setAuthorizedSubmitter(unauthorizedUser.address, true)
      ).to.be.revertedWithCustomError(registry, "UnauthorizedCaller");
    });
  });

  describe("Evidence Recording", function () {
    it("should allow authorized submitter to record evidence and emit events", async function () {
      const tx = await registry.connect(authorizedSigner).recordEvidence(sampleEvidenceId, sampleEvidenceHash);
      const receipt = await tx.wait();

      await expect(tx)
        .to.emit(registry, "EvidenceRecorded")
        .withArgs(sampleEvidenceId, sampleEvidenceHash, authorizedSigner.address, (val) => val > 0, receipt.blockNumber);

      expect(await registry.evidenceExists(sampleEvidenceId)).to.be.true;

      const record = await registry.getEvidence(sampleEvidenceId);
      expect(record.evidenceHash).to.equal(sampleEvidenceHash);
      expect(record.submitter).to.equal(authorizedSigner.address);
      expect(record.blockNumber).to.equal(receipt.blockNumber);
    });

    it("should allow recording evidence with policy commitment", async function () {
      const tx = await registry.recordEvidenceWithPolicy(
        sampleEvidenceId,
        sampleEvidenceHash,
        samplePolicyCommitment
      );
      const receipt = await tx.wait();

      await expect(tx)
        .to.emit(registry, "EvidenceRecordedWithPolicy")
        .withArgs(
          sampleEvidenceId,
          sampleEvidenceHash,
          samplePolicyCommitment,
          owner.address,
          (val) => val > 0,
          receipt.blockNumber
        );

      const record = await registry.getEvidence(sampleEvidenceId);
      expect(record.evidenceHash).to.equal(sampleEvidenceHash);
      expect(record.policyCommitment).to.equal(samplePolicyCommitment);
    });

    it("should reject duplicate evidence ID recording", async function () {
      await registry.recordEvidence(sampleEvidenceId, sampleEvidenceHash);

      await expect(
        registry.recordEvidence(sampleEvidenceId, sampleEvidenceHash)
      ).to.be.revertedWithCustomError(registry, "AlreadyRecorded");
    });

    it("should reject unauthorized callers from recording", async function () {
      await expect(
        registry.connect(unauthorizedUser).recordEvidence(sampleEvidenceId, sampleEvidenceHash)
      ).to.be.revertedWithCustomError(registry, "UnauthorizedCaller");
    });

    it("should reject empty evidence ID or empty hash", async function () {
      await expect(
        registry.recordEvidence("", sampleEvidenceHash)
      ).to.be.revertedWithCustomError(registry, "EmptyEvidenceId");

      await expect(
        registry.recordEvidence(sampleEvidenceId, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(registry, "EmptyEvidenceHash");
    });

    it("should support batch recording with length matching", async function () {
      const ids = ["evt_batch_1", "evt_batch_2"];
      const hashes = [
        ethers.keccak256(ethers.toUtf8Bytes("b1")),
        ethers.keccak256(ethers.toUtf8Bytes("b2"))
      ];

      await registry.recordEvidenceBatch(ids, hashes);
      expect(await registry.evidenceExists("evt_batch_1")).to.be.true;
      expect(await registry.evidenceExists("evt_batch_2")).to.be.true;

      await expect(
        registry.recordEvidenceBatch(["evt_batch_3"], hashes)
      ).to.be.revertedWithCustomError(registry, "ArrayLengthMismatch");
    });
  });

  describe("Evidence Verification", function () {
    beforeEach(async function () {
      await registry.recordEvidence(sampleEvidenceId, sampleEvidenceHash);
    });

    it("should verify matching on-chain evidence correctly", async function () {
      const [matches, exists] = await registry.verifyEvidence(sampleEvidenceId, sampleEvidenceHash);
      expect(matches).to.be.true;
      expect(exists).to.be.true;
    });

    it("should detect hash mismatch for tampered hash", async function () {
      const [matches, exists] = await registry.verifyEvidence(sampleEvidenceId, alteredHash);
      expect(matches).to.be.false;
      expect(exists).to.be.true;
    });

    it("should return false for unrecorded evidence ID", async function () {
      const [matches, exists] = await registry.verifyEvidence("evt_non_existent", sampleEvidenceHash);
      expect(matches).to.be.false;
      expect(exists).to.be.false;
    });

    it("should support backward-compatible verifyAnchor and getAnchor calls", async function () {
      const [matches, exists] = await registry.verifyAnchor(sampleEvidenceId, sampleEvidenceHash);
      expect(matches).to.be.true;
      expect(exists).to.be.true;

      const anchor = await registry.getAnchor(sampleEvidenceId);
      expect(anchor.eventHash).to.equal(sampleEvidenceHash);
    });
  });
});
