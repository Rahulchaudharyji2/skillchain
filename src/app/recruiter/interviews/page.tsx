import { Video, Calendar, Clock, ShieldCheck, User } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { InterviewActionsClient } from "./InterviewActionsClient";
import { meetingProviderService } from "@/lib/interviews/meeting-provider";

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
      consents: true,
    },
    orderBy: { scheduledAt: "asc" },
  });

  const activeProvider = meetingProviderService.getProviderInfo();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            competency reports with mandatory consent validation.
          </p>
        </div>

        {/* Global provider configuration indicator */}
        <div className="p-3 rounded-xl bg-white border border-cream-300 text-xs text-stone-600 flex items-center gap-3 shadow-xs">
          <div className={`w-2.5 h-2.5 rounded-full ${activeProvider.isReal ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
          <div>
            <span className="font-bold text-forest-950 block text-[11px]">Meeting Provider:</span>
            <span className="text-[10px] text-stone-500">{activeProvider.label}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {interviews.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-cream-300 space-y-3">
            <Video className="w-8 h-8 text-stone-400 mx-auto" />
            <p className="text-sm font-bold text-forest-950">No interviews scheduled yet</p>
            <p className="text-xs text-stone-500">
              Navigate to the Candidate Directory to schedule technical interview rounds.
            </p>
          </div>
        ) : (
          interviews.map((interview) => {
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
                          {interview.durationMinutes} Minutes ({interview.timeZone})
                        </span>
                      </div>
                    </div>
                  </div>

                  <InterviewActionsClient
                    interviewId={interview.id}
                    hasReport={!!interview.report}
                    meetingUrl={interview.meetingUrl}
                    recordingConsentGiven={interview.recordingConsentGiven}
                  />
                </div>

                {interview.notes && (
                  <div className="p-3 rounded-lg bg-cream-50 border border-cream-200 text-xs text-stone-600">
                    <span className="font-semibold text-forest-900 block mb-0.5">Focus Notes:</span>
                    <p>{interview.notes}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
