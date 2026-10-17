import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isPassportPublic } = await req.json();

    const updated = await prisma.studentProfile.update({
      where: { userId: user.id },
      data: { isPassportPublic: Boolean(isPassportPublic) },
    });

    return NextResponse.json({ success: true, isPassportPublic: updated.isPassportPublic });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
