import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { ShieldAlert, BookOpenCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReviewConsoleClient } from "./ReviewConsoleClient";

export default async function AdminAssessmentReviewsPage() {
  const user = await getCurrentUser();

  const flaggedAttempts = await prisma.assessmentAttempt.findMany({
    where: {
      OR: [
        { status: "FLAGGED" },
        { reviews: { some: {} } },
      ],
    },
    include: {
      assessment: {
        include: {
          skills: { include: { skill: true } },
        },
      },
      studentProfile: {
        include: {
          user: true,
        },
      },
      proctoringEvents: {
        orderBy: { timestamp: "asc" },
      },
      submissions: {
        include: { question: true },
      },
      reviews: {
        include: {
          reviewer: true,
        },
        orderBy: { resolvedAt: "desc" },
      },
      assessmentResult: true,
    },
    orderBy: { startedAt: "desc" },
  });

  const serialized = flaggedAttempts.map((a) => ({
    id: a.id,
    assessmentTitle: a.assessment.title,
    assessmentVersion: a.version,
    passingThreshold: a.assessment.passingThreshold,
    candidateName: a.studentProfile.user.name,
    candidateEmail: a.studentProfile.user.email,
    status: a.status,
    score: a.score,
    passed: a.passed,
    startedAt: a.startedAt.toISOString(),
    submittedAt: a.submittedAt ? a.submittedAt.toISOString() : null,
    proctoringEvents: a.proctoringEvents.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      metadata: e.metadata,
      timestamp: e.timestamp.toISOString(),
    })),
    submissions: a.submissions.map((s) => ({
      questionText: s.question.questionText,
      type: s.question.type,
      studentAnswer: s.studentAnswer,
      codeSolution: s.codeSolution,
      scoreEarned: s.scoreEarned,
      passedTestCases: s.passedTestCases,
      totalTestCases: s.totalTestCases,
    })),
    reviews: a.reviews.map((r) => ({
      id: r.id,
      decision: r.decision,
      comments: r.comments,
      reviewerName: r.reviewer.name,
      resolvedAt: r.resolvedAt.toISOString(),
    })),
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/assessments"
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-forest-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Assessment Bank</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Integrity & Proctoring Assurance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
            Human Assessor Review Queue
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            Proctoring flags are strictly non-disqualifying signals. Human assessors verify session audit logs, inspecting candidate code and context before approving credential issuance or confirming violations.
          </p>
        </div>
      </div>

      <ReviewConsoleClient initialAttempts={serialized} />
    </div>
  );
}
