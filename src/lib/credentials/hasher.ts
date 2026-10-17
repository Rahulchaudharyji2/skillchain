import crypto from "crypto";

export interface VerifiableCredentialPayload {
  issuer: {
    name: string;
    domain: string;
    address: string;
  };
  recipient: {
    name: string;
    walletAddress?: string | null;
  };
  credential: {
    title: string;
    type: string;
    degreeName?: string | null;
    fieldOfStudy?: string | null;
    grade?: string | null;
    issuanceDate: string;
    expirationDate?: string | null;
  };
  salt: string;
}

/**
 * Generates an immutable SHA-256 cryptographic commitment from the W3C credential payload
 */
export function generateCredentialCommitment(payload: VerifiableCredentialPayload): string {
  const normalizedString = JSON.stringify({
    issuer: payload.issuer,
    recipient: {
      name: payload.recipient.name,
      walletAddress: payload.recipient.walletAddress?.toLowerCase() || null,
    },
    credential: payload.credential,
    salt: payload.salt,
  });

  const hash = crypto.createHash("sha256").update(normalizedString).digest("hex");
  return `0x${hash}`;
}

/**
 * Verifies that a credential payload matches its published commitment
 */
export function verifyCredentialIntegrity(
  payload: VerifiableCredentialPayload,
  expectedCommitment: string
): boolean {
  const calculated = generateCredentialCommitment(payload);
  return calculated.toLowerCase() === expectedCommitment.toLowerCase();
}

/**
 * Generates a random cryptographic salt for commitment hashing
 */
export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Generates an opaque 32-byte credential identifier for on-chain storage
 */
export function generateCredentialId(): string {
  return `0x${crypto.randomBytes(32).toString("hex")}`;
}
