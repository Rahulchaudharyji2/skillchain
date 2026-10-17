import { Sparkles, Layers, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function AdminSkillsPage() {
  const categories = await prisma.skillCategory.findMany({
    include: {
      skills: {
        include: {
          studentSkills: true,
          assessmentSkills: true,
        },
      },
    },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Skill Ontology</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          Skill Categories & Ontology Matrix
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Standardized taxonomy mapping skills to university curricula, coding assessments, and job
          requirements.
        </p>
      </div>

      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat.id} className="card-premium p-6 bg-white border border-cream-300 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <div>
                <h2 className="text-base font-bold text-forest-950">{cat.name}</h2>
                <p className="text-xs text-stone-500">{cat.description}</p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cream-100 text-forest-900">
                {cat.skills.length} Registered Skills
              </span>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              {cat.skills.map((s) => (
                <div key={s.id} className="p-3 rounded-xl bg-cream-50 border border-cream-200 space-y-1">
                  <span className="font-bold text-forest-950 text-xs block">{s.name}</span>
                  <span className="text-[10px] text-stone-400 block font-mono">Slug: {s.slug}</span>
                  <span className="text-[10px] text-emerald-800 font-semibold block">
                    {s.studentSkills.length} Verified Students
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
