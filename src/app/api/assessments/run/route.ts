import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeCandidateCode } from "@/lib/assessments/execution";

export async function POST(req: NextRequest) {
  try {
    const { questionId, code, language = "javascript" } = await req.json();

    if (!questionId || code === undefined) {
      return NextResponse.json({ error: "questionId and code are required." }, { status: 400 });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { testCases: true },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Execute in sandboxed provider (never in web server process)
    const result = await executeCandidateCode(
      code,
      language || question.language || "javascript",
      question.testCases.map((tc) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
        weight: tc.weight,
      })),
      question.points
    );

    // Ensure hidden test cases remain strictly redacted in the response
    const sanitizedResults = result.testCaseResults.map((tc) => ({
      testCaseId: tc.testCaseId,
      passed: tc.passed,
      isHidden: tc.isHidden,
      actualOutput: tc.isHidden ? "[HIDDEN TEST CASE OUTPUT]" : tc.actualOutput,
      expectedOutput: tc.isHidden ? "[HIDDEN TEST CASE EXPECTATION]" : tc.expectedOutput,
      error: tc.isHidden && tc.error ? "Runtime error in hidden test case" : tc.error,
    }));

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        testCaseResults: sanitizedResults,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
