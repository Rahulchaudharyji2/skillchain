import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { AttemptRunnerClient } from "./AttemptRunnerClient";
import { calculateAttemptExpiry } from "@/lib/assessments/timer";

interface AttemptPageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function AttemptPage({ params }: AttemptPageProps) {
  const { attemptId } = await params;
  const user = await getCurrentUser();

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: {
        include: {
          questions: {
            select: {
              id: true,
              type: true,
              questionText: true,
              optionsJson: true,
              starterCode: true,
              language: true,
              points: true,
              explanation: true,
              // Notice: testCases are intentionally NOT selected to prevent student inspection
            },
          },
        },
      },
      submissions: true,
      proctoringEvents: true,
      assessmentResult: true,
    },
  });

  if (!attempt) {
    notFound();
  }

  const expiresAt =
    attempt.expiresAt ||
    calculateAttemptExpiry(attempt.startedAt, attempt.assessment.durationMinutes);

  return (
    <AttemptRunnerClient
      attemptId={attempt.id}
      initialStatus={attempt.status}
      initialScore={attempt.score}
      initialPassed={attempt.passed}
      durationMinutes={attempt.assessment.durationMinutes}
      assessmentTitle={attempt.assessment.title}
      assessmentVersion={attempt.version}
      passingThreshold={attempt.assessment.passingThreshold}
      questions={attempt.assessment.questions}
      existingSubmissions={attempt.submissions}
      proctoringEventsCount={attempt.proctoringEvents.filter((e) => e.eventType !== "CONSENT_GRANTED").length}
      initialConsentGiven={attempt.consentGiven}
      expiresAtIso={expiresAt.toISOString()}
      feedback={attempt.assessmentResult?.feedback || null}
      credentialId={attempt.assessmentResult?.credentialId || null}
    />
  );
}
