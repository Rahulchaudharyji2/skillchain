import {
  FileText,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Video,
  User,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ReportReviewClient } from "./ReportReviewClient";

export default async function RecruiterReportsPage() {
  const reports = await prisma.interviewReport.findMany({
    include: {
      interview: {
        include: {
          application: {
            include: {
              job: true,
              studentProfile: { include: { user: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <FileText className="w-3.5 h-3.5" />
          <span>Synthesis & Assessment</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          AI Interview Summaries & HR Sign-Off
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Structured interview summaries synthesized from permitted transcript text. Evaluates
          demonstrated competencies against job requirements without automated biometric decisions.
        </p>
      </div>

      <div className="space-y-6">
        {reports.map((report) => {
          let competencies: any[] = [];
          try {
            competencies = JSON.parse(report.competenciesJson);
          } catch {
            // fallback
          }

          let unanswered: string[] = [];
          try {
            unanswered = JSON.parse(report.unansweredRequirementsJson);
          } catch {
            // fallback
          }

          const candidate = report.interview.application.studentProfile.user;
          const job = report.interview.application.job;

          return (
            <div key={report.id} className="card-premium p-6 sm:p-8 bg-white border border-cream-300 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cream-200 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400">
                    Role: {job.title}
                  </span>
                  <h2 className="text-lg font-bold text-forest-950">
                    Candidate: {candidate.name}
                  </h2>
                  <p className="text-xs text-stone-500">
                    Interviewed {formatDate(report.interview.scheduledAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      report.hrDecision === "APPROVED"
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        : report.hrDecision === "REJECTED"
                        ? "bg-red-100 text-red-900"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    HR STATUS: {report.hrDecision || "NEEDS REVIEW"}
                  </span>
                </div>
              </div>

              {/* Summary Statement */}
              <div className="p-4 rounded-xl bg-cream-50 border border-cream-200 text-xs text-stone-700 space-y-2">
                <span className="font-bold text-forest-950 block">AI Executive Summary:</span>
                <p className="leading-relaxed">{report.summary}</p>
              </div>

              {/* Competencies Observed */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
                  Competency Evidence Observed:
                </span>
                <div className="space-y-3">
                  {competencies.map((comp: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-white border border-cream-300 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-forest-950 text-sm">{comp.skill}</span>
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          {comp.assessment}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-stone-400 uppercase">Supporting Evidence:</span>
                        <ul className="list-disc list-inside text-stone-600 text-[11px] space-y-0.5">
                          {comp.evidence.map((ev: string, j: number) => (
                            <li key={j}>{ev}</li>
                          ))}
                        </ul>
                      </div>
                      {comp.followUpQuestions && comp.followUpQuestions.length > 0 && (
                        <div className="pt-1 text-[11px] text-ochre-900 font-medium">
                          Suggested Follow-Up: {comp.followUpQuestions[0]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Unanswered Requirements */}
              {unanswered.length > 0 && (
                <div className="p-3 rounded-lg bg-cream-50 border border-cream-200 text-xs text-stone-600">
                  <span className="font-bold text-stone-700 block mb-1">Unaddressed Job Requirements:</span>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5">
                    {unanswered.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* HR Review Client */}
              <ReportReviewClient
                reportId={report.id}
                initialDecision={report.hrDecision}
                initialNotes={report.hrNotes}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
