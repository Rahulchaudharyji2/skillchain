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

    const [profile, job] = await Promise.all([
      prisma.studentProfile.findFirst({
        where: {
          OR: [{ userId: user.id }, { user: { email: user.email } }],
        },
        include: {
          studentSkills: {
            include: { skill: true },
          },
        },
      }),
      prisma.job.findUnique({
        where: { id: jobId },
        include: {
          requirements: { include: { skill: true } },
        },
      }),
    ]);

    if (!profile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    if (!job) {
      return NextResponse.json({ error: "Job posting not found" }, { status: 404 });
    }

    // STRICT ELIGIBILITY CHECK: Student must possess ALL required skills for this job
    const candidateSkillNames = new Set(
      profile.studentSkills
        .filter((s) => s.verifiedByAssessment || s.verifiedByDegree || !s.isSelfDeclared)
        .map((s) => s.skill.name.toLowerCase().trim())
    );

    const missingSkills = job.requirements
      .map((r) => r.skill.name)
      .filter((skillName) => !candidateSkillNames.has(skillName.toLowerCase().trim()));

    if (missingSkills.length > 0) {
      return NextResponse.json(
        {
          error: `Eligibility requirement not met: You must verify all required skills for this job before applying. Missing verified skills: ${missingSkills.join(", ")}. Please take our AI proctored skill exam first.`,
          missingSkills,
        },
        { status: 403 }
      );
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
