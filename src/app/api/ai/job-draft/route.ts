import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { aiService } from "@/lib/ai/service";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "RECRUITER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized: Recruiter role required" }, { status: 403 });
    }

    const { prompt, template, manualFallback } = await req.json();

    // If recruiter requests a manual fallback template or if AI is bypassed
    if (manualFallback || (!prompt && template)) {
      const draft = aiService.getManualJobTemplate(template || "fullstack");
      return NextResponse.json({ success: true, draft, isManualFallback: true });
    }

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "A prompt or fallback template identifier is required." }, { status: 400 });
    }

    const draft = await aiService.generateJobDraft(prompt);

    return NextResponse.json({
      success: true,
      draft,
      isManualFallback: draft.isFallback || false,
      source: draft.source || "ai-synthesizer",
    });
  } catch (err: any) {
    // If AI fails, gracefully provide fullstack manual fallback template
    try {
      const fallback = aiService.getManualJobTemplate("fullstack");
      return NextResponse.json({
        success: true,
        draft: fallback,
        isManualFallback: true,
        warning: "External AI provider was unavailable. Loaded structured domain fallback template.",
      });
    } catch {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }
}
