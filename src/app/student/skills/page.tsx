import Link from "next/link";
import { Sparkles, ShieldCheck, CheckCircle2, Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getEvidenceBadgeStyle } from "@/lib/utils";
import { AddSkillModal } from "./AddSkillModal";

export default async function StudentSkillsPage() {
  const user = await getCurrentUser();

  const [profile, allSkills] = await Promise.all([
    prisma.studentProfile.findFirst({
      where: {
        OR: [
          { userId: user?.id },
          { user: { email: user?.email || "alex.rivera@student.mit.edu" } },
        ],
      },
      include: {
        studentSkills: {
          include: {
            skill: { include: { category: true } },
            evidences: true,
          },
        },
      },
    }),
    prisma.skill.findMany({ select: { id: true, name: true } }),
  ]);

  const studentSkills = profile?.studentSkills || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Skills & Evidence Matrix</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
            Verified Competencies & Evidence
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            Strictly categorizes skills by proof type. Assessment-verified and degree-verified skills
            carry higher matching weight with recruiters.
          </p>
        </div>

        <AddSkillModal availableSkills={allSkills} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {studentSkills.map((ss) => {
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
            <div key={ss.id} className="card-premium p-5 bg-white border border-cream-300 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-forest-950 text-base">{ss.skill.name}</h3>
                  <p className="text-xs text-stone-500 font-medium">
                    {ss.skill.category.name} • {ss.proficiencyLevel}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.className}`}>
                  {badge.label}
                </span>
              </div>

              {/* Evidence details */}
              <div className="space-y-1.5 pt-2 border-t border-cream-100">
                {ss.evidences.length > 0 ? (
                  ss.evidences.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2.5 rounded-lg bg-cream-50 border border-cream-200 text-xs text-stone-700 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-forest-900 block">{ev.title}</span>
                        {ev.description && (
                          <span className="text-[11px] text-stone-500 block">{ev.description}</span>
                        )}
                      </div>
                      {ev.score && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded flex-shrink-0">
                          {ev.score}% Score
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-stone-400 italic">
                    Self-declared claim. Complete an assessment to verify this skill.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
