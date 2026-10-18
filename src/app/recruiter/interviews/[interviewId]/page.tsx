import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/session";
import { JitsiMeetingRoom } from "@/components/interviews/JitsiMeetingRoom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Building,
  UserCheck,
  ShieldCheck,
  FileText,
  Briefcase,
  Sparkles,
} from "lucide-react";

interface RecruiterInterviewPageProps {
  params: Promise<{ interviewId: string }>;
}

export default async function RecruiterInterviewLiveRoomPage({
  params,
}: RecruiterInterviewPageProps) {
  const { interviewId } = await params;
  const currentUser = await getCurrentUser();

  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      application: {
        include: {
          job: { include: { organization: true } },
          studentProfile: {
            include: {
              user: true,
              studentSkills: { include: { skill: true } },
            },
          },
        },
      },
      report: true,
      transcript: true,
    },
  });

  if (!interview) {
    notFound();
  }

  const candidate = interview.application.studentProfile.user;
  const job = interview.application.job;
  const organization = job.organization;
  const studentProfile = interview.application.studentProfile;

  // Extract clean room name from meetingUrl
  let roomName = `SkillChain-Interview-${interview.id.slice(0, 10)}`;
  if (interview.meetingUrl) {
    try {
      const url = new URL(interview.meetingUrl);
      const pathParts = url.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        roomName = pathParts[pathParts.length - 1];
      }
    } catch {}
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/recruiter/interviews"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-forest-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Interviews Workspace</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-forest-100 text-forest-900">
              1:1 Live Evaluation Room
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900">
              {interview.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold font-display text-forest-950 mt-1">
            Technical Interview: {candidate.name}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Role: <strong>{job.title}</strong> at {organization.name} • Scheduled: {formatDate(interview.scheduledAt)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/skills/${studentProfile.publicPassportSlug || "student"}`}
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-white border border-cream-300 text-forest-900 hover:bg-cream-100 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <UserCheck className="w-3.5 h-3.5 text-forest-700" />
            <span>View Verified Skills</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Live Video Meeting + Side Evaluation Intelligence Panel */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Real-Time WebRTC Jitsi Meeting Window */}
        <div className="lg:col-span-8 space-y-4">
          <JitsiMeetingRoom
            roomName={roomName}
            userName={currentUser?.name || "HR Recruiter"}
            userRole="RECRUITER"
            interviewTitle={`${job.title} — Round 1 Technical`}
            candidateName={candidate.name}
            recruiterName={currentUser?.name || "HR Interviewer"}
          />
        </div>

        {/* Right Column (4 cols): Candidate Verified Competencies & Live Notes */}
        <div className="lg:col-span-4 space-y-4">
          {/* Candidate Snapshot Card */}
          <div className="card-premium p-5 bg-white border border-cream-300 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-forest-900 text-cream-50 flex items-center justify-center font-bold text-sm">
                {candidate.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-forest-950 text-sm">{candidate.name}</h3>
                <span className="text-[11px] text-stone-500 block">{candidate.email}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-cream-200 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                Target Job Skills to Validate:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {studentProfile.studentSkills.map((s: any) => (
                  <span
                    key={s.id}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                      s.verifiedByAssessment
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-cream-100 text-stone-700 border-cream-200"
                    }`}
                  >
                    {s.verifiedByAssessment && <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                    <span>{s.skill.name}</span>
                  </span>
                ))}
              </div>
            </div>

            {interview.notes && (
              <div className="p-3 rounded-lg bg-cream-50 border border-cream-200 text-xs text-stone-700">
                <span className="font-bold text-forest-950 block mb-1">Focus Notes:</span>
                <p className="leading-relaxed">{interview.notes}</p>
              </div>
            )}
          </div>

          {/* AI Intelligence & Report Card */}
          <div className="card-premium p-5 bg-gradient-to-br from-forest-950 to-forest-900 text-cream-50 border border-forest-800 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-ochre-300" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-ochre-300">
                Interview Intelligence Model
              </h4>
            </div>
            <p className="text-xs text-cream-200 leading-relaxed">
              Real-time conversational turn tracking active. Transcripts and technical depth are
              evaluated against job rubric standards.
            </p>

            <div className="p-3 rounded-xl bg-forest-900/80 border border-forest-700 text-xs text-stone-300 space-y-1">
              <div className="flex justify-between">
                <span>Speaker Diarization:</span>
                <strong className="text-emerald-400">Candidate + HR</strong>
              </div>
              <div className="flex justify-between">
                <span>Rubric Dimensions:</span>
                <strong className="text-cream-100">Depth, Reasoning, Speed</strong>
              </div>
              <div className="flex justify-between">
                <span>Audio Privacy:</span>
                <strong className="text-cream-100">Zero Audio Retention</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
