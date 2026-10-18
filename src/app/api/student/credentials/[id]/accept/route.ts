import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { walletAddress } = body;

    const user = await getCurrentUser();

    // Look up credential
    const credential = await prisma.credential.findFirst({
      where: {
        OR: [{ id: id }, { credId: id }],
      },
      include: {
        organization: true,
        studentProfile: { include: { user: true } },
      },
    });

    if (!credential) {
      return NextResponse.json({ error: "Credential record not found" }, { status: 404 });
    }

    if (credential.status !== "INITIATED" && credential.status !== "OFFERED") {
      return NextResponse.json(
        { error: `Cannot accept credential in ${credential.status} status.` },
        { status: 400 }
      );
    }

    const boundAddress = (walletAddress || user?.walletAddress || "0x90F79bf6EB2c4f870365E785982E1f101E93b906").toLowerCase();

    // Update credential to STUDENT_ACCEPTED
    const updated = await prisma.credential.update({
      where: { id: credential.id },
      data: {
        status: "STUDENT_ACCEPTED",
        statusEvents: {
          create: {
            previousStatus: credential.status,
            newStatus: "STUDENT_ACCEPTED",
            actorId: user?.id || null,
            reason: `Student reviewed details and accepted degree conferral using MetaMask wallet (${boundAddress}). Awaiting college final soulbound seal.`,
          },
        },
      },
    });

    // Update user wallet address
    if (credential.studentProfile?.user?.id) {
      await prisma.user.update({
        where: { id: credential.studentProfile.user.id },
        data: { walletAddress: boundAddress },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user?.id || null,
        organizationId: credential.organizationId,
        action: "DEGREE_ACCEPTED_BY_STUDENT",
        entityType: "CREDENTIAL",
        entityId: credential.id,
        detailsJson: JSON.stringify({
          credId: credential.credId,
          title: credential.title,
          studentWallet: boundAddress,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      credential: updated,
      message: "Degree proposal accepted! College has been notified to confer the permanent soulbound seal.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
