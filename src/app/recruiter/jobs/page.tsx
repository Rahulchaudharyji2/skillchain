import Link from "next/link";
import {
  Briefcase,
  Users,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MapPin,
  Calendar,
  DollarSign,
  Plus,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function RecruiterJobsPage() {
  const jobs = await prisma.job.findMany({
    include: {
      organization: true,
      applications: true,
      requirements: { include: { skill: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Job Requisitions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
            Active Job Postings
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            Manage your open roles, review applicant match scores, and update candidate stages.
          </p>
        </div>

        <Link
          href="/recruiter/jobs/new"
          className="px-4 py-2.5 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-ochre-300" />
          <span>Create New Job with AI</span>
        </Link>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="card-premium p-6 bg-white border border-cream-300 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-stone-400">
                    {job.organization.name}
                  </span>
                  {job.aiGenerated && (
                    <span className="text-[10px] font-bold text-ochre-800 bg-ochre-100 px-1.5 py-0.2 rounded flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI Synthesized
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-forest-950 mt-0.5">{job.title}</h2>
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

              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <span className="text-xl font-bold font-display text-forest-950 block">
                    {job.applications.length}
                  </span>
                  <span className="text-[10px] text-stone-400 uppercase font-semibold">
                    Applicants
                  </span>
                </div>

                <Link
                  href={`/recruiter/jobs/${job.id}`}
                  className="px-4 py-2 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
                >
                  <span>Review Candidates</span>
                  <ArrowRight className="w-3.5 h-3.5 text-ochre-300" />
                </Link>
              </div>
            </div>

            {/* Required Skills tags */}
            <div className="pt-3 border-t border-cream-100 flex flex-wrap gap-1.5">
              {job.requirements.map((req) => (
                <span
                  key={req.id}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cream-50 text-forest-800 border border-cream-200"
                >
                  {req.skill.name} (Weight: {req.weight}x)
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
