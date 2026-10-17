import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Users,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  MapPin,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

interface JobDetailPageProps {
  params: Promise<{ jobId: string }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { jobId } = await params;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      organization: true,
      requirements: { include: { skill: true } },
      applications: {
        include: {
          studentProfile: { include: { user: true } },
          interviews: true,
        },
        orderBy: { matchScore: "desc" },
      },
    },
  });

  if (!job) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link
        href="/recruiter/jobs"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-forest-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to All Postings</span>
      </Link>

      <div className="card-premium p-6 sm:p-8 bg-white border border-cream-300 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-cream-200">
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400">
              {job.organization.name}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-forest-950 mt-1">
              {job.title}
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              {job.location} ({job.workArrangement}) • {job.compensationRange} • {job.seniorityLevel}
            </p>
          </div>

          <span className="seal-badge text-[10px] font-bold px-3 py-1 rounded-full">
            STATUS: {job.status}
          </span>
        </div>

        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-forest-900 mb-1.5">
            Role Overview
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">{job.overview}</p>
        </div>

        {/* Required Skills & Weights */}
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-forest-900 mb-2">
            Skill Requirements & Matching Weights
          </h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {job.requirements.map((req) => (
              <div key={req.id} className="p-3 rounded-lg bg-cream-50 border border-cream-200 text-xs">
                <span className="font-bold text-forest-950 block">{req.skill.name}</span>
                <span className="text-[11px] text-stone-500 block">
                  Weight: {req.weight}x • Level: {req.requiredLevel}
                </span>
                {req.mustBeVerified && (
                  <span className="text-[10px] text-emerald-800 font-semibold block mt-0.5">
                    Must Be Verified Proof
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Candidate Pipeline for this Job */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-forest-950 flex items-center gap-2">
          <Users className="w-4 h-4 text-forest-800" />
          <span>Candidate Applicants ({job.applications.length})</span>
        </h2>

        <div className="space-y-3">
          {job.applications.map((app) => (
            <div
              key={app.id}
              className="card-premium p-4 sm:p-5 bg-white border border-cream-300 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-forest-900 text-cream-50 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {app.studentProfile.user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-forest-950 text-sm">
                    {app.studentProfile.user.name}
                  </h3>
                  <span className="text-xs text-stone-500 block">
                    {app.studentProfile.headline || app.studentProfile.user.email}
                  </span>
                  <span className="text-[10px] text-stone-400 block">
                    Applied on {formatDate(app.appliedAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                      app.matchScore >= 80
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {app.matchScore}% MATCH
                  </span>
                  <span className="text-[10px] text-stone-500 block mt-0.5">
                    Stage: {app.currentStage.replace("_", " ")}
                  </span>
                </div>

                <Link
                  href={`/recruiter/candidates/${app.studentProfile.id}`}
                  className="px-3.5 py-1.5 rounded-lg bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
                >
                  <span>Explain Match</span>
                  <ArrowRight className="w-3.5 h-3.5 text-ochre-300" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
