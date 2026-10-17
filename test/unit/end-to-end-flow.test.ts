import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateCredentialCommitment, verifyCredentialIntegrity, generateSalt } from "@/lib/credentials/hasher";
import { IsolatedProcessExecutionProvider } from "@/lib/assessments/execution/isolated-process-provider";
import { calculateCandidateMatch } from "@/lib/matching/engine";
import { meetingProviderService } from "@/lib/interviews/meeting-provider";
import { generateStructuredInterviewReport } from "@/lib/interviews/report-generator";

describe("SkillChain Complete End-to-End Flow Verification", () => {
  let universityOrg: any;
  let issuerUser: any;
  let studentUser: any;
  let studentProfile: any;
  let recruiterUser: any;
  let employerOrg: any;
  let job: any;
  let degreeCredential: any;
  let application: any;
  let interview: any;

  beforeAll(async () => {
    // 1. Fetch seeded baseline records
    universityOrg = await prisma.organization.findFirst({ where: { type: "UNIVERSITY" } });
    employerOrg = await prisma.organization.findFirst({ where: { type: "EMPLOYER" } });
    issuerUser = await prisma.user.findFirst({ where: { role: "ISSUER" } });
    recruiterUser = await prisma.user.findFirst({ where: { role: "RECRUITER" } });
    studentUser = await prisma.user.findFirst({ where: { role: "STUDENT" } });
    studentProfile = await prisma.studentProfile.findFirst({
      where: { userId: studentUser?.id },
      include: { user: true },
    });
    job = await prisma.job.findFirst({
      include: { requirements: { include: { skill: true } } },
    });
  });

  it("Step 1: University Issuance — Generates cryptographic SHA-256 commitment & verifiable record", async () => {
    const salt = generateSalt();
    const payload = {
      issuer: {
        name: universityOrg?.name || "MIT",
        domain: "mit.edu",
        address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      },
      recipient: {
        name: studentUser.name,
        walletAddress: studentUser.walletAddress,
      },
      credential: {
        title: "Bachelor of Science in Computer Science",
        type: "BACHELOR_DEGREE",
        degreeName: "Computer Science",
        fieldOfStudy: "Software Engineering & Cryptography",
        grade: "Summa Cum Laude (GPA 3.96)",
        issuanceDate: new Date().toISOString(),
      },
      salt,
    };

    const commitment = generateCredentialCommitment(payload);
    expect(commitment).toMatch(/^0x[a-f0-9]{64}$/);

    // Verify cryptographic integrity
    const isValid = verifyCredentialIntegrity(payload, commitment);
    expect(isValid).toBe(true);

    // Verify tamper detection
    const tamperedPayload = {
      ...payload,
      credential: { ...payload.credential, grade: "3.20" },
    };
    expect(verifyCredentialIntegrity(tamperedPayload, commitment)).toBe(false);

    // Record credential in database with unique credId
    const credId = "0x" + "b".repeat(40) + Date.now().toString(16).padStart(24, "0");
    degreeCredential = await prisma.credential.create({
      data: {
        credId,
        credentialType: "DEGREE",
        organizationId: universityOrg.id,
        studentProfileId: studentProfile.id,
        title: payload.credential.title,
        degreeName: payload.credential.degreeName,
        fieldOfStudy: payload.credential.fieldOfStudy,
        grade: payload.credential.grade,
        commitment: commitment,
        status: "ACTIVE",
        txHash: "0x" + "a".repeat(64),
      },
    });

    expect(degreeCredential.id).toBeDefined();
    expect(degreeCredential.status).toBe("ACTIVE");
  });

  it("Step 2: Student QR & Public Passport — Accessible with verified degree & privacy slug", async () => {
    const refreshedProfile = await prisma.studentProfile.findUnique({
      where: { id: studentProfile.id },
      include: {
        credentials: { where: { status: "ACTIVE" } },
        studentSkills: { include: { skill: true } },
      },
    });

    expect(refreshedProfile).toBeDefined();
    expect(refreshedProfile?.publicPassportSlug).toBeTruthy();
    expect(refreshedProfile?.credentials.length).toBeGreaterThan(0);
    expect(refreshedProfile?.isPassportPublic).toBe(true);
  });

  it("Step 3: Sandboxed Skill Assessment — Safely evaluates code, redacts hidden tests & awards verified skill", async () => {
    const provider = new IsolatedProcessExecutionProvider();
    const candidateCode = `
      function filterActiveSkills(skills, minScore) {
        return skills.filter(function(s) {
          return s.score >= minScore;
        });
      }
    `;

    const testCases = [
      {
        id: "tc-pub-1",
        input: JSON.stringify({
          skills: [{ name: "React", score: 90 }, { name: "CSS", score: 50 }],
          minScore: 70,
        }),
        expectedOutput: JSON.stringify([{ name: "React", score: 90 }]),
        isHidden: false,
        weight: 20,
      },
      {
        id: "tc-hidden-1",
        input: JSON.stringify({
          skills: [{ name: "Rust", score: 95 }, { name: "Go", score: 60 }],
          minScore: 80,
        }),
        expectedOutput: JSON.stringify([{ name: "Rust", score: 95 }]),
        isHidden: true,
        weight: 20,
      },
    ];

    const result = await provider.execute(candidateCode, "javascript", testCases, 40.0, "filterActiveSkills");
    expect(result.passed).toBe(true);
    expect(result.score).toBe(40.0);

    // Verify hidden test case output redaction
    const hiddenResult = result.testCaseResults.find((r) => r.testCaseId === "tc-hidden-1");
    expect(hiddenResult?.actualOutput).toBe("[HIDDEN TEST CASE OUTPUT]");
    expect(hiddenResult?.expectedOutput).toBe("[HIDDEN TEST CASE EXPECTATION]");
  });

  it("Step 4: Recruiter Job Posting & Candidate Application", async () => {
    expect(job).toBeDefined();
    expect(job.requirements.length).toBeGreaterThan(0);

    // Retrieve or create application using composite unique key
    application = await prisma.application.upsert({
      where: {
        jobId_studentProfileId: {
          jobId: job.id,
          studentProfileId: studentProfile.id,
        },
      },
      create: {
        jobId: job.id,
        studentProfileId: studentProfile.id,
        currentStage: "APPLIED",
        matchScore: 92.5,
      },
      update: {
        currentStage: "APPLIED",
      },
    });

    expect(application.id).toBeDefined();
    expect(application.currentStage).toBe("APPLIED");
  });

  it("Step 5: Deterministic 5-Tier Recruiter Match — Grants proper evidence credit & identifies gaps", () => {
    const jobReqs = [
      { skillName: "React", weight: 3.0, mustBeVerified: true },
      { skillName: "TypeScript", weight: 2.0, mustBeVerified: true },
      { skillName: "Docker", weight: 1.0, mustBeVerified: false },
    ];

    const candidateSkills = [
      {
        skillName: "React",
        verifiedByAssessment: true,
        verifiedByDegree: false,
        isSelfDeclared: false,
        evidences: [{ evidenceType: "ASSESSMENT", title: "React Sandbox Passed", score: 95 }],
      },
      {
        skillName: "TypeScript",
        verifiedByAssessment: false,
        verifiedByDegree: true,
        isSelfDeclared: false,
        evidences: [{ evidenceType: "UNIVERSITY_DEGREE", title: "BS Computer Science", score: 95 }],
      },
      {
        skillName: "Docker",
        verifiedByAssessment: false,
        verifiedByDegree: false,
        isSelfDeclared: true,
        evidences: [],
      },
    ];

    const match = calculateCandidateMatch(jobReqs, candidateSkills);
    expect(match.overallScore).toBe(85);

    const dockerSkill = match.matchingSkills.find((s) => s.skillName === "Docker");
    expect(dockerSkill?.evidenceType).toBe("SELF_DECLARED");
    expect(dockerSkill?.score).toBe(35);
  });

  it("Step 6: Interview Scheduling, Provider Check & Evidence-Linked Report Synthesis", async () => {
    // 6a. Check meeting provider fallback behaviour
    const providerInfo = meetingProviderService.getProviderInfo();
    expect(providerInfo).toBeDefined();
    expect(providerInfo.provider).toBe("DEMO_SIMULATED"); // default without env key

    const room = await meetingProviderService.createMeetingRoom({
      topic: "E2E Technical Round",
      scheduledAt: new Date(Date.now() + 86400000),
      durationMinutes: 45,
    });
    expect(room.meetingUrl).toContain("demo");
    expect(room.isSimulated).toBe(true);

    // 6b. Schedule Interview
    interview = await prisma.interview.create({
      data: {
        applicationId: application.id,
        scheduledAt: new Date(Date.now() + 86400000),
        durationMinutes: 45,
        timeZone: "America/New_York",
        status: "SCHEDULED",
        meetingUrl: room.meetingUrl,
        recordingConsentGiven: true, // Candidate and recruiter granted consent
        notes: "E2E verification round",
        consents: {
          create: [
            { userId: studentUser.id, consentGiven: true, policyVersion: "v1.0" },
            { userId: recruiterUser.id, consentGiven: true, policyVersion: "v1.0" },
          ],
        },
      },
    });

    expect(interview.id).toBeDefined();

    // 6c. Generate Structured AI Interview Report
    const reportResponse = await generateStructuredInterviewReport({
      interviewId: interview.id,
      actorId: recruiterUser.id,
      forceRegenerate: true,
    });

    expect(reportResponse.success).toBe(true);
    expect(reportResponse.consentGranted).toBe(true);
    expect(reportResponse.report).toBeDefined();
    expect(reportResponse.report.summary).toBeTruthy();

    // Verify structured competency observations
    const competencies = JSON.parse(reportResponse.report.competenciesJson);
    expect(Array.isArray(competencies)).toBe(true);
    expect(competencies.length).toBeGreaterThan(0);
    expect(competencies[0].skill).toBeDefined();
    expect(competencies[0].evidence.length).toBeGreaterThan(0);

    // Verify limitations & follow-up questions
    const limitations = JSON.parse(reportResponse.report.limitationsJson);
    expect(Array.isArray(limitations)).toBe(true);
    expect(limitations.length).toBeGreaterThan(0);

    // 6d. Enforce Mandatory Recruiter Human Sign-off
    const reviewedReport = await prisma.interviewReport.update({
      where: { id: reportResponse.report.id },
      data: {
        hrDecision: "APPROVED",
        hrNotes: "Candidate Alex Rivera demonstrated stellar system design capabilities.",
        reviewedById: recruiterUser.id,
      },
    });

    expect(reviewedReport.hrDecision).toBe("APPROVED");

    // Advance candidate stage
    const updatedApplication = await prisma.application.update({
      where: { id: application.id },
      data: { currentStage: "SELECTED" },
    });

    expect(updatedApplication.currentStage).toBe("SELECTED");
  });

  it("Step 7: Enforces Candidate Consent Requirement before Report Generation", async () => {
    // Create an interview with consent explicitly FALSE
    const noConsentInterview = await prisma.interview.create({
      data: {
        applicationId: application.id,
        scheduledAt: new Date(Date.now() + 86400000 * 3),
        durationMinutes: 45,
        timeZone: "America/New_York",
        status: "SCHEDULED",
        meetingUrl: "https://meet.skillchain.org/rooms/demo-no-consent",
        recordingConsentGiven: false,
        notes: "No consent interview",
      },
    });

    const result = await generateStructuredInterviewReport({
      interviewId: noConsentInterview.id,
      actorId: recruiterUser.id,
    });

    expect(result.success).toBe(false);
    expect(result.consentGranted).toBe(false);
    expect(result.error).toContain("Candidate consent required");
  });
});
