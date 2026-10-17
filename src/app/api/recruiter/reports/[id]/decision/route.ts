import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "RECRUITER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const { hrDecision, hrNotes } = await req.json();

    const report = await prisma.interviewReport.findUnique({
      where: { id },
      include: {
        interview: {
          include: {
            application: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Interview report not found" }, { status: 404 });
    }

    const updatedReport = await prisma.interviewReport.update({
      where: { id },
      data: {
        hrDecision,
        hrNotes: hrNotes || "",
        reviewedById: user.id,
        updatedAt: new Date(),
      },
    });

    // Update application stage according to human recruiter decision
    const application = report.interview.application;
    let targetStage = application.currentStage;

    if (hrDecision === "APPROVED") {
      targetStage = "SELECTED";
    } else if (hrDecision === "REJECTED") {
      targetStage = "REJECTED";
    } else if (hrDecision === "NEEDS_MORE_INFO") {
      targetStage = "SHORTLISTED";
    }

    if (targetStage !== application.currentStage) {
      await prisma.application.update({
        where: { id: application.id },
        data: { currentStage: targetStage },
      });

      await prisma.applicationStageEvent.create({
        data: {
          applicationId: application.id,
          fromStage: application.currentStage,
          toStage: targetStage,
          actorId: user.id,
          notes: `Recruiter decision on AI interview report: ${hrDecision}. Notes: ${hrNotes || "None"}`,
        },
      });
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "INTERVIEW_DECISION_SUBMITTED",
        entityType: "InterviewReport",
        entityId: report.id,
        detailsJson: JSON.stringify({
          decision: hrDecision,
          notes: hrNotes,
          previousStage: application.currentStage,
          newStage: targetStage,
        }),
      },
    });

    return NextResponse.json({ success: true, report: updatedReport, newStage: targetStage });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
