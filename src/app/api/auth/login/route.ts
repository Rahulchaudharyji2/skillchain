import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, role, walletAddress } = body;

    // 1. Web3 Wallet Login (MetaMask)
    if (walletAddress) {
      const normalizedAddress = walletAddress.toLowerCase();

      // Look up existing user by wallet address or email
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { walletAddress: { equals: normalizedAddress } },
            { email: email || "" },
          ],
        },
        include: { studentProfile: true },
      });

      if (!user) {
        // Find default student (Alex Rivera) or create linked wallet
        user = await prisma.user.findFirst({
          where: { role: role || "STUDENT" },
          include: { studentProfile: true },
        });

        if (user) {
          // Update user wallet address
          await prisma.user.update({
            where: { id: user.id },
            data: { walletAddress: normalizedAddress },
          });
        }
      }

      const activeRole = role || user?.role || "STUDENT";
      let redirectPath = "/student/dashboard";
      if (activeRole === "RECRUITER") redirectPath = "/recruiter/dashboard";
      if (activeRole === "UNIVERSITY_ADMIN" || activeRole === "ISSUER") redirectPath = "/university/dashboard";

      const res = NextResponse.json({
        success: true,
        user: {
          id: user?.id,
          name: user?.name || "Web3 Student",
          email: user?.email || "alex.rivera@student.mit.edu",
          role: activeRole,
          walletAddress: normalizedAddress,
        },
        redirectPath,
      });

      res.cookies.set("skillchain_demo_role", activeRole, { path: "/", maxAge: 60 * 60 * 24 * 7 });
      res.cookies.set("skillchain_demo_email", user?.email || "alex.rivera@student.mit.edu", { path: "/", maxAge: 60 * 60 * 24 * 7 });
      res.cookies.set("skillchain_wallet_address", normalizedAddress, { path: "/", maxAge: 60 * 60 * 24 * 7 });

      return res;
    }

    // 2. Email & Password Institutional Login
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user in database
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: `User with email ${email} not found in database.` },
        { status: 404 }
      );
    }

    let targetRole = user.role;
    let redirectPath = "/student/dashboard";

    if (targetRole === "ISSUER" || targetRole === "UNIVERSITY_ADMIN") {
      redirectPath = "/university/dashboard";
    } else if (targetRole === "RECRUITER") {
      redirectPath = "/recruiter/dashboard";
    } else if (targetRole === "ADMIN") {
      redirectPath = "/admin/dashboard";
    }

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: targetRole,
        walletAddress: user.walletAddress,
      },
      redirectPath,
    });

    res.cookies.set("skillchain_demo_role", targetRole, { path: "/", maxAge: 60 * 60 * 24 * 7 });
    res.cookies.set("skillchain_demo_email", user.email, { path: "/", maxAge: 60 * 60 * 24 * 7 });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
