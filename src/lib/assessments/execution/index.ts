import { ICodeExecutionProvider, TestCaseInput, ExecutionResult } from "./types";
import { IsolatedProcessExecutionProvider } from "./isolated-process-provider";
import { Judge0ExecutionProvider } from "./judge0-provider";
import { MockExecutionProvider } from "./mock-provider";

export * from "./types";
export * from "./isolated-process-provider";
export * from "./judge0-provider";
export * from "./mock-provider";

let currentProvider: ICodeExecutionProvider | null = null;

export function getCodeExecutionProvider(): ICodeExecutionProvider {
  if (currentProvider) return currentProvider;

  const providerType = process.env.CODE_EXECUTION_PROVIDER || "isolated";

  if (providerType === "mock") {
    currentProvider = new MockExecutionProvider();
  } else if (process.env.JUDGE0_API_URL && process.env.JUDGE0_API_KEY) {
    currentProvider = new Judge0ExecutionProvider();
  } else {
    currentProvider = new IsolatedProcessExecutionProvider();
  }

  return currentProvider;
}

export function setCodeExecutionProvider(provider: ICodeExecutionProvider | null) {
  currentProvider = provider;
}

/**
 * Universal runner that dispatches to the active sandboxed execution provider.
 * Never executes untrusted code in the web server process.
 */
export async function executeCandidateCode(
  code: string,
  language: string,
  testCases: TestCaseInput[],
  maxPoints: number = 40.0,
  functionName?: string
): Promise<ExecutionResult> {
  const provider = getCodeExecutionProvider();
  return provider.execute(code, language, testCases, maxPoints, functionName);
}
