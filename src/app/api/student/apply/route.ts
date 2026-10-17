import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, matchScore } = await req.json();

    const profile = await prisma.studentProfile.findFirst({
      where: {
        OR: [{ userId: user.id }, { user: { email: user.email } }],
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const application = await prisma.application.upsert({
      where: {
        jobId_studentProfileId: {
          jobId,
          studentProfileId: profile.id,
        },
      },
      update: {
        matchScore: Number(matchScore || 0),
      },
      create: {
        jobId,
        studentProfileId: profile.id,
        currentStage: "APPLIED",
        matchScore: Number(matchScore || 0),
        stageEvents: {
          create: [
            {
              fromStage: "NONE",
              toStage: "APPLIED",
              actorId: user.id,
              notes: "Candidate submitted verifiable skill passport.",
            },
          ],
        },
      },
    });

    return NextResponse.json({ success: true, application });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
