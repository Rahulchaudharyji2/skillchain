import Link from "next/link";
import { Briefcase, MapPin, DollarSign, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function PublicJobsPage() {
  const jobs = await prisma.job.findMany({
    where: { status: "PUBLISHED" },
    include: {
      organization: true,
      requirements: { include: { skill: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <Briefcase className="w-3.5 h-3.5" />
          <span>Verified Opportunities</span>
        </div>
        <h1 className="text-3xl font-display font-extrabold text-forest-950 mt-1">
          SkillChain Public Job Board
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
          Explore job requisitions where employers prioritize verified skills, university degrees, and
          proctored assessments over unverified resume claims.
        </p>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="card-premium p-6 bg-white border border-cream-300 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400">
                  {job.organization.name}
                </span>
                <h2 className="text-lg font-bold text-forest-950 mt-0.5">{job.title}</h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 mt-1">
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
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    Posted {formatDate(job.createdAt)}
                  </span>
                </div>
              </div>

              <Link
                href={`/jobs/${job.id}`}
                className="px-4 py-2 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all flex-shrink-0"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5 text-ochre-300" />
              </Link>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">{job.overview}</p>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-cream-100">
              {job.requirements.map((req) => (
                <span
                  key={req.id}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cream-50 text-forest-800 border border-cream-200"
                >
                  {req.skill.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
