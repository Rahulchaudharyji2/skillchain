import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CandidateDetailClient } from "./CandidateDetailClient";

interface CandidateDetailPageProps {
  params: Promise<{ studentId: string }>;
  searchParams?: Promise<{ jobId?: string }>;
}

export default async function CandidateDetailPage({
  params,
  searchParams,
}: CandidateDetailPageProps) {
  const { studentId } = await params;
  const sp = searchParams ? await searchParams : {};
  const initialJobId = sp?.jobId;

  const [profile, publishedJobs] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        credentials: { include: { organization: true } },
        studentSkills: {
          include: { skill: true, evidences: true },
        },
        projects: true,
      },
    }),
    prisma.job.findMany({
      where: { status: "PUBLISHED" },
      include: {
        requirements: { include: { skill: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!profile) {
    notFound();
  }

  const candidateSkills = profile.studentSkills.map((ss) => ({
    skillName: ss.skill.name,
    verifiedByAssessment: ss.verifiedByAssessment,
    verifiedByDegree: ss.verifiedByDegree,
    isSelfDeclared: ss.isSelfDeclared,
    evidences: ss.evidences.map((e) => ({
      evidenceType: e.evidenceType,
      title: e.title,
      description: e.description,
      score: e.score,
    })),
  }));

  const serializedJobs = publishedJobs.map((j) => ({
    id: j.id,
    title: j.title,
    seniorityLevel: j.seniorityLevel,
    location: j.location,
    requirements: j.requirements.map((r) => ({
      skill: { name: r.skill.name },
      weight: r.weight,
      mustBeVerified: r.mustBeVerified,
      minScoreThreshold: r.minScoreThreshold,
    })),
  }));

  const serializedProfile = {
    id: profile.id,
    headline: profile.headline,
    bio: profile.bio,
    universityName: profile.universityName,
    degree: profile.degree,
    user: {
      name: profile.user.name,
      email: profile.user.email,
    },
    credentials: profile.credentials.map((c) => ({
      id: c.id,
      title: c.title,
      grade: c.grade,
      status: c.status,
      organization: { name: c.organization.name },
    })),
    projects: profile.projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      techStack: p.techStack,
    })),
  };

  return (
    <CandidateDetailClient
      profile={serializedProfile}
      candidateSkills={candidateSkills}
      publishedJobs={serializedJobs}
      initialJobId={initialJobId}
    />
  );
}
