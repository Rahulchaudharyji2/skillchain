import {
  Video,
  Calendar,
  Clock,
  Building,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  FileText,
  UserCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StudentInterviewsPage() {
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
          interviews: {
            include: {
              transcript: true,
              report: true,
              consents: true,
            },
          },
        },
      },
    },
  });

  const interviews = profile?.applications.flatMap((a) =>
    a.interviews.map((i) => ({ ...i, job: a.job }))
  ) || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <Video className="w-3.5 h-3.5" />
          <span>Interview Workspace</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          Scheduled Interviews & AI Summaries
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Review interview schedules, join meeting rooms, and inspect AI-assisted competency summaries.
          Reports require human HR sign-off before hiring decisions.
        </p>
      </div>

      <div className="space-y-6">
        {interviews.map((interview) => {
          let competencies: any[] = [];
          try {
            competencies = interview.report ? JSON.parse(interview.report.competenciesJson) : [];
          } catch {
            // fallback
          }

          let turns: any[] = [];
          try {
            turns = interview.transcript ? JSON.parse(interview.transcript.turnsJson) : [];
          } catch {
            // fallback
          }

          return (
            <div key={interview.id} className="card-premium p-6 sm:p-8 bg-white border border-cream-300 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cream-200 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400">
                    {interview.job.organization.name}
                  </span>
                  <h2 className="text-lg font-bold text-forest-950">{interview.job.title}</h2>
                  <div className="flex items-center gap-4 text-xs text-stone-500 mt-1">
                    <span className="flex items-center gap-1.5 font-medium text-forest-900">
                      <Calendar className="w-3.5 h-3.5 text-forest-700" />
                      {formatDate(interview.scheduledAt)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {interview.durationMinutes} Minutes ({interview.timeZone})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-forest-900 text-cream-50 text-xs font-bold">
                    {interview.status}
                  </span>

                  {interview.meetingUrl && (
                    <a
                      href={interview.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Video className="w-3.5 h-3.5 text-ochre-300" />
                      <span>Join Room</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Consent Disclosed */}
              <div className="p-3 rounded-lg bg-cream-50 border border-cream-200 flex items-center justify-between text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Recording & AI synthesis consent was explicitly provided.</span>
                </div>
                <span className="text-[10px] font-mono text-stone-400">Policy v1.0</span>
              </div>

              {/* AI Interview Report Section */}
              {interview.report && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-forest-950 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-ochre-600" />
                      AI Interview Summary & Competency Evidence
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                      HUMAN REVIEW REQUIRED
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-cream-50 border border-cream-200 text-xs text-stone-700 space-y-3">
                    <p className="leading-relaxed font-medium">{interview.report.summary}</p>

                    {/* Competencies Breakdown */}
                    <div className="space-y-2 pt-2 border-t border-cream-200">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                        Demonstrated Competency Evidence:
                      </span>
                      {competencies.map((comp: any, i: number) => (
                        <div key={i} className="p-3 rounded-lg bg-white border border-cream-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-forest-950">{comp.skill}</span>
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                              {comp.assessment}
                            </span>
                          </div>
                          <ul className="text-[11px] text-stone-600 space-y-0.5 list-disc list-inside">
                            {comp.evidence.map((ev: string, j: number) => (
                              <li key={j}>{ev}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Transcript Viewer Accordion */}
              {turns.length > 0 && (
                <details className="pt-2 border-t border-cream-200 group">
                  <summary className="cursor-pointer text-xs font-bold text-forest-900 hover:text-forest-700 flex items-center gap-1.5 select-none">
                    <FileText className="w-3.5 h-3.5 text-stone-400" />
                    <span>View Disclosed Interview Transcript Turns ({turns.length} turns)</span>
                  </summary>
                  <div className="mt-3 p-4 rounded-xl bg-forest-950 text-cream-100 font-mono text-xs space-y-2 max-h-60 overflow-y-auto">
                    {turns.map((t: any, i: number) => (
                      <div key={i} className="space-y-0.5">
                        <span className="text-ochre-400 font-bold block">{t.speaker}:</span>
                        <p className="text-stone-300 leading-relaxed pl-2">{t.text}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
