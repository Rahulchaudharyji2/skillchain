import Link from "next/link";
import {
  Briefcase,
  Users,
  Sparkles,
  Video,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Search,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function RecruiterDashboardPage() {
  const user = await getCurrentUser();

  const [jobs, applications, candidatesCount, interviews] = await Promise.all([
    prisma.job.findMany({
      include: {
        organization: true,
        applications: { include: { studentProfile: { include: { user: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.application.findMany({
      include: {
        job: true,
        studentProfile: { include: { user: true } },
      },
      orderBy: { matchScore: "desc" },
      take: 5,
    }),
    prisma.studentProfile.count(),
    prisma.interview.findMany({
      include: {
        application: { include: { job: true, studentProfile: { include: { user: true } } } },
        report: true,
      },
      take: 3,
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cream-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Recruiter Talent Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
            Talent Discovery & Verification
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Stripe Global Recruiting • AI Job Creator & Deterministic Match Engine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/recruiter/candidates"
            className="px-4 py-2.5 rounded-xl bg-white border border-cream-300 text-forest-900 hover:bg-cream-100 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <Search className="w-3.5 h-3.5 text-forest-700" />
            <span>Discover Candidates</span>
          </Link>

          <Link
            href="/recruiter/jobs/new"
            className="px-4 py-2.5 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-ochre-300" />
            <span>Create Job with AI</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-premium p-4 bg-white border border-cream-300">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">Active Postings</span>
            <Briefcase className="w-4 h-4 text-forest-700" />
          </div>
          <p className="text-2xl font-bold font-display text-forest-950">{jobs.length}</p>
          <span className="text-[10px] text-stone-500 font-medium block mt-1">
            Published on SkillChain
          </span>
        </div>

        <div className="card-premium p-4 bg-white border border-cream-300">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">Talent Pool</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-bold font-display text-forest-950">{candidatesCount}</p>
          <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
            Verified Passports
          </span>
        </div>

        <div className="card-premium p-4 bg-white border border-cream-300">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">Shortlisted</span>
            <Sparkles className="w-4 h-4 text-ochre-600" />
          </div>
          <p className="text-2xl font-bold font-display text-forest-950">
            {applications.filter((a) => a.currentStage === "SHORTLISTED" || a.currentStage === "INTERVIEW_SCHEDULED").length}
          </p>
          <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
            Evidence-backed matches
          </span>
        </div>

        <div className="card-premium p-4 bg-white border border-cream-300">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">Interviews</span>
            <Video className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold font-display text-forest-950">{interviews.length}</p>
          <span className="text-[10px] text-purple-700 font-semibold block mt-1">
            AI Summaries Enabled
          </span>
        </div>
      </div>

      {/* Main Grid: Top Matches & Interviews */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Top Candidate Matches (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-forest-950">Top Evidence-Backed Candidates</h2>
              <p className="text-xs text-stone-500">Ranked by transparent, verifiable skill proofs</p>
            </div>
            <Link
              href="/recruiter/applications"
              className="text-xs font-semibold text-forest-800 hover:text-forest-950 flex items-center gap-1"
            >
              <span>View All Pipeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="card-premium p-4 bg-white border border-cream-300 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-forest-900 text-cream-50 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {app.studentProfile.user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-forest-950">
                        {app.studentProfile.user.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cream-100 text-forest-800 font-medium">
                        {app.currentStage.replace("_", " ")}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-500 block">
                      Role: {app.job.title}
                    </span>
                    <span className="text-[10px] text-stone-400 block">
                      Applied {formatDate(app.appliedAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                        app.matchScore >= 80
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {app.matchScore}% MATCH
                    </span>
                  </div>

                  <Link
                    href={`/recruiter/candidates/${app.studentProfile.id}`}
                    className="px-3 py-1.5 rounded-lg bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>View Match</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: AI Job Creator Quick Trigger (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card-premium p-6 bg-forest-950 text-cream-50 border-forest-900 space-y-4">
            <div className="flex items-center gap-2 text-ochre-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs uppercase font-bold tracking-wider">Natural Language AI</span>
            </div>
            <h3 className="font-bold text-base text-cream-50">Create Job from Prompt</h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              Describe your role in plain English. The AI synthesizes responsibilities, required skills,
              proficiency tiers, and matching weights.
            </p>
            <Link
              href="/recruiter/jobs/new"
              className="w-full py-2.5 rounded-xl bg-ochre-400 hover:bg-ochre-300 text-forest-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Open AI Job Creator</span>
              <ArrowRight className="w-4 h-4 text-forest-900" />
            </Link>
          </div>

          <div className="card-premium p-5 bg-white border border-cream-300 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-forest-900">
              Recent AI Interview Reports
            </h3>
            {interviews[0] && (
              <div className="p-3 rounded-lg bg-cream-50 border border-cream-200 text-xs space-y-1">
                <span className="font-bold text-forest-950 block">
                  {interviews[0].application.studentProfile.user.name} — Technical Round
                </span>
                <span className="text-[11px] text-stone-500 block">
                  Decision: {interviews[0].report?.hrDecision || "Under Review"}
                </span>
                <Link
                  href="/recruiter/reports"
                  className="text-[11px] font-semibold text-forest-800 hover:text-forest-950 inline-flex items-center gap-1 pt-1"
                >
                  <span>Read Validated Synthesis</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
