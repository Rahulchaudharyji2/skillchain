"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Lock,
  Unlock,
  Sparkles,
  ArrowRight,
  Video,
  CheckCircle2,
  Calendar,
  Loader2,
  X,
  FileCheck,
  ShieldCheck,
  Send,
  Users,
} from "lucide-react";
import { ApplicationStageUpdaterClient } from "./ApplicationStageUpdaterClient";
import { formatDate } from "@/lib/utils";

interface AssessmentMark {
  id: string;
  assessmentTitle: string;
  score: number | null;
  passed: boolean;
  percentageScore: number | null;
}

interface ApplicationItem {
  id: string;
  jobId: string;
  jobTitle: string;
  studentProfileId: string;
  candidateName: string;
  candidateEmail: string;
  headline: string | null;
  matchScore: number;
  currentStage: string;
  appliedAt: string;
  isUnlocked: boolean;
  assessmentMarks: AssessmentMark[];
  hasInterview: boolean;
  interviewCount: number;
  hasDegree: boolean;
}

interface JobOption {
  id: string;
  title: string;
  applicationsCount: number;
}

interface RecruiterJobApplicantsClientProps {
  initialApplications: ApplicationItem[];
  jobs: JobOption[];
  orgTokens: number;
}

export function RecruiterJobApplicantsClient({
  initialApplications,
  jobs,
  orgTokens: initialOrgTokens,
}: RecruiterJobApplicantsClientProps) {
  const [selectedJobId, setSelectedJobId] = useState<string>("ALL");
  const [applications, setApplications] = useState<ApplicationItem[]>(initialApplications);
  const [tokens, setTokens] = useState(initialOrgTokens);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  // Quick 1:1 Schedule Modal State
  const [scheduleModalApp, setScheduleModalApp] = useState<ApplicationItem | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [interviewDate, setInterviewDate] = useState(() => {
    const d = new Date(Date.now() + 86400000 * 2);
    return d.toISOString().slice(0, 16);
  });
  const [meetingUrl, setMeetingUrl] = useState(
    "https://meet.skillchain.org/room/eval-" + Math.floor(100 + Math.random() * 900)
  );
  const [focusNotes, setFocusNotes] = useState(
    "Technical evaluation & 1:1 problem solving interview."
  );

  // Filter applications specifically by chosen job
  const filteredApplications = applications.filter((app) => {
    if (selectedJobId === "ALL") return true;
    return app.jobId === selectedJobId;
  });

  const handleUnlock = async (app: ApplicationItem) => {
    setUnlockingId(app.studentProfileId);
    try {
      const res = await fetch("/api/recruiter/unlock-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentProfileId: app.studentProfileId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof data.organizationTokenBalance === "number") {
          setTokens(data.organizationTokenBalance);
        }
        setApplications((prev) =>
          prev.map((item) =>
            item.studentProfileId === app.studentProfileId
              ? { ...item, isUnlocked: true }
              : item
          )
        );
      } else {
        alert(data.error || "Failed to unlock candidate profile");
      }
    } catch (err: any) {
      alert("Error: " + (err.message || "Failed to contact unlock API"));
    } finally {
      setUnlockingId(null);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleModalApp) return;
    setScheduleLoading(true);

    try {
      const res = await fetch("/api/recruiter/interviews/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentProfileId: scheduleModalApp.studentProfileId,
          jobId: scheduleModalApp.jobId,
          meetingUrl,
          scheduledAt: new Date(interviewDate).toISOString(),
          timeZone: "America/New_York",
          notes: focusNotes,
        }),
      });

      if (res.ok) {
        setApplications((prev) =>
          prev.map((item) =>
            item.id === scheduleModalApp.id
              ? {
                  ...item,
                  hasInterview: true,
                  interviewCount: item.interviewCount + 1,
                  currentStage: "INTERVIEW_SCHEDULED",
                }
              : item
          )
        );
        setScheduleModalApp(null);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to schedule interview");
      }
    } catch (err: any) {
      alert("Error scheduling interview: " + err.message);
    } finally {
      setScheduleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
            <Send className="w-3.5 h-3.5" />
            <span>Job Specific Talent Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
            Job Applicants & Verified Marks
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            Only students who explicitly applied to your job postings are listed. Review verified
            assessment marks and match scores. Unlock full profiles (5 tokens: 3 platform + 2 student) to schedule 1:1 interviews.
          </p>
        </div>

        {/* HR Token Balance */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-900 text-cream-50 text-xs font-semibold shadow-sm flex-shrink-0">
          <Sparkles className="w-4 h-4 text-ochre-300" />
          <span>
            HR Wallet Balance: <strong className="text-ochre-300 font-mono text-base ml-1">{tokens} Tokens</strong>
          </span>
        </div>
      </div>

      {/* Job Filter Selector Bar */}
      <div className="card-premium p-4 bg-white border border-cream-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Briefcase className="w-4 h-4 text-forest-800 flex-shrink-0" />
          <span className="text-xs font-bold text-forest-950">Select Job Posting:</span>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-cream-300 bg-cream-50 font-semibold text-forest-950 focus:outline-none focus:ring-1 focus:ring-forest-800"
          >
            <option value="ALL">All Jobs ({applications.length} applicants total)</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.applicationsCount} applicants)
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-stone-500">
          Showing <strong>{filteredApplications.length}</strong> applicant(s) for selected job
        </div>
      </div>

      {/* Applicants List Table */}
      <div className="card-premium overflow-hidden bg-white border border-cream-300 shadow-sm">
        {filteredApplications.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-8 h-8 text-stone-400 mx-auto" />
            <h3 className="text-sm font-bold text-forest-950">No Candidates Applied Yet</h3>
            <p className="text-xs text-stone-500">
              There are currently no job applications submitted for this specific position.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-cream-100/70 border-b border-cream-200 text-stone-600 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Job Role</th>
                <th className="py-3 px-4">Verified Test Marks</th>
                <th className="py-3 px-4">Match Score</th>
                <th className="py-3 px-4">Applied Date</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4 text-right">Profile & 1:1 Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {filteredApplications.map((app) => (
                <tr key={app.id} className="hover:bg-cream-50/60 transition-colors">
                  {/* Candidate info (masked email if locked) */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-forest-950 block text-sm">
                        {app.candidateName}
                      </span>
                      {app.hasDegree && (
                        <span className="seal-badge text-[9px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200">
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-700" />
                          DEGREE
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-stone-500 block mt-0.5">
                      {app.isUnlocked ? (
                        app.candidateEmail
                      ) : (
                        <span className="font-mono text-stone-400 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-amber-600" />
                          {app.candidateEmail}
                        </span>
                      )}
                    </span>
                  </td>

                  {/* Job */}
                  <td className="py-3.5 px-4 font-medium text-forest-900 max-w-[200px] truncate">
                    {app.jobTitle}
                  </td>

                  {/* Verified Marks & Test Scores (Highlights) */}
                  <td className="py-3.5 px-4">
                    {app.assessmentMarks.length > 0 ? (
                      <div className="space-y-1">
                        {app.assessmentMarks.slice(0, 2).map((mark) => (
                          <div
                            key={mark.id}
                            className="flex items-center gap-2 text-[11px]"
                          >
                            <span className="font-semibold text-forest-950 truncate max-w-[140px]">
                              {mark.assessmentTitle}:
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                                mark.score && mark.score >= 80
                                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                  : "bg-amber-100 text-amber-900"
                              }`}
                            >
                              {mark.score !== null ? `${mark.score}%` : "Completed"}
                            </span>
                          </div>
                        ))}
                        {app.assessmentMarks.length > 2 && (
                          <span className="text-[10px] text-stone-400 italic block">
                            +{app.assessmentMarks.length - 2} more test marks
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-stone-400 italic">
                        No proctored tests yet
                      </span>
                    )}
                  </td>

                  {/* Match Score */}
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

                  {/* Applied Date */}
                  <td className="py-3.5 px-4 text-stone-500 whitespace-nowrap">
                    {formatDate(app.appliedAt)}
                  </td>

                  {/* Stage Updater */}
                  <td className="py-3.5 px-4">
                    <ApplicationStageUpdaterClient
                      applicationId={app.id}
                      currentStage={app.currentStage}
                    />
                  </td>

                  {/* Action: Unlock / Schedule 1:1 */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {!app.isUnlocked ? (
                        <button
                          onClick={() => handleUnlock(app)}
                          disabled={unlockingId === app.studentProfileId}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1 shadow-sm transition-all"
                          title="Pay 5 Tokens: 3 to Platform + 2 to Student to see full profile & schedule"
                        >
                          {unlockingId === app.studentProfileId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-amber-200" />
                          )}
                          <span>Unlock Profile (5 Tokens)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setScheduleModalApp(app)}
                          className="px-3 py-1.5 rounded-lg bg-forest-900 hover:bg-forest-800 text-cream-50 font-semibold text-xs flex items-center gap-1 shadow-sm transition-all"
                        >
                          <Video className="w-3.5 h-3.5 text-ochre-300" />
                          <span>Schedule 1:1</span>
                        </button>
                      )}

                      <Link
                        href={`/recruiter/candidates/${app.studentProfileId}?jobId=${app.jobId}`}
                        className="p-1.5 rounded-lg text-forest-800 hover:bg-cream-200 transition-colors"
                        title="View Full Candidate Analysis"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 1:1 Interview Scheduling Modal */}
      {scheduleModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/40 backdrop-blur-sm animate-fade-in">
          <div className="card-premium w-full max-w-lg bg-white border border-cream-300 p-6 sm:p-8 space-y-5 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-forest-900" />
                <h3 className="text-base font-bold text-forest-950">
                  Schedule 1:1 Live Interview
                </h3>
              </div>
              <button
                onClick={() => setScheduleModalApp(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-cream-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Candidate & Selected Job
                </label>
                <div className="p-2.5 rounded-lg bg-cream-50 border border-cream-200 font-medium text-forest-950">
                  {scheduleModalApp.candidateName} — {scheduleModalApp.jobTitle}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Interview Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-cream-300 bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-forest-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  1:1 Meeting Room URL
                </label>
                <input
                  type="url"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-cream-300 bg-white text-stone-800 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-forest-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  HR Focus & Technical Topics
                </label>
                <textarea
                  rows={2}
                  value={focusNotes}
                  onChange={(e) => setFocusNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-cream-300 bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-forest-800"
                />
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  Once confirmed, this interview will immediately reflect on the candidate&apos;s <strong>Student Interview Portal</strong> and Student Dashboard.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-cream-200">
                <button
                  type="button"
                  onClick={() => setScheduleModalApp(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:bg-cream-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduleLoading}
                  className="px-5 py-2 rounded-lg bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  {scheduleLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Calendar className="w-3.5 h-3.5 text-ochre-300" />
                  )}
                  <span>Confirm & Send 1:1 Invitation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
