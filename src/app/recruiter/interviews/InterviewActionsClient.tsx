"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Loader2, ArrowRight, ShieldCheck, ShieldAlert, Video } from "lucide-react";

interface InterviewActionsClientProps {
  interviewId: string;
  hasReport: boolean;
  meetingUrl: string | null;
  recordingConsentGiven: boolean;
}

export function InterviewActionsClient({
  interviewId,
  hasReport,
  meetingUrl,
  recordingConsentGiven,
}: InterviewActionsClientProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isDemoMeeting = !meetingUrl || meetingUrl.includes("demo") || meetingUrl.includes("skillchain.org");

  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/recruiter/interviews/${interviewId}/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceRegenerate: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate report");
      } else {
        router.push("/recruiter/reports");
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Network error generating report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Provider badge */}
      <span
        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          isDemoMeeting
            ? "bg-amber-100 text-amber-900 border border-amber-300"
            : "bg-emerald-100 text-emerald-900 border border-emerald-300"
        }`}
      >
        {isDemoMeeting ? "Demo Simulated Room" : "Live WebRTC Room"}
      </span>

      {/* Consent badge */}
      <span
        className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
          recordingConsentGiven
            ? "bg-forest-100 text-forest-900"
            : "bg-stone-100 text-stone-600"
        }`}
      >
        {recordingConsentGiven ? (
          <>
            <ShieldCheck className="w-3 h-3 text-forest-800" />
            <span>Consent Granted</span>
          </>
        ) : (
          <>
            <ShieldAlert className="w-3 h-3 text-stone-500" />
            <span>Consent Required</span>
          </>
        )}
      </span>

      <Link
        href={`/recruiter/interviews/${interviewId}`}
        className="px-3.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-cream-50 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
      >
        <Video className="w-3.5 h-3.5 text-ochre-300" />
        <span>Enter 1:1 Live Room</span>
      </Link>

      {hasReport ? (
        <Link
          href="/recruiter/reports"
          className="px-3.5 py-1.5 rounded-lg bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <span>Review AI Report</span>
          <ArrowRight className="w-3.5 h-3.5 text-ochre-300" />
        </Link>
      ) : (
        <button
          onClick={handleGenerateReport}
          disabled={loading || !recordingConsentGiven}
          className="px-3.5 py-1.5 rounded-lg bg-forest-900 hover:bg-forest-800 disabled:opacity-60 text-cream-50 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-ochre-300" />
          )}
          <span>Generate AI Report</span>
        </button>
      )}

      {error && <span className="text-[11px] font-semibold text-red-600">{error}</span>}
    </div>
  );
}
