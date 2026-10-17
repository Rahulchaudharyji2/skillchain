import { describe, it, expect, vi } from "vitest";
import { executeWithSafeRetry } from "@/lib/blockchain/retries";
import {
  generateCredentialCommitment,
  verifyCredentialIntegrity,
  generateCredentialId,
  generateSalt,
  type VerifiableCredentialPayload,
} from "@/lib/credentials/hasher";
import { isHex } from "viem";

describe("SkillChain Blockchain & Credential Service Tests", () => {
  describe("1. Privacy-Preserving Commitments & Non-Transferable Identifiers", () => {
    it("Generates a unique 32-byte non-transferable credential identifier", () => {
      const id1 = generateCredentialId();
      const id2 = generateCredentialId();

      expect(id1).toMatch(/^0x[a-f0-9]{64}$/);
      expect(id2).toMatch(/^0x[a-f0-9]{64}$/);
      expect(id1).not.toBe(id2);
      expect(isHex(id1)).toBe(true);
    });

    it("Generates privacy-preserving SHA-256 commitment without publishing student PII", () => {
      const salt = generateSalt();
      const payload: VerifiableCredentialPayload = {
        issuer: {
          name: "MIT",
          domain: "mit.edu",
          address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        },
        recipient: {
          name: "Alex Rivera",
          walletAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        },
        credential: {
          title: "Bachelor of Science in Computer Science",
          type: "DEGREE",
          degreeName: "B.S.",
          fieldOfStudy: "Computer Science",
          grade: "Summa Cum Laude",
          issuanceDate: "2026-05-15T00:00:00.000Z",
        },
        salt,
      };

      const commitment = generateCredentialCommitment(payload);
      expect(commitment).toMatch(/^0x[a-f0-9]{64}$/);
      expect(commitment).not.toContain("Alex Rivera");
      expect(commitment).not.toContain("Summa Cum Laude");

      // Verify integrity
      expect(verifyCredentialIntegrity(payload, commitment)).toBe(true);

      // Tampering detection
      const tampered = { ...payload, recipient: { ...payload.recipient, name: "Attacker Name" } };
      expect(verifyCredentialIntegrity(tampered, commitment)).toBe(false);
    });
  });

  describe("2. Safe Retries with Exponential Backoff", () => {
    it("Succeeds on first attempt without retrying", async () => {
      const mockOp = vi.fn().mockResolvedValue("SUCCESS");
      const result = await executeWithSafeRetry(mockOp, { maxRetries: 3, initialDelayMs: 10 });

      expect(result).toBe("SUCCESS");
      expect(mockOp).toHaveBeenCalledTimes(1);
    });

    it("Retries on failure and succeeds if subsequent attempt resolves", async () => {
      const mockOp = vi
        .fn()
        .mockRejectedValueOnce(new Error("Transient RPC Error"))
        .mockResolvedValueOnce("RECOVERED");

      const result = await executeWithSafeRetry(mockOp, {
        maxRetries: 3,
        initialDelayMs: 10,
        backoffFactor: 1.5,
      });

      expect(result).toBe("RECOVERED");
      expect(mockOp).toHaveBeenCalledTimes(2);
    });

    it("Throws the final error after reaching maxRetries", async () => {
      const mockOp = vi.fn().mockRejectedValue(new Error("Persistent RPC 429 Rate Limit"));

      await expect(
        executeWithSafeRetry(mockOp, { maxRetries: 3, initialDelayMs: 10 })
      ).rejects.toThrow("Persistent RPC 429 Rate Limit");

      expect(mockOp).toHaveBeenCalledTimes(3);
    });
  });
});
