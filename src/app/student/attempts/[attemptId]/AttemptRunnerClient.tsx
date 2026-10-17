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
} from "lucide-react";
import confetti from "canvas-confetti";

interface AttemptRunnerClientProps {
  attemptId: string;
  initialStatus: string;
  initialScore: number | null;
  initialPassed: boolean;
  durationMinutes: number;
  assessmentTitle: string;
  questions: {
    id: string;
    type: string;
    questionText: string;
    optionsJson: string | null;
    starterCode: string | null;
    language: string | null;
    points: number;
    explanation?: string | null;
  }[];
  existingSubmissions?: {
    questionId: string;
    studentAnswer?: string | null;
    codeSolution?: string | null;
    scoreEarned: number;
    passedTestCases?: number;
    totalTestCases?: number;
  }[];
  proctoringEventsCount: number;
}

export function AttemptRunnerClient({
  attemptId,
  initialStatus,
  initialScore,
  initialPassed,
  durationMinutes,
  assessmentTitle,
  questions,
  existingSubmissions = [],
  proctoringEventsCount,
}: AttemptRunnerClientProps) {
  const [status, setStatus] = useState(initialStatus);
  const [score, setScore] = useState(initialScore);
  const [passed, setPassed] = useState(initialPassed);

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
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

  const [timeLeftSeconds, setTimeLeftSeconds] = useState(durationMinutes * 60);

  // Proctoring Focus Listener
  useEffect(() => {
    if (status !== "IN_PROGRESS") return;

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
  }, [status]);

  // Timer countdown
  useEffect(() => {
    if (status !== "IN_PROGRESS") return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  const logProctoring = async (eventType: string, metadata: any) => {
    try {
      setProctorCount((prev) => prev + 1);
      setProctorWarning(`Proctoring Flag: ${eventType.replace("_", " ")} recorded.`);
      setTimeout(() => setProctorWarning(null), 4000);

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
        setStatus("GRADED");
        setScore(data.score);
        setPassed(data.passed);

        if (data.passed) {
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

  const activeQuestion = questions[activeQuestionIndex];

  // -----------------------------------------------------------
  // GRADED RESULT VIEW
  // -----------------------------------------------------------
  if (status === "GRADED") {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
        <div className="card-premium p-8 bg-white border-2 border-cream-300 text-center space-y-4">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
              passed ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"
            }`}
          >
            {passed ? <Award className="w-10 h-10" /> : <Clock className="w-10 h-10" />}
          </div>

          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-stone-400">
              Assessment Completed
            </span>
            <h1 className="text-3xl font-bold font-display text-forest-950 mt-1">
              {passed ? "Assessment Passed with Distinction!" : "Assessment Completed"}
            </h1>
            <p className="text-stone-600 text-xs mt-1">{assessmentTitle}</p>
          </div>

          <div className="inline-block p-4 rounded-xl bg-cream-50 border border-cream-200">
            <span className="text-xs text-stone-400 font-semibold block">FINAL SCORE</span>
            <span className="text-4xl font-extrabold text-forest-950 font-display mt-1 block">
              {score}%
            </span>
            <span
              className={`inline-block mt-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                passed ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-stone-100 text-stone-700"
              }`}
            >
              {passed ? "VERIFIED SKILL CREDENTIAL ISSUED" : "BELOW PASSING THRESHOLD"}
            </span>
          </div>

          <div className="pt-4 flex items-center justify-center gap-4">
            <Link
              href="/student/dashboard"
              className="px-5 py-2.5 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold shadow-sm"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/student/passport"
              className="px-5 py-2.5 rounded-xl bg-white border border-cream-300 text-forest-900 hover:bg-cream-100 text-xs font-semibold shadow-sm"
            >
              View Updated Passport
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // IN-PROGRESS ACTIVE TEST RUNNER
  // -----------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Proctoring Warning Notification */}
      {proctorWarning && (
        <div className="p-3 rounded-xl bg-amber-500 text-amber-950 text-xs font-semibold flex items-center justify-between shadow-md animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-950" />
            <span>{proctorWarning}</span>
          </div>
          <span className="text-[10px] font-mono">Audit Event #{proctorCount}</span>
        </div>
      )}

      {/* Top Banner: Timer & Navigation */}
      <div className="card-premium p-4 bg-white border border-cream-300 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-forest-700">
            Proctored Assessment Session
          </span>
          <h2 className="text-base font-bold text-forest-950">{assessmentTitle}</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cream-100 border border-cream-200 text-forest-950 font-mono text-sm font-bold">
            <Clock className="w-4 h-4 text-forest-700" />
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
        {/* Left Column: Questions List (3 cols) */}
        <div className="lg:col-span-3 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block px-1">
            Questions ({questions.length})
          </span>
          {questions.map((q, idx) => {
            const isCurrent = idx === activeQuestionIndex;
            const hasAnswer = Boolean(answers[q.id]);
            return (
              <button
                key={q.id}
                onClick={() => setActiveQuestionIndex(idx)}
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
                  <span className="truncate block max-w-[130px]">{q.type.replace("_", " ")}</span>
                </div>
                <span className="text-[10px] font-mono opacity-80">{q.points} pts</span>
              </button>
            );
          })}
        </div>

        {/* Right Column: Question Content & Code Editor (9 cols) */}
        <div className="lg:col-span-9 space-y-4">
          <div className="card-premium p-6 bg-white border border-cream-300 space-y-6">
            <div className="flex items-center justify-between border-b border-cream-200 pb-3">
              <span className="text-xs font-bold text-forest-800">
                Question {activeQuestionIndex + 1} of {questions.length} • {activeQuestion.points} Points
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cream-100 text-forest-900">
                Type: {activeQuestion.type}
              </span>
            </div>

            <p className="text-sm font-medium text-forest-950 leading-relaxed">
              {activeQuestion.questionText}
            </p>

            {/* MCQ Options */}
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
                      {selected && <CheckCircle2 className="w-4 h-4 text-ochre-300" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* CODING QUESTION EDITOR */}
            {activeQuestion.type === "CODING" && (
              <div className="space-y-4 pt-2">
                <div className="rounded-xl overflow-hidden border border-stone-800">
                  <div className="bg-stone-900 px-4 py-2 flex items-center justify-between text-xs text-stone-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-ochre-400" />
                      solution.js
                    </span>
                    <span>Node.js / Isolated V8 VM</span>
                  </div>
                  <textarea
                    rows={12}
                    value={answers[activeQuestion.id] || activeQuestion.starterCode || ""}
                    onChange={(e) => setAnswers({ ...answers, [activeQuestion.id]: e.target.value })}
                    className="w-full p-4 code-editor-area text-xs font-mono leading-relaxed resize-none focus:outline-none"
                    placeholder="// Write your code here..."
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">
                    Runs against hidden server-side test cases.
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
                          {testResults.passed ? "All Test Cases Passed" : "Some Test Cases Failed"}
                        </span>
                      </span>
                      <span className="text-ochre-400">
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
                            Test Case #{i + 1} {tc.isHidden && "(Hidden Case)"}
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
