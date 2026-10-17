const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SkillChainCredentialRegistry — Comprehensive Verification Suite", function () {
  let registry;
  let admin, issuer1, issuer2, unauthorizedUser, student1, student2;

  beforeEach(async function () {
    [admin, issuer1, issuer2, unauthorizedUser, student1, student2] = await ethers.getSigners();

    const RegistryFactory = await ethers.getContractFactory("SkillChainCredentialRegistry");
    registry = await RegistryFactory.deploy(admin.address);
    await registry.waitForDeployment();
  });

  describe("1. Authorized Issuer Registration & Access Control", function () {
    it("Admin can register an authorized institutional issuer with metadata URI", async function () {
      await expect(
        registry.registerIssuer(
          issuer1.address,
          "Massachusetts Institute of Technology",
          "https://mit.edu/credentials/v1"
        )
      )
        .to.emit(registry, "IssuerRegistered")
        .withArgs(issuer1.address, "Massachusetts Institute of Technology", "https://mit.edu/credentials/v1");

      expect(await registry.isAuthorizedIssuer(issuer1.address)).to.equal(true);

      const info = await registry.getIssuerInfo(issuer1.address);
      expect(info.institutionName).to.equal("Massachusetts Institute of Technology");
      expect(info.metadataURI).to.equal("https://mit.edu/credentials/v1");
      expect(info.isAuthorized).to.equal(true);
      expect(info.registeredAt).to.be.greaterThan(0);
    });

    it("Reverts if attempting to register zero address as an issuer", async function () {
      await expect(
        registry.registerIssuer(ethers.ZeroAddress, "Zero College", "https://zero.edu")
      ).to.be.revertedWithCustomError(registry, "ZeroAddressNotAllowed");
    });

    it("Reverts if attempting to re-register an already authorized issuer", async function () {
      await registry.registerIssuer(issuer1.address, "MIT", "https://mit.edu");
      await expect(
        registry.registerIssuer(issuer1.address, "MIT Duplicate", "https://mit.edu")
      ).to.be.revertedWithCustomError(registry, "IssuerAlreadyRegistered");
    });

    it("Unauthorized account cannot register an issuer", async function () {
      await expect(
        registry.connect(unauthorizedUser).registerIssuer(
          issuer2.address,
          "Fake University",
          "https://fake.edu"
        )
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });

    it("Admin can remove an authorized issuer", async function () {
      await registry.registerIssuer(issuer1.address, "Tech Institute", "https://tech.edu");
      expect(await registry.isAuthorizedIssuer(issuer1.address)).to.equal(true);

      await expect(registry.removeIssuer(issuer1.address))
        .to.emit(registry, "IssuerRemoved")
        .withArgs(issuer1.address);

      expect(await registry.isAuthorizedIssuer(issuer1.address)).to.equal(false);
    });

    it("Reverts if attempting to remove an issuer that is not registered", async function () {
      await expect(
        registry.removeIssuer(unauthorizedUser.address)
      ).to.be.revertedWithCustomError(registry, "IssuerNotRegistered");
    });
  });

  describe("2. Non-Transferable Identifiers & Privacy-Preserving Commitments", function () {
    const credId = ethers.keccak256(ethers.toUtf8Bytes("CRED-2026-MIT-CS-001"));
    const commitment = ethers.sha256(ethers.toUtf8Bytes("Alex Rivera|BS Computer Science|GPA 3.9|SALT_SECRET_789"));
    const typeURI = "https://skillchain.org/schemas/academic-degree/v1";

    beforeEach(async function () {
      await registry.registerIssuer(issuer1.address, "MIT", "https://mit.edu");
    });

    it("Authorized issuer can issue a verifiable credential without storing personal data", async function () {
      const tx = await registry.connect(issuer1).issueCredential(
        credId,
        commitment,
        student1.address,
        typeURI
      );

      await expect(tx)
        .to.emit(registry, "CredentialIssued")
        .withArgs(credId, commitment, issuer1.address, student1.address, typeURI, (val) => val > 0);

      const cred = await registry.getCredential(credId);
      expect(cred.status).to.equal(1); // Active
      expect(cred.commitment).to.equal(commitment);
      expect(cred.issuer).to.equal(issuer1.address);
      expect(cred.studentWallet).to.equal(student1.address);
      expect(cred.credentialTypeURI).to.equal(typeURI);
      expect(cred.revokedAt).to.equal(0);
    });

    it("Ensures credential is soulbound / non-transferable (no transfer interface, wallet locked)", async function () {
      await registry.connect(issuer1).issueCredential(credId, commitment, student1.address, typeURI);

      const cred = await registry.getCredential(credId);
      expect(cred.studentWallet).to.equal(student1.address);

      // Verify the contract has no transfer function and identity cannot be reassigned
      expect(registry.transfer).to.be.undefined;
      expect(registry.transferFrom).to.be.undefined;
    });

    it("Reverts if commitment is empty (bytes32(0))", async function () {
      await expect(
        registry.connect(issuer1).issueCredential(
          credId,
          ethers.ZeroHash,
          student1.address,
          typeURI
        )
      ).to.be.revertedWithCustomError(registry, "EmptyCommitmentNotAllowed");
    });

    it("Prevents duplicate credential issuance with the same credId", async function () {
      await registry.connect(issuer1).issueCredential(credId, commitment, student1.address, typeURI);

      await expect(
        registry.connect(issuer1).issueCredential(credId, commitment, student1.address, typeURI)
      ).to.be.revertedWithCustomError(registry, "CredentialAlreadyExists");
    });

    it("Unauthorized account cannot issue credentials", async function () {
      await expect(
        registry.connect(unauthorizedUser).issueCredential(
          credId,
          commitment,
          student1.address,
          typeURI
        )
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });
  });

  describe("3. Credential Lifecycle: Suspension, Restoration & Revocation", function () {
    const credId = ethers.keccak256(ethers.toUtf8Bytes("CRED-LIFECYCLE-001"));
    const commitment = ethers.sha256(ethers.toUtf8Bytes("Student Cert Payload with Salt"));
    const typeURI = "https://skillchain.org/schemas/skill-cert/v1";

    beforeEach(async function () {
      await registry.registerIssuer(issuer1.address, "Stanford", "https://stanford.edu");
      await registry.connect(issuer1).issueCredential(credId, commitment, student1.address, typeURI);
    });

    it("Issuer can suspend an active credential", async function () {
      await expect(
        registry.connect(issuer1).suspendCredential(credId, "Administrative audit in progress")
      )
        .to.emit(registry, "CredentialSuspended")
        .withArgs(credId, issuer1.address, "Administrative audit in progress", (t) => t > 0);

      const cred = await registry.getCredential(credId);
      expect(cred.status).to.equal(2); // Suspended
    });

    it("Issuer can restore a suspended credential back to Active", async function () {
      await registry.connect(issuer1).suspendCredential(credId, "Audit");

      await expect(registry.connect(issuer1).restoreCredential(credId))
        .to.emit(registry, "CredentialRestored")
        .withArgs(credId, issuer1.address, (t) => t > 0);

      const cred = await registry.getCredential(credId);
      expect(cred.status).to.equal(1); // Active
    });

    it("Cannot suspend a credential that is already suspended", async function () {
      await registry.connect(issuer1).suspendCredential(credId, "First suspension");
      await expect(
        registry.connect(issuer1).suspendCredential(credId, "Second suspension")
      ).to.be.revertedWithCustomError(registry, "InvalidCredentialStatus");
    });

    it("Cannot restore a credential that is already Active", async function () {
      await expect(
        registry.connect(issuer1).restoreCredential(credId)
      ).to.be.revertedWithCustomError(registry, "InvalidCredentialStatus");
    });

    it("Issuer can permanently revoke a credential", async function () {
      await expect(
        registry.connect(issuer1).revokeCredential(credId, "Academic integrity violation")
      )
        .to.emit(registry, "CredentialRevoked")
        .withArgs(credId, issuer1.address, "Academic integrity violation", (t) => t > 0);

      const cred = await registry.getCredential(credId);
      expect(cred.status).to.equal(3); // Revoked
      expect(cred.revokedAt).to.be.greaterThan(0);

      // Cannot revoke again
      await expect(
        registry.connect(issuer1).revokeCredential(credId, "Revoke again")
      ).to.be.revertedWithCustomError(registry, "InvalidCredentialStatus");

      // Cannot restore a revoked credential
      await expect(
        registry.connect(issuer1).restoreCredential(credId)
      ).to.be.revertedWithCustomError(registry, "InvalidCredentialStatus");
    });

    it("Unauthorized account cannot suspend, restore, or revoke", async function () {
      await expect(
        registry.connect(unauthorizedUser).suspendCredential(credId, "Unauthorized")
      ).to.be.revertedWithCustomError(registry, "UnauthorizedIssuer");

      await expect(
        registry.connect(unauthorizedUser).revokeCredential(credId, "Unauthorized")
      ).to.be.revertedWithCustomError(registry, "UnauthorizedIssuer");
    });

    it("Non-existent credential lookup returns status None (0)", async function () {
      const nonExistentId = ethers.keccak256(ethers.toUtf8Bytes("NON-EXISTENT"));
      const cred = await registry.getCredential(nonExistentId);
      expect(cred.status).to.equal(0); // None
    });
  });

  describe("4. Emergency Pausable Safeguards", function () {
    const credId = ethers.keccak256(ethers.toUtf8Bytes("CRED-PAUSE-001"));
    const commitment = ethers.sha256(ethers.toUtf8Bytes("Pause Test Payload"));
    const typeURI = "https://skillchain.org/schemas/degree/v1";

    beforeEach(async function () {
      await registry.registerIssuer(issuer1.address, "Harvard", "https://harvard.edu");
    });

    it("Admin can pause and unpause the registry", async function () {
      expect(await registry.paused()).to.equal(false);

      await registry.pause();
      expect(await registry.paused()).to.equal(true);

      // Operations should revert when paused
      await expect(
        registry.connect(issuer1).issueCredential(credId, commitment, student1.address, typeURI)
      ).to.be.revertedWithCustomError(registry, "EnforcedPause");

      await registry.unpause();
      expect(await registry.paused()).to.equal(false);

      // Operation succeeds after unpause
      await expect(
        registry.connect(issuer1).issueCredential(credId, commitment, student1.address, typeURI)
      ).to.emit(registry, "CredentialIssued");
    });

    it("Unauthorized caller cannot pause or unpause", async function () {
      await expect(
        registry.connect(unauthorizedUser).pause()
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });
  });
});
