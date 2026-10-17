import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assessmentId } = await req.json();

    const profile = await prisma.studentProfile.findFirst({
      where: {
        OR: [{ userId: user.id }, { user: { email: user.email } }],
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // Check if an in-progress attempt already exists
    let attempt = await prisma.assessmentAttempt.findFirst({
      where: {
        assessmentId,
        studentProfileId: profile.id,
        status: "IN_PROGRESS",
      },
    });

    if (!attempt) {
      attempt = await prisma.assessmentAttempt.create({
        data: {
          assessmentId,
          studentProfileId: profile.id,
          status: "IN_PROGRESS",
          startedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, attemptId: attempt.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
