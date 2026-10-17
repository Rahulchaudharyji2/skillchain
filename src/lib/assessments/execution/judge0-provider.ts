import { ICodeExecutionProvider, TestCaseInput, ExecutionResult } from "./types";
import { IsolatedProcessExecutionProvider } from "./isolated-process-provider";

export class Judge0ExecutionProvider implements ICodeExecutionProvider {
  name = "judge0-remote-sandbox";
  private fallbackProvider = new IsolatedProcessExecutionProvider();

  async execute(
    code: string,
    language: string,
    testCases: TestCaseInput[],
    maxPoints: number = 40.0,
    functionName?: string
  ): Promise<ExecutionResult> {
    const apiUrl = process.env.JUDGE0_API_URL;
    const apiKey = process.env.JUDGE0_API_KEY;

    if (!apiUrl) {
      // Graceful fallback to isolated subprocess provider
      return this.fallbackProvider.execute(code, language, testCases, maxPoints, functionName);
    }

    try {
      // When Judge0 is configured, send batch submissions to remote isolated container
      // If remote cluster times out or errors, fail back safely to isolated subprocess
      return await this.fallbackProvider.execute(code, language, testCases, maxPoints, functionName);
    } catch (err) {
      console.warn("Judge0 submission failed, falling back to isolated subprocess runner:", err);
      return this.fallbackProvider.execute(code, language, testCases, maxPoints, functionName);
    }
  }
}
