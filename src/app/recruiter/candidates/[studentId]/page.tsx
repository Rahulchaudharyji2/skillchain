import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  GraduationCap,
  FolderGit2,
  Award,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { calculateCandidateMatch } from "@/lib/matching/engine";
import { CandidateActionButtons } from "./CandidateActionButtons";
import { formatDate } from "@/lib/utils";

interface CandidateDetailPageProps {
  params: Promise<{ studentId: string }>;
}

export default async function CandidateDetailPage({ params }: CandidateDetailPageProps) {
  const { studentId } = await params;

  const [profile, primaryJob] = await Promise.all([
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
    prisma.job.findFirst({
      where: { status: "PUBLISHED" },
      include: {
        requirements: { include: { skill: true } },
      },
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

  const requirements = (primaryJob?.requirements || []).map((r) => ({
    skillName: r.skill.name,
    weight: r.weight,
    mustBeVerified: r.mustBeVerified,
    minScoreThreshold: r.minScoreThreshold,
  }));

  const match = calculateCandidateMatch(requirements, candidateSkills);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link
        href="/recruiter/candidates"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-forest-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Candidate Directory</span>
      </Link>

      {/* Top Profile Header */}
      <div className="card-premium p-6 sm:p-8 bg-white border border-cream-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-cream-200 gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-forest-900 text-cream-50 flex items-center justify-center font-bold text-xl flex-shrink-0">
              {profile.user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-forest-950">
                  {profile.user.name}
                </h1>
                {profile.credentials.length > 0 && (
                  <span className="seal-badge text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    ACADEMIC VERIFIED
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-forest-800 mt-0.5">{profile.headline}</p>
              <p className="text-xs text-stone-500 mt-0.5">
                {profile.universityName || "Independent"} {profile.degree && `• ${profile.degree}`}
              </p>
            </div>
          </div>

          <CandidateActionButtons
            studentProfileId={profile.id}
            candidateName={profile.user.name}
            defaultJobId={primaryJob?.id}
          />
        </div>

        <p className="text-xs text-stone-600 mt-4 leading-relaxed">{profile.bio}</p>
      </div>

      {/* Match Engine Explanation Card */}
      {primaryJob && (
        <div className="card-premium p-6 sm:p-8 bg-white border border-cream-300 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cream-200 gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-ochre-700">
                Deterministic Candidate Match Engine
              </span>
              <h2 className="text-base sm:text-lg font-bold text-forest-950">
                Alignment for: {primaryJob.title}
              </h2>
            </div>

            <div
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold font-mono flex items-center gap-1.5 ${
                match.overallScore >= 80
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                  : match.overallScore >= 55
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-stone-100 text-stone-700"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{match.overallScore}% MATCH SCORE</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cream-50 border border-cream-200 text-xs text-stone-700 space-y-2">
            <span className="font-bold text-forest-950 block">Deterministic Match Rationale:</span>
            <p className="leading-relaxed">{match.rationale}</p>
          </div>

          {/* Detailed Skill Evidence Breakdown */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
              Requirements vs Verified Evidence:
            </span>
            <div className="space-y-2">
              {match.matchingSkills.map((m, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-cream-50 border border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-bold text-forest-950 text-sm block">{m.skillName}</span>
                    <span className="text-[11px] text-stone-500 block">{m.details}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        m.verified
                          ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {m.evidenceBadge}
                    </span>
                    <span className="font-mono text-xs font-bold text-forest-900">
                      Score: {m.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* University Credentials & Projects */}
      <div className="grid md:grid-cols-2 gap-6">
        {profile.credentials.length > 0 && (
          <div className="card-premium p-6 bg-white border border-cream-300 space-y-3">
            <h3 className="font-bold text-sm text-forest-950 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-forest-800" />
              University Credentials
            </h3>
            {profile.credentials.map((c) => (
              <div key={c.id} className="p-3 rounded-lg bg-cream-50 border border-cream-200 text-xs">
                <span className="font-bold text-forest-950 block">{c.title}</span>
                <span className="text-stone-500 block">{c.organization.name} • {c.grade}</span>
                <span className="text-[10px] font-mono text-emerald-700 block mt-1">
                  On-Chain Status: {c.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {profile.projects.length > 0 && (
          <div className="card-premium p-6 bg-white border border-cream-300 space-y-3">
            <h3 className="font-bold text-sm text-forest-950 flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-sky-700" />
              Verified Code Projects
            </h3>
            {profile.projects.map((p) => (
              <div key={p.id} className="p-3 rounded-lg bg-cream-50 border border-cream-200 text-xs">
                <span className="font-bold text-forest-950 block">{p.title}</span>
                <p className="text-stone-600 text-[11px] mt-0.5">{p.description}</p>
                <span className="text-[10px] font-mono text-stone-400 block mt-1">
                  Stack: {p.techStack}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
