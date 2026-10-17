import { prisma } from "@/lib/prisma";
import { AIService, InterviewReportResult } from "@/lib/ai/service";
import { meetingProviderService } from "./meeting-provider";

export interface GenerateReportOptions {
  interviewId: string;
  actorId?: string;
  forceRegenerate?: boolean;
}

export interface GenerateReportResponse {
  success: boolean;
  report?: any;
  error?: string;
  consentGranted: boolean;
  isSimulatedTranscript: boolean;
}

/**
 * Service to generate structured, evidence-linked interview summaries,
 * competency observations, limitations, and follow-up questions.
 * Enforces candidate consent and ensures final hiring decisions remain with the recruiter.
 */
export async function generateStructuredInterviewReport(
  options: GenerateReportOptions
): Promise<GenerateReportResponse> {
  const { interviewId, actorId, forceRegenerate = false } = options;

  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      application: {
        include: {
          job: {
            include: {
              requirements: {
                include: { skill: true },
              },
            },
          },
          studentProfile: {
            include: { user: true },
          },
        },
      },
      participants: {
        include: { user: true },
      },
      consents: true,
      transcript: true,
      report: {
        include: { evidences: true },
      },
    },
  });

  if (!interview) {
    return {
      success: false,
      error: "Interview not found.",
      consentGranted: false,
      isSimulatedTranscript: true,
    };
  }

  // 1. Mandatory Consent Verification Gate
  // Candidate must have granted consent for interview recording & AI transcript synthesis
  const candidateUserId = interview.application.studentProfile.userId;
  const candidateConsent = interview.consents.find((c) => c.userId === candidateUserId);
  const isConsentGiven = interview.recordingConsentGiven || (candidateConsent && candidateConsent.consentGiven);

  if (!isConsentGiven) {
    return {
      success: false,
      error: "Candidate consent required: Candidate has not granted consent for AI transcript processing and competency evaluation.",
      consentGranted: false,
      isSimulatedTranscript: true,
    };
  }

  // 2. Return existing report if already generated and not forced
  if (interview.report && !forceRegenerate) {
    return {
      success: true,
      report: interview.report,
      consentGranted: true,
      isSimulatedTranscript: interview.transcript?.isSimulated ?? true,
    };
  }

  // 3. Retrieve or generate transcript
  let transcript = interview.transcript;
  const requiredSkillNames = interview.application.job.requirements.map((r) => r.skill.name);
  const candidateName = interview.application.studentProfile.user.name;
  const jobTitle = interview.application.job.title;

  if (!transcript) {
    const generated = meetingProviderService.generateDemoTranscript(
      candidateName,
      jobTitle,
      requiredSkillNames
    );

    transcript = await prisma.interviewTranscript.create({
      data: {
        interviewId: interview.id,
        rawTranscriptText: generated.rawTranscriptText,
        turnsJson: JSON.stringify(generated.turns),
        isSimulated: generated.isSimulated,
      },
    });
  }

  // 4. Generate Structured AI Synthesis with Zod validation
  const aiService = new AIService();
  const reportData: InterviewReportResult = await aiService.generateInterviewReport(
    transcript.rawTranscriptText,
    jobTitle,
    requiredSkillNames
  );

  // 5. Persist or Update InterviewReport in Database
  const upsertedReport = await prisma.interviewReport.upsert({
    where: { interviewId: interview.id },
    create: {
      interviewId: interview.id,
      summary: reportData.summary,
      competenciesJson: JSON.stringify(reportData.competencies),
      unansweredRequirementsJson: JSON.stringify(reportData.unansweredRequirements),
      limitationsJson: JSON.stringify(reportData.limitations),
      suggestedFollowUpsJson: JSON.stringify(reportData.suggestedFollowUps),
      humanReviewRequired: true,
      hrDecision: null, // Initial state: Requires Recruiter Sign-Off
    },
    update: {
      summary: reportData.summary,
      competenciesJson: JSON.stringify(reportData.competencies),
      unansweredRequirementsJson: JSON.stringify(reportData.unansweredRequirements),
      limitationsJson: JSON.stringify(reportData.limitations),
      suggestedFollowUpsJson: JSON.stringify(reportData.suggestedFollowUps),
      humanReviewRequired: true,
      updatedAt: new Date(),
    },
  });

  // 6. Delete previous evidences and link newly parsed competency quotes
  await prisma.interviewEvidence.deleteMany({
    where: { reportId: upsertedReport.id },
  });

  const evidenceRecords = [];
  for (const comp of reportData.competencies) {
    for (const quote of comp.evidence) {
      evidenceRecords.push({
        reportId: upsertedReport.id,
        skill: comp.skill,
        quote: quote,
        context: `${comp.assessment}: ${comp.limitations?.[0] || "Demonstrated in technical interview discussion."}`,
        confidence: 0.92,
      });
    }
  }

  if (evidenceRecords.length > 0) {
    await prisma.interviewEvidence.createMany({
      data: evidenceRecords,
    });
  }

  // 7. Update Interview status to COMPLETED if it was SCHEDULED
  if (interview.status === "SCHEDULED" || interview.status === "IN_PROGRESS") {
    await prisma.interview.update({
      where: { id: interview.id },
      data: { status: "COMPLETED" },
    });
  }

  // 8. Record Immutable Audit Log
  await prisma.auditLog.create({
    data: {
      userId: actorId || null,
      action: "INTERVIEW_REPORT_SYNTHESIZED",
      entityType: "InterviewReport",
      entityId: upsertedReport.id,
      detailsJson: JSON.stringify({
        candidate: candidateName,
        jobTitle,
        competenciesObserved: reportData.competencies.length,
        isSimulated: transcript.isSimulated,
        humanReviewRequired: true,
      }),
    },
  });

  const fullReport = await prisma.interviewReport.findUnique({
    where: { id: upsertedReport.id },
    include: { evidences: true },
  });

  return {
    success: true,
    report: fullReport,
    consentGranted: true,
    isSimulatedTranscript: transcript.isSimulated,
  };
}
