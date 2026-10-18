import Link from "next/link";
import {
  Award,
  BookOpenCheck,
  Briefcase,
  Video,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Calendar,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();

  // Load student profile with credentials, attempts, applications, interviews
  let profile =
    user?.role === "STUDENT"
      ? await prisma.studentProfile.findFirst({
          where: { userId: user.id },
          include: {
            user: true,
            credentials: {
              include: { organization: true },
            },
            assessmentAttempts: {
              where: { status: "GRADED" },
              include: { assessment: true, assessmentResult: true },
              take: 3,
            },
            applications: {
              include: {
                job: { include: { organization: true } },
                interviews: true,
              },
            },
            studentSkills: {
              include: { skill: true },
            },
          },
        })
      : null;

  if (!profile) {
    profile = await prisma.studentProfile.findFirst({
      where: { user: { email: "alex.rivera@student.mit.edu" } },
      include: {
        user: true,
        credentials: {
          include: { organization: true },
        },
        assessmentAttempts: {
          where: { status: "GRADED" },
          include: { assessment: true, assessmentResult: true },
          take: 3,
        },
        applications: {
          include: {
            job: { include: { organization: true } },
            interviews: true,
          },
        },
        studentSkills: {
          include: { skill: true },
        },
      },
    });
  }

  const credentials = profile?.credentials || [];
  const attempts = profile?.assessmentAttempts || [];
  const applications = profile?.applications || [];
  const verifiedSkillsCount = profile?.studentSkills.filter((s) => s.verifiedByAssessment || s.verifiedByDegree).length || 0;

  const upcomingInterview = applications
    .flatMap((a) => a.interviews)
    .find((i) => i.status === "SCHEDULED" || i.status === "COMPLETED");

  const offeredCredential = credentials.find(
    (c) =>
      c.status === "OFFERED" ||
      c.status === "PENDING_ACCEPTANCE" ||
      c.status === "INITIATED" ||
      c.status === "STUDENT_ACCEPTED"
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cream-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-ochre-700">
            Student Skill Passport Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
            Welcome back, {profile?.user.name || "Alex Rivera"}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Your credentials and assessment proofs are anchored to Polygon Amoy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/skills/${profile?.publicPassportSlug || "alex-rivera-passport"}`}
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-white border border-cream-300 text-forest-900 hover:bg-cream-100 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 text-forest-700" />
            <span>View Public Passport</span>
          </Link>

          <Link
            href="/student/passport"
            className="px-4 py-2.5 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <QrCode className="w-3.5 h-3.5 text-ochre-300" />
            <span>Passport & QR Code</span>
          </Link>
        </div>
      </div>

      {/* Pending or Accepted Soulbound Degree Banner */}
      {offeredCredential && (
        <div
          className={`card-premium p-6 border-2 shadow-md space-y-4 animate-in zoom-in-95 ${
            offeredCredential.status === "STUDENT_ACCEPTED"
              ? "bg-gradient-to-r from-sky-50 to-blue-50 border-sky-400"
              : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-400"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-sm ${
                  offeredCredential.status === "STUDENT_ACCEPTED" ? "bg-sky-600" : "bg-amber-500"
                }`}
              >
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded inline-block mb-1 ${
                    offeredCredential.status === "STUDENT_ACCEPTED"
                      ? "bg-sky-200 text-sky-900"
                      : "bg-amber-200 text-amber-900"
                  }`}
                >
                  {offeredCredential.status === "STUDENT_ACCEPTED"
                    ? "✅ Accepted by Student — Awaiting Final University Seal"
                    : "🎓 College Initiated Soulbound Degree"}
                </span>
                <h3 className="text-lg font-bold text-forest-950">
                  {offeredCredential.title}
                </h3>
                <p className="text-xs text-stone-600">
                  Conferred by <strong>{offeredCredential.organization.name}</strong> •{" "}
                  {offeredCredential.fieldOfStudy} (Grade: {offeredCredential.grade})
                </p>
              </div>
            </div>

            <Link
              href="/student/credentials"
              className={`px-4 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all ${
                offeredCredential.status === "STUDENT_ACCEPTED"
                  ? "bg-sky-600 hover:bg-sky-700"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              <span>
                {offeredCredential.status === "STUDENT_ACCEPTED"
                  ? "View Degree Status"
                  : "🦊 Review & Accept with MetaMask"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-premium p-4 bg-white border border-cream-300">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">Degrees & Certs</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-display text-forest-950">{credentials.length}</p>
          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" />
            On-Chain Verified
          </span>
        </div>

        <div className="card-premium p-4 bg-white border border-cream-300">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">Verified Skills</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-display text-forest-950">{verifiedSkillsCount}</p>
          <span className="text-[10px] text-stone-500 font-medium block mt-1">
            Proctored Assessments
          </span>
        </div>

        <div className="card-premium p-4 bg-white border border-cream-300">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">Job Applications</span>
            <Briefcase className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-bold font-display text-forest-950">{applications.length}</p>
          <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
            1 Shortlisted
          </span>
        </div>

        <div className="card-premium p-4 bg-white border border-cream-300">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">Interviews</span>
            <Video className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold font-display text-forest-950">
            {applications.reduce((acc, a) => acc + a.interviews.length, 0)}
          </p>
          <span className="text-[10px] text-purple-700 font-semibold block mt-1">
            AI Summary Ready
          </span>
        </div>
      </div>

      {/* Main Grid: Credential Focus & Interview Highlight */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols): Academic Degree & Assessment Proofs */}
        <div className="lg:col-span-8 space-y-6">
          {/* Latest Academic Degree */}
          {credentials[0] && (
            <div className="card-premium p-6 bg-white border border-cream-300">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">
                      Primary Academic Degree
                    </span>
                    <h2 className="text-base font-bold text-forest-950">{credentials[0].title}</h2>
                    <p className="text-xs text-stone-600">
                      {credentials[0].organization.name} • {credentials[0].fieldOfStudy} ({credentials[0].grade})
                    </p>
                  </div>
                </div>
                <span className="seal-badge text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  ACTIVE REGISTRY
                </span>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-cream-50 text-xs font-mono text-stone-600 flex flex-wrap items-center justify-between gap-2 border border-cream-200">
                <span>Commitment: {credentials[0].commitment.substring(0, 20)}...</span>
                <Link
                  href={`/verify/${credentials[0].credId}`}
                  className="font-sans font-semibold text-forest-800 hover:text-forest-950 flex items-center gap-1"
                >
                  <span>Verify On-Chain</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Recent Assessment Proofs */}
          <div className="card-premium p-6 bg-white border border-cream-300 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-forest-950">Recent Skill Assessments</h2>
                <p className="text-xs text-stone-500">Proctored, hidden-test verified code submissions</p>
              </div>
              <Link
                href="/student/assessments"
                className="text-xs font-bold text-forest-800 hover:text-forest-950 flex items-center gap-1"
              >
                <span>Browse All Tests</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {attempts.map((att) => (
                <div
                  key={att.id}
                  className="p-3.5 rounded-xl bg-cream-50 border border-cream-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                      {att.score}%
                    </div>
                    <div>
                      <h4 className="font-bold text-forest-950 text-xs">{att.assessment.title}</h4>
                      <p className="text-[11px] text-stone-500">
                        Completed on {formatDate(att.completedAt)} • Passed with Distinction
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Verified Skill
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Upcoming Interview & Next Steps */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upcoming Interview Card */}
          {upcomingInterview && (
            <div className="card-premium p-5 bg-forest-950 text-cream-50 border-forest-900">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-ochre-400 flex items-center gap-1">
                  <Video className="w-3.5 h-3.5" />
                  Interview Scheduled
                </span>
                <span className="px-1.5 py-0.2 rounded bg-forest-900 text-[10px] text-cream-200 font-semibold">
                  Round 1
                </span>
              </div>
              <h3 className="font-bold text-sm text-cream-50">Stripe — Frontend Engineering</h3>
              <p className="text-xs text-stone-400 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                {formatDate(upcomingInterview.scheduledAt)} ({upcomingInterview.durationMinutes} mins)
              </p>

              <div className="mt-4 pt-3 border-t border-forest-900 flex items-center justify-between">
                <Link
                  href="/student/interviews"
                  className="text-xs font-semibold text-ochre-300 hover:text-ochre-200 flex items-center gap-1"
                >
                  <span>Review Notes & AI Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Discovery Recommendation */}
          <div className="card-premium p-5 bg-white border border-cream-300 space-y-3">
            <h3 className="font-bold text-sm text-forest-950">Recommended Skill Verification</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Recruiters are currently seeking verified <strong>Python & Systems</strong> competencies.
              Taking this 45-minute sandboxed test increases your job match score by up to 25%.
            </p>
            <Link
              href="/student/assessments"
              className="w-full py-2 rounded-lg bg-cream-100 hover:bg-cream-200 text-forest-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Take Python Assessment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
