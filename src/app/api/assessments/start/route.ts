import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { calculateAttemptExpiry } from "@/lib/assessments/timer";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized: Please log in." }, { status: 401 });
    }

    const { assessmentId, consentGiven } = await req.json();
    if (!assessmentId) {
      return NextResponse.json({ error: "Assessment ID is required." }, { status: 400 });
    }

    // Require explicit consent before starting any proctored assessment
    if (consentGiven !== true) {
      return NextResponse.json(
        {
          error: "CONSENT_REQUIRED",
          message: "Explicit consent for integrity monitoring is required before beginning this assessment.",
        },
        { status: 400 }
      );
    }

    const profile = await prisma.studentProfile.findFirst({
      where: {
        OR: [{ userId: user.id }, { user: { email: user.email } }],
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Student profile not found." }, { status: 404 });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment || !assessment.isActive) {
      return NextResponse.json({ error: "Assessment not found or inactive." }, { status: 404 });
    }

    // 1. Check for active IN_PROGRESS attempt (Resume existing attempt)
    const existingInProgress = await prisma.assessmentAttempt.findFirst({
      where: {
        assessmentId,
        studentProfileId: profile.id,
        status: "IN_PROGRESS",
      },
    });

    if (existingInProgress) {
      const expiresAt = existingInProgress.expiresAt || calculateAttemptExpiry(existingInProgress.startedAt, assessment.durationMinutes);
      const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));

      return NextResponse.json({
        success: true,
        attemptId: existingInProgress.id,
        resumed: true,
        expiresAt: expiresAt.toISOString(),
        serverTime: new Date().toISOString(),
        remainingSeconds,
        version: existingInProgress.version,
      });
    }

    // 2. Fetch all historical attempts for this student on this assessment
    const pastAttempts = await prisma.assessmentAttempt.findMany({
      where: {
        assessmentId,
        studentProfileId: profile.id,
      },
      orderBy: { startedAt: "desc" },
    });

    // 3. Check if already passed and verified
    const passedAttempt = pastAttempts.find((a) => a.passed && a.status === "GRADED");
    if (passedAttempt) {
      return NextResponse.json(
        {
          error: "ALREADY_PASSED",
          message: "You have already passed this assessment and earned your verified skill credential.",
          attemptId: passedAttempt.id,
        },
        { status: 400 }
      );
    }

    // 4. Check Attempt Limits (Temporarily bypassed for testing mode)
    // const maxAllowed = assessment.maxAttempts || 3;
    // if (pastAttempts.length >= maxAllowed) {
    //   return NextResponse.json(
    //     {
    //       error: "ATTEMPT_LIMIT_EXCEEDED",
    //       message: `You have reached the maximum limit of ${maxAllowed} attempts for this assessment.`,
    //       attemptsUsed: pastAttempts.length,
    //       maxAllowed,
    //     },
    //     { status: 403 }
    //   );
    // }

    // 5. Check Cooldown Period between attempts (Temporarily disabled as requested)
    // const cooldownHours = assessment.cooldownHours || 24;
    // const latestAttempt = pastAttempts[0];
    // if (latestAttempt && latestAttempt.completedAt) {
    //   const cooldownMs = cooldownHours * 60 * 60 * 1000;
    //   const elapsedMs = Date.now() - latestAttempt.completedAt.getTime();
    //   if (elapsedMs < cooldownMs) {
    //     const remainingHours = Math.ceil((cooldownMs - elapsedMs) / (60 * 60 * 1000));
    //     return NextResponse.json(
    //       {
    //         error: "COOLDOWN_ACTIVE",
    //         message: `A cooldown period of ${cooldownHours}h is required between attempts. Please retry in ${remainingHours} hour(s).`,
    //         remainingHours,
    //         cooldownHours,
    //       },
    //       { status: 429 }
    //     );
    //   }
    // }

    // 6. Create new attempt with Authoritative Timer and Version snapshot
    const now = new Date();
    const expiresAt = calculateAttemptExpiry(now, assessment.durationMinutes);

    const attempt = await prisma.assessmentAttempt.create({
      data: {
        assessmentId,
        studentProfileId: profile.id,
        status: "IN_PROGRESS",
        startedAt: now,
        expiresAt,
        version: assessment.version,
        consentGiven: true,
      },
    });

    // Record initial Consent Event
    await prisma.proctoringEvent.create({
      data: {
        attemptId: attempt.id,
        eventType: "CONSENT_GRANTED",
        metadata: JSON.stringify({
          userAgent: req.headers.get("user-agent"),
          ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
          consentedAt: now.toISOString(),
        }),
        timestamp: now,
      },
    });

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      resumed: false,
      expiresAt: expiresAt.toISOString(),
      serverTime: now.toISOString(),
      remainingSeconds: assessment.durationMinutes * 60,
      version: attempt.version,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
