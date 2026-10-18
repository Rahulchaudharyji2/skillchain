import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/session";
import { WebRtcMeetingRoom } from "@/components/interviews/WebRtcMeetingRoom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Building,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Sparkles,
  Video,
} from "lucide-react";

interface StudentInterviewRoomPageProps {
  params: Promise<{ interviewId: string }>;
}

export default async function StudentInterviewLiveRoomPage({
  params,
}: StudentInterviewRoomPageProps) {
  const { interviewId } = await params;
  const currentUser = await getCurrentUser();

  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      application: {
        include: {
          job: { include: { organization: true } },
          studentProfile: { include: { user: true } },
        },
      },
      report: true,
      transcript: true,
    },
  });

  if (!interview) {
    notFound();
  }

  const job = interview.application.job;
  const organization = job.organization;
  const candidate = interview.application.studentProfile.user;

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
            href="/student/interviews"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-forest-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Scheduled Interviews</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
              Candidate Live Room
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cream-100 text-forest-900">
              {interview.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold font-display text-forest-950 mt-1">
            {job.title} — 1:1 Technical Interview
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Organization: <strong>{organization.name}</strong> • Scheduled: {formatDate(interview.scheduledAt)} ({interview.durationMinutes} mins)
          </p>
        </div>

        <div className="p-3 rounded-xl bg-white border border-cream-300 text-xs text-stone-600 flex items-center gap-2.5 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Verified Student Candidate Room</span>
        </div>
      </div>

      {/* Main Grid: Live Video Meeting + Side Tips & Guidelines */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Real-Time WebRTC Google Meet Style Window */}
        <div className="lg:col-span-8 space-y-4">
          <WebRtcMeetingRoom
            interviewId={interview.id}
            roomName={roomName}
            userName={currentUser?.name || candidate.name}
            userRole="CANDIDATE"
            interviewTitle={`${job.title} — Round 1 Technical`}
            candidateName={candidate.name}
            recruiterName={`${organization.name} Interviewer`}
          />
        </div>

        {/* Right Column (4 cols): Interview Guidelines & Tips */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card-premium p-5 bg-white border border-cream-300 space-y-3">
            <div className="flex items-center gap-2 text-forest-950 font-bold text-sm">
              <Building className="w-4 h-4 text-forest-700" />
              <span>Job Overview & Team</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">{job.overview}</p>
            <div className="pt-2 border-t border-cream-200">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-1">
                Required Competencies:
              </span>
              <div className="flex flex-wrap gap-1">
                {JSON.parse(job.requiredSkillsJson || "[]").map((s: string, idx: number) => (
                  <span
                    key={idx}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cream-100 text-forest-900 border border-cream-200"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="card-premium p-5 bg-forest-950 text-cream-50 border-forest-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ochre-300">
              Candidate Preparation Tips
            </h4>
            <ul className="text-xs text-cream-200 space-y-2 list-disc list-inside leading-relaxed">
              <li>Keep your webcam and microphone active throughout the interview.</li>
              <li>Explain your thought process aloud when working through architecture or coding problems.</li>
              <li>Reference concrete past projects and verified credentials on your SkillChain passport.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
