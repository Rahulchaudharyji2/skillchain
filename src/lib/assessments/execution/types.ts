export interface TestCaseInput {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  weight: number;
}

export interface ExecutionTestCaseResult {
  testCaseId: string;
  passed: boolean;
  actualOutput?: string;
  expectedOutput?: string;
  isHidden: boolean;
  error?: string;
  executionTimeMs?: number;
}

export interface ExecutionResult {
  passed: boolean;
  score: number;
  maxScore: number;
  testCaseResults: ExecutionTestCaseResult[];
  executionLog: string;
  totalTimeMs?: number;
}

export interface ICodeExecutionProvider {
  name: string;
  execute(
    code: string,
    language: string,
    testCases: TestCaseInput[],
    maxPoints: number,
    functionName?: string
  ): Promise<ExecutionResult>;
}
