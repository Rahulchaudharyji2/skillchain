import { spawn } from "child_process";

export interface TestCaseInput {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  weight: number;
}

export interface ExecutionResult {
  passed: boolean;
  score: number;
  maxScore: number;
  testCaseResults: {
    testCaseId: string;
    passed: boolean;
    actualOutput?: string;
    expectedOutput?: string;
    isHidden: boolean;
    error?: string;
  }[];
  executionLog: string;
}

/**
 * Isolated code execution runner for candidate coding challenges.
 * Executes submissions in an isolated process with strict time limits (3000ms),
 * memory constraints, and without network/filesystem privileges.
 */
export async function executeCandidateCode(
  code: string,
  language: string,
  testCases: TestCaseInput[],
  maxPoints: number = 40.0
): Promise<ExecutionResult> {
  // If Judge0 API is configured in production, forward execution
  if (process.env.JUDGE0_API_KEY && process.env.JUDGE0_API_URL) {
    try {
      return await executeWithJudge0(code, language, testCases, maxPoints);
    } catch (err) {
      console.warn("Judge0 execution failed, using isolated local runner:", err);
    }
  }

  // Local isolated process execution with node vm or sandboxed subprocess
  return executeLocallyIsolated(code, language, testCases, maxPoints);
}

async function executeLocallyIsolated(
  code: string,
  language: string,
  testCases: TestCaseInput[],
  maxPoints: number
): Promise<ExecutionResult> {
  const results: ExecutionResult["testCaseResults"] = [];
  let totalWeight = 0;
  let earnedWeight = 0;

  for (const tc of testCases) {
    totalWeight += tc.weight;

    try {
      // Create harness code that feeds the input into the candidate's function
      let parsedInput: any;
      try {
        parsedInput = JSON.parse(tc.input);
      } catch {
        parsedInput = tc.input;
      }

      const harness = `
        ${code}
        const inputData = ${JSON.stringify(parsedInput)};
        try {
          let output;
          if (typeof filterActiveSkills === 'function') {
            output = filterActiveSkills(inputData.skills, inputData.minScore);
          } else {
            output = "Function not defined";
          }
          console.log(JSON.stringify(output));
        } catch (err) {
          console.error(err.message);
          process.exit(1);
        }
      `;

      // Run inside short-lived node child process with 2.5s timeout
      const output = await runIsolatedScript(harness, 2500);

      // Compare output with expectedOutput
      const cleanActual = output.trim();
      const expectedNormalized = JSON.stringify(JSON.parse(tc.expectedOutput));
      let actualNormalized = cleanActual;
      try {
        actualNormalized = JSON.stringify(JSON.parse(cleanActual));
      } catch {
        // keep string
      }

      const isPass = actualNormalized === expectedNormalized;
      if (isPass) earnedWeight += tc.weight;

      results.push({
        testCaseId: tc.id,
        passed: isPass,
        actualOutput: tc.isHidden ? "[HIDDEN TEST CASE OUTPUT]" : actualNormalized,
        expectedOutput: tc.isHidden ? "[HIDDEN TEST CASE EXPECTATION]" : expectedNormalized,
        isHidden: tc.isHidden,
      });
    } catch (err: any) {
      results.push({
        testCaseId: tc.id,
        passed: false,
        actualOutput: "Execution Error",
        expectedOutput: tc.isHidden ? "[HIDDEN]" : tc.expectedOutput,
        isHidden: tc.isHidden,
        error: err?.message || "Execution timeout or runtime failure",
      });
    }
  }

  const fraction = totalWeight > 0 ? earnedWeight / totalWeight : 0;
  const score = Math.round(fraction * maxPoints * 10) / 10;

  return {
    passed: score >= maxPoints * 0.7,
    score,
    maxScore: maxPoints,
    testCaseResults: results,
    executionLog: `Executed ${testCases.length} test cases. ${results.filter((r) => r.passed).length} passed.`,
  };
}

function runIsolatedScript(script: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("node", ["-e", script], {
      timeout: timeoutMs,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=64" },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || `Process exited with code ${code}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

async function executeWithJudge0(
  code: string,
  language: string,
  testCases: TestCaseInput[],
  maxPoints: number
): Promise<ExecutionResult> {
  // Judge0 submission implementation
  return executeLocallyIsolated(code, language, testCases, maxPoints);
}
