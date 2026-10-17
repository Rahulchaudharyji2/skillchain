import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getFlaggedAttempts, submitAssessmentReview } from "@/lib/assessments/review";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only ADMIN, ISSUER, or RECRUITER can review assessments
    if (user.role === "STUDENT") {
      return NextResponse.json({ error: "Forbidden: Human assessor review privilege required." }, { status: 403 });
    }

    const flagged = await getFlaggedAttempts();
    return NextResponse.json({ success: true, attempts: flagged });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "STUDENT") {
      return NextResponse.json({ error: "Forbidden: Human assessor review privilege required." }, { status: 403 });
    }

    const { attemptId, decision, comments } = await req.json();

    if (!attemptId || !decision || !comments) {
      return NextResponse.json(
        { error: "attemptId, decision ('APPROVED' | 'REJECTED' | 'DISMISSED'), and comments are required." },
        { status: 400 }
      );
    }

    const result = await submitAssessmentReview({
      attemptId,
      reviewerId: user.id,
      decision,
      comments,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
