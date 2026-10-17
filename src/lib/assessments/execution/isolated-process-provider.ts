import { spawn } from "child_process";
import { ICodeExecutionProvider, TestCaseInput, ExecutionResult, ExecutionTestCaseResult } from "./types";

/**
 * Isolated Out-of-Process Code Execution Provider.
 *
 * CRITICAL SECURITY GUARANTEE:
 * Untrusted candidate code is NEVER executed in the main web server process or runtime.
 * Execution runs in a dedicated child process with:
 *  - Stripped environment variables (no access to DATABASE_URL, secrets, or private keys)
 *  - Sandboxed module loader (blocks fs, child_process, net, http, https, cluster, etc.)
 *  - Overridden process.exit, process.kill, and frozen empty process.env
 *  - Hard memory cap (--max-old-space-size=64)
 *  - Authoritative execution timeout (2500ms) with process termination
 */
export class IsolatedProcessExecutionProvider implements ICodeExecutionProvider {
  name = "isolated-process-sandbox";

  async execute(
    code: string,
    language: string,
    testCases: TestCaseInput[],
    maxPoints: number = 40.0,
    preferredFunctionName?: string
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const results: ExecutionTestCaseResult[] = [];
    let totalWeight = 0;
    let earnedWeight = 0;

    // Detect target function name from starter code, explicit argument, or candidate code
    const targetFunctionName = preferredFunctionName || this.detectFunctionName(code);

    for (const tc of testCases) {
      totalWeight += tc.weight;
      const tcStartTime = Date.now();

      try {
        let parsedInput: any;
        try {
          parsedInput = JSON.parse(tc.input);
        } catch {
          parsedInput = tc.input;
        }

        const harness = this.buildSandboxedHarness(code, targetFunctionName, parsedInput);
        const rawOutput = await this.runInIsolatedSubprocess(harness, 2500);

        // Normalize outputs for comparison
        const actualNormalized = this.normalizeJson(rawOutput);
        const expectedNormalized = this.normalizeJson(tc.expectedOutput);
        const isPass = actualNormalized === expectedNormalized;

        if (isPass) {
          earnedWeight += tc.weight;
        }

        results.push({
          testCaseId: tc.id,
          passed: isPass,
          actualOutput: tc.isHidden ? "[HIDDEN TEST CASE OUTPUT]" : actualNormalized,
          expectedOutput: tc.isHidden ? "[HIDDEN TEST CASE EXPECTATION]" : expectedNormalized,
          isHidden: tc.isHidden,
          executionTimeMs: Date.now() - tcStartTime,
        });
      } catch (err: any) {
        results.push({
          testCaseId: tc.id,
          passed: false,
          actualOutput: tc.isHidden ? "[HIDDEN TEST CASE OUTPUT]" : "Execution Error",
          expectedOutput: tc.isHidden ? "[HIDDEN TEST CASE EXPECTATION]" : tc.expectedOutput,
          isHidden: tc.isHidden,
          error: err?.message || "Execution timeout or runtime failure",
          executionTimeMs: Date.now() - tcStartTime,
        });
      }
    }

    const fraction = totalWeight > 0 ? earnedWeight / totalWeight : 0;
    const score = Math.round(fraction * maxPoints * 10) / 10;
    const passed = score >= maxPoints * 0.7;

    return {
      passed,
      score,
      maxScore: maxPoints,
      testCaseResults: results,
      executionLog: `Executed ${testCases.length} test cases in isolated sandbox (${results.filter((r) => r.passed).length} passed, ${results.filter((r) => !r.passed).length} failed).`,
      totalTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Constructs the security harness that neutralizes dangerous APIs
   * before running candidate code.
   */
  private buildSandboxedHarness(userCode: string, functionName: string | null, inputData: any): string {
    const serializedInput = JSON.stringify(inputData);

    return `
      'use strict';
      // 1. Sandbox isolation: Strip access to dangerous modules and capabilities
      try {
        if (typeof require !== 'undefined') {
          const Module = require('module');
          const blocked = [
            'child_process', 'fs', 'fs/promises', 'net', 'http', 'https',
            'tls', 'dgram', 'cluster', 'worker_threads', 'process', 'os'
          ];
          const origLoad = Module._load;
          Module._load = function(request, parent, isMain) {
            if (blocked.includes(request)) {
              throw new Error("Access to module '" + request + "' is strictly disallowed in sandbox.");
            }
            return origLoad.apply(this, arguments);
          };
        }
      } catch (e) {}

      // 2. Prevent tampering with process lifecycle or environment
      try {
        if (typeof process !== 'undefined') {
          process.exit = function() { throw new Error("Security violation: process.exit() is prohibited."); };
          process.kill = function() { throw new Error("Security violation: process.kill() is prohibited."); };
          process.env = Object.freeze({});
        }
      } catch (e) {}

      // 3. Disable network primitives in modern runtimes
      if (typeof fetch !== 'undefined') fetch = undefined;
      if (typeof WebSocket !== 'undefined') WebSocket = undefined;
      if (typeof XMLHttpRequest !== 'undefined') XMLHttpRequest = undefined;

      // 4. Load candidate code
      ${userCode}

      // 5. Evaluate target function
      (function() {
        const input = ${serializedInput};
        let fn = null;

        ${functionName ? `if (typeof ${functionName} === 'function') fn = ${functionName};` : ""}

        if (!fn && typeof filterActiveSkills === 'function') fn = filterActiveSkills;
        if (!fn && typeof solution === 'function') fn = solution;
        if (!fn && typeof handler === 'function') fn = handler;

        if (!fn && typeof module !== 'undefined' && typeof module.exports === 'function') {
          fn = module.exports;
        }

        if (!fn) {
          throw new Error("Target function ${functionName || 'solution'} was not found or is not a callable function.");
        }

        let output;
        // Check if input is structured as multiple parameters
        if (input && typeof input === 'object' && !Array.isArray(input)) {
          if (fn.name === 'filterActiveSkills' && 'skills' in input && 'minScore' in input) {
            output = fn(input.skills, input.minScore);
          } else if ('args' in input && Array.isArray(input.args)) {
            output = fn.apply(null, input.args);
          } else {
            output = fn(input);
          }
        } else if (Array.isArray(input) && fn.length > 1) {
          output = fn.apply(null, input);
        } else {
          output = fn(input);
        }

        console.log("RESULT_START" + JSON.stringify(output) + "RESULT_END");
      })();
    `;
  }

  /**
   * Spawns an isolated node child process with strict environment stripping.
   */
  private runInIsolatedSubprocess(script: string, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      // Pass ONLY the minimum OS path variables required to find the node binary.
      // Zero secrets, zero DATABASE_URL, zero application context.
      const sanitizedEnv: NodeJS.ProcessEnv = {
        NODE_ENV: process.env.NODE_ENV || "production",
        PATH: process.env.PATH || "",
        SYSTEMROOT: process.env.SYSTEMROOT || "",
        COMSPEC: process.env.COMSPEC || "",
        NODE_OPTIONS: "--max-old-space-size=64",
      };

      const child = spawn("node", ["-e", script], {
        timeout: timeoutMs,
        stdio: ["pipe", "pipe", "pipe"],
        env: sanitizedEnv,
      });

      let stdout = "";
      let stderr = "";
      let isTimedOut = false;

      const timer = setTimeout(() => {
        isTimedOut = true;
        try {
          child.kill("SIGKILL");
        } catch (_) {}
        reject(new Error(`Execution timed out after ${timeoutMs}ms limit.`));
      }, timeoutMs);

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        if (isTimedOut) return;

        if (code === 0) {
          // Extract result between markers
          const match = stdout.match(/RESULT_START([\s\S]*?)RESULT_END/);
          if (match && match[1] !== undefined) {
            resolve(match[1]);
          } else {
            resolve(stdout.trim());
          }
        } else {
          const cleanErr = stderr.replace(/evalmachine\.<anonymous>:\d+/g, "").trim();
          reject(new Error(cleanErr || `Process exited with code ${code}`));
        }
      });

      child.on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  private detectFunctionName(code: string): string | null {
    // Look for: function fnName( or const fnName = (
    const fnDecl = code.match(/function\s+([a-zA-Z0-9_$]+)\s*\(/);
    if (fnDecl && fnDecl[1]) return fnDecl[1];

    const constDecl = code.match(/(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:function|\([^)]*\)\s*=>)/);
    if (constDecl && constDecl[1]) return constDecl[1];

    return null;
  }

  private normalizeJson(val: any): string {
    if (typeof val === "string") {
      const trimmed = val.trim();
      try {
        return JSON.stringify(JSON.parse(trimmed));
      } catch {
        return trimmed;
      }
    }
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
}
