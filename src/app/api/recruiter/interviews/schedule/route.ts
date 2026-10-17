import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "RECRUITER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { studentProfileId, jobId, meetingUrl, scheduledAt } = await req.json();

    let targetJobId = jobId;
    if (!targetJobId) {
      const firstJob = await prisma.job.findFirst();
      targetJobId = firstJob?.id;
    }

    // Get or create application
    let application = await prisma.application.findFirst({
      where: {
        jobId: targetJobId,
        studentProfileId,
      },
    });

    if (!application) {
      application = await prisma.application.create({
        data: {
          jobId: targetJobId,
          studentProfileId,
          currentStage: "INTERVIEW_SCHEDULED",
          matchScore: 85.0,
        },
      });
    } else {
      await prisma.application.update({
        where: { id: application.id },
        data: { currentStage: "INTERVIEW_SCHEDULED" },
      });
    }

    // Create Interview
    const interview = await prisma.interview.create({
      data: {
        applicationId: application.id,
        scheduledAt: new Date(scheduledAt || Date.now() + 86400000 * 2),
        durationMinutes: 45,
        timeZone: "America/New_York",
        status: "SCHEDULED",
        meetingUrl: meetingUrl || "https://meet.skillchain.org/room/str-eval-901",
        recordingConsentGiven: true,
        notes: "Technical evaluation round scheduled by recruiter.",
      },
    });

    // Record stage event
    await prisma.applicationStageEvent.create({
      data: {
        applicationId: application.id,
        fromStage: application.currentStage,
        toStage: "INTERVIEW_SCHEDULED",
        actorId: user.id,
        notes: "Recruiter scheduled technical interview round.",
      },
    });

    return NextResponse.json({ success: true, interviewId: interview.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
