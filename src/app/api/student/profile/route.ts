import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, headline, bio, universityName, degree, githubUrl, linkedinUrl, portfolioUrl } =
      await req.json();

    await prisma.user.update({
      where: { id: user.id },
      data: { name },
    });

    const updatedProfile = await prisma.studentProfile.update({
      where: { userId: user.id },
      data: {
        headline,
        bio,
        universityName,
        degree,
        githubUrl,
        linkedinUrl,
        portfolioUrl,
      },
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
