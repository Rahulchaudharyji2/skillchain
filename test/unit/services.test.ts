import { describe, it, expect } from "vitest";
import { calculateCandidateMatch } from "@/lib/matching/engine";
import {
  generateCredentialCommitment,
  verifyCredentialIntegrity,
  generateSalt,
  type VerifiableCredentialPayload,
} from "@/lib/credentials/hasher";
import {
  JobGenerationSchema,
  InterviewReportSchema,
  aiService,
} from "@/lib/ai/service";

describe("SkillChain Core Services Unit Tests", () => {
  describe("1. Evidence-Typed Candidate Match Engine", () => {
    const jobRequirements = [
      { skillName: "React", weight: 3.0, mustBeVerified: true, minScoreThreshold: 80 },
      { skillName: "TypeScript", weight: 2.0, mustBeVerified: true, minScoreThreshold: 75 },
      { skillName: "Data Structures & Algorithms", weight: 2.0, mustBeVerified: false },
    ];

    it("Grants highest score and tier for proctored assessments and university degrees", () => {
      const alexSkills = [
        {
          skillName: "React",
          verifiedByAssessment: true,
          verifiedByDegree: false,
          isSelfDeclared: false,
          evidences: [{ evidenceType: "ASSESSMENT", title: "React Proctored", score: 95 }],
        },
        {
          skillName: "TypeScript",
          verifiedByAssessment: true,
          verifiedByDegree: false,
          isSelfDeclared: false,
          evidences: [{ evidenceType: "ASSESSMENT", title: "TypeScript Proctored", score: 92 }],
        },
        {
          skillName: "Data Structures & Algorithms",
          verifiedByAssessment: false,
          verifiedByDegree: true,
          isSelfDeclared: false,
          evidences: [{ evidenceType: "UNIVERSITY_DEGREE", title: "MIT BS CS Degree", score: 95 }],
        },
      ];

      const match = calculateCandidateMatch(jobRequirements, alexSkills);

      expect(match.overallScore).toBeGreaterThanOrEqual(90);
      expect(match.matchTier).toBe("STRONG_MATCH");
      expect(match.missingSkills.length).toBe(0);
      expect(match.evidenceBreakdown.assessmentVerifiedCount).toBe(2);
      expect(match.evidenceBreakdown.universityVerifiedCount).toBe(1);
    });

    it("Distinguishes self-declared skills from verified skills with lower score", () => {
      const unverifiedSkills = [
        {
          skillName: "React",
          verifiedByAssessment: false,
          verifiedByDegree: false,
          isSelfDeclared: true,
          evidences: [],
        },
        {
          skillName: "TypeScript",
          verifiedByAssessment: false,
          verifiedByDegree: false,
          isSelfDeclared: true,
          evidences: [],
        },
      ];

      const match = calculateCandidateMatch(jobRequirements, unverifiedSkills);

      // Should be much lower score because skills are self-declared only and DSA is missing
      expect(match.overallScore).toBeLessThan(40);
      expect(match.matchTier).toBe("DEVELOPING_MATCH");
      expect(match.selfDeclaredOnly).toContain("React");
      expect(match.missingSkills).toContain("Data Structures & Algorithms");
    });
  });

  describe("2. Cryptographic Commitment Hasher & Tamper Detection", () => {
    const salt = generateSalt();
    const payload: VerifiableCredentialPayload = {
      issuer: {
        name: "Massachusetts Institute of Technology",
        domain: "mit.edu",
        address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      },
      recipient: {
        name: "Alex Rivera",
        walletAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      },
      credential: {
        title: "Bachelor of Science in Computer Science",
        type: "DEGREE",
        degreeName: "Bachelor of Science",
        fieldOfStudy: "Computer Science",
        grade: "3.92 GPA",
        issuanceDate: "2025-06-05T00:00:00.000Z",
      },
      salt,
    };

    it("Generates valid SHA-256 commitment hex string", () => {
      const commitment = generateCredentialCommitment(payload);
      expect(commitment).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it("Verifies matching commitment passes integrity check", () => {
      const commitment = generateCredentialCommitment(payload);
      expect(verifyCredentialIntegrity(payload, commitment)).toBe(true);
    });

    it("Fails verification if academic record has been tampered with", () => {
      const commitment = generateCredentialCommitment(payload);

      // Tamper with grade from 3.92 to 4.0
      const tamperedPayload = {
        ...payload,
        credential: { ...payload.credential, grade: "4.00 GPA" },
      };

      expect(verifyCredentialIntegrity(tamperedPayload, commitment)).toBe(false);
    });
  });

  describe("3. AI Provider Layer & Structured Schema Validation", () => {
    it("Generates valid job draft matching Zod schema", async () => {
      const prompt =
        "Create a job for a React frontend engineer with TypeScript and Web3 knowledge.";
      const draft = await aiService.generateJobDraft(prompt);

      expect(draft.title).toBeDefined();
      expect(draft.requiredSkills.length).toBeGreaterThan(0);
      expect(draft.responsibilities.length).toBeGreaterThan(0);
      expect(["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD"]).toContain(draft.seniorityLevel);
      expect(JobGenerationSchema.safeParse(draft).success).toBe(true);
    });

    it("Generates structured interview report matching schema with human review flag", async () => {
      const transcript =
        "Interviewer: How do you handle React state optimization?\nAlex Rivera: I use local state, useMemo, and avoid unnecessary re-renders with memoized callbacks.";
      const report = await aiService.generateInterviewReport(transcript, "Frontend Engineer", [
        "React",
        "TypeScript",
      ]);

      expect(report.summary).toBeDefined();
      expect(report.competencies.length).toBeGreaterThan(0);
      expect(report.humanReviewRequired).toBe(true);
      expect(InterviewReportSchema.safeParse(report).success).toBe(true);
    });
  });
});
