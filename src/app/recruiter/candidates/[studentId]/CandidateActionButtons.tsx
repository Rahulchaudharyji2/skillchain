"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Video, CheckCircle2, Loader2, Calendar } from "lucide-react";

interface CandidateActionButtonsProps {
  studentProfileId: string;
  candidateName: string;
  defaultJobId?: string;
}

export function CandidateActionButtons({
  studentProfileId,
  candidateName,
  defaultJobId,
}: CandidateActionButtonsProps) {
  const [shortlisted, setShortlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const router = useRouter();

  const handleShortlist = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recruiter/shortlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentProfileId }),
      });
      if (res.ok) {
        setShortlisted(true);
        router.refresh();
      }
    } catch (err) {
      console.error("Shortlist failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    const meetingUrl = window.prompt("Enter or confirm meeting room URL:", "https://meet.skillchain.org/room/str-eval-901");
    if (!meetingUrl) return;

    setLoading(true);
    try {
      const res = await fetch("/api/recruiter/interviews/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentProfileId,
          jobId: defaultJobId,
          meetingUrl,
          scheduledAt: new Date(Date.now() + 86400000 * 2).toISOString(),
        }),
      });
      if (res.ok) {
        setScheduled(true);
        router.refresh();
      }
    } catch (err) {
      console.error("Schedule failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleShortlist}
        disabled={loading || shortlisted}
        className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
          shortlisted
            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
            : "bg-white border border-cream-300 text-forest-900 hover:bg-cream-100"
        }`}
      >
        {shortlisted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> : <Sparkles className="w-3.5 h-3.5 text-ochre-600" />}
        <span>{shortlisted ? "Candidate Shortlisted" : "Shortlist Candidate"}</span>
      </button>

      <button
        onClick={handleSchedule}
        disabled={loading || scheduled}
        className="px-4 py-2 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
      >
        {scheduled ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Video className="w-3.5 h-3.5 text-ochre-300" />}
        <span>{scheduled ? "Interview Scheduled" : "Schedule Interview"}</span>
      </button>
    </div>
  );
}
