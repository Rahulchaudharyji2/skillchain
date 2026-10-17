import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
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

    const txHash = "0x" + crypto.randomBytes(32).toString("hex");

    const updated = await prisma.credential.update({
      where: { id },
      data: {
        status: newStatus,
        revocationReason: action === "REVOKE" ? reason : undefined,
        statusEvents: {
          create: [
            {
              previousStatus: credential.status,
              newStatus,
              actorId: user.id,
              reason: reason || `Status changed to ${newStatus}`,
              txHash,
            },
          ],
        },
      },
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
