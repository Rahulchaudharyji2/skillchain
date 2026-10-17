import Link from "next/link";
import { Video, Calendar, Clock, ArrowRight, ExternalLink, ShieldCheck, User } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function RecruiterInterviewsPage() {
  const interviews = await prisma.interview.findMany({
    include: {
      application: {
        include: {
          job: true,
          studentProfile: { include: { user: true } },
        },
      },
      report: true,
    },
    orderBy: { scheduledAt: "asc" },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <Video className="w-3.5 h-3.5" />
          <span>Interviews & Sessions</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          Candidate Interviews Workspace
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Coordinate technical evaluations, launch meeting rooms, and access AI-generated interview
          competency reports.
        </p>
      </div>

      <div className="space-y-4">
        {interviews.map((interview) => {
          const candidate = interview.application.studentProfile.user;
          const job = interview.application.job;

          return (
            <div key={interview.id} className="card-premium p-6 bg-white border border-cream-300 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-forest-900 text-ochre-300 flex items-center justify-center font-bold flex-shrink-0">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">
                      {job.title}
                    </span>
                    <h2 className="text-base font-bold text-forest-950">{candidate.name}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1">
                      <span className="flex items-center gap-1 font-medium text-forest-900">
                        <Calendar className="w-3.5 h-3.5 text-forest-700" />
                        {formatDate(interview.scheduledAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {interview.durationMinutes} Minutes
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="px-3 py-1 rounded-full bg-forest-900 text-cream-50 text-xs font-bold">
                    {interview.status}
                  </span>

                  {interview.meetingUrl && (
                    <a
                      href={interview.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-lg bg-cream-100 hover:bg-cream-200 text-forest-900 text-xs font-semibold flex items-center gap-1"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Room</span>
                    </a>
                  )}

                  {interview.report && (
                    <Link
                      href="/recruiter/reports"
                      className="px-3.5 py-1.5 rounded-lg bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-1"
                    >
                      <span>Review AI Report</span>
                      <ArrowRight className="w-3.5 h-3.5 text-ochre-300" />
                    </Link>
                  )}
                </div>
              </div>

              {interview.notes && (
                <div className="p-3 rounded-lg bg-cream-50 border border-cream-200 text-xs text-stone-600">
                  <span className="font-semibold text-forest-900 block mb-0.5">Focus Notes:</span>
                  <p>{interview.notes}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
