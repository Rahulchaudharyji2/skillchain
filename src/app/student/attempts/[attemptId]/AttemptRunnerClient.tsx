"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Send,
  Loader2,
  FileCode,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  HelpCircle,
  Eye,
  CheckSquare,
  Square,
} from "lucide-react";
import confetti from "canvas-confetti";

interface QuestionItem {
  id: string;
  type: string;
  questionText: string;
  optionsJson: string | null;
  starterCode: string | null;
  language: string | null;
  points: number;
  explanation?: string | null;
}

interface AttemptRunnerClientProps {
  attemptId: string;
  initialStatus: string;
  initialScore: number | null;
  initialPassed: boolean;
  durationMinutes: number;
  assessmentTitle: string;
  assessmentVersion: number;
  passingThreshold: number;
  questions: QuestionItem[];
  existingSubmissions?: {
    questionId: string;
    studentAnswer?: string | null;
    codeSolution?: string | null;
    scoreEarned: number;
    passedTestCases?: number;
    totalTestCases?: number;
  }[];
  proctoringEventsCount: number;
  initialConsentGiven: boolean;
  expiresAtIso: string;
  feedback?: string | null;
  credentialId?: string | null;
}

export function AttemptRunnerClient({
  attemptId,
  initialStatus,
  initialScore,
  initialPassed,
  durationMinutes,
  assessmentTitle,
  assessmentVersion,
  passingThreshold,
  questions,
  existingSubmissions = [],
  proctoringEventsCount,
  initialConsentGiven,
  expiresAtIso,
  feedback: initialFeedback,
  credentialId: initialCredentialId,
}: AttemptRunnerClientProps) {
  const [status, setStatus] = useState(initialStatus);
  const [score, setScore] = useState(initialScore);
  const [passed, setPassed] = useState(initialPassed);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [credentialId, setCredentialId] = useState(initialCredentialId);
  const [consentGiven, setConsentGiven] = useState(initialConsentGiven);

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Answers state supports string (MCQ, Short answer, code) or JSON string for multi-select
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const map: Record<string, any> = {};
    existingSubmissions.forEach((sub) => {
      map[sub.questionId] = sub.codeSolution || sub.studentAnswer || "";
    });
    // Default starter codes
    questions.forEach((q) => {
      if (!map[q.id] && q.starterCode) {
        map[q.id] = q.starterCode;
      }
    });
    return map;
  });

  const [testResults, setTestResults] = useState<any>(null);
  const [runningCode, setRunningCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [proctorCount, setProctorCount] = useState(proctoringEventsCount);
  const [proctorWarning, setProctorWarning] = useState<string | null>(null);

  // Authoritative server-side timer calculation
  const calculateRemainingSeconds = () => {
    const expTime = new Date(expiresAtIso).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((expTime - now) / 1000));
  };

  const [timeLeftSeconds, setTimeLeftSeconds] = useState(calculateRemainingSeconds);

  // Authoritative countdown timer
  useEffect(() => {
    if (status !== "IN_PROGRESS" || !consentGiven) return;

    const interval = setInterval(() => {
      const remaining = calculateRemainingSeconds();
      setTimeLeftSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        handleSubmitAuto();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status, consentGiven, expiresAtIso]);

  // Proctoring Focus & Tab-switch listeners
  useEffect(() => {
    if (status !== "IN_PROGRESS" || !consentGiven) return;

    const handleVisibility = () => {
      if (document.hidden) {
        logProctoring("TAB_SWITCH", { message: "Candidate changed or hid browser tab" });
      }
    };

    const handleBlur = () => {
      logProctoring("FOCUS_LOST", { message: "Window lost active focus" });
    };

    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, [status, consentGiven]);

  const logProctoring = async (eventType: string, metadata: any) => {
    try {
      setProctorCount((prev) => prev + 1);
      setProctorWarning(
        `Activity logged: ${eventType.replace("_", " ")}. Under SkillChain's fairness policy, flags are non-disqualifying and reviewed by a human assessor.`
      );
      setTimeout(() => setProctorWarning(null), 5000);

      await fetch("/api/assessments/proctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, eventType, metadata }),
      });
    } catch (e) {
      console.warn("Proctor logging error:", e);
    }
  };

  const handleRunCode = async (questionId: string) => {
    setRunningCode(true);
    setTestResults(null);
    try {
      const currentCode = answers[questionId] || "";
      const res = await fetch("/api/assessments/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, code: currentCode }),
      });
      const data = await res.json();
      setTestResults(data.result);
    } catch (err) {
      console.error("Code run error:", err);
    } finally {
      setRunningCode(false);
    }
  };

  const handleResetCode = (questionId: string, starterCode: string | null) => {
    if (starterCode) {
      setAnswers((prev) => ({ ...prev, [questionId]: starterCode }));
      setTestResults(null);
    }
  };

  const handleToggleMultiSelect = (questionId: string, option: string) => {
    const current = answers[questionId];
    let selected: string[] = [];
    if (Array.isArray(current)) {
      selected = [...current];
    } else if (typeof current === "string" && current) {
      try {
        const parsed = JSON.parse(current);
        selected = Array.isArray(parsed) ? parsed : [current];
      } catch {
        selected = [current];
      }
    }

    if (selected.includes(option)) {
      selected = selected.filter((o) => o !== option);
    } else {
      selected.push(option);
    }

    setAnswers({ ...answers, [questionId]: selected });
  };

  const handleSubmitAuto = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/assessments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, answers }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus(data.status);
        setScore(data.score);
        setPassed(data.passed);
        setFeedback(data.feedback);
        if (data.credentialId) setCredentialId(data.credentialId);

        if (data.status === "GRADED" && data.passed) {
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        }
      }
    } catch (err) {
      console.error("Auto submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    const confirm = window.confirm("Are you sure you want to finalize and grade your assessment?");
    if (!confirm) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/assessments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, answers }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus(data.status);
        setScore(data.score);
        setPassed(data.passed);
        setFeedback(data.feedback);
        if (data.credentialId) setCredentialId(data.credentialId);

        if (data.status === "GRADED" && data.passed) {
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        }
      }
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  // -----------------------------------------------------------
  // 1. CONSENT MODAL IF NOT YET GRANTED
  // -----------------------------------------------------------
  if (!consentGiven) {
    return (
      <div className="max-w-3xl mx-auto p-8 card-premium bg-white border border-cream-300 space-y-6 animate-in fade-in">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-forest-900 text-cream-50 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-ochre-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ochre-700">
              SkillChain Integrity Protocol
            </span>
            <h1 className="text-2xl font-bold font-display text-forest-950">
              Proctored Assessment Consent
            </h1>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-cream-50 border border-cream-200 text-xs text-stone-700 space-y-3 leading-relaxed">
          <p className="font-semibold text-forest-950">
            Before beginning <strong>{assessmentTitle}</strong>, please review and accept our fair academic integrity agreement:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Active Focus Logging:</strong> Your browser window visibility, tab switches, and fullscreen status are recorded during the session.
            </li>
            <li>
              <strong>Fair Assessment Guarantee:</strong> Activity flags are strictly advisory signals. SkillChain <em>never</em> automatically treats proctoring flags as proof of cheating.
            </li>
            <li>
              <strong>Mandatory Human Review:</strong> If anomalous flags occur, your submission is queued for manual inspection by an assessor, who will verify your code and context before making an integrity decision.
            </li>
            <li>
              <strong>Server-Side Hidden Test Cases:</strong> Coding problems are evaluated inside an isolated, sandboxed execution environment.
            </li>
          </ul>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-200">
          <Link
            href="/student/assessments"
            className="px-4 py-2 rounded-xl border border-cream-300 text-stone-700 hover:bg-cream-100 text-xs font-semibold"
          >
            Cancel & Return
          </Link>
          <button
            onClick={() => setConsentGiven(true)}
            className="px-6 py-2.5 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-2 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-ochre-300" />
            <span>I Consent & Begin Assessment</span>
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 2. GRADED OR FLAGGED RESULT VIEW
  // -----------------------------------------------------------
  if (status === "GRADED" || status === "FLAGGED" || status === "REJECTED") {
    const isFlagged = status === "FLAGGED";
    const isRejected = status === "REJECTED";

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
        <div className="card-premium p-8 bg-white border-2 border-cream-300 text-center space-y-5">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
              isFlagged
                ? "bg-amber-100 text-amber-800"
                : isRejected
                ? "bg-red-100 text-red-800"
                : passed
                ? "bg-emerald-100 text-emerald-800"
                : "bg-stone-100 text-stone-600"
            }`}
          >
            {isFlagged ? (
              <ShieldAlert className="w-10 h-10 text-amber-600" />
            ) : isRejected ? (
              <XCircle className="w-10 h-10 text-red-600" />
            ) : passed ? (
              <Award className="w-10 h-10 text-emerald-700" />
            ) : (
              <Clock className="w-10 h-10 text-stone-500" />
            )}
          </div>

          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cream-100 text-forest-800">
                Version {assessmentVersion}
              </span>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                  isFlagged
                    ? "bg-amber-100 text-amber-900"
                    : isRejected
                    ? "bg-red-100 text-red-900"
                    : passed
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-stone-100 text-stone-700"
                }`}
              >
                Status: {status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-display text-forest-950">
              {isFlagged
                ? "Assessment Submitted — Queued for Assessor Review"
                : isRejected
                ? "Assessment Session Disqualified"
                : passed
                ? "Assessment Passed with Distinction!"
                : "Assessment Completed"}
            </h1>
            <p className="text-stone-600 text-xs mt-1">{assessmentTitle}</p>
          </div>

          {/* Score Card */}
          <div className="inline-block p-5 rounded-2xl bg-cream-50 border border-cream-200 min-w-[280px]">
            <span className="text-xs text-stone-400 font-semibold block uppercase tracking-wider">
              Final Computed Score
            </span>
            <span className="text-4xl font-extrabold text-forest-950 font-display mt-1 block">
              {score ?? 0}%
            </span>
            <span
              className={`inline-block mt-2 text-[11px] font-bold px-3 py-1 rounded-full border ${
                isFlagged
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : isRejected
                  ? "bg-red-50 text-red-800 border-red-200"
                  : passed
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-stone-100 text-stone-700 border-stone-200"
              }`}
            >
              {isFlagged
                ? "PENDING HUMAN ASSESSOR CONFIRMATION"
                : isRejected
                ? "CREDENTIAL WITHHELD"
                : passed
                ? "VERIFIED SKILL CREDENTIAL ISSUED"
                : `BELOW PASSING THRESHOLD (${passingThreshold}%)`}
            </span>
          </div>

          {/* Information / Feedback Banner */}
          {feedback && (
            <div
              className={`p-4 rounded-xl text-xs text-left max-w-xl mx-auto leading-relaxed border ${
                isFlagged
                  ? "bg-amber-50 text-amber-900 border-amber-200"
                  : isRejected
                  ? "bg-red-50 text-red-900 border-red-200"
                  : "bg-cream-100 text-forest-900 border-cream-200"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 mt-0.5 shrink-0 text-ochre-700" />
                <p>{feedback}</p>
              </div>
            </div>
          )}

          {isFlagged && (
            <p className="text-[11px] text-stone-500 max-w-md mx-auto">
              Our human assessors review all flagged sessions to verify academic honesty without automated false accusations. You will be notified once the review is resolved.
            </p>
          )}

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/student/dashboard"
              className="px-5 py-2.5 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold shadow-sm transition-all"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/student/passport"
              className="px-5 py-2.5 rounded-xl bg-white border border-cream-300 text-forest-900 hover:bg-cream-100 text-xs font-semibold shadow-sm transition-all"
            >
              View Student Passport
            </Link>
            {credentialId && (
              <Link
                href={`/verify/${credentialId}`}
                className="px-5 py-2.5 rounded-xl bg-ochre-600 hover:bg-ochre-500 text-white text-xs font-semibold shadow-sm transition-all"
              >
                View Verifiable Credential
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 3. ACTIVE IN-PROGRESS TEST RUNNER
  // -----------------------------------------------------------
  const activeQuestion = questions[activeQuestionIndex];
  const isTimeCritical = timeLeftSeconds <= 300; // Under 5 mins

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Proctoring Warning Notification */}
      {proctorWarning && (
        <div className="p-3.5 rounded-xl bg-amber-500 text-amber-950 text-xs font-semibold flex items-center justify-between shadow-md animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-950 shrink-0" />
            <span>{proctorWarning}</span>
          </div>
          <span className="text-[10px] font-mono shrink-0 ml-2">Flag #{proctorCount}</span>
        </div>
      )}

      {/* Top Banner: Timer & Navigation */}
      <div className="card-premium p-4 bg-white border border-cream-300 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-forest-700">
            <span>Proctored Assessment Session</span>
            <span>•</span>
            <span>v{assessmentVersion}</span>
            <span>•</span>
            <span className="text-ochre-700">Passing: {passingThreshold}%</span>
          </div>
          <h2 className="text-base font-bold text-forest-950 mt-0.5">{assessmentTitle}</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Authoritative Server-Synced Countdown Timer */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold ${
              isTimeCritical
                ? "bg-red-50 text-red-700 border-red-300 animate-pulse"
                : "bg-cream-100 border-cream-200 text-forest-950"
            }`}
          >
            <Clock className={`w-4 h-4 ${isTimeCritical ? "text-red-600" : "text-forest-700"}`} />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-cream-50 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Finish & Submit</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Question Navigation List */}
        <div className="lg:col-span-3 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block px-1">
            Questions ({questions.length})
          </span>
          {questions.map((q, idx) => {
            const isCurrent = idx === activeQuestionIndex;
            const ans = answers[q.id];
            const hasAnswer =
              ans !== undefined &&
              ans !== "" &&
              (Array.isArray(ans) ? ans.length > 0 : true);

            return (
              <button
                key={q.id}
                onClick={() => {
                  setActiveQuestionIndex(idx);
                  setTestResults(null);
                }}
                className={`w-full p-3 rounded-xl text-left text-xs transition-all border flex items-center justify-between ${
                  isCurrent
                    ? "bg-forest-900 text-cream-50 border-forest-900 shadow-sm font-semibold"
                    : hasAnswer
                    ? "bg-cream-100 text-forest-950 border-cream-300 hover:bg-cream-200"
                    : "bg-white text-stone-600 border-cream-200 hover:bg-cream-50"
                }`}
              >
                <div>
                  <span className="block text-[10px] opacity-75">Question {idx + 1}</span>
                  <span className="truncate block max-w-[130px] font-medium">
                    {q.type.replace("_", " ")}
                  </span>
                </div>
                <span className="text-[10px] font-mono opacity-80">{q.points} pts</span>
              </button>
            );
          })}
        </div>

        {/* Right Column: Question Content & Interactive Work Area */}
        <div className="lg:col-span-9 space-y-4">
          <div className="card-premium p-6 bg-white border border-cream-300 space-y-6">
            <div className="flex items-center justify-between border-b border-cream-200 pb-3">
              <span className="text-xs font-bold text-forest-800">
                Question {activeQuestionIndex + 1} of {questions.length} • {activeQuestion.points} Points
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cream-100 text-forest-900 uppercase">
                {activeQuestion.type.replace("_", " ")}
              </span>
            </div>

            <p className="text-sm font-medium text-forest-950 leading-relaxed">
              {activeQuestion.questionText}
            </p>

            {/* 1. MULTIPLE CHOICE */}
            {activeQuestion.type === "MULTIPLE_CHOICE" && activeQuestion.optionsJson && (
              <div className="space-y-2.5 pt-2">
                {JSON.parse(activeQuestion.optionsJson).map((opt: string, i: number) => {
                  const selected = answers[activeQuestion.id] === opt;
                  return (
                    <button
                      key={i}
                      onClick={() => setAnswers({ ...answers, [activeQuestion.id]: opt })}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                        selected
                          ? "bg-forest-900 text-cream-50 border-forest-900 font-semibold"
                          : "bg-cream-50 hover:bg-cream-100 text-stone-700 border-cream-200"
                      }`}
                    >
                      <span>{opt}</span>
                      {selected && <CheckCircle2 className="w-4 h-4 text-ochre-300 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. MULTIPLE SELECT (Checkboxes) */}
            {activeQuestion.type === "MULTIPLE_SELECT" && activeQuestion.optionsJson && (
              <div className="space-y-2.5 pt-2">
                <span className="text-[11px] text-stone-500 italic block mb-1">
                  Select all that apply:
                </span>
                {JSON.parse(activeQuestion.optionsJson).map((opt: string, i: number) => {
                  const currentAns = answers[activeQuestion.id];
                  let isSelected = false;
                  if (Array.isArray(currentAns)) {
                    isSelected = currentAns.includes(opt);
                  } else if (typeof currentAns === "string" && currentAns) {
                    try {
                      const parsed = JSON.parse(currentAns);
                      isSelected = Array.isArray(parsed) && parsed.includes(opt);
                    } catch {
                      isSelected = currentAns === opt;
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleToggleMultiSelect(activeQuestion.id, opt)}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-forest-900 text-cream-50 border-forest-900 font-semibold"
                          : "bg-cream-50 hover:bg-cream-100 text-stone-700 border-cream-200"
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-ochre-300 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3. SHORT ANSWER */}
            {activeQuestion.type === "SHORT_ANSWER" && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-forest-950 block">
                  Your Answer:
                </label>
                <input
                  type="text"
                  value={answers[activeQuestion.id] || ""}
                  onChange={(e) =>
                    setAnswers({ ...answers, [activeQuestion.id]: e.target.value })
                  }
                  placeholder="Type your exact response..."
                  className="w-full p-3 rounded-xl border border-cream-300 text-xs focus:outline-none focus:ring-2 focus:ring-forest-800 text-forest-950 bg-cream-50"
                />
              </div>
            )}

            {/* 4. CODING QUESTION */}
            {activeQuestion.type === "CODING" && (
              <div className="space-y-4 pt-2">
                <div className="rounded-xl overflow-hidden border border-stone-800">
                  <div className="bg-stone-900 px-4 py-2 flex items-center justify-between text-xs text-stone-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-ochre-400" />
                      solution.js
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleResetCode(activeQuestion.id, activeQuestion.starterCode)}
                        className="flex items-center gap-1 hover:text-stone-200 transition-colors"
                        title="Reset to starter code"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Code</span>
                      </button>
                      <span>Isolated Node Sandbox</span>
                    </div>
                  </div>
                  <textarea
                    rows={13}
                    value={answers[activeQuestion.id] || activeQuestion.starterCode || ""}
                    onChange={(e) =>
                      setAnswers({ ...answers, [activeQuestion.id]: e.target.value })
                    }
                    className="w-full p-4 code-editor-area text-xs font-mono leading-relaxed resize-none focus:outline-none bg-stone-950 text-cream-100"
                    placeholder="// Write your solution function here..."
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">
                    Runs in isolated sandbox. Hidden test cases are evaluated server-side.
                  </span>
                  <button
                    onClick={() => handleRunCode(activeQuestion.id)}
                    disabled={runningCode}
                    className="px-4 py-2 rounded-lg bg-forest-900 hover:bg-forest-800 text-cream-50 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    {runningCode ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-ochre-300" />
                    )}
                    <span>Run Sandboxed Tests</span>
                  </button>
                </div>

                {/* TEST RESULTS PANEL */}
                {testResults && (
                  <div className="p-4 rounded-xl bg-stone-950 text-cream-100 font-mono text-xs space-y-3 border border-stone-800 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                      <span className="font-bold flex items-center gap-1.5">
                        {testResults.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span>
                          {testResults.passed
                            ? "All Visible & Hidden Tests Passed"
                            : "Some Test Cases Failed"}
                        </span>
                      </span>
                      <span className="text-ochre-400 font-semibold">
                        Score: {testResults.score} / {testResults.maxScore} pts
                      </span>
                    </div>

                    <div className="space-y-2">
                      {testResults.testCaseResults.map((tc: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded bg-stone-900 text-[11px]"
                        >
                          <span className="text-stone-300">
                            Test Case #{i + 1} {tc.isHidden && "(Server-Side Hidden Test Case)"}
                          </span>
                          <span
                            className={`font-bold ${
                              tc.passed ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {tc.passed ? "PASSED" : "FAILED"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
