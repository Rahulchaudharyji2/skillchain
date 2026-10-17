import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "RECRUITER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { studentProfileId } = await req.json();

    const employerOrg = await prisma.organization.findFirst({
      where: { type: "EMPLOYER" },
    });

    if (!employerOrg) {
      return NextResponse.json({ error: "Employer org not found" }, { status: 404 });
    }

    const shortlist = await prisma.candidateShortlist.upsert({
      where: {
        organizationId_studentProfileId: {
          organizationId: employerOrg.id,
          studentProfileId,
        },
      },
      update: { notes: "Shortlisted via Recruiter Candidate Match Explorer" },
      create: {
        organizationId: employerOrg.id,
        studentProfileId,
        notes: "Shortlisted via Recruiter Candidate Match Explorer",
      },
    });

    return NextResponse.json({ success: true, shortlist });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
