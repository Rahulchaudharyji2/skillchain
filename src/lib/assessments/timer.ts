/**
 * Authoritative Server-Side Timer Engine for SkillChain Assessments.
 * Prevents client-side manipulation, tab pauses, or client clock drift.
 */

export const DEFAULT_GRACE_PERIOD_SECONDS = 30; // 30-second network buffer

export function calculateAttemptExpiry(startedAt: Date, durationMinutes: number): Date {
  return new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
}

export function evaluateAttemptTimer(
  startedAt: Date,
  durationMinutes: number,
  submissionTime: Date = new Date(),
  gracePeriodSeconds: number = DEFAULT_GRACE_PERIOD_SECONDS
): {
  isExpired: boolean;
  expiresAt: Date;
  secondsRemaining: number;
  secondsOverdue: number;
} {
  const expiresAt = calculateAttemptExpiry(startedAt, durationMinutes);
  const deadlineWithGrace = new Date(expiresAt.getTime() + gracePeriodSeconds * 1000);

  const diffMs = expiresAt.getTime() - submissionTime.getTime();
  const secondsRemaining = Math.max(0, Math.floor(diffMs / 1000));

  const isExpired = submissionTime.getTime() > deadlineWithGrace.getTime();
  const secondsOverdue = isExpired
    ? Math.floor((submissionTime.getTime() - expiresAt.getTime()) / 1000)
    : 0;

  return {
    isExpired,
    expiresAt,
    secondsRemaining,
    secondsOverdue,
  };
}
