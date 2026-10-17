import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeCandidateCode } from "@/lib/assessments/runner";

export async function POST(req: NextRequest) {
  try {
    const { attemptId, answers } = await req.json();

    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: {
            questions: { include: { testCases: true } },
            skills: { include: { skill: true } },
          },
        },
        studentProfile: true,
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    let totalPointsPossible = 0;
    let totalPointsEarned = 0;

    for (const q of attempt.assessment.questions) {
      totalPointsPossible += q.points;
      const studentAns = answers[q.id];

      if (q.type === "MULTIPLE_CHOICE" || q.type === "MULTIPLE_SELECT") {
        let correctOptions: string[] = [];
        try {
          correctOptions = JSON.parse(q.correctAnswersJson);
        } catch {
          correctOptions = [q.correctAnswersJson];
        }

        const isCorrect = correctOptions.includes(studentAns);
        const earned = isCorrect ? q.points : 0;
        totalPointsEarned += earned;

        await prisma.submission.create({
          data: {
            attemptId: attempt.id,
            questionId: q.id,
            studentAnswer: String(studentAns || ""),
            scoreEarned: earned,
          },
        });
      } else if (q.type === "CODING") {
        const code = String(studentAns || q.starterCode || "");
        const execResult = await executeCandidateCode(
          code,
          q.language || "javascript",
          q.testCases.map((tc) => ({
            id: tc.id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: tc.isHidden,
            weight: tc.weight,
          })),
          q.points
        );

        totalPointsEarned += execResult.score;

        await prisma.submission.create({
          data: {
            attemptId: attempt.id,
            questionId: q.id,
            codeSolution: code,
            language: q.language || "javascript",
            executionOutput: execResult.executionLog,
            passedTestCases: execResult.testCaseResults.filter((r) => r.passed).length,
            totalTestCases: execResult.testCaseResults.length,
            scoreEarned: execResult.score,
          },
        });
      }
    }

    const percentageScore =
      totalPointsPossible > 0
        ? Math.round((totalPointsEarned / totalPointsPossible) * 1000) / 10
        : 0;

    const isPassed = percentageScore >= attempt.assessment.passingThreshold;

    // Update attempt
    await prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "GRADED",
        score: percentageScore,
        passed: isPassed,
        submittedAt: new Date(),
        completedAt: new Date(),
      },
    });

    // Create result
    await prisma.assessmentResult.create({
      data: {
        attemptId: attempt.id,
        totalScore: totalPointsEarned,
        maxScore: totalPointsPossible,
        percentageScore,
        verifiedSkillIssued: isPassed,
        feedback: isPassed
          ? `Congratulations! You scored ${percentageScore}%, meeting the ${attempt.assessment.passingThreshold}% passing threshold. A verified skill credential has been recorded.`
          : `You scored ${percentageScore}%. The passing threshold is ${attempt.assessment.passingThreshold}%. Review the core concepts and try again in 7 days.`,
      },
    });

    // If passed, issue verified skills
    if (isPassed) {
      for (const as of attempt.assessment.skills) {
        const studentSkill = await prisma.studentSkill.upsert({
          where: {
            studentProfileId_skillId: {
              studentProfileId: attempt.studentProfileId,
              skillId: as.skillId,
            },
          },
          update: {
            verifiedByAssessment: true,
            isSelfDeclared: false,
            proficiencyLevel: percentageScore >= 90 ? "ADVANCED" : "INTERMEDIATE",
          },
          create: {
            studentProfileId: attempt.studentProfileId,
            skillId: as.skillId,
            verifiedByAssessment: true,
            isSelfDeclared: false,
            proficiencyLevel: percentageScore >= 90 ? "ADVANCED" : "INTERMEDIATE",
          },
        });

        // Add Skill Evidence
        await prisma.skillEvidence.create({
          data: {
            studentSkillId: studentSkill.id,
            evidenceType: "ASSESSMENT",
            title: `Proctored Assessment: ${attempt.assessment.title}`,
            description: `Passed proctored assessment with a score of ${percentageScore}%.`,
            score: percentageScore,
            proofUrl: `/student/attempts/${attempt.id}`,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      passed: isPassed,
      score: percentageScore,
      totalEarned: totalPointsEarned,
      totalPossible: totalPointsPossible,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
