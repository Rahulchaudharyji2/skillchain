import Link from "next/link";
import {
  BookOpenCheck,
  Clock,
  Award,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Code2,
  Sparkles,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export default async function StudentAssessmentsPage() {
  const user = await getCurrentUser();

  const [assessments, userAttempts] = await Promise.all([
    prisma.assessment.findMany({
      where: { isActive: true },
      include: {
        category: true,
        skills: { include: { skill: true } },
        questions: { select: { id: true, type: true, points: true } },
      },
    }),
    prisma.assessmentAttempt.findMany({
      where: {
        studentProfile: {
          OR: [
            { userId: user?.id },
            { user: { email: user?.email || "alex.rivera@student.mit.edu" } },
          ],
        },
      },
      include: { assessmentResult: true },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <BookOpenCheck className="w-3.5 h-3.5" />
          <span>Skill Verification Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          Skill Assessments Catalog
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Take proctored coding and theoretical assessments to earn verifiable skill credentials.
          All tests feature server-side hidden test cases and sandboxed execution.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assessments.map((ass) => {
          const attempt = userAttempts.find((a) => a.assessmentId === ass.id && a.status === "GRADED");
          const isPassed = attempt?.passed;

          return (
            <div key={ass.id} className="card-premium p-6 bg-white border border-cream-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-forest-700 px-2 py-0.5 rounded bg-cream-100">
                    {ass.category.name}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      ass.difficulty === "ADVANCED"
                        ? "bg-purple-50 text-purple-800 border-purple-200"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200"
                    }`}
                  >
                    {ass.difficulty}
                  </span>
                </div>

                <h3 className="font-bold text-base text-forest-950 mb-1.5">{ass.title}</h3>
                <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                  {ass.instructions}
                </p>

                <div className="mt-4 pt-4 border-t border-cream-200 grid grid-cols-2 gap-2 text-xs text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>{ass.durationMinutes} Minutes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-stone-400" />
                    <span>{ass.passingThreshold}% Passing</span>
                  </div>
                </div>

                {/* Skills Tested */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {ass.skills.map((s) => (
                    <span key={s.id} className="text-[10px] px-2 py-0.5 rounded bg-cream-50 text-forest-800 font-medium border border-cream-200">
                      {s.skill.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-cream-200">
                {isPassed ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Passed ({attempt?.score}%)
                    </span>
                    <Link
                      href={`/student/attempts/${attempt?.id}`}
                      className="text-xs font-semibold text-forest-800 hover:text-forest-950 flex items-center gap-1"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <Link
                    href={`/student/assessments/${ass.id}`}
                    className="w-full py-2.5 rounded-lg bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Start Assessment</span>
                    <ArrowRight className="w-3.5 h-3.5 text-ochre-300" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
