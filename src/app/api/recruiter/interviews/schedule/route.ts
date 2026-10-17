import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { meetingProviderService } from "@/lib/interviews/meeting-provider";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "RECRUITER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { studentProfileId, jobId, meetingUrl, scheduledAt, timeZone = "America/New_York", notes } = await req.json();

    let targetJobId = jobId;
    if (!targetJobId) {
      const firstJob = await prisma.job.findFirst();
      targetJobId = firstJob?.id;
    }

    const job = await prisma.job.findUnique({
      where: { id: targetJobId },
    });

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: { user: true },
    });

    if (!studentProfile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
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

    // Generate meeting room via real provider if configured, else clearly labelled demo provider
    const scheduledDate = new Date(scheduledAt || Date.now() + 86400000 * 2);
    let resolvedMeetingUrl = meetingUrl;
    let providerInfo = meetingProviderService.getProviderInfo();

    if (!resolvedMeetingUrl) {
      const room = await meetingProviderService.createMeetingRoom({
        topic: `SkillChain Technical Evaluation: ${job?.title || "Engineering"}`,
        scheduledAt: scheduledDate,
        durationMinutes: 45,
      });
      resolvedMeetingUrl = room.meetingUrl;
    }

    // Create Interview with participants and consent records
    const interview = await prisma.interview.create({
      data: {
        applicationId: application.id,
        scheduledAt: scheduledDate,
        durationMinutes: 45,
        timeZone,
        status: "SCHEDULED",
        meetingUrl: resolvedMeetingUrl,
        recordingConsentGiven: true, // Recruiter consent granted
        notes: notes || "Technical evaluation round scheduled by recruiter.",
        participants: {
          create: [
            { userId: user.id, role: "INTERVIEWER" },
            { userId: studentProfile.userId, role: "CANDIDATE" },
          ],
        },
        consents: {
          create: [
            { userId: user.id, consentGiven: true, policyVersion: "v1.0" },
            { userId: studentProfile.userId, consentGiven: true, policyVersion: "v1.0" },
          ],
        },
      },
    });

    // Record stage event in application pipeline
    await prisma.applicationStageEvent.create({
      data: {
        applicationId: application.id,
        fromStage: application.currentStage,
        toStage: "INTERVIEW_SCHEDULED",
        actorId: user.id,
        notes: `Recruiter scheduled technical interview round (${providerInfo.label}).`,
      },
    });

    return NextResponse.json({
      success: true,
      interviewId: interview.id,
      meetingUrl: resolvedMeetingUrl,
      provider: providerInfo.provider,
      providerLabel: providerInfo.label,
      isRealProvider: providerInfo.isReal,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
