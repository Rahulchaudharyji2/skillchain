"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldAlert, Loader2 } from "lucide-react";

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
  const router = useRouter();

  const handleStart = async () => {
    if (!agreed) return;
    setLoading(true);

    try {
      const res = await fetch("/api/assessments/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId }),
      });
      const data = await res.json();
      if (data.attemptId) {
        router.push(`/student/attempts/${data.attemptId}`);
      }
    } catch (err) {
      console.error("Start failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-cream-200">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-cream-300 text-forest-900 focus:ring-forest-800"
        />
        <span className="text-xs text-stone-700 leading-relaxed">
          I affirm that I will independently complete this assessment without unauthorized aids. I consent
          to technical window focus monitoring for tamper prevention and credential integrity.
        </span>
      </label>

      <button
        onClick={handleStart}
        disabled={!agreed || loading}
        className="w-full py-3.5 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-ochre-300" />
            <span>Initializing Isolated Assessment Runner...</span>
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
