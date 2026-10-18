import Link from "next/link";
import { Send, Users, Sparkles, ArrowRight, Video, Briefcase, Lock, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { RecruiterJobApplicantsClient } from "./RecruiterJobApplicantsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RecruiterApplicationsPage() {
  const user = await getCurrentUser();

  // Find recruiter's organization
  let recruiterOrg = null;
  if (user) {
    if (user.organization?.id) {
      recruiterOrg = await prisma.organization.findUnique({
        where: { id: user.organization.id },
      });
    } else {
      const membership = await prisma.organizationMember.findFirst({
        where: { userId: user.id },
        include: { organization: true },
      });
      recruiterOrg = membership?.organization || (await prisma.organization.findFirst({ where: { type: "EMPLOYER" } }));
    }
  }

  // Fetch jobs for recruiter org or all published jobs
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { applications: true },
      },
    },
  });

  // Fetch all applications with job, student profile, assessments/marks, unlock status, and interviews
  const applications = await prisma.application.findMany({
    include: {
      job: true,
      studentProfile: {
        include: {
          user: true,
          assessmentAttempts: {
            where: { status: "GRADED" },
            include: {
              assessment: true,
              assessmentResult: true,
            },
            orderBy: { score: "desc" },
          },
          credentials: true,
          profileUnlocks: {
            where: recruiterOrg ? { organizationId: recruiterOrg.id } : undefined,
          },
        },
      },
      interviews: true,
    },
    orderBy: { matchScore: "desc" },
  });

  // Serialize applications with marks and unlock state
  const serializedApplications = applications.map((app) => {
    const isUnlocked = app.studentProfile.profileUnlocks.length > 0;
    const attempts = app.studentProfile.assessmentAttempts;

    return {
      id: app.id,
      jobId: app.job.id,
      jobTitle: app.job.title,
      studentProfileId: app.studentProfile.id,
      candidateName: app.studentProfile.user.name,
      candidateEmail: isUnlocked
        ? app.studentProfile.user.email
        : app.studentProfile.user.email.replace(/(.{2})(.*)(@.*)/, "$1•••$3"),
      headline: app.studentProfile.headline,
      matchScore: app.matchScore,
      currentStage: app.currentStage,
      appliedAt: app.appliedAt.toISOString(),
      isUnlocked,
      assessmentMarks: attempts.map((att) => ({
        id: att.id,
        assessmentTitle: att.assessment.title,
        score: att.score,
        passed: att.passed,
        percentageScore: att.assessmentResult?.percentageScore || att.score,
      })),
      hasInterview: app.interviews.length > 0,
      interviewCount: app.interviews.length,
      hasDegree: app.studentProfile.credentials.some((c) => c.credentialType === "DEGREE"),
    };
  });

  const serializedJobs = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    applicationsCount: j._count.applications,
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <RecruiterJobApplicantsClient
        initialApplications={serializedApplications}
        jobs={serializedJobs}
        orgTokens={recruiterOrg?.tokenBalance ?? 50}
      />
    </div>
  );
}
