import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PROCTOR_ANOMALY_THRESHOLD = 2; // More than 2 events queues for human review

export async function POST(req: NextRequest) {
  try {
    const { attemptId, eventType, metadata } = await req.json();

    if (!attemptId || !eventType) {
      return NextResponse.json({ error: "attemptId and eventType are required." }, { status: 400 });
    }

    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        proctoringEvents: true,
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    // 1. Record the proctoring audit event
    const event = await prisma.proctoringEvent.create({
      data: {
        attemptId,
        eventType,
        metadata: JSON.stringify(metadata || {}),
        timestamp: new Date(),
      },
    });

    // 2. Count anomaly events (excluding initial consent)
    const anomalyCount =
      attempt.proctoringEvents.filter((e) => e.eventType !== "CONSENT_GRANTED").length + 1;

    // 3. If anomaly count exceeds threshold, flag for HUMAN REVIEW.
    // POLICY GUARANTEE: Never automatically treat proctoring flags as proof of cheating.
    // The candidate is NOT disqualified; their attempt simply queues for human assessor sign-off.
    let isFlaggedForReview = false;
    if (anomalyCount >= PROCTOR_ANOMALY_THRESHOLD && attempt.status === "IN_PROGRESS") {
      isFlaggedForReview = true;
      await prisma.assessmentAttempt.update({
        where: { id: attemptId },
        data: {
          status: "FLAGGED",
        },
      });
    }

    return NextResponse.json({
      success: true,
      eventId: event.id,
      anomalyCount,
      requiresHumanReview: isFlaggedForReview,
      advisory: isFlaggedForReview
        ? "Activity noted. An assessor will verify your session after submission. You are NOT disqualified."
        : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
