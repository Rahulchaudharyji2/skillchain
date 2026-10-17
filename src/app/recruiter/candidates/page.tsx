import Link from "next/link";
import {
  Users,
  Search,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Award,
  ArrowRight,
  ExternalLink,
  FolderGit2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getEvidenceBadgeStyle } from "@/lib/utils";

export default async function RecruiterCandidatesPage() {
  const candidates = await prisma.studentProfile.findMany({
    include: {
      user: true,
      credentials: true,
      studentSkills: {
        include: { skill: true, evidences: true },
      },
      projects: true,
    },
    orderBy: { createdAt: "desc" },
  });

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
          coding assessments, and open-source GitHub projects.
        </p>
      </div>

      <div className="space-y-4">
        {candidates.map((cand) => {
          const verifiedSkills = cand.studentSkills.filter(
            (s) => s.verifiedByAssessment || s.verifiedByDegree
          );

          return (
            <div key={cand.id} className="card-premium p-6 bg-white border border-cream-300 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-forest-900 text-cream-50 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {cand.user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-forest-950">
                        {cand.user.name}
                      </h2>
                      {cand.credentials.length > 0 && (
                        <span className="seal-badge text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-700" />
                          DEGREE VERIFIED
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-forest-800 mt-0.5">{cand.headline}</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {cand.universityName || "Self-Taught"} {cand.degree && `• ${cand.degree}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <Link
                    href={`/skills/${cand.publicPassportSlug}`}
                    target="_blank"
                    className="p-2 rounded-lg bg-cream-100 hover:bg-cream-200 text-forest-900 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Public Passport</span>
                  </Link>

                  <Link
                    href={`/recruiter/candidates/${cand.id}`}
                    className="px-4 py-2 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>Match Analysis</span>
                    <ArrowRight className="w-3.5 h-3.5 text-ochre-300" />
                  </Link>
                </div>
              </div>

              {/* Skills & Evidence row */}
              <div className="pt-3 border-t border-cream-100 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                  Verified Competencies & Evidence Types:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {cand.studentSkills.map((ss) => {
                    const badge = getEvidenceBadgeStyle(
                      ss.verifiedByAssessment
                        ? "ASSESSMENT"
                        : ss.verifiedByDegree
                        ? "UNIVERSITY_DEGREE"
                        : ss.evidences.length > 0
                        ? "PROJECT"
                        : "SELF_DECLARED"
                    );

                    return (
                      <span
                        key={ss.id}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${badge.className}`}
                      >
                        {ss.skill.name} ({badge.label})
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
