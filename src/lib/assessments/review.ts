import { prisma } from "@/lib/prisma";
import { issueSkillCredentialAfterChecks } from "./credentials";

export interface ReviewSubmissionPayload {
  attemptId: string;
  reviewerId: string;
  decision: "APPROVED" | "REJECTED" | "DISMISSED";
  comments: string;
}

export interface FlaggedAttemptSummary {
  id: string;
  assessmentTitle: string;
  candidateName: string;
  candidateEmail: string;
  score: number | null;
  status: string;
  startedAt: Date;
  submittedAt: Date | null;
  proctoringEventsCount: number;
  proctoringEvents: {
    eventType: string;
    timestamp: Date;
    metadata: string | null;
  }[];
  reviews: {
    decision: string;
    comments: string;
    reviewerName: string;
    resolvedAt: Date;
  }[];
}

/**
 * Retrieve all assessment attempts flagged for human integrity review.
 * NEVER treats proctoring flags as automated proof of cheating.
 */
export async function getFlaggedAttempts(): Promise<FlaggedAttemptSummary[]> {
  const attempts = await prisma.assessmentAttempt.findMany({
    where: {
      OR: [
        { status: "FLAGGED" },
        { proctoringEvents: { some: { eventType: { not: "CONSENT_GRANTED" } } } },
      ],
    },
    include: {
      assessment: { select: { title: true } },
      studentProfile: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
      proctoringEvents: {
        orderBy: { timestamp: "asc" },
      },
      reviews: {
        include: {
          reviewer: { select: { name: true } },
        },
        orderBy: { resolvedAt: "desc" },
      },
    },
    orderBy: { startedAt: "desc" },
  });

  return attempts.map((a) => ({
    id: a.id,
    assessmentTitle: a.assessment.title,
    candidateName: a.studentProfile.user.name,
    candidateEmail: a.studentProfile.user.email,
    score: a.score,
    status: a.status,
    startedAt: a.startedAt,
    submittedAt: a.submittedAt,
    proctoringEventsCount: a.proctoringEvents.filter((e) => e.eventType !== "CONSENT_GRANTED").length,
    proctoringEvents: a.proctoringEvents.map((e) => ({
      eventType: e.eventType,
      timestamp: e.timestamp,
      metadata: e.metadata,
    })),
    reviews: a.reviews.map((r) => ({
      decision: r.decision,
      comments: r.comments,
      reviewerName: r.reviewer.name,
      resolvedAt: r.resolvedAt,
    })),
  }));
}

/**
 * Process a human assessor's authoritative review decision on a flagged attempt.
 */
export async function submitAssessmentReview(payload: ReviewSubmissionPayload) {
  const { attemptId, reviewerId, decision, comments } = payload;

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: true,
      studentProfile: { include: { user: true } },
      assessmentResult: true,
    },
  });

  if (!attempt) {
    throw new Error("Assessment attempt not found.");
  }

  // Record the human assessor's review decision
  const review = await prisma.assessmentReview.create({
    data: {
      attemptId,
      reviewerId,
      decision,
      comments,
      resolvedAt: new Date(),
    },
  });

  let credentialIssuanceResult = null;

  if (decision === "APPROVED") {
    // Human assessor confirmed the activity was non-malicious (e.g., dual monitor, system notification)
    await prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: { status: "GRADED" },
    });

    // If candidate met the passing threshold, issue the verified skill credential
    if (attempt.passed) {
      credentialIssuanceResult = await issueSkillCredentialAfterChecks(attemptId, reviewerId);
    }

    await prisma.notification.create({
      data: {
        userId: attempt.studentProfile.userId,
        title: "Assessment Review Completed: Approved",
        message: `Your assessment submission for "${attempt.assessment.title}" has been reviewed and approved by an assessor. Notes: ${comments}`,
        type: "ASSESSMENT",
        linkUrl: `/student/attempts/${attemptId}`,
      },
    });
  } else if (decision === "REJECTED") {
    // Assessor confirmed integrity violation
    await prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: "REJECTED",
        passed: false,
      },
    });

    if (attempt.assessmentResult) {
      await prisma.assessmentResult.update({
        where: { attemptId },
        data: {
          verifiedSkillIssued: false,
          feedback: `Integrity review decision: REJECTED. Assessor notes: ${comments}`,
        },
      });
    }

    await prisma.notification.create({
      data: {
        userId: attempt.studentProfile.userId,
        title: "Assessment Review Completed: Disqualified",
        message: `Your assessment submission for "${attempt.assessment.title}" was reviewed and disqualified due to academic integrity violation. Notes: ${comments}`,
        type: "ASSESSMENT",
        linkUrl: `/student/attempts/${attemptId}`,
      },
    });
  } else {
    // Dismissed - return to graded without credential unless passed
    await prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: { status: "GRADED" },
    });
  }

  // Audit log of the human review
  await prisma.auditLog.create({
    data: {
      userId: reviewerId,
      action: `ASSESSMENT_REVIEW_${decision}`,
      entityType: "AssessmentAttempt",
      entityId: attemptId,
      detailsJson: JSON.stringify({
        decision,
        comments,
        attemptId,
        score: attempt.score,
        credentialIssued: credentialIssuanceResult?.success || false,
      }),
    },
  });

  return {
    success: true,
    reviewId: review.id,
    decision,
    credentialIssuanceResult,
  };
}
