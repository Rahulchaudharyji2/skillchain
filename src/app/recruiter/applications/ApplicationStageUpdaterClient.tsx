"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface ApplicationStageUpdaterClientProps {
  applicationId: string;
  currentStage: string;
}

export function ApplicationStageUpdaterClient({
  applicationId,
  currentStage,
}: ApplicationStageUpdaterClientProps) {
  const [stage, setStage] = useState(currentStage);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStageChange = async (newStage: string) => {
    if (newStage === stage || loading) return;
    setLoading(true);
    setStage(newStage);

    try {
      const res = await fetch(`/api/recruiter/applications/${applicationId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStage: newStage }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error("Stage update error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {loading && <Loader2 className="w-3 h-3 animate-spin text-stone-400" />}
      <select
        value={stage}
        onChange={(e) => handleStageChange(e.target.value)}
        disabled={loading}
        className="p-1.5 rounded-lg bg-cream-50 border border-cream-300 text-[11px] font-semibold text-stone-800 focus:outline-none"
      >
        <option value="APPLIED">Applied</option>
        <option value="UNDER_REVIEW">Under Review</option>
        <option value="SHORTLISTED">Shortlisted</option>
        <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
        <option value="INTERVIEW_COMPLETED">Interview Completed</option>
        <option value="SELECTED">Selected (Offer)</option>
        <option value="REJECTED">Rejected</option>
      </select>
    </div>
  );
}
