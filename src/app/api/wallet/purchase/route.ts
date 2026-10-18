import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized: Login required" }, { status: 401 });
    }

    const { amount, purpose = "TOKEN_PURCHASE" } = await req.json();
    const tokenAmount = parseInt(amount, 10);

    if (isNaN(tokenAmount) || tokenAmount <= 0) {
      return NextResponse.json({ error: "Invalid token amount specified" }, { status: 400 });
    }

    // Determine target balance: Organization (Employer / University) or Student
    if (user.role === "RECRUITER" || user.role === "ISSUER" || user.role === "UNIVERSITY_ADMIN") {
      let orgId = user.organization?.id;
      if (!orgId) {
        const mem = await prisma.organizationMember.findFirst({
          where: { userId: user.id },
        });
        orgId = mem?.organizationId;
      }

      if (!orgId) {
        // Fallback to first organization matching user type
        const fallbackOrg = await prisma.organization.findFirst({
          where: {
            type: user.role === "RECRUITER" ? "EMPLOYER" : "UNIVERSITY",
          },
        });
        orgId = fallbackOrg?.id;
      }

      if (!orgId) {
        return NextResponse.json({ error: "Organization record not found" }, { status: 404 });
      }

      const updatedOrg = await prisma.organization.update({
        where: { id: orgId },
        data: {
          tokenBalance: { increment: tokenAmount },
        },
      });

      // Record payment entry
      await prisma.payment.create({
        data: {
          organizationId: orgId,
          amount: tokenAmount * 1.0, // $1 per token
          currency: "USD",
          status: "COMPLETED",
          providerReference: `tok_${Date.now()}`,
          purpose: purpose || "HR_TOKEN_PURCHASE",
        },
      });

      return NextResponse.json({
        success: true,
        entityType: "ORGANIZATION",
        tokenBalance: updatedOrg.tokenBalance,
        purchasedTokens: tokenAmount,
        message: `Successfully purchased ${tokenAmount} tokens! New balance: ${updatedOrg.tokenBalance} Tokens.`,
      });
    }

    // Student Wallet top up
    if (user.role === "STUDENT" || user.studentProfile) {
      const studentProfileId = user.studentProfile?.id;
      let targetProfile = null;

      if (studentProfileId) {
        targetProfile = await prisma.studentProfile.findUnique({
          where: { id: studentProfileId },
        });
      } else {
        targetProfile = await prisma.studentProfile.findFirst({
          where: { userId: user.id },
        });
      }

      if (!targetProfile) {
        return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
      }

      const updatedProfile = await prisma.studentProfile.update({
        where: { id: targetProfile.id },
        data: {
          tokenBalance: { increment: tokenAmount },
        },
      });

      return NextResponse.json({
        success: true,
        entityType: "STUDENT",
        tokenBalance: updatedProfile.tokenBalance,
        purchasedTokens: tokenAmount,
        message: `Successfully added ${tokenAmount} tokens to student wallet! New balance: ${updatedProfile.tokenBalance} Tokens.`,
      });
    }

    return NextResponse.json({ error: "Unsupported role for token purchase" }, { status: 400 });
  } catch (err: any) {
    console.error("Token purchase error:", err);
    return NextResponse.json({ error: err.message || "Failed to process token purchase" }, { status: 500 });
  }
}
