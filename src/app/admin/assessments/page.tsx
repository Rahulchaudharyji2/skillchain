import { BookOpenCheck, Clock, Award, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function AdminAssessmentsPage() {
  const assessments = await prisma.assessment.findMany({
    include: {
      category: true,
      questions: { include: { testCases: true } },
      attempts: true,
    },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
            <BookOpenCheck className="w-3.5 h-3.5" />
            <span>Evaluation Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
            Assessment Bank & Hidden Test Suites
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            Multi-domain questions and isolated sandboxed tests with server-side validation.
          </p>
        </div>

        <a
          href="/admin/assessments/reviews"
          className="px-4 py-2 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
        >
          <ShieldCheck className="w-4 h-4 text-ochre-300" />
          <span>Human Review Queue</span>
        </a>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {assessments.map((ass) => (
          <div key={ass.id} className="card-premium p-6 bg-white border border-cream-300 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400">
                  {ass.category.name}
                </span>
                <h2 className="text-base font-bold text-forest-950">{ass.title}</h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                ACTIVE (v{ass.version})
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">{ass.instructions}</p>

            <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-xl bg-cream-50 text-xs">
              <div>
                <span className="text-[10px] text-stone-400 block">DURATION</span>
                <span className="font-bold text-forest-950">{ass.durationMinutes}m</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block">PASS THRESHOLD</span>
                <span className="font-bold text-emerald-800">{ass.passingThreshold}%</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block">QUESTIONS</span>
                <span className="font-bold text-forest-950">{ass.questions.length} Items</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">
                Questions in Bank:
              </span>
              {ass.questions.map((q, idx) => (
                <div key={q.id} className="p-2 rounded-lg bg-cream-50 text-[11px] text-stone-700 flex items-center justify-between">
                  <span>Q{idx + 1}: {q.type.replace("_", " ")}</span>
                  <span className="font-mono text-stone-500">{q.points} pts • {q.testCases.length} Test Cases</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
