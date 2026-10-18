import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "RECRUITER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized: Recruiter session required" }, { status: 403 });
    }

    const { studentProfileId } = await req.json();
    if (!studentProfileId) {
      return NextResponse.json({ error: "studentProfileId is required" }, { status: 400 });
    }

    // Resolve recruiter's organization
    let orgId = user.organization?.id;
    if (!orgId) {
      const recruiterMembership = await prisma.organizationMember.findFirst({
        where: { userId: user.id },
        include: { organization: true },
      });
      orgId = recruiterMembership?.organizationId;
    }

    if (!orgId) {
      // Fallback: pick first employer organization (e.g. Stripe)
      const defaultOrg = await prisma.organization.findFirst({
        where: { type: "EMPLOYER" },
      });
      orgId = defaultOrg?.id;
    }

    if (!orgId) {
      return NextResponse.json({ error: "Recruiter organization not found" }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return NextResponse.json({ error: "Organization record not found" }, { status: 404 });
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: { user: true },
    });

    if (!studentProfile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // Check if already unlocked
    const existingUnlock = await prisma.profileUnlock.findUnique({
      where: {
        organizationId_studentProfileId: {
          organizationId: org.id,
          studentProfileId: studentProfile.id,
        },
      },
    });

    if (existingUnlock) {
      return NextResponse.json({
        success: true,
        alreadyUnlocked: true,
        message: "Candidate profile already unlocked.",
        organizationTokenBalance: org.tokenBalance,
        studentTokenBalance: studentProfile.tokenBalance,
      });
    }

    // Verify sufficient tokens (5 required: 3 to platform treasury, 2 to student)
    const REQUIRED_TOKENS = 5;
    const PLATFORM_TOKENS = 3;
    const STUDENT_TOKENS = 2;

    if (org.tokenBalance < REQUIRED_TOKENS) {
      return NextResponse.json(
        {
          error: `Insufficient token balance. You need ${REQUIRED_TOKENS} tokens (Current balance: ${org.tokenBalance}).`,
          requiredTokens: REQUIRED_TOKENS,
          currentBalance: org.tokenBalance,
        },
        { status: 400 }
      );
    }

    // Execute atomic token transfer:
    // 1. Deduct 5 tokens from organization
    // 2. Credit 2 tokens to student profile
    // 3. Keep 3 tokens for platform treasury (retained)
    // 4. Create ProfileUnlock record
    // 5. Create notification for student
    const result = await prisma.$transaction(async (tx) => {
      const updatedOrg = await tx.organization.update({
        where: { id: org.id },
        data: {
          tokenBalance: { decrement: REQUIRED_TOKENS },
        },
      });

      const updatedStudent = await tx.studentProfile.update({
        where: { id: studentProfile.id },
        data: {
          tokenBalance: { increment: STUDENT_TOKENS },
        },
      });

      const unlock = await tx.profileUnlock.create({
        data: {
          organizationId: org.id,
          studentProfileId: studentProfile.id,
          platformTokens: PLATFORM_TOKENS,
          studentTokens: STUDENT_TOKENS,
        },
      });

      // Notify student of received tokens
      await tx.notification.create({
        data: {
          userId: studentProfile.userId,
          title: "Profile Unlocked & Tokens Credited!",
          message: `${org.name} paid 5 tokens to view your full verified profile. 2 tokens have been directly credited to your student wallet!`,
          type: "SYSTEM",
          linkUrl: "/student/profile",
        },
      });

      return {
        unlock,
        updatedOrg,
        updatedStudent,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Profile successfully unlocked! 3 tokens routed to SkillChain treasury, 2 tokens credited to ${studentProfile.user.name}.`,
      unlockId: result.unlock.id,
      organizationTokenBalance: result.updatedOrg.tokenBalance,
      studentTokenBalance: result.updatedStudent.tokenBalance,
      platformTokensRetained: PLATFORM_TOKENS,
      studentTokensReceived: STUDENT_TOKENS,
    });
  } catch (err: any) {
    console.error("Profile unlock error:", err);
    return NextResponse.json({ error: err.message || "Failed to unlock profile" }, { status: 500 });
  }
}
