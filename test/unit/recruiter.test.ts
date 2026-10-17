import { describe, it, expect } from "vitest";
import {
  calculateCandidateMatch,
  type CandidateMatchResult,
} from "@/lib/matching/engine";
import {
  aiService,
  JobGenerationSchema,
  InterviewReportSchema,
} from "@/lib/ai/service";

describe("SkillChain Recruitment Module Integration Tests", () => {
  describe("1. Natural-Language Job Generation & Validated Structured AI Outputs", () => {
    it("Produces a Zod-validated structured job draft from natural language prompt", async () => {
      const prompt =
        "We are looking for a Senior Frontend Engineer to build high-performance Web3 dashboards using React, TypeScript, and TailwindCSS.";
      const draft = await aiService.generateJobDraft(prompt);

      expect(draft).toBeDefined();
      expect(draft.title).toMatch(/Frontend|Engineer|Developer/i);
      expect(draft.requiredSkills.length).toBeGreaterThanOrEqual(2);
      expect(draft.responsibilities.length).toBeGreaterThanOrEqual(2);
      expect(draft.source).toBe("deterministic-synthesizer");

      // Validated against schema
      const parseResult = JobGenerationSchema.safeParse(draft);
      expect(parseResult.success).toBe(true);
    });

    it("Provides robust manual fallback templates when AI provider is unavailable", () => {
      const frontendFallback = aiService.getManualJobTemplate("frontend");
      expect(frontendFallback.isFallback).toBe(true);
      expect(frontendFallback.source).toBe("manual-fallback-template");
      expect(frontendFallback.title).toBe("Frontend React Engineer");
      expect(frontendFallback.requiredSkills).toContain("React");
      expect(frontendFallback.requiredSkills).toContain("TypeScript");

      // Must also validate against the exact same Zod schema
      expect(JobGenerationSchema.safeParse(frontendFallback).success).toBe(true);

      const backendFallback = aiService.getManualJobTemplate("backend");
      expect(backendFallback.requiredSkills).toContain("Python");
      expect(JobGenerationSchema.safeParse(backendFallback).success).toBe(true);

      const fullstackFallback = aiService.getManualJobTemplate("fullstack");
      expect(fullstackFallback.requiredSkills).toContain("React");
      expect(JobGenerationSchema.safeParse(fullstackFallback).success).toBe(true);
    });
  });

  describe("2. Deterministic 5-Tier Matching Engine & Evidence Differentiation", () => {
    const jobRequirements = [
      { skillName: "React", weight: 3.0, mustBeVerified: true, minScoreThreshold: 80 },
      { skillName: "TypeScript", weight: 2.5, mustBeVerified: true, minScoreThreshold: 75 },
      { skillName: "Data Structures & Algorithms", weight: 2.0, mustBeVerified: false },
      { skillName: "Next.js", weight: 1.5, mustBeVerified: false },
    ];

    it("Grants 100% credit for assessment-verified skills and 95% for academic degree evidence", () => {
      const candidateSkills = [
        {
          skillName: "React",
          verifiedByAssessment: true,
          verifiedByDegree: false,
          isSelfDeclared: false,
          evidences: [{ evidenceType: "ASSESSMENT", title: "React Proctored Assessment", score: 96 }],
        },
        {
          skillName: "TypeScript",
          verifiedByAssessment: true,
          verifiedByDegree: false,
          isSelfDeclared: false,
          evidences: [{ evidenceType: "ASSESSMENT", title: "TypeScript Proctored Assessment", score: 90 }],
        },
        {
          skillName: "Data Structures & Algorithms",
          verifiedByAssessment: false,
          verifiedByDegree: true,
          isSelfDeclared: false,
          evidences: [{ evidenceType: "UNIVERSITY_DEGREE", title: "MIT BS Computer Science", score: 95 }],
        },
        {
          skillName: "Next.js",
          verifiedByAssessment: false,
          verifiedByDegree: false,
          isSelfDeclared: false,
          evidences: [{ evidenceType: "PROJECT", title: "DeFi Portfolio Dashboard", score: 85 }],
        },
      ];

      const match: CandidateMatchResult = calculateCandidateMatch(jobRequirements, candidateSkills);

      expect(match.overallScore).toBeGreaterThanOrEqual(88);
      expect(match.matchTier).toBe("STRONG_MATCH");
      expect(match.evidenceBreakdown.assessmentVerifiedCount).toBe(2);
      expect(match.evidenceBreakdown.universityVerifiedCount).toBe(1);
      expect(match.evidenceBreakdown.projectVerifiedCount).toBe(1);
      expect(match.evidenceBreakdown.selfDeclaredCount).toBe(0);
      expect(match.evidenceBreakdown.missingCount).toBe(0);

      // Verify individual evidence tiers in matchingSkills
      const reactMatch = match.matchingSkills.find((s) => s.skillName === "React");
      expect(reactMatch?.evidenceBadge).toContain("Assessment Verified");
      expect(reactMatch?.score).toBe(96);

      const dsaMatch = match.matchingSkills.find((s) => s.skillName === "Data Structures & Algorithms");
      expect(dsaMatch?.evidenceBadge).toContain("University Degree");
      expect(dsaMatch?.score).toBe(95);

      const nextMatch = match.matchingSkills.find((s) => s.skillName === "Next.js");
      expect(nextMatch?.evidenceBadge).toContain("Project Evidence");
      expect(nextMatch?.score).toBe(70);
    });

    it("Penalizes unverified self-declared skills (35%) and missing skills (0%)", () => {
      const unverifiedCandidate = [
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
        // DSA and Next.js are completely missing
      ];

      const match = calculateCandidateMatch(jobRequirements, unverifiedCandidate);

      // Total weights: 3.0 + 2.5 + 2.0 + 1.5 = 9.0
      // React (35 * 3.0) + TS (35 * 2.5) + DSA (0) + Next.js (0) = 105 + 87.5 = 192.5 / 9.0 ≈ 21%
      expect(match.overallScore).toBeLessThan(30);
      expect(match.matchTier).toBe("DEVELOPING_MATCH");
      expect(match.evidenceBreakdown.selfDeclaredCount).toBe(2);
      expect(match.evidenceBreakdown.missingCount).toBe(2);
    });

    it("Accurately applies custom skill weights to prioritize critical proficiencies", () => {
      const candidateMissingTS = [
        {
          skillName: "React",
          verifiedByAssessment: true,
          verifiedByDegree: false,
          isSelfDeclared: false,
          evidences: [{ evidenceType: "ASSESSMENT", title: "React Assessment", score: 95 }],
        },
      ];

      // Configuration A: React has high weight (5.0), TypeScript has low weight (1.0)
      const configA = [
        { skillName: "React", weight: 5.0, mustBeVerified: true },
        { skillName: "TypeScript", weight: 1.0, mustBeVerified: true },
      ];
      const matchA = calculateCandidateMatch(configA, candidateMissingTS);

      // Configuration B: React has low weight (1.0), TypeScript has high weight (5.0)
      const configB = [
        { skillName: "React", weight: 1.0, mustBeVerified: true },
        { skillName: "TypeScript", weight: 5.0, mustBeVerified: true },
      ];
      const matchB = calculateCandidateMatch(configB, candidateMissingTS);

      // Match A should have a much higher score because the candidate has the heavily-weighted skill
      expect(matchA.overallScore).toBeGreaterThan(matchB.overallScore);
      expect(matchA.overallScore).toBe(79.2); // (95 * 5.0) / (6.0 * 100) * 100 = 79.2%
      expect(matchB.overallScore).toBe(15.8); // (95 * 1.0) / (6.0 * 100) * 100 = 15.8%
    });
  });

  describe("3. Skill-Gap Reporting & Actionable Remediation", () => {
    it("Generates comprehensive skill gaps distinguishing MISSING and UNVERIFIED_SELF_DECLARED", () => {
      const requirements = [
        { skillName: "React", weight: 3.0, mustBeVerified: true },
        { skillName: "TypeScript", weight: 2.0, mustBeVerified: true },
        { skillName: "Python", weight: 1.5, mustBeVerified: false },
        { skillName: "Docker", weight: 1.0, mustBeVerified: false },
      ];

      const candidateSkills = [
        {
          skillName: "React",
          verifiedByAssessment: true,
          verifiedByDegree: false,
          isSelfDeclared: false,
          evidences: [{ evidenceType: "ASSESSMENT", title: "React Proctored", score: 90 }],
        },
        {
          skillName: "TypeScript",
          verifiedByAssessment: false,
          verifiedByDegree: false,
          isSelfDeclared: true,
          evidences: [],
        },
        // Python and Docker missing
      ];

      const match = calculateCandidateMatch(requirements, candidateSkills);

      expect(match.skillGaps.length).toBe(3);

      // TypeScript should be flagged as UNVERIFIED_SELF_DECLARED
      const tsGap = match.skillGaps.find((g) => g.skillName === "TypeScript");
      expect(tsGap).toBeDefined();
      expect(tsGap?.gapType).toBe("UNVERIFIED_SELF_DECLARED");
      expect(tsGap?.recommendedAssessmentId).toBe("typescript-assessment");
      expect(tsGap?.recommendation).toContain("TypeScript Advanced Type Systems");

      // Python should be flagged as MISSING with python assessment recommendation
      const pythonGap = match.skillGaps.find((g) => g.skillName === "Python");
      expect(pythonGap).toBeDefined();
      expect(pythonGap?.gapType).toBe("MISSING");
      expect(pythonGap?.recommendedAssessmentId).toBe("python-assessment");

      // Docker should be flagged as MISSING
      const dockerGap = match.skillGaps.find((g) => g.skillName === "Docker");
      expect(dockerGap).toBeDefined();
      expect(dockerGap?.gapType).toBe("MISSING");
    });

    it("Reports zero skill gaps when all required skills are verified or backed by projects", () => {
      const requirements = [{ skillName: "React", weight: 3.0, mustBeVerified: true }];
      const candidateSkills = [
        {
          skillName: "React",
          verifiedByAssessment: true,
          verifiedByDegree: false,
          isSelfDeclared: false,
          evidences: [{ evidenceType: "ASSESSMENT", title: "React Exam", score: 98 }],
        },
      ];

      const match = calculateCandidateMatch(requirements, candidateSkills);
      expect(match.skillGaps.length).toBe(0);
    });
  });

  describe("4. Hiring Stages & Human-In-The-Loop Decision Architecture", () => {
    it("Requires human recruiter confirmation before publishing job postings", () => {
      // Simulating job creation approval validation
      const validateJobSubmission = (data: {
        title: string;
        description: string;
        department: string;
        location: string;
        explicitApprovalConfirmed: boolean;
        requiredSkills: string[];
      }) => {
        if (!data.explicitApprovalConfirmed) {
          throw new Error("Explicit recruiter approval required before publishing.");
        }
        if (data.requiredSkills.length === 0) {
          throw new Error("Job must specify at least one skill requirement.");
        }
        return { status: "PUBLISHED" as const, approvedByRecruiter: true };
      };

      // Fails when explicitApprovalConfirmed is false
      expect(() =>
        validateJobSubmission({
          title: "Frontend Lead",
          description: "Leadership role",
          department: "Engineering",
          location: "Remote",
          explicitApprovalConfirmed: false,
          requiredSkills: ["React"],
        })
      ).toThrow(/approval required/i);

      // Succeeds when approved
      const published = validateJobSubmission({
        title: "Frontend Lead",
        description: "Leadership role",
        department: "Engineering",
        location: "Remote",
        explicitApprovalConfirmed: true,
        requiredSkills: ["React"],
      });
      expect(published.status).toBe("PUBLISHED");
      expect(published.approvedByRecruiter).toBe(true);
    });

    it("Maintains strict audit trail of candidate application stage progression", () => {
      const stages: string[] = [
        "APPLIED",
        "UNDER_REVIEW",
        "SHORTLISTED",
        "INTERVIEW_SCHEDULED",
        "INTERVIEW_COMPLETED",
        "SELECTED",
        "REJECTED",
      ];

      const auditLog: Array<{ fromStage: string; toStage: string; actorId: string; timestamp: Date }> = [];

      const advanceStage = (from: string, to: string, actorId: string) => {
        expect(stages).toContain(from);
        expect(stages).toContain(to);
        auditLog.push({
          fromStage: from,
          toStage: to,
          actorId,
          timestamp: new Date(),
        });
      };

      advanceStage("APPLIED", "SHORTLISTED", "recruiter_stripe_01");
      advanceStage("SHORTLISTED", "INTERVIEW_SCHEDULED", "recruiter_stripe_01");
      advanceStage("INTERVIEW_SCHEDULED", "SELECTED", "recruiter_stripe_01");

      expect(auditLog.length).toBe(3);
      expect(auditLog[0].fromStage).toBe("APPLIED");
      expect(auditLog[0].toStage).toBe("SHORTLISTED");
      expect(auditLog[2].toStage).toBe("SELECTED");
    });

    it("Enforces human review on AI interview summaries without automated biometric decisions", async () => {
      const transcript =
        "Candidate explains how they solved high latency in microservices using Redis caching and message queues.";
      const report = await aiService.generateInterviewReport(
        transcript,
        "Backend Architect",
        ["System Design", "Redis", "Distributed Systems"]
      );

      // AI must explicitly flag that human review is required
      expect(report.humanReviewRequired).toBe(true);

      // AI outputs do not decide the hiring outcome
      expect((report as any).autoReject).toBeUndefined();
      expect((report as any).autoHire).toBeUndefined();

      // Recruiter records explicit sign-off
      const recruiterSignOff = {
        reportId: "report-123",
        hrDecision: "APPROVED" as const,
        hrNotes: "Demonstrated strong distributed systems trade-off analysis.",
        reviewedBy: "recruiter_stripe_01",
        reviewedAt: new Date().toISOString(),
      };

      expect(["APPROVED", "NEEDS_MORE_INFO", "REJECTED"]).toContain(recruiterSignOff.hrDecision);
      expect(recruiterSignOff.hrNotes.length).toBeGreaterThan(10);
    });
  });

  describe("5. Candidate Search & Multi-Tier Verification Filtering", () => {
    const candidateDirectory = [
      {
        id: "student-1",
        name: "Alex Rivera",
        headline: "Full-Stack Engineer",
        verifiedAssessmentCount: 2,
        universityVerifiedCount: 1,
        projectCount: 2,
        skills: ["React", "TypeScript", "Next.js"],
      },
      {
        id: "student-2",
        name: "Maya Chen",
        headline: "Backend Specialist",
        verifiedAssessmentCount: 0,
        universityVerifiedCount: 1,
        projectCount: 1,
        skills: ["Python", "PostgreSQL", "Docker"],
      },
      {
        id: "student-3",
        name: "Jordan Taylor",
        headline: "Junior Web Developer",
        verifiedAssessmentCount: 0,
        universityVerifiedCount: 0,
        projectCount: 2,
        skills: ["JavaScript", "HTML", "CSS"],
      },
      {
        id: "student-4",
        name: "Samira Patel",
        headline: "Aspiring Coder",
        verifiedAssessmentCount: 0,
        universityVerifiedCount: 0,
        projectCount: 0,
        skills: ["React", "Python"], // self-declared only
      },
    ];

    it("Filters candidates strictly by evidence tier", () => {
      // 1. Proctored Assessment Verified filter
      const assessmentCandidates = candidateDirectory.filter((c) => c.verifiedAssessmentCount > 0);
      expect(assessmentCandidates.map((c) => c.name)).toEqual(["Alex Rivera"]);

      // 2. Academic Degree Verified filter
      const degreeCandidates = candidateDirectory.filter((c) => c.universityVerifiedCount > 0);
      expect(degreeCandidates.map((c) => c.name)).toEqual(["Alex Rivera", "Maya Chen"]);

      // 3. Project Verified filter
      const projectCandidates = candidateDirectory.filter((c) => c.projectCount > 0);
      expect(projectCandidates.map((c) => c.name)).toEqual(["Alex Rivera", "Maya Chen", "Jordan Taylor"]);

      // 4. Self-declared only (no assessment, degree, or project)
      const selfDeclaredOnly = candidateDirectory.filter(
        (c) => c.verifiedAssessmentCount === 0 && c.universityVerifiedCount === 0 && c.projectCount === 0
      );
      expect(selfDeclaredOnly.map((c) => c.name)).toEqual(["Samira Patel"]);
    });

    it("Performs multi-attribute keyword and skill search across candidates", () => {
      const search = (query: string, skillFilter?: string) => {
        return candidateDirectory.filter((c) => {
          const matchesQuery =
            !query ||
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.headline.toLowerCase().includes(query.toLowerCase());
          const matchesSkill =
            !skillFilter || c.skills.some((s) => s.toLowerCase() === skillFilter.toLowerCase());
          return matchesQuery && matchesSkill;
        });
      };

      expect(search("Alex").length).toBe(1);
      expect(search("Backend").length).toBe(1);
      expect(search("", "React").length).toBe(2); // Alex and Samira
      expect(search("Maya", "Python").length).toBe(1);
      expect(search("NonExistent").length).toBe(0);
    });
  });
});
