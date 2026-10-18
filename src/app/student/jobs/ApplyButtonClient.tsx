"use client";

import React, { useState } from "react";
import { Send, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ApplyButtonClientProps {
  jobId: string;
  hasApplied: boolean;
  matchScore: number;
  missingSkills?: string[];
  recommendedAssessmentSlug?: string;
}

export function ApplyButtonClient({
  jobId,
  hasApplied: initialHasApplied,
  matchScore,
  missingSkills = [],
  recommendedAssessmentSlug = "python-assessment",
}: ApplyButtonClientProps) {
  const [applied, setApplied] = useState(initialHasApplied);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleApply = async () => {
    if (applied || loading || missingSkills.length > 0) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/student/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, matchScore }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setApplied(true);
        router.refresh();
      } else {
        setErrorMsg(data.error || "Cannot apply: Skill requirements not satisfied.");
      }
    } catch (err: any) {
      setErrorMsg("Network error applying for job.");
    } finally {
      setLoading(false);
    }
  };

  if (applied) {
    return (
      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        <span>Passport Submitted</span>
      </span>
    );
  }

  if (missingSkills.length > 0) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
            🔒 Missing {missingSkills.length} Required {missingSkills.length === 1 ? "Skill" : "Skills"}
          </span>
          <a
            href={`/student/assessments`}
            className="px-3.5 py-2 rounded-xl bg-ochre-600 hover:bg-ochre-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <span>Take Proctored Exam</span>
            <Send className="w-3.5 h-3.5" />
          </a>
        </div>
        <span className="text-[10px] text-stone-500">
          Must verify: <strong>{missingSkills.join(", ")}</strong> before applying
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {errorMsg && (
        <span className="text-[11px] text-red-600 font-semibold max-w-xs text-right">
          {errorMsg}
        </span>
      )}
      <button
        onClick={handleApply}
        disabled={loading}
        className="px-4 py-2 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-ochre-300" />
        ) : (
          <Send className="w-3.5 h-3.5 text-ochre-300" />
        )}
        <span>Apply with Passport</span>
      </button>
    </div>
  );
}
