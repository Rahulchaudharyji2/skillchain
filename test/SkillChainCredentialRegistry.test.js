const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SkillChainCredentialRegistry", function () {
  let registry;
  let admin, issuer1, issuer2, unauthorizedUser, student1, student2;

  beforeEach(async function () {
    [admin, issuer1, issuer2, unauthorizedUser, student1, student2] = await ethers.getSigners();

    const RegistryFactory = await ethers.getContractFactory("SkillChainCredentialRegistry");
    registry = await RegistryFactory.deploy(admin.address);
    await registry.waitForDeployment();
  });

  describe("Issuer Management", function () {
    it("Admin can register an authorized issuer", async function () {
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
  });

  describe("Credential Issuance & Integrity", function () {
    const credId = ethers.keccak256(ethers.toUtf8Bytes("CRED-2026-MIT-CS-001"));
    const commitment = ethers.sha256(ethers.toUtf8Bytes("Alex Rivera|BS Computer Science|GPA 3.9|SALT_SECRET_789"));
    const typeURI = "https://skillchain.org/schemas/academic-degree/v1";

    beforeEach(async function () {
      await registry.registerIssuer(issuer1.address, "MIT", "https://mit.edu");
    });

    it("Authorized issuer can issue a verifiable credential", async function () {
      await expect(
        registry.connect(issuer1).issueCredential(
          credId,
          commitment,
          student1.address,
          typeURI
        )
      )
        .to.emit(registry, "CredentialIssued")
        .withArgs(credId, commitment, issuer1.address, student1.address, typeURI, (val) => val > 0);

      const cred = await registry.getCredential(credId);
      expect(cred.status).to.equal(1); // Active
      expect(cred.commitment).to.equal(commitment);
      expect(cred.issuer).to.equal(issuer1.address);
      expect(cred.studentWallet).to.equal(student1.address);
      expect(cred.credentialTypeURI).to.equal(typeURI);
    });

    it("Unauthorized caller cannot issue credentials", async function () {
      await expect(
        registry.connect(unauthorizedUser).issueCredential(
          credId,
          commitment,
          student1.address,
          typeURI
        )
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });

    it("Prevents duplicate credential issuance with same ID", async function () {
      await registry.connect(issuer1).issueCredential(credId, commitment, student1.address, typeURI);

      await expect(
        registry.connect(issuer1).issueCredential(credId, commitment, student1.address, typeURI)
      ).to.be.revertedWithCustomError(registry, "CredentialAlreadyExists");
    });
  });

  describe("Credential Lifecycle: Suspension, Restoration & Revocation", function () {
    const credId = ethers.keccak256(ethers.toUtf8Bytes("CRED-LIFECYCLE-001"));
    const commitment = ethers.sha256(ethers.toUtf8Bytes("Student Cert Payload"));
    const typeURI = "https://skillchain.org/schemas/skill-cert/v1";

    beforeEach(async function () {
      await registry.registerIssuer(issuer1.address, "Stanford", "https://stanford.edu");
      await registry.connect(issuer1).issueCredential(credId, commitment, student1.address, typeURI);
    });

    it("Issuer can suspend and restore a credential", async function () {
      // Suspend
      await expect(registry.connect(issuer1).suspendCredential(credId, "Administrative audit in progress"))
        .to.emit(registry, "CredentialSuspended");

      let cred = await registry.getCredential(credId);
      expect(cred.status).to.equal(2); // Suspended

      // Restore
      await expect(registry.connect(issuer1).restoreCredential(credId))
        .to.emit(registry, "CredentialRestored");

      cred = await registry.getCredential(credId);
      expect(cred.status).to.equal(1); // Active
    });

    it("Issuer can permanently revoke a credential", async function () {
      await expect(registry.connect(issuer1).revokeCredential(credId, "Academic integrity violation"))
        .to.emit(registry, "CredentialRevoked");

      const cred = await registry.getCredential(credId);
      expect(cred.status).to.equal(3); // Revoked
      expect(cred.revokedAt).to.be.greaterThan(0);

      // Cannot revoke again or restore
      await expect(
        registry.connect(issuer1).revokeCredential(credId, "Revoke again")
      ).to.be.revertedWithCustomError(registry, "InvalidCredentialStatus");
    });

    it("Unauthorized user cannot modify credential status", async function () {
      await expect(
        registry.connect(unauthorizedUser).revokeCredential(credId, "Malicious attempt")
      ).to.be.revertedWithCustomError(registry, "UnauthorizedIssuer");
    });
  });
});
