import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();

    let email = "alex.rivera@student.mit.edu";
    let redirectPath = "/student/dashboard";

    if (role === "ISSUER" || role === "UNIVERSITY_ADMIN") {
      email = "issuer@mit.edu";
      redirectPath = "/university/dashboard";
    } else if (role === "RECRUITER") {
      email = "recruiter@stripe.com";
      redirectPath = "/recruiter/dashboard";
    } else if (role === "ADMIN") {
      email = "admin@skillchain.org";
      redirectPath = "/admin/dashboard";
    } else {
      email = "alex.rivera@student.mit.edu";
      redirectPath = "/student/dashboard";
    }

    const res = NextResponse.json({ success: true, redirectPath });
    res.cookies.set("skillchain_demo_role", role, { path: "/", maxAge: 60 * 60 * 24 * 7 });
    res.cookies.set("skillchain_demo_email", email, { path: "/", maxAge: 60 * 60 * 24 * 7 });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
