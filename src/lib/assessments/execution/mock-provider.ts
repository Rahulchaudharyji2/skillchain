import { ICodeExecutionProvider, TestCaseInput, ExecutionResult, ExecutionTestCaseResult } from "./types";

/**
 * Mock deterministic code execution provider for integration testing and predictable CI runs.
 */
export class MockExecutionProvider implements ICodeExecutionProvider {
  name = "mock-execution-provider";

  constructor(
    private shouldPass: boolean = true,
    private customOutputs?: Record<string, string>
  ) {}

  async execute(
    code: string,
    language: string,
    testCases: TestCaseInput[],
    maxPoints: number = 40.0
  ): Promise<ExecutionResult> {
    const results: ExecutionTestCaseResult[] = [];
    let totalWeight = 0;
    let earnedWeight = 0;

    for (const tc of testCases) {
      totalWeight += tc.weight;

      // Check if code contains deliberate syntax error or throws
      const hasError = code.includes("THROW_ERROR") || code.includes("SYNTAX_ERR");
      const passed = !hasError && (this.customOutputs?.[tc.id] !== undefined ? this.customOutputs[tc.id] === tc.expectedOutput : this.shouldPass);

      if (passed) {
        earnedWeight += tc.weight;
      }

      results.push({
        testCaseId: tc.id,
        passed,
        actualOutput: tc.isHidden
          ? "[HIDDEN TEST CASE OUTPUT]"
          : (passed ? tc.expectedOutput : "mock-failure-output"),
        expectedOutput: tc.isHidden
          ? "[HIDDEN TEST CASE EXPECTATION]"
          : tc.expectedOutput,
        isHidden: tc.isHidden,
        error: hasError ? "Simulated execution error" : undefined,
        executionTimeMs: 15,
      });
    }

    const fraction = totalWeight > 0 ? earnedWeight / totalWeight : 0;
    const score = Math.round(fraction * maxPoints * 10) / 10;

    return {
      passed: score >= maxPoints * 0.7,
      score,
      maxScore: maxPoints,
      testCaseResults: results,
      executionLog: `Mock executed ${testCases.length} test cases (${results.filter((r) => r.passed).length} passed).`,
      totalTimeMs: 45,
    };
  }
}
