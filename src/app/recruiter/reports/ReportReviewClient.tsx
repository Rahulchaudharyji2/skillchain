"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, XCircle, AlertCircle, Loader2 } from "lucide-react";

interface ReportReviewClientProps {
  reportId: string;
  initialDecision: string | null;
  initialNotes: string | null;
}

export function ReportReviewClient({
  reportId,
  initialDecision,
  initialNotes,
}: ReportReviewClientProps) {
  const [decision, setDecision] = useState(initialDecision || "APPROVED");
  const [notes, setNotes] = useState(initialNotes || "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const handleSaveDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/recruiter/reports/${reportId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hrDecision: decision, hrNotes: notes }),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Decision save error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSaveDecision} className="p-4 rounded-xl bg-cream-50 border border-cream-200 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-forest-950 uppercase tracking-wider">
          HR Human Review & Final Decision
        </label>
        {saved && (
          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Decision Saved</span>
          </span>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <select
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
          className="p-2 rounded-lg bg-white border border-cream-300 text-xs font-semibold text-stone-900 focus:outline-none"
        >
          <option value="APPROVED">APPROVE (Recommend Offer)</option>
          <option value="NEEDS_MORE_INFO">NEEDS MORE INFO (Follow-Up Round)</option>
          <option value="REJECTED">REJECT</option>
        </select>

        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add HR evaluation notes..."
          className="sm:col-span-2 p-2 rounded-lg bg-white border border-cream-300 text-xs text-stone-800 focus:outline-none"
        />
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Human Decision"}
        </button>
      </div>
    </form>
  );
}
