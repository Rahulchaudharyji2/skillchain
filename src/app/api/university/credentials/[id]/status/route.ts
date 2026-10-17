import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { submitCredentialStatusChangeOnChain } from "@/lib/blockchain/client";
import { enqueueBlockchainJob } from "@/lib/blockchain/retries";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ISSUER" && user.role !== "UNIVERSITY_ADMIN" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const { action, reason } = await req.json();

    const credential = await prisma.credential.findUnique({
      where: { id },
    });

    if (!credential) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    let newStatus = credential.status;
    if (action === "SUSPEND") newStatus = "SUSPENDED";
    else if (action === "RESTORE") newStatus = "ACTIVE";
    else if (action === "REVOKE") newStatus = "REVOKED";

    // Submit on-chain status mutation via Viem to Polygon Amoy
    const { txHash, simulated } = await submitCredentialStatusChangeOnChain({
      credId: credential.credId as `0x${string}`,
      action,
      reason,
    });

    const updated = await prisma.credential.update({
      where: { id },
      data: {
        status: newStatus,
        txHash,
        revocationReason: action === "REVOKE" ? reason : undefined,
        statusEvents: {
          create: [
            {
              previousStatus: credential.status,
              newStatus,
              actorId: user.id,
              reason: reason || `Status changed to ${newStatus}${simulated ? " (Polygon Amoy simulated node)" : ""}`,
              txHash,
            },
          ],
        },
      },
    });

    // Enqueue background tracking job
    await enqueueBlockchainJob("BLOCKCHAIN_CONFIRM", {
      credentialId: credential.id,
      credIdHex: credential.credId as `0x${string}`,
      commitment: credential.commitment as `0x${string}`,
      credentialTypeURI: "https://skillchain.org/schemas/academic-degree/v1",
      action,
      reason,
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: `CREDENTIAL_${action}`,
        entityType: "Credential",
        entityId: credential.id,
        detailsJson: JSON.stringify({ previousStatus: credential.status, newStatus, reason, txHash }),
      },
    });

    return NextResponse.json({ success: true, updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
