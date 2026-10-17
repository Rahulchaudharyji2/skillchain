import Link from "next/link";
import {
  Send,
  Building,
  CheckCircle2,
  Clock,
  Video,
  ChevronRight,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";

export default async function StudentApplicationsPage() {
  const user = await getCurrentUser();

  const profile = await prisma.studentProfile.findFirst({
    where: {
      OR: [
        { userId: user?.id },
        { user: { email: user?.email || "alex.rivera@student.mit.edu" } },
      ],
    },
    include: {
      applications: {
        include: {
          job: { include: { organization: true } },
          stageEvents: { orderBy: { createdAt: "desc" } },
          interviews: true,
        },
      },
    },
  });

  const applications = profile?.applications || [];

  const stages = [
    "APPLIED",
    "UNDER_REVIEW",
    "SHORTLISTED",
    "INTERVIEW_SCHEDULED",
    "INTERVIEW_COMPLETED",
    "SELECTED",
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <Send className="w-3.5 h-3.5" />
          <span>Application Pipeline</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          My Job Applications & Status Tracker
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Track stage progression, review interview invitations, and monitor recruiter review activity.
        </p>
      </div>

      <div className="space-y-6">
        {applications.map((app) => {
          const currentStageIndex = stages.indexOf(app.currentStage);

          return (
            <div key={app.id} className="card-premium p-6 sm:p-8 bg-white border border-cream-300 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cream-200 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400">
                    {app.job.organization.name}
                  </span>
                  <h2 className="text-lg font-bold text-forest-950">{app.job.title}</h2>
                  <p className="text-xs text-stone-500">
                    Applied on {formatDate(app.appliedAt)} • Match Score: {app.matchScore}%
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-forest-900 text-cream-50 text-xs font-bold tracking-wide">
                    STAGE: {app.currentStage.replace("_", " ")}
                  </span>
                  {app.interviews.length > 0 && (
                    <Link
                      href="/student/interviews"
                      className="px-3 py-1 rounded-full bg-ochre-100 border border-ochre-300 text-ochre-900 text-xs font-bold flex items-center gap-1"
                    >
                      <Video className="w-3.5 h-3.5 text-ochre-700" />
                      <span>Interview Ready</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Stage Progress Stepper */}
              <div className="py-2">
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {stages.map((stageName, idx) => {
                    const isPassed = idx <= currentStageIndex;
                    const isCurrent = idx === currentStageIndex;

                    return (
                      <div
                        key={stageName}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isCurrent
                            ? "bg-forest-900 text-cream-50 border-forest-900 font-bold"
                            : isPassed
                            ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-medium"
                            : "bg-cream-50 text-stone-400 border-cream-200"
                        }`}
                      >
                        <span className="block text-[9px] uppercase tracking-wider opacity-75">
                          Step {idx + 1}
                        </span>
                        <span className="block text-[11px] truncate mt-0.5">
                          {stageName.replace("_", " ")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stage Events Log */}
              {app.stageEvents.length > 0 && (
                <div className="pt-2 border-t border-cream-100 space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block">
                    Stage Progression Events
                  </span>
                  <div className="space-y-1.5">
                    {app.stageEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-2 rounded-lg bg-cream-50 border border-cream-100 flex items-center justify-between text-xs text-stone-600"
                      >
                        <span>
                          Advanced from <strong>{ev.fromStage}</strong> to <strong>{ev.toStage}</strong>: {ev.notes}
                        </span>
                        <span className="text-stone-400 text-[11px] font-mono">
                          {formatDate(ev.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
