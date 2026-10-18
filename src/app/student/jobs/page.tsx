import Link from "next/link";
import {
  Briefcase,
  Building,
  MapPin,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Send,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { calculateCandidateMatch } from "@/lib/matching/engine";
import { ApplyButtonClient } from "./ApplyButtonClient";

export default async function StudentJobsPage() {
  const user = await getCurrentUser();

  const [profile, jobs] = await Promise.all([
    prisma.studentProfile.findFirst({
      where: {
        OR: [
          { userId: user?.id },
          { user: { email: user?.email || "alex.rivera@student.mit.edu" } },
        ],
      },
      include: {
        studentSkills: {
          include: { skill: true, evidences: true },
        },
        applications: { select: { jobId: true, currentStage: true } },
      },
    }),
    prisma.job.findMany({
      where: { status: "PUBLISHED" },
      include: {
        organization: true,
        requirements: { include: { skill: true } },
      },
    }),
  ]);

  const candidateSkills = (profile?.studentSkills || []).map((ss) => ({
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

  const appliedJobIds = new Set(profile?.applications.map((a) => a.jobId));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <Briefcase className="w-3.5 h-3.5" />
          <span>Verified Recruiter Opportunities</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          Explore Jobs & Match Explanations
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Jobs dynamically ranked by transparent, deterministic match scores based on your verified
          assessments, academic credentials, and project evidence.
        </p>
      </div>

      <div className="space-y-6">
        {jobs.map((job) => {
          const requirements = job.requirements.map((r) => ({
            skillName: r.skill.name,
            weight: r.weight,
            mustBeVerified: r.mustBeVerified,
            minScoreThreshold: r.minScoreThreshold,
          }));

          const match = calculateCandidateMatch(requirements, candidateSkills);
          const hasApplied = appliedJobIds.has(job.id);

          return (
            <div key={job.id} className="card-premium p-6 bg-white border border-cream-300 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-forest-900 text-cream-50 flex items-center justify-center font-bold text-base flex-shrink-0">
                    {job.organization.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">
                      {job.organization.name}
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-forest-950">{job.title}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {job.location} ({job.workArrangement})
                      </span>
                      {job.compensationRange && (
                        <span className="flex items-center gap-1 font-semibold text-forest-900">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                          {job.compensationRange}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Match Score Badge */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 flex-shrink-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                    Candidate Match
                  </span>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-extrabold font-mono flex items-center gap-1 ${
                      match.overallScore >= 80
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        : match.overallScore >= 55
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{match.overallScore}% MATCH</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">{job.overview}</p>

              {/* Match Explanation & Required Skills */}
              <div className="p-3.5 rounded-xl bg-cream-50 border border-cream-200 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-forest-800 block">
                  Why you match:
                </span>
                <p className="text-xs text-stone-600">{match.rationale}</p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {match.matchingSkills.map((m, i) => (
                    <span
                      key={i}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        m.verified
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {m.skillName} ({m.evidenceBadge})
                    </span>
                  ))}
                  {match.missingSkills.map((missing, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-400 line-through">
                      {missing} (Missing)
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-cream-100 flex items-center justify-between">
                <Link
                  href={`/jobs/${job.id}`}
                  className="text-xs font-semibold text-stone-500 hover:text-forest-900"
                >
                  View Full Job Specification
                </Link>

                <ApplyButtonClient
                  jobId={job.id}
                  hasApplied={hasApplied}
                  matchScore={match.overallScore}
                  missingSkills={match.missingSkills}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
