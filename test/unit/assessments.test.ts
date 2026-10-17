import { describe, it, expect, beforeEach } from "vitest";
import {
  scoreObjectiveQuestion,
  scoreCodingQuestion,
  gradeAssessmentAttempt,
} from "@/lib/assessments/scoring";
import {
  evaluateAttemptTimer,
  calculateAttemptExpiry,
} from "@/lib/assessments/timer";
import {
  IsolatedProcessExecutionProvider,
  MockExecutionProvider,
  setCodeExecutionProvider,
  executeCandidateCode,
} from "@/lib/assessments/execution";
import { issueSkillCredentialAfterChecks } from "@/lib/assessments/credentials";
import { submitAssessmentReview, getFlaggedAttempts } from "@/lib/assessments/review";
import { prisma } from "@/lib/prisma";

describe("SkillChain Assessment Module Integration Tests", () => {
  beforeEach(() => {
    // Reset to isolated process provider by default
    setCodeExecutionProvider(null);
  });

  describe("1. Sandboxed Code Execution Provider & Web Server Isolation", () => {
    it("Executes valid candidate JavaScript code in isolated sandbox without host contamination", async () => {
      const provider = new IsolatedProcessExecutionProvider();
      const code = `
        function filterActiveSkills(skills, minScore) {
          return skills
            .filter(s => s.status === 'active' && s.score >= minScore)
            .sort((a, b) => b.score - a.score);
        }
      `;

      const testCases = [
        {
          id: "tc-1",
          input: JSON.stringify({
            skills: [
              { name: "React", status: "active", score: 85 },
              { name: "Docker", status: "inactive", score: 95 },
              { name: "TypeScript", status: "active", score: 92 },
            ],
            minScore: 80,
          }),
          expectedOutput: JSON.stringify([
            { name: "TypeScript", status: "active", score: 92 },
            { name: "React", status: "active", score: 85 },
          ]),
          isHidden: false,
          weight: 1.0,
        },
        {
          id: "tc-2",
          input: JSON.stringify({
            skills: [{ name: "CSS", status: "active", score: 60 }],
            minScore: 75,
          }),
          expectedOutput: JSON.stringify([]),
          isHidden: true,
          weight: 1.0,
        },
      ];

      const result = await provider.execute(code, "javascript", testCases, 40.0, "filterActiveSkills");

      expect(result.passed).toBe(true);
      expect(result.score).toBe(40.0);
      expect(result.testCaseResults.length).toBe(2);

      // Verify hidden test cases do not leak their actual output
      const hiddenTc = result.testCaseResults.find((tc) => tc.isHidden);
      expect(hiddenTc).toBeDefined();
      expect(hiddenTc?.passed).toBe(true);
      expect(hiddenTc?.actualOutput).toBe("[HIDDEN TEST CASE OUTPUT]");
      expect(hiddenTc?.expectedOutput).toBe("[HIDDEN TEST CASE EXPECTATION]");
    });

    it("Neutralizes malicious candidate code attempting process.exit or fs access", async () => {
      const provider = new IsolatedProcessExecutionProvider();
      const maliciousCode = `
        function filterActiveSkills() {
          // Attempting to kill process or read host files
          try {
            if (typeof process !== 'undefined' && process.exit) {
              process.exit(1);
            }
          } catch (e) {}
          return [];
        }
      `;

      const testCases = [
        {
          id: "tc-malicious",
          input: JSON.stringify({ skills: [], minScore: 10 }),
          expectedOutput: JSON.stringify([]),
          isHidden: false,
          weight: 1.0,
        },
      ];

      // Web server should NOT be killed, and execution should complete safely
      const result = await provider.execute(maliciousCode, "javascript", testCases, 10.0, "filterActiveSkills");
      expect(result).toBeDefined();
      expect(result.testCaseResults[0].passed).toBe(true);
    });

    it("Safely handles candidate infinite loops with execution timeout protection", async () => {
      const provider = new IsolatedProcessExecutionProvider();
      const loopCode = `
        function filterActiveSkills() {
          while(true) {}
        }
      `;

      const testCases = [
        {
          id: "tc-timeout",
          input: JSON.stringify({ skills: [], minScore: 10 }),
          expectedOutput: JSON.stringify([]),
          isHidden: false,
          weight: 1.0,
        },
      ];

      const result = await provider.execute(loopCode, "javascript", testCases, 10.0, "filterActiveSkills");
      expect(result.passed).toBe(false);
      expect(result.testCaseResults[0].passed).toBe(false);
      expect(result.testCaseResults[0].error).toMatch(/timed out/i);
    });
  });

  describe("2. Server-Side Scoring of Objective & Coding Questions", () => {
    it("Correctly grades MULTIPLE_CHOICE questions", async () => {
      const q = {
        id: "q-mcq",
        type: "MULTIPLE_CHOICE",
        points: 15,
        correctAnswersJson: JSON.stringify(["useMemo"]),
      };

      const correct = await scoreObjectiveQuestion(q, "useMemo");
      expect(correct.isCorrect).toBe(true);
      expect(correct.pointsEarned).toBe(15);

      const wrong = await scoreObjectiveQuestion(q, "useEffect");
      expect(wrong.isCorrect).toBe(false);
      expect(wrong.pointsEarned).toBe(0);
    });

    it("Correctly grades MULTIPLE_SELECT questions", async () => {
      const q = {
        id: "q-multi-select",
        type: "MULTIPLE_SELECT",
        points: 20,
        correctAnswersJson: JSON.stringify(["Option A", "Option C"]),
      };

      // Exact match
      const correct = await scoreObjectiveQuestion(q, ["Option A", "Option C"]);
      expect(correct.isCorrect).toBe(true);
      expect(correct.pointsEarned).toBe(20);

      // Incomplete answer
      const partial = await scoreObjectiveQuestion(q, ["Option A"]);
      expect(partial.isCorrect).toBe(false);
      expect(partial.pointsEarned).toBe(0);

      // Extra wrong answer
      const extra = await scoreObjectiveQuestion(q, ["Option A", "Option B", "Option C"]);
      expect(extra.isCorrect).toBe(false);
      expect(extra.pointsEarned).toBe(0);
    });

    it("Correctly grades SHORT_ANSWER questions with trimming and normalization", async () => {
      const q = {
        id: "q-short",
        type: "SHORT_ANSWER",
        points: 10,
        correctAnswersJson: JSON.stringify(["useRef", "ref"]),
      };

      const matchTrimmed = await scoreObjectiveQuestion(q, "  useRef  ");
      expect(matchTrimmed.isCorrect).toBe(true);
      expect(matchTrimmed.pointsEarned).toBe(10);

      const altMatch = await scoreObjectiveQuestion(q, "REF");
      expect(altMatch.isCorrect).toBe(true);

      const incorrect = await scoreObjectiveQuestion(q, "useState");
      expect(incorrect.isCorrect).toBe(false);
      expect(incorrect.pointsEarned).toBe(0);
    });

    it("Calculates comprehensive attempt score and passing threshold", async () => {
      // Use mock execution provider for deterministic fast grading
      setCodeExecutionProvider(new MockExecutionProvider(true));

      const questions = [
        {
          id: "q1",
          type: "MULTIPLE_CHOICE",
          points: 20,
          correctAnswersJson: JSON.stringify(["useMemo"]),
        },
        {
          id: "q2",
          type: "SHORT_ANSWER",
          points: 20,
          correctAnswersJson: JSON.stringify(["useRef"]),
        },
        {
          id: "q3",
          type: "CODING",
          points: 60,
          correctAnswersJson: JSON.stringify([]),
          starterCode: "function solution() { return true; }",
          testCases: [
            { id: "tc1", input: "1", expectedOutput: "1", isHidden: false, weight: 1.0 },
          ],
        },
      ];

      const answers = {
        q1: "useMemo",
        q2: "useRef",
        q3: "function solution() { return true; }",
      };

      const result = await gradeAssessmentAttempt(questions, answers, 75.0);
      expect(result.totalPointsPossible).toBe(100);
      expect(result.totalPointsEarned).toBe(100);
      expect(result.percentageScore).toBe(100);
      expect(result.passed).toBe(true);
    });
  });

  describe("3. Authoritative Server-Side Timers", () => {
    it("Calculates valid remaining time for on-time submission", () => {
      const startedAt = new Date();
      const durationMinutes = 45;

      const evalResult = evaluateAttemptTimer(startedAt, durationMinutes, new Date());
      expect(evalResult.isExpired).toBe(false);
      expect(evalResult.secondsRemaining).toBeGreaterThan(0);
      expect(evalResult.secondsOverdue).toBe(0);
    });

    it("Flags late submissions beyond authoritative duration and grace period", () => {
      // Started 50 minutes ago for a 45-minute assessment
      const startedAt = new Date(Date.now() - 50 * 60 * 1000);
      const durationMinutes = 45;

      const evalResult = evaluateAttemptTimer(startedAt, durationMinutes, new Date(), 30);
      expect(evalResult.isExpired).toBe(true);
      expect(evalResult.secondsOverdue).toBeGreaterThan(0);
    });
  });

  describe("4. Consent-Based Proctoring & Non-Disqualification Principle", () => {
    it("Logs proctoring events without automatic disqualification", async () => {
      // Find an existing or seeded student
      const student = await prisma.studentProfile.findFirst({
        include: { user: true },
      });
      const assessment = await prisma.assessment.findFirst();

      expect(student).toBeDefined();
      expect(assessment).toBeDefined();

      if (!student || !assessment) return;

      // Create an attempt
      const attempt = await prisma.assessmentAttempt.create({
        data: {
          assessmentId: assessment.id,
          studentProfileId: student.id,
          status: "IN_PROGRESS",
          startedAt: new Date(),
          version: assessment.version,
          consentGiven: true,
        },
      });

      // Log tab switch event
      const event = await prisma.proctoringEvent.create({
        data: {
          attemptId: attempt.id,
          eventType: "TAB_SWITCH",
          metadata: JSON.stringify({ reason: "Candidate blurred tab" }),
          timestamp: new Date(),
        },
      });

      expect(event.id).toBeDefined();
      expect(event.eventType).toBe("TAB_SWITCH");

      // Verify the attempt is NOT automatically failed or marked cheater
      const fetched = await prisma.assessmentAttempt.findUnique({
        where: { id: attempt.id },
      });
      expect(fetched?.status).not.toBe("REJECTED");
    });
  });

  describe("5. Human Review & Skill Credential Issuance Gates", () => {
    it("Prevents credential issuance for flagged attempt before human assessor approval", async () => {
      const student = await prisma.studentProfile.findFirst({
        include: { user: true },
      });
      const assessment = await prisma.assessment.findFirst();

      if (!student || !assessment) return;

      const flaggedAttempt = await prisma.assessmentAttempt.create({
        data: {
          assessmentId: assessment.id,
          studentProfileId: student.id,
          status: "FLAGGED",
          score: 88,
          passed: true,
          startedAt: new Date(),
          submittedAt: new Date(),
          completedAt: new Date(),
          consentGiven: true,
          version: assessment.version,
        },
      });

      // Add a proctoring flag
      await prisma.proctoringEvent.create({
        data: {
          attemptId: flaggedAttempt.id,
          eventType: "TAB_SWITCH",
          timestamp: new Date(),
        },
      });

      // Attempt to issue credential directly without human review
      const issuanceResult = await issueSkillCredentialAfterChecks(flaggedAttempt.id);
      expect(issuanceResult.success).toBe(false);
      expect(issuanceResult.error).toMatch(/human review/i);
    });

    it("Issues verifiable credential once human assessor reviews and APPROVES the attempt", async () => {
      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      const student = await prisma.studentProfile.findFirst({
        include: { user: true },
      });
      const assessment = await prisma.assessment.findFirst();

      if (!admin || !student || !assessment) return;

      const flaggedAttempt = await prisma.assessmentAttempt.create({
        data: {
          assessmentId: assessment.id,
          studentProfileId: student.id,
          status: "FLAGGED",
          score: 92,
          passed: true,
          startedAt: new Date(),
          submittedAt: new Date(),
          completedAt: new Date(),
          consentGiven: true,
          version: assessment.version,
        },
      });

      // Human Assessor submits approval
      const reviewResult = await submitAssessmentReview({
        attemptId: flaggedAttempt.id,
        reviewerId: admin.id,
        decision: "APPROVED",
        comments: "Activity was dual-monitor focus loss; code solution and answers are verified authentic.",
      });

      expect(reviewResult.success).toBe(true);
      expect(reviewResult.decision).toBe("APPROVED");
      expect(reviewResult.credentialIssuanceResult?.success).toBe(true);
      expect(reviewResult.credentialIssuanceResult?.credentialId).toBeDefined();

      // Verify the student skill was marked verified
      const updatedSkill = await prisma.studentSkill.findFirst({
        where: {
          studentProfileId: student.id,
          verifiedByAssessment: true,
        },
      });
      expect(updatedSkill).toBeDefined();
    });

    it("Withholds credential if human assessor REJECTS the attempt for integrity violation", async () => {
      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      const student = await prisma.studentProfile.findFirst({
        include: { user: true },
      });
      const assessment = await prisma.assessment.findFirst();

      if (!admin || !student || !assessment) return;

      const flaggedAttempt = await prisma.assessmentAttempt.create({
        data: {
          assessmentId: assessment.id,
          studentProfileId: student.id,
          status: "FLAGGED",
          score: 85,
          passed: true,
          startedAt: new Date(),
          submittedAt: new Date(),
          completedAt: new Date(),
          consentGiven: true,
          version: assessment.version,
        },
      });

      const reviewResult = await submitAssessmentReview({
        attemptId: flaggedAttempt.id,
        reviewerId: admin.id,
        decision: "REJECTED",
        comments: "Repeated tab switching and copy-pasting detected from external solution repository.",
      });

      expect(reviewResult.success).toBe(true);
      expect(reviewResult.decision).toBe("REJECTED");
      expect(reviewResult.credentialIssuanceResult).toBeNull();

      const finalAttempt = await prisma.assessmentAttempt.findUnique({
        where: { id: flaggedAttempt.id },
      });
      expect(finalAttempt?.status).toBe("REJECTED");
      expect(finalAttempt?.passed).toBe(false);
    });
  });
});
