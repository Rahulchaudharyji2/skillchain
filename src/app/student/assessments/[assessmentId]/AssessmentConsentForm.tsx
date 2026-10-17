"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, Loader2, AlertCircle } from "lucide-react";

interface AssessmentConsentFormProps {
  assessmentId: string;
  studentProfileId: string;
}

export function AssessmentConsentForm({
  assessmentId,
  studentProfileId,
}: AssessmentConsentFormProps) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleStart = async () => {
    if (!agreed) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/assessments/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          consentGiven: true,
        }),
      });
      const data = await res.json();

      if (data.attemptId) {
        router.push(`/student/attempts/${data.attemptId}`);
      } else {
        setErrorMessage(data.message || data.error || "Unable to start assessment.");
      }
    } catch (err: any) {
      console.error("Start failed:", err);
      setErrorMessage(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-cream-200">
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-900 border border-red-200 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-cream-300 text-forest-900 focus:ring-forest-800"
        />
        <div className="text-xs text-stone-700 leading-relaxed space-y-1">
          <p>
            I affirm that I will independently complete this assessment without unauthorized aids. I consent
            to technical browser focus and visibility logging for integrity verification.
          </p>
          <p className="text-[11px] text-stone-500">
            <strong>Fair Assessment Guarantee:</strong> SkillChain never automatically treats proctoring flags as proof of cheating. Any anomalous activity undergoes human assessor review.
          </p>
        </div>
      </label>

      <button
        onClick={handleStart}
        disabled={!agreed || loading}
        className="w-full py-3.5 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-ochre-300" />
            <span>Initializing Sandboxed Assessment Runner...</span>
          </>
        ) : (
          <>
            <span>Begin Proctored Assessment</span>
            <ArrowRight className="w-4 h-4 text-ochre-300" />
          </>
        )}
      </button>
    </div>
  );
}
