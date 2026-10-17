import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

interface JobPublicDetailPageProps {
  params: Promise<{ jobId: string }>;
}

export default async function JobPublicDetailPage({ params }: JobPublicDetailPageProps) {
  const { jobId } = await params;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      organization: true,
      requirements: { include: { skill: true } },
    },
  });

  if (!job) {
    notFound();
  }

  let responsibilities: string[] = [];
  try {
    responsibilities = JSON.parse(job.responsibilitiesJson);
  } catch {
    // fallback
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-8">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-forest-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to All Jobs</span>
      </Link>

      <div className="card-premium p-6 sm:p-8 bg-white border border-cream-300 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b border-cream-200 gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400">
              {job.organization.name}
            </span>
            <h1 className="text-2xl font-bold font-display text-forest-950 mt-1">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 mt-2">
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
            href="/student/jobs"
            className="px-5 py-2.5 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all flex-shrink-0"
          >
            <span>Apply with Skill Passport</span>
            <ArrowRight className="w-3.5 h-3.5 text-ochre-300" />
          </Link>
        </div>

        <div>
          <h2 className="text-xs uppercase font-bold tracking-wider text-forest-900 mb-1.5">
            Role Overview
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{job.overview}</p>
        </div>

        {responsibilities.length > 0 && (
          <div>
            <h2 className="text-xs uppercase font-bold tracking-wider text-forest-900 mb-2">
              Responsibilities
            </h2>
            <ul className="list-disc list-inside text-xs text-stone-600 space-y-1">
              {responsibilities.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h2 className="text-xs uppercase font-bold tracking-wider text-forest-900 mb-2">
            Skill Requirements
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {job.requirements.map((req) => (
              <div key={req.id} className="p-3 rounded-xl bg-cream-50 border border-cream-200 text-xs">
                <span className="font-bold text-forest-950 block">{req.skill.name}</span>
                <span className="text-stone-500 text-[11px] block">
                  Required Level: {req.requiredLevel} • Weight: {req.weight}x
                </span>
                {req.mustBeVerified && (
                  <span className="text-[10px] text-emerald-800 font-semibold block mt-0.5">
                    Verified Proof Required
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
