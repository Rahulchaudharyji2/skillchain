import { type Hex } from "viem";
import { prisma } from "@/lib/prisma";
import { publicClient, REGISTRY_CONTRACT_ADDRESS } from "./client";

export interface TransactionTrackingResult {
  txHash: string;
  status: "CONFIRMED" | "FAILED" | "PENDING";
  blockNumber?: number;
  gasUsed?: string;
  error?: string;
}

/**
 * Tracks an on-chain transaction on Polygon Amoy testnet.
 * Waits for transaction receipt, records block confirmation,
 * updates the database Credential status and logs a CredentialStatusEvent.
 */
export async function trackCredentialTransaction(
  txHash: Hex,
  credentialId: string,
  targetStatus: "ACTIVE" | "SUSPENDED" | "REVOKED",
  actorId?: string,
  statusReason?: string
): Promise<TransactionTrackingResult> {
  try {
    // 1. Fetch current credential from database
    const credential = await prisma.credential.findFirst({
      where: {
        OR: [{ id: credentialId }, { credId: credentialId }],
      },
    });

    if (!credential) {
      return {
        txHash,
        status: "FAILED",
        error: `Credential record not found for ID ${credentialId}`,
      };
    }

    // 2. Poll for transaction receipt using Viem
    let receipt;
    try {
      receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1,
        timeout: 45_000, // 45 seconds timeout
      });
    } catch (pollErr: unknown) {
      // In simulated test mode or RPC timeout, log and retain pending/submitted
      console.warn(`Receipt wait timed out or simulated for tx ${txHash}:`, (pollErr as Error)?.message);
      return {
        txHash,
        status: "PENDING",
        error: (pollErr as Error)?.message,
      };
    }

    const isSuccess = receipt.status === "success";
    const newStatus = isSuccess ? targetStatus : "FAILED";
    const blockNum = Number(receipt.blockNumber);
    const gasUsed = receipt.gasUsed.toString();

    // 3. Update Credential and record CredentialStatusEvent
    await prisma.credential.update({
      where: { id: credential.id },
      data: {
        status: newStatus,
        txHash,
        blockNumber: blockNum,
        statusEvents: {
          create: [
            {
              previousStatus: credential.status,
              newStatus,
              actorId: actorId || null,
              reason: statusReason || `Transaction confirmed on-chain in block #${blockNum}`,
              txHash,
            },
          ],
        },
      },
    });

    // 4. Record Audit Log
    await prisma.auditLog.create({
      data: {
        userId: actorId || null,
        organizationId: credential.organizationId,
        action: `TRANSACTION_CONFIRMED_${targetStatus}`,
        entityType: "Credential",
        entityId: credential.id,
        detailsJson: JSON.stringify({
          txHash,
          blockNumber: blockNum,
          gasUsed,
          contractAddress: REGISTRY_CONTRACT_ADDRESS,
          status: newStatus,
        }),
      },
    });

    return {
      txHash,
      status: isSuccess ? "CONFIRMED" : "FAILED",
      blockNumber: blockNum,
      gasUsed,
    };
  } catch (err: unknown) {
    const errorMsg = (err as Error)?.message || "Unknown error tracking transaction";
    return {
      txHash,
      status: "FAILED",
      error: errorMsg,
    };
  }
}
