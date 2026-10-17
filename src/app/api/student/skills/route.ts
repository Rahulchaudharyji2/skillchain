import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { skillId, proficiencyLevel } = await req.json();

    const profile = await prisma.studentProfile.findFirst({
      where: {
        OR: [{ userId: user.id }, { user: { email: user.email } }],
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const studentSkill = await prisma.studentSkill.upsert({
      where: {
        studentProfileId_skillId: {
          studentProfileId: profile.id,
          skillId,
        },
      },
      update: {
        proficiencyLevel,
        isSelfDeclared: true,
      },
      create: {
        studentProfileId: profile.id,
        skillId,
        proficiencyLevel,
        isSelfDeclared: true,
      },
    });

    return NextResponse.json({ success: true, studentSkill });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
