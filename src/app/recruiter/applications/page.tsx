import Link from "next/link";
import { Send, Users, Sparkles, ArrowRight, Video } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ApplicationStageUpdaterClient } from "./ApplicationStageUpdaterClient";

export default async function RecruiterApplicationsPage() {
  const applications = await prisma.application.findMany({
    include: {
      job: true,
      studentProfile: { include: { user: true } },
      interviews: true,
    },
    orderBy: { matchScore: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <Send className="w-3.5 h-3.5" />
          <span>Talent Pipeline</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          Applicant Tracking & Match Progression
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Review candidates across all application stages. Update stages, trigger interview schedules,
          and inspect deterministic skill evidence.
        </p>
      </div>

      <div className="card-premium overflow-hidden bg-white border border-cream-300">
        <table className="w-full text-left text-xs">
          <thead className="bg-cream-100/70 border-b border-cream-200 text-stone-600 uppercase tracking-wider text-[10px] font-bold">
            <tr>
              <th className="py-3 px-4">Candidate</th>
              <th className="py-3 px-4">Job Role</th>
              <th className="py-3 px-4">Match Score</th>
              <th className="py-3 px-4">Applied Date</th>
              <th className="py-3 px-4">Hiring Stage</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100">
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-cream-50/60 transition-colors">
                <td className="py-3.5 px-4">
                  <span className="font-bold text-forest-950 block">
                    {app.studentProfile.user.name}
                  </span>
                  <span className="text-[11px] text-stone-400 block">
                    {app.studentProfile.user.email}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-medium text-forest-900">{app.job.title}</td>
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                      app.matchScore >= 80
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {app.matchScore}%
                  </span>
                </td>
                <td className="py-3.5 px-4 text-stone-500">{formatDate(app.appliedAt)}</td>
                <td className="py-3.5 px-4">
                  <ApplicationStageUpdaterClient
                    applicationId={app.id}
                    currentStage={app.currentStage}
                  />
                </td>
                <td className="py-3.5 px-4 text-right">
                  <Link
                    href={`/recruiter/candidates/${app.studentProfile.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-forest-800 hover:text-forest-950"
                  >
                    <span>Match Deep Dive</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
