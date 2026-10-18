"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  GraduationCap,
  FolderGit2,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Calendar,
  Clock,
  Video,
  X,
  Loader2,
  Briefcase,
  FileText,
} from "lucide-react";
import { calculateCandidateMatch } from "@/lib/matching/engine";
import { formatDate } from "@/lib/utils";

interface SkillEvidence {
  evidenceType: string;
  title: string;
  description: string | null;
  score: number | null;
}

interface CandidateSkill {
  skillName: string;
  verifiedByAssessment: boolean;
  verifiedByDegree: boolean;
  isSelfDeclared: boolean;
  evidences: SkillEvidence[];
}

interface JobRequirement {
  skillName: string;
  weight: number;
  mustBeVerified: boolean;
  minScoreThreshold: number | null;
}

interface PublishedJob {
  id: string;
  title: string;
  seniorityLevel: string;
  location: string;
  requirements: {
    skill: { name: string };
    weight: number;
    mustBeVerified: boolean;
    minScoreThreshold: number | null;
  }[];
}

interface CandidateDetailClientProps {
  profile: {
    id: string;
    headline: string | null;
    bio: string | null;
    universityName: string | null;
    degree: string | null;
    user: {
      name: string;
      email: string;
    };
    credentials: {
      id: string;
      title: string;
      grade: string | null;
      status: string;
      organization: { name: string };
    }[];
    projects: {
      id: string;
      title: string;
      description: string;
      techStack: string;
    }[];
  };
  candidateSkills: CandidateSkill[];
  publishedJobs: PublishedJob[];
  initialJobId?: string;
  initialIsUnlocked?: boolean;
  recruiterOrgTokens?: number;
  studentTokensReceived?: number;
}

export function CandidateDetailClient({
  profile,
  candidateSkills,
  publishedJobs,
  initialJobId,
  initialIsUnlocked = false,
  recruiterOrgTokens = 50,
  studentTokensReceived = 0,
}: CandidateDetailClientProps) {
  const [selectedJobId, setSelectedJobId] = useState<string>(
    initialJobId || (publishedJobs.length > 0 ? publishedJobs[0].id : "")
  );

  // Profile unlock state
  const [isUnlocked, setIsUnlocked] = useState(initialIsUnlocked);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [orgTokens, setOrgTokens] = useState(recruiterOrgTokens);
  const [unlockMsg, setUnlockMsg] = useState<string | null>(null);

  // Shortlist state
  const [shortlisted, setShortlisted] = useState(false);
  const [shortlistLoading, setShortlistLoading] = useState(false);

  // Modal schedule state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduledSuccess, setScheduledSuccess] = useState(false);
  const [interviewDate, setInterviewDate] = useState(() => {
    const d = new Date(Date.now() + 86400000 * 2);
    return d.toISOString().slice(0, 16);
  });
  const [timeZone, setTimeZone] = useState("America/New_York");
  const [meetingUrl, setMeetingUrl] = useState("https://meet.skillchain.org/room/eval-" + Math.floor(100 + Math.random() * 900));
  const [focusNotes, setFocusNotes] = useState("Technical architecture, code quality, and live system design evaluation.");
  const [consentConfirmed, setConsentConfirmed] = useState(true);

  const selectedJob = publishedJobs.find((j) => j.id === selectedJobId);

  const requirements: JobRequirement[] = (selectedJob?.requirements || []).map((r) => ({
    skillName: r.skill.name,
    weight: r.weight,
    mustBeVerified: r.mustBeVerified,
    minScoreThreshold: r.minScoreThreshold,
  }));

  const match = selectedJob
    ? calculateCandidateMatch(requirements, candidateSkills)
    : null;

  const handleUnlockProfile = async () => {
    setUnlockLoading(true);
    setUnlockMsg(null);
    try {
      const res = await fetch("/api/recruiter/unlock-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentProfileId: profile.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsUnlocked(true);
        if (typeof data.organizationTokenBalance === "number") {
          setOrgTokens(data.organizationTokenBalance);
        }
        setUnlockMsg(data.message || "Candidate full profile unlocked successfully!");
      } else {
        alert(data.error || "Failed to unlock profile");
      }
    } catch (err: any) {
      console.error("Unlock error:", err);
      alert("Error unlocking profile: " + (err.message || "Network error"));
    } finally {
      setUnlockLoading(false);
    }
  };

  const handleShortlist = async () => {
    setShortlistLoading(true);
    try {
      const res = await fetch("/api/recruiter/shortlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentProfileId: profile.id, jobId: selectedJobId }),
      });
      if (res.ok) {
        setShortlisted(true);
      }
    } catch (err) {
      console.error("Shortlist error:", err);
    } finally {
      setShortlistLoading(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleLoading(true);
    try {
      const res = await fetch("/api/recruiter/interviews/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentProfileId: profile.id,
          jobId: selectedJobId,
          meetingUrl,
          scheduledAt: new Date(interviewDate).toISOString(),
          timeZone,
          notes: focusNotes,
        }),
      });

      if (res.ok) {
        setScheduledSuccess(true);
        setTimeout(() => {
          setIsScheduleOpen(false);
        }, 1200);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to schedule interview");
      }
    } catch (err) {
      console.error("Schedule error:", err);
      alert("Network error scheduling interview");
    } finally {
      setScheduleLoading(false);
    }
  };

  // Masked email & details if locked
  const maskedEmail = profile.user.email.replace(/(.{2})(.*)(@.*)/, "$1•••$3");

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Banner / Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/recruiter/applications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-forest-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Job Applicants</span>
        </Link>

        {/* Recruiter Token Balance Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-forest-900 text-cream-50 text-xs font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-ochre-300" />
          <span>Recruiter Tokens: <strong className="text-ochre-300 font-mono text-sm">{orgTokens}</strong></span>
        </div>
      </div>

      {/* Unlock Notice Banner if not unlocked */}
      {!isUnlocked ? (
        <div className="card-premium p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-200 text-amber-900 inline-block">
                🔒 Privacy-First Candidate Profile
              </span>
              <h3 className="text-sm font-bold text-forest-950">
                Full Profile & 1:1 Interview Scheduling Locked
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed max-w-xl">
                You can review the applicant&apos;s verified test marks and score breakdown below.
                To view complete contact details, GitHub/Portfolio links, and schedule a 1:1 interview,
                unlock profile for <strong>5 Tokens</strong> (3 platform treasury + 2 tokens directly to student).
              </p>
            </div>

            <button
              onClick={handleUnlockProfile}
              disabled={unlockLoading}
              className="px-5 py-3 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 disabled:opacity-50 text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all flex-shrink-0"
            >
              {unlockLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-ochre-300" />
              ) : (
                <Sparkles className="w-4 h-4 text-ochre-300" />
              )}
              <span>Unlock Profile (5 Tokens)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              <strong>Profile Unlocked:</strong> Full verified contact details and 1:1 interview scheduling are active. (5 tokens settled: 3 platform + 2 student)
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
            UNLOCKED
          </span>
        </div>
      )}

      {/* Profile Header */}
      <div className="card-premium p-6 sm:p-8 bg-white border border-cream-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-cream-200 gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-forest-900 text-cream-50 flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-sm">
              {profile.user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-forest-950">
                  {profile.user.name}
                </h1>
                {profile.credentials.length > 0 && (
                  <span className="seal-badge text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    ACADEMIC VERIFIED
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-forest-800 mt-0.5">{profile.headline}</p>
              <p className="text-xs text-stone-500 mt-0.5">
                {profile.universityName || "Independent Candidate"}{" "}
                {profile.degree && `• ${profile.degree}`}
              </p>
              <p className="text-xs font-mono text-stone-400 mt-0.5">
                Email: {isUnlocked ? profile.user.email : maskedEmail}{" "}
                {!isUnlocked && <span className="text-[10px] text-amber-600 font-semibold">(Masked)</span>}
              </p>
            </div>
          </div>

          {/* Recruiter Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleShortlist}
              disabled={shortlistLoading || shortlisted}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                shortlisted
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                  : "bg-white border border-cream-300 text-forest-900 hover:bg-cream-100"
              }`}
            >
              {shortlistLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : shortlisted ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-ochre-600" />
              )}
              <span>{shortlisted ? "Candidate Shortlisted" : "Shortlist Candidate"}</span>
            </button>

            {isUnlocked ? (
              <button
                onClick={() => setIsScheduleOpen(true)}
                className="px-4 py-2 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                {scheduledSuccess ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Video className="w-3.5 h-3.5 text-ochre-300" />
                )}
                <span>{scheduledSuccess ? "Interview Scheduled" : "Schedule 1:1 Interview"}</span>
              </button>
            ) : (
              <button
                onClick={handleUnlockProfile}
                disabled={unlockLoading}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Unlock to Schedule (5 Tokens)</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-stone-600 mt-4 leading-relaxed">
          {isUnlocked ? profile.bio : (profile.bio ? `${profile.bio.substring(0, 100)}... (Unlock profile to read full biography)` : "Candidate bio.")}
        </p>
      </div>

      {/* Target Job Selector & Deterministic Engine */}
      <div className="card-premium p-6 sm:p-8 bg-white border border-cream-300 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cream-200 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-ochre-700">
                Deterministic Candidate Match Engine
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cream-100 text-stone-600 border border-cream-200 font-medium">
                Human-in-the-loop
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-forest-950 mt-0.5">
              Role Fit Analysis
            </h2>
          </div>

          {/* Job Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-stone-500 whitespace-nowrap">
              Evaluate For:
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-cream-300 bg-white font-medium text-forest-950 focus:outline-none focus:ring-1 focus:ring-forest-800"
            >
              {publishedJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.seniorityLevel})
                </option>
              ))}
            </select>
          </div>
        </div>

        {match && (
          <>
            {/* Score Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-forest-900 text-cream-50 gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-ochre-300 font-bold block">
                  Weighted Fit Score
                </span>
                <div className="text-2xl font-bold font-mono text-white mt-0.5 flex items-center gap-2">
                  <span>{match.overallScore}%</span>
                  <span className="text-xs font-normal text-cream-200 font-sans">
                    {match.overallScore >= 80
                      ? "• High Alignment (Strong verified competencies)"
                      : match.overallScore >= 55
                      ? "• Moderate Alignment (Partial verification or project evidence)"
                      : "• Developing Fit (Key skills unverified or absent)"}
                  </span>
                </div>
              </div>

              <div className="text-xs text-cream-200 max-w-sm sm:text-right">
                <span className="font-semibold text-white block">Deterministic 5-Tier Rule:</span>
                Assessment Verified (100%) &gt; Degree (95%) &gt; Project (70%) &gt; Self-Declared (35%) &gt; Missing (0%)
              </div>
            </div>

            {/* Match Rationale */}
            <div className="p-4 rounded-xl bg-cream-50 border border-cream-200 text-xs text-stone-700 space-y-1.5">
              <span className="font-bold text-forest-950 block">Deterministic Match Rationale:</span>
              <p className="leading-relaxed">{match.rationale}</p>
            </div>

            {/* Skill Requirements vs Verified Evidence */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Requirements vs Demonstrated Evidence
                </span>
                <span className="text-[11px] text-stone-500 font-medium">
                  {match.matchingSkills.length} job skills evaluated
                </span>
              </div>

              <div className="space-y-2">
                {match.matchingSkills.map((m, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-cream-50/70 border border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-forest-950 text-sm">{m.skillName}</span>
                      </div>
                      <span className="text-[11px] text-stone-500 block mt-0.5">{m.details}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          m.score >= 90
                            ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                            : m.score >= 70
                            ? "bg-sky-100 text-sky-900 border-sky-300"
                            : m.score > 0
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {m.evidenceBadge}
                      </span>
                      <span className="font-mono text-xs font-bold text-forest-900 min-w-[55px] text-right">
                        {m.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill-Gap Reporting Section */}
            <div className="space-y-3 pt-4 border-t border-cream-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-ochre-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-forest-950">
                    Skill-Gap Reporting & Remediation
                  </span>
                </div>
                <span className="text-[11px] font-medium text-stone-500">
                  {match.skillGaps.length === 0
                    ? "Zero skill gaps detected"
                    : `${match.skillGaps.length} skill gap(s) identified`}
                </span>
              </div>

              {match.skillGaps.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    <strong>All requirements satisfied:</strong> Candidate possesses verified or project-backed evidence for every required skill in this job profile.
                  </span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {match.skillGaps.map((gap, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-forest-950 text-sm">
                            {gap.skillName}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              gap.gapType === "MISSING"
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : "bg-amber-100 text-amber-900 border border-amber-300"
                            }`}
                          >
                            {gap.gapType === "MISSING" ? "Missing Skill" : "Unverified Self-Declaration"}
                          </span>
                          <span className="text-[10px] text-stone-500">
                            Weight: {gap.weight.toFixed(1)}x
                          </span>
                        </div>

                        {gap.recommendedAssessmentId && (
                          <Link
                            href={`/assessments/${gap.recommendedAssessmentId}`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-forest-900 text-cream-50 hover:bg-forest-800 text-[11px] font-semibold transition-all shadow-sm flex-shrink-0"
                          >
                            <span>Request SkillChain Assessment</span>
                            <ExternalLink className="w-3 h-3 text-ochre-300" />
                          </Link>
                        )}
                      </div>

                      <p className="text-stone-700 leading-relaxed text-[11px]">
                        <strong>Actionable Recommendation:</strong> {gap.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Credentials & Projects */}
      <div className="grid md:grid-cols-2 gap-6">
        {profile.credentials.length > 0 && (
          <div className="card-premium p-6 bg-white border border-cream-300 space-y-3">
            <h3 className="font-bold text-sm text-forest-950 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-forest-800" />
              University Credentials
            </h3>
            {profile.credentials.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-lg bg-cream-50 border border-cream-200 text-xs"
              >
                <span className="font-bold text-forest-950 block">{c.title}</span>
                <span className="text-stone-500 block">
                  {c.organization.name} • {c.grade || "Conferred"}
                </span>
                <span className="text-[10px] font-mono text-emerald-700 block mt-1 font-semibold">
                  On-Chain Status: {c.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {profile.projects.length > 0 && (
          <div className="card-premium p-6 bg-white border border-cream-300 space-y-3">
            <h3 className="font-bold text-sm text-forest-950 flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-sky-700" />
              Verified Code Projects
            </h3>
            {profile.projects.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-lg bg-cream-50 border border-cream-200 text-xs"
              >
                <span className="font-bold text-forest-950 block">{p.title}</span>
                <p className="text-stone-600 text-[11px] mt-0.5">{p.description}</p>
                <span className="text-[10px] font-mono text-stone-500 block mt-1">
                  Stack: {p.techStack}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Human In The Loop Notice */}
      <div className="p-4 rounded-xl bg-cream-100 border border-cream-200 text-xs text-stone-600 flex items-start gap-3">
        <HelpCircle className="w-4 h-4 text-forest-800 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-forest-950 block">
            SkillChain Human Decision Protocol:
          </span>
          <p className="leading-relaxed text-[11px]">
            AI outputs, match scores, and interview summaries serve purely as structured evidence
            synthesizers. Hiring stage advances, shortlisting, and final employment offers are
            strictly reserved for human recruiters and hiring managers.
          </p>
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/40 backdrop-blur-sm animate-fade-in">
          <div className="card-premium w-full max-w-lg bg-white border border-cream-300 p-6 sm:p-8 space-y-5 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-forest-900" />
                <h3 className="text-base font-bold text-forest-950">
                  Schedule Technical Interview
                </h3>
              </div>
              <button
                onClick={() => setIsScheduleOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-cream-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Candidate & Target Role
                </label>
                <div className="p-2.5 rounded-lg bg-cream-50 border border-cream-200 font-medium text-forest-950">
                  {profile.user.name} — {selectedJob?.title || "General Evaluation"}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-cream-300 bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-forest-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Timezone
                  </label>
                  <select
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-cream-300 bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-forest-800"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT/BST)</option>
                    <option value="UTC">UTC Universal</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-stone-700">
                    Live WebRTC Meeting Room
                  </label>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Google Meet Architecture
                  </span>
                </div>
                <input
                  type="text"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  required
                  placeholder="https://skillchain.org/rooms/webrtc-..."
                  className="w-full px-3 py-2 rounded-lg border border-cream-300 bg-white text-stone-800 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-forest-800"
                />
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Participants will join the 1:1 HD WebRTC meeting room directly inside SkillChain with camera, mic, screen-share, and live chat.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Recruiter Focus & Evaluation Notes
                </label>
                <textarea
                  rows={2}
                  value={focusNotes}
                  onChange={(e) => setFocusNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-cream-300 bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-forest-800"
                />
              </div>

              <div className="p-3 rounded-lg bg-cream-50 border border-cream-200 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentConfirmed}
                  onChange={(e) => setConsentConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-stone-300 text-forest-800 focus:ring-forest-800"
                />
                <label htmlFor="consent" className="text-[11px] text-stone-600 leading-tight">
                  Candidate will be informed of interview scope and transcript-based evidence capture. No biometric surveillance or automated rejection will be applied.
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-cream-200">
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:bg-cream-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduleLoading || !consentConfirmed}
                  className="px-5 py-2 rounded-lg bg-forest-900 text-cream-50 hover:bg-forest-800 disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  {scheduleLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Calendar className="w-3.5 h-3.5 text-ochre-300" />
                  )}
                  <span>Confirm & Dispatch Invitation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
