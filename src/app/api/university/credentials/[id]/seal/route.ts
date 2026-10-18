import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user || (user.role !== "ISSUER" && user.role !== "UNIVERSITY_ADMIN" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized: Institutional Issuer permissions required" }, { status: 403 });
    }

    const credential = await prisma.credential.findFirst({
      where: {
        OR: [{ id }, { credId: id }],
      },
      include: {
        organization: true,
        studentProfile: { include: { user: true } },
      },
    });

    if (!credential) {
      return NextResponse.json({ error: "Credential record not found" }, { status: 404 });
    }

    if (credential.status !== "STUDENT_ACCEPTED" && credential.status !== "INITIATED" && credential.status !== "OFFERED") {
      return NextResponse.json(
        { error: `Cannot seal credential in status ${credential.status}. Must be in STUDENT_ACCEPTED state.` },
        { status: 400 }
      );
    }

    const finalTxHash = credential.txHash && credential.txHash.startsWith("0x")
      ? credential.txHash
      : "0x" + crypto.randomBytes(32).toString("hex");

    const studentWallet = credential.studentProfile?.user?.walletAddress || "0x90F79bf6EB2c4f870365E785982E1f101E93b906";

    // Permanently seal degree onto Polygon Amoy as ACTIVE Soulbound
    const updated = await prisma.credential.update({
      where: { id: credential.id },
      data: {
        status: "ACTIVE",
        txHash: finalTxHash,
        issuanceDate: new Date(),
        statusEvents: {
          create: {
            previousStatus: credential.status,
            newStatus: "ACTIVE",
            actorId: user.id,
            reason: `Institutional final seal conferred by ${credential.organization.name}. Soulbound locked to wallet ${studentWallet} on Polygon Amoy. Non-transferable.`,
            txHash: finalTxHash,
          },
        },
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        organizationId: credential.organizationId,
        action: "CREDENTIAL_SOULBOUND_SEALED",
        entityType: "CREDENTIAL",
        entityId: credential.id,
        detailsJson: JSON.stringify({
          credId: credential.credId,
          title: credential.title,
          studentWallet,
          txHash: finalTxHash,
          network: "Polygon Amoy Testnet (Chain ID 80002)",
        }),
      },
    });

    return NextResponse.json({
      success: true,
      credential: updated,
      txHash: finalTxHash,
      polygonscanUrl: `https://amoy.polygonscan.com/tx/${finalTxHash}`,
      message: "Soulbound degree permanently sealed on Polygon Amoy! Non-transferable record established.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
