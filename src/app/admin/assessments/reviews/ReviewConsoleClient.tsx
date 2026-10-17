"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FileCode,
  Award,
  AlertTriangle,
  Send,
  Loader2,
  Calendar,
  Eye,
} from "lucide-react";

interface AttemptData {
  id: string;
  assessmentTitle: string;
  assessmentVersion: number;
  passingThreshold: number;
  candidateName: string;
  candidateEmail: string;
  status: string;
  score: number | null;
  passed: boolean;
  startedAt: string;
  submittedAt: string | null;
  proctoringEvents: {
    id: string;
    eventType: string;
    metadata: string | null;
    timestamp: string;
  }[];
  submissions: {
    questionText: string;
    type: string;
    studentAnswer: string | null;
    codeSolution: string | null;
    scoreEarned: number;
    passedTestCases: number;
    totalTestCases: number;
  }[];
  reviews: {
    id: string;
    decision: string;
    comments: string;
    reviewerName: string;
    resolvedAt: string;
  }[];
}

export function ReviewConsoleClient({ initialAttempts }: { initialAttempts: AttemptData[] }) {
  const [attempts, setAttempts] = useState<AttemptData[]>(initialAttempts);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(
    initialAttempts[0]?.id || null
  );

  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | "DISMISSED">("APPROVED");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const selectedAttempt = attempts.find((a) => a.id === selectedAttemptId);

  const handleSubmitReview = async () => {
    if (!selectedAttemptId || !comments.trim()) {
      alert("Please enter assessor notes/comments before submitting.");
      return;
    }

    setSubmitting(true);
    setActionMessage(null);

    try {
      const res = await fetch("/api/assessments/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: selectedAttemptId,
          decision,
          comments,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionMessage(
          `Review submitted successfully: Decision recorded as ${decision}.${
            data.credentialIssuanceResult?.success
              ? " Verified skill credential has been issued to student."
              : ""
          }`
        );

        // Update local state
        setAttempts((prev) =>
          prev.map((a) =>
            a.id === selectedAttemptId
              ? {
                  ...a,
                  status: decision === "REJECTED" ? "REJECTED" : "GRADED",
                  reviews: [
                    {
                      id: data.reviewId || "temp",
                      decision,
                      comments,
                      reviewerName: "You (Assessor)",
                      resolvedAt: new Date().toISOString(),
                    },
                    ...a.reviews,
                  ],
                }
              : a
          )
        );

        setComments("");
      } else {
        alert(data.error || "Review submission failed.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (attempts.length === 0) {
    return (
      <div className="card-premium p-12 bg-white border border-cream-300 text-center space-y-3">
        <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
        <h3 className="text-base font-bold text-forest-950">Review Queue Empty</h3>
        <p className="text-xs text-stone-500 max-w-sm mx-auto">
          No attempts currently require human integrity review. All sessions are compliant or have been resolved.
        </p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-12 gap-6">
      {/* Left Column: Attempt Selector */}
      <div className="lg:col-span-4 space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block px-1">
          Flagged Attempts ({attempts.length})
        </span>

        {attempts.map((att) => {
          const isSelected = att.id === selectedAttemptId;
          const flagCount = att.proctoringEvents.filter(
            (e) => e.eventType !== "CONSENT_GRANTED"
          ).length;

          return (
            <button
              key={att.id}
              onClick={() => {
                setSelectedAttemptId(att.id);
                setActionMessage(null);
              }}
              className={`w-full p-4 rounded-xl border text-left transition-all space-y-2 ${
                isSelected
                  ? "bg-forest-900 text-cream-50 border-forest-900 shadow-sm"
                  : "bg-white text-stone-800 border-cream-300 hover:bg-cream-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs truncate max-w-[170px]">
                  {att.candidateName}
                </span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    isSelected
                      ? "bg-forest-800 text-cream-100"
                      : att.status === "FLAGGED"
                      ? "bg-amber-100 text-amber-900 border border-amber-200"
                      : att.status === "REJECTED"
                      ? "bg-red-100 text-red-900"
                      : "bg-emerald-100 text-emerald-900"
                  }`}
                >
                  {att.status}
                </span>
              </div>

              <p className="text-[11px] opacity-80 truncate">{att.assessmentTitle}</p>

              <div className="flex items-center justify-between text-[10px] opacity-75 pt-1 border-t border-cream-200/20 font-mono">
                <span>Score: {att.score ?? "Pending"}%</span>
                <span className="flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  {flagCount} Flags
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Right Column: Detailed Review & Decision Inspector */}
      {selectedAttempt && (
        <div className="lg:col-span-8 space-y-5">
          {actionMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}

          {/* Header Card */}
          <div className="card-premium p-6 bg-white border border-cream-300 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream-200 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700">
                  Attempt Verification Dossier
                </span>
                <h2 className="text-lg font-bold text-forest-950">{selectedAttempt.candidateName}</h2>
                <span className="text-xs text-stone-500">{selectedAttempt.candidateEmail}</span>
              </div>

              <div className="text-right">
                <span className="text-xs text-stone-400 block">SCORE EARNED</span>
                <span className="text-2xl font-bold font-display text-forest-950">
                  {selectedAttempt.score}%
                </span>
                <span className="text-[10px] text-stone-500 block">
                  Threshold: {selectedAttempt.passingThreshold}%
                </span>
              </div>
            </div>

            {/* Proctoring Event Audit Timeline */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-forest-950 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Recorded Proctoring Events Timeline</span>
              </span>

              <div className="space-y-1.5 max-h-48 overflow-y-auto p-3 rounded-xl bg-cream-50 border border-cream-200 text-xs">
                {selectedAttempt.proctoringEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between p-2 rounded bg-white border border-cream-200 text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          evt.eventType === "CONSENT_GRANTED"
                            ? "bg-emerald-500"
                            : evt.eventType === "TIMEOUT"
                            ? "bg-red-500"
                            : "bg-amber-500"
                        }`}
                      />
                      <span className="font-bold text-forest-950">{evt.eventType}</span>
                      {evt.metadata && (
                        <span className="text-[10px] text-stone-500 truncate max-w-xs font-mono">
                          {evt.metadata}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Candidate Answers & Code Submissions */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-forest-950 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-forest-700" />
                <span>Candidate Question Submissions</span>
              </span>

              <div className="space-y-3">
                {selectedAttempt.submissions.map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-cream-50 border border-cream-200 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-forest-950">
                        Q{idx + 1}: {sub.questionText}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-forest-900 border border-cream-200">
                        Score: {sub.scoreEarned} pts
                      </span>
                    </div>

                    {sub.studentAnswer && (
                      <p className="text-[11px] text-stone-700 bg-white p-2 rounded border border-cream-200 font-mono">
                        Answer: {sub.studentAnswer}
                      </p>
                    )}

                    {sub.codeSolution && (
                      <div className="rounded-lg overflow-hidden border border-stone-800">
                        <div className="bg-stone-900 px-3 py-1 text-[10px] text-stone-400 font-mono flex items-center justify-between">
                          <span>Code Solution</span>
                          <span>
                            {sub.passedTestCases} / {sub.totalTestCases} Tests Passed
                          </span>
                        </div>
                        <pre className="p-3 bg-stone-950 text-cream-100 font-mono text-[11px] overflow-x-auto leading-relaxed">
                          {sub.codeSolution}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Past Reviews History */}
            {selectedAttempt.reviews.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-cream-200">
                <span className="text-xs font-bold text-forest-950">Prior Review History</span>
                <div className="space-y-1.5">
                  {selectedAttempt.reviews.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl bg-cream-100 text-xs text-forest-950 space-y-1 border border-cream-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px]">
                          {r.decision} by {r.reviewerName}
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          {new Date(r.resolvedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-stone-700 text-[11px]">{r.comments}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assessor Decision Form */}
            <div className="p-4 rounded-xl bg-forest-950 text-cream-50 space-y-4 pt-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-ochre-400">
                  Human Assessor Determination
                </h4>
                <p className="text-[11px] text-stone-300 mt-0.5">
                  Decide whether recorded activity represents legitimate non-malicious context or verified cheating.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setDecision("APPROVED")}
                  className={`p-3 rounded-xl border text-center text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                    decision === "APPROVED"
                      ? "bg-emerald-700 text-white border-emerald-500 shadow-md"
                      : "bg-forest-900 text-stone-300 border-forest-800 hover:bg-forest-800"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Approve Session</span>
                  <span className="text-[9px] font-normal opacity-80">
                    Non-malicious (Issue Credential)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision("REJECTED")}
                  className={`p-3 rounded-xl border text-center text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                    decision === "REJECTED"
                      ? "bg-red-800 text-white border-red-600 shadow-md"
                      : "bg-forest-900 text-stone-300 border-forest-800 hover:bg-forest-800"
                  }`}
                >
                  <XCircle className="w-4 h-4 text-red-300" />
                  <span>Disqualify Session</span>
                  <span className="text-[9px] font-normal opacity-80">
                    Confirmed Academic Violation
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision("DISMISSED")}
                  className={`p-3 rounded-xl border text-center text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                    decision === "DISMISSED"
                      ? "bg-stone-700 text-white border-stone-500 shadow-md"
                      : "bg-forest-900 text-stone-300 border-forest-800 hover:bg-forest-800"
                  }`}
                >
                  <Clock className="w-4 h-4 text-stone-300" />
                  <span>Dismiss Flags</span>
                  <span className="text-[9px] font-normal opacity-80">
                    No Action / Neutral
                  </span>
                </button>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                  Assessor Audit Comments & Rationale:
                </label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Explain the inspection rationale (e.g. Activity was verified as secondary monitor window blur; code solution is authentic)..."
                  className="w-full p-3 rounded-xl bg-forest-900 border border-forest-800 text-cream-50 text-xs focus:outline-none focus:ring-1 focus:ring-ochre-400 placeholder:text-stone-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-ochre-600 hover:bg-ochre-500 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-md transition-all"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Sign & Enforce Review Determination</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
