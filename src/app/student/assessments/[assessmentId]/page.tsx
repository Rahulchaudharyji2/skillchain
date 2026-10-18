import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Eye,
  FileCode,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { AssessmentConsentForm } from "./AssessmentConsentForm";

interface AssessmentDetailPageProps {
  params: Promise<{ assessmentId: string }>;
}

export default async function AssessmentDetailPage({ params }: AssessmentDetailPageProps) {
  const { assessmentId } = await params;
  const user = await getCurrentUser();

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      category: true,
      skills: { include: { skill: true } },
      questions: { select: { id: true, type: true, points: true } },
    },
  });

  if (!assessment) {
    notFound();
  }

  const profile = await prisma.studentProfile.findFirst({
    where: {
      OR: [
        { userId: user?.id },
        { user: { email: user?.email || "alex.rivera@student.mit.edu" } },
      ],
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link
        href="/student/assessments"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-forest-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Assessments</span>
      </Link>

      <div className="card-premium p-8 bg-white border border-cream-300 space-y-8">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-forest-700 px-2.5 py-0.5 rounded bg-cream-100">
            {assessment.category.name} • {assessment.difficulty}
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-2">
            {assessment.title}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
            {assessment.instructions}
          </p>
        </div>

        {/* Specifications Matrix */}
        <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-cream-50 border border-cream-200 text-center">
          <div>
            <span className="text-xs text-stone-400 font-semibold block">DURATION</span>
            <span className="text-lg font-bold text-forest-950 mt-0.5 block">
              {assessment.durationMinutes} Mins
            </span>
          </div>
          <div>
            <span className="text-xs text-stone-400 font-semibold block">PASSING CRITERIA</span>
            <span className="text-lg font-bold text-emerald-800 mt-0.5 block">
              {assessment.passingThreshold}%
            </span>
          </div>
          <div>
            <span className="text-xs text-stone-400 font-semibold block">QUESTIONS</span>
            <span className="text-lg font-bold text-forest-950 mt-0.5 block">
              {assessment.questions.length} Items
            </span>
          </div>
        </div>

        {/* Proctoring Disclosures & Instructions */}
        <div className="p-5 rounded-xl bg-cream-100/70 border border-cream-300 space-y-3">
          <div className="flex items-center gap-2 text-forest-900 font-bold text-sm">
            <Eye className="w-4 h-4 text-forest-700" />
            <span>Proctoring & Assessment Integrity Notice</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            To ensure the authenticity of your verified credential, SkillChain monitors browser tab
            focus changes and fullscreen exit events during this assessment. All code execution occurs in
            an isolated server-side sandbox against undisclosed hidden test cases.
          </p>
          <ul className="text-xs text-stone-600 space-y-1 list-disc list-inside">
            <li><strong>No Screen Switching:</strong> Tab switches and leaving the window trigger instant anti-cheat alerts.</li>
            <li><strong>AI Camera & Face Proctoring:</strong> Single-face verification active. Multiple faces or missing face are flagged.</li>
            <li><strong>Gaze & Head Angle Monitoring:</strong> Turning away from the examination screen generates security notifications.</li>
            <li><strong>Server-Side Hidden Tests:</strong> Code executes in an isolated sandbox with automated grading.</li>
          </ul>
        </div>

        {/* Interactive Consent & Start Form */}
        <AssessmentConsentForm
          assessmentId={assessment.id}
          studentProfileId={profile?.id || "demo-profile-id"}
        />
      </div>
    </div>
  );
}
