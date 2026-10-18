import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gradeAssessmentAttempt } from "@/lib/assessments/scoring";
import { evaluateAttemptTimer } from "@/lib/assessments/timer";
import { issueSkillCredentialAfterChecks } from "@/lib/assessments/credentials";

export async function POST(req: NextRequest) {
  try {
    const { attemptId, answers, forcedStatus, disqualificationReason } = await req.json();

    if (!attemptId || !answers) {
      return NextResponse.json({ error: "attemptId and answers are required." }, { status: 400 });
    }

    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: {
            questions: {
              include: { testCases: true },
            },
            skills: { include: { skill: true } },
          },
        },
        studentProfile: true,
        proctoringEvents: true,
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    if (attempt.status === "GRADED" && attempt.completedAt) {
      return NextResponse.json(
        { error: "Attempt has already been finalized and graded." },
        { status: 400 }
      );
    }

    // 1. Authoritative Timer Validation
    const now = new Date();
    const timerEval = evaluateAttemptTimer(
      attempt.startedAt,
      attempt.assessment.durationMinutes,
      now
    );

    let isOvertime = false;
    if (timerEval.isExpired) {
      isOvertime = true;
      // Record authoritative timeout event
      await prisma.proctoringEvent.create({
        data: {
          attemptId: attempt.id,
          eventType: "TIMEOUT",
          metadata: JSON.stringify({
            secondsOverdue: timerEval.secondsOverdue,
            submittedAt: now.toISOString(),
            expiresAt: timerEval.expiresAt.toISOString(),
          }),
          timestamp: now,
        },
      });
    }

    // 2. Server-Side Scoring of All Questions
    const grading = await gradeAssessmentAttempt(
      attempt.assessment.questions.map((q) => ({
        id: q.id,
        type: q.type,
        points: q.points,
        correctAnswersJson: q.correctAnswersJson,
        starterCode: q.starterCode,
        language: q.language,
        testCases: q.testCases.map((tc) => ({
          id: tc.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden,
          weight: tc.weight,
        })),
      })),
      answers,
      attempt.assessment.passingThreshold
    );

    // 3. Persist Submissions
    for (const qr of grading.questionResults) {
      await prisma.submission.create({
        data: {
          attemptId: attempt.id,
          questionId: qr.questionId,
          studentAnswer: qr.studentAnswer || null,
          codeSolution: qr.codeSolution || null,
          language: qr.language || null,
          executionOutput: qr.executionOutput || null,
          passedTestCases: qr.passedTestCases,
          totalTestCases: qr.totalTestCases,
          scoreEarned: qr.pointsEarned,
        },
      });
    }

    // 4. Proctoring & Integrity Evaluation
    // Check if flagged by proctoring events or overtime
    const anomalyEvents = attempt.proctoringEvents.filter((e) => e.eventType !== "CONSENT_GRANTED");
    const hasIntegrityFlags =
      forcedStatus === "FLAGGED" ||
      attempt.status === "FLAGGED" ||
      anomalyEvents.length >= 2 ||
      isOvertime;

    const finalStatus = hasIntegrityFlags ? "FLAGGED" : "GRADED";
    const finalScore = forcedStatus === "FLAGGED" && disqualificationReason ? 0 : grading.percentageScore;
    const finalPassed = forcedStatus === "FLAGGED" && disqualificationReason ? false : grading.passed;

    // 5. Update Attempt Record
    await prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: finalStatus,
        score: finalScore,
        passed: finalPassed,
        submittedAt: now,
        completedAt: now,
      },
    });

    // 6. Create Assessment Result
    let resultFeedback = "";
    if (disqualificationReason) {
      resultFeedback = `DISQUALIFIED: ${disqualificationReason}`;
    } else if (hasIntegrityFlags) {
      resultFeedback = `Your assessment earned ${grading.percentageScore}%. Because session flags were recorded (e.g. tab blur or window focus), your attempt is queued for human assessor verification. Note: Proctoring flags are never automated proof of cheating.`;
    } else if (grading.passed) {
      resultFeedback = `Congratulations! You scored ${grading.percentageScore}%, passing the ${attempt.assessment.passingThreshold}% threshold. A verified skill credential has been issued.`;
    } else {
      resultFeedback = `You scored ${grading.percentageScore}%. The passing threshold is ${attempt.assessment.passingThreshold}%. Review the core concepts and try again after the cooldown period.`;
    }

    await prisma.assessmentResult.create({
      data: {
        attemptId: attempt.id,
        totalScore: grading.totalPointsEarned,
        maxScore: grading.totalPointsPossible,
        percentageScore: finalScore,
        verifiedSkillIssued: false, // will be flipped to true when checks pass
        feedback: resultFeedback,
      },
    });

    // 7. Credential Issuance after Required Checks
    let credentialResult = null;
    if (!hasIntegrityFlags && grading.passed) {
      credentialResult = await issueSkillCredentialAfterChecks(attempt.id);
    }

    return NextResponse.json({
      success: true,
      status: finalStatus,
      score: grading.percentageScore,
      passed: grading.passed,
      totalEarned: grading.totalPointsEarned,
      totalPossible: grading.totalPointsPossible,
      requiresHumanReview: hasIntegrityFlags,
      credentialIssued: credentialResult?.success || false,
      credentialId: credentialResult?.credentialId,
      feedback: resultFeedback,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
