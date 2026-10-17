"use client";

import React, { useState } from "react";
import { Send, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ApplyButtonClientProps {
  jobId: string;
  hasApplied: boolean;
  matchScore: number;
}

export function ApplyButtonClient({
  jobId,
  hasApplied: initialHasApplied,
  matchScore,
}: ApplyButtonClientProps) {
  const [applied, setApplied] = useState(initialHasApplied);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleApply = async () => {
    if (applied || loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/student/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, matchScore }),
      });
      const data = await res.json();
      if (data.success) {
        setApplied(true);
        router.refresh();
      }
    } catch (err) {
      console.error("Apply failed:", err);
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

  return (
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
  );
}
