import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CandidateSearchClient } from "./CandidateSearchClient";

export default async function RecruiterCandidatesPage() {
  const [candidates, jobs] = await Promise.all([
    prisma.studentProfile.findMany({
      include: {
        user: true,
        credentials: true,
        studentSkills: {
          include: { skill: true, evidences: true },
        },
        projects: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.job.findMany({
      where: { status: "PUBLISHED" },
      include: {
        requirements: { include: { skill: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const serializedCandidates = candidates.map((cand) => ({
    id: cand.id,
    name: cand.user.name,
    headline: cand.headline,
    bio: cand.bio,
    universityName: cand.universityName,
    degree: cand.degree,
    publicPassportSlug: cand.publicPassportSlug,
    credentialsCount: cand.credentials.length,
    hasDegree: cand.credentials.some((c) => c.credentialType === "DEGREE"),
    skills: cand.studentSkills.map((ss) => ({
      skillName: ss.skill.name,
      verifiedByAssessment: ss.verifiedByAssessment,
      verifiedByDegree: ss.verifiedByDegree,
      isSelfDeclared: ss.isSelfDeclared,
      evidences: ss.evidences.map((e) => ({
        evidenceType: e.evidenceType,
        title: e.title,
        score: e.score,
      })),
    })),
    projectsCount: cand.projects.length,
  }));

  const serializedJobs = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    requirements: j.requirements.map((r) => ({
      skillName: r.skill.name,
      weight: r.weight,
      mustBeVerified: r.mustBeVerified,
    })),
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <Users className="w-3.5 h-3.5" />
          <span>Talent Discovery</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          Discover Verified Candidates
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Search candidate skill passports backed by academic degrees on Polygon Amoy, proctored
          coding assessments, and open-source GitHub projects. Filter by evidence tier or score against specific jobs in real-time.
        </p>
      </div>

      <CandidateSearchClient
        candidates={serializedCandidates}
        jobs={serializedJobs}
      />
    </div>
  );
}
