import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { generateStructuredInterviewReport } from "@/lib/interviews/report-generator";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "RECRUITER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id: interviewId } = await params;
    const body = await req.json().catch(() => ({}));
    const forceRegenerate = body.forceRegenerate === true;

    const result = await generateStructuredInterviewReport({
      interviewId,
      actorId: user.id,
      forceRegenerate,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, consentGranted: result.consentGranted },
        { status: result.consentGranted ? 400 : 403 }
      );
    }

    return NextResponse.json({
      success: true,
      report: result.report,
      isSimulatedTranscript: result.isSimulatedTranscript,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate interview report" }, { status: 500 });
  }
}
