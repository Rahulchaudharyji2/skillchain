import {
  FileText,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Quote,
  CheckCircle2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ReportReviewClient } from "./ReportReviewClient";

export default async function RecruiterReportsPage() {
  const reports = await prisma.interviewReport.findMany({
    include: {
      interview: {
        include: {
          transcript: true,
          application: {
            include: {
              job: true,
              studentProfile: { include: { user: true } },
            },
          },
        },
      },
      evidences: true,
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
          Structured interview summaries synthesized from candidate-permitted transcript text. Evaluates
          demonstrated competencies against job requirements with evidence citations and leaves all final decisions with the human recruiter.
        </p>
      </div>

      <div className="space-y-6">
        {reports.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-cream-300 space-y-3">
            <FileText className="w-8 h-8 text-stone-400 mx-auto" />
            <p className="text-sm font-bold text-forest-950">No interview reports available yet</p>
            <p className="text-xs text-stone-500">
              Schedule candidate interviews and generate AI evaluations from the Interviews workspace.
            </p>
          </div>
        ) : (
          reports.map((report) => {
            let competencies: any[] = [];
            try {
              competencies = JSON.parse(report.competenciesJson);
            } catch {
              competencies = [];
            }

            let unanswered: string[] = [];
            try {
              unanswered = JSON.parse(report.unansweredRequirementsJson);
            } catch {
              unanswered = [];
            }

            let limitations: string[] = [];
            try {
              limitations = JSON.parse(report.limitationsJson);
            } catch {
              limitations = [];
            }

            let suggestedFollowUps: string[] = [];
            try {
              suggestedFollowUps = JSON.parse(report.suggestedFollowUpsJson);
            } catch {
              suggestedFollowUps = [];
            }

            const candidate = report.interview.application.studentProfile.user;
            const job = report.interview.application.job;
            const isSimulated = report.interview.transcript?.isSimulated ?? true;

            return (
              <div key={report.id} className="card-premium p-6 sm:p-8 bg-white border border-cream-300 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cream-200 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-stone-400">
                        Role: {job.title}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isSimulated
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        }`}
                      >
                        {isSimulated ? "Simulated Demo Transcript" : "Live Provider Transcript"}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-forest-950 mt-0.5">
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
                          ? "bg-red-100 text-red-900 border border-red-300"
                          : "bg-amber-100 text-amber-900 border border-amber-300"
                      }`}
                    >
                      HR STATUS: {report.hrDecision || "NEEDS REVIEW"}
                    </span>
                  </div>
                </div>

                {/* Summary Statement */}
                <div className="p-4 rounded-xl bg-cream-50 border border-cream-200 text-xs text-stone-700 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-forest-950">
                    <Sparkles className="w-3.5 h-3.5 text-ochre-700" />
                    <span>AI Executive Summary:</span>
                  </div>
                  <p className="leading-relaxed">{report.summary}</p>
                </div>

                {/* Competencies Observed */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
                    Competency Evidence & Quote Citations:
                  </span>
                  <div className="grid gap-3">
                    {competencies.map((comp: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-white border border-cream-300 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-forest-950 text-sm">{comp.skill}</span>
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            {comp.assessment}
                          </span>
                        </div>
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                            Direct Transcript Evidence:
                          </span>
                          <ul className="space-y-1">
                            {comp.evidence.map((ev: string, j: number) => (
                              <li key={j} className="text-stone-700 text-[11px] flex items-start gap-1.5">
                                <Quote className="w-3 h-3 text-forest-700 flex-shrink-0 mt-0.5" />
                                <span>&ldquo;{ev}&rdquo;</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {comp.followUpQuestions && comp.followUpQuestions.length > 0 && (
                          <div className="pt-2 border-t border-cream-100 text-[11px] text-ochre-900 font-medium flex items-center gap-1.5">
                            <HelpCircle className="w-3 h-3 text-ochre-700 flex-shrink-0" />
                            <span>Follow-Up: {comp.followUpQuestions[0]}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Unanswered Requirements */}
                {unanswered.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <span className="font-bold text-amber-950 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                      <span>Unaddressed Job Requirements in Transcript:</span>
                    </span>
                    <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5 pl-1">
                      {unanswered.map((u, i) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Limitations */}
                {limitations.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 space-y-1">
                    <span className="font-bold text-stone-800 block text-[11px]">
                      AI Evaluation Scope & Limitations:
                    </span>
                    <ul className="list-disc list-inside text-[11px] space-y-0.5 pl-1">
                      {limitations.map((lim, i) => (
                        <li key={i}>{lim}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested Follow-Ups */}
                {suggestedFollowUps.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-cream-50 border border-cream-200 text-xs text-stone-700 space-y-1">
                    <span className="font-bold text-forest-950 block text-[11px]">
                      Recommended Follow-Up Action Items:
                    </span>
                    <ul className="list-disc list-inside text-[11px] space-y-0.5 pl-1">
                      {suggestedFollowUps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* HR Review Form */}
                <ReportReviewClient
                  reportId={report.id}
                  initialDecision={report.hrDecision}
                  initialNotes={report.hrNotes}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
