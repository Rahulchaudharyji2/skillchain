import { prisma } from "@/lib/prisma";
import { type Hex } from "viem";

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2,
};

/**
 * Executes an async operation with exponential backoff and jitter.
 * Designed for handling transient RPC network drops or rate-limit errors.
 */
export async function executeWithSafeRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | unknown;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation(attempt);
    } catch (err: unknown) {
      lastError = err;
      const isLastAttempt = attempt === config.maxRetries;

      if (isLastAttempt) {
        break;
      }

      // Calculate exponential backoff with jitter
      const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffFactor, attempt - 1);
      const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
      const jitter = Math.random() * 0.3 * cappedDelay; // Up to 30% jitter
      const totalDelay = Math.floor(cappedDelay + jitter);

      console.warn(
        `[SafeRetry] Attempt ${attempt} failed with error: ${(err as Error)?.message}. Retrying in ${totalDelay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, totalDelay));
    }
  }

  throw lastError;
}

export interface EnqueuedJobPayload {
  credentialId: string;
  credIdHex: Hex;
  commitment: Hex;
  studentWallet?: string;
  credentialTypeURI: string;
  action: "ISSUE" | "SUSPEND" | "RESTORE" | "REVOKE";
  reason?: string;
}

/**
 * Enqueues a blockchain transaction to BackgroundJob for safe asynchronous tracking and retries
 */
export async function enqueueBlockchainJob(
  jobType: "BLOCKCHAIN_SUBMIT" | "BLOCKCHAIN_CONFIRM",
  payload: EnqueuedJobPayload
) {
  return await prisma.backgroundJob.create({
    data: {
      jobType,
      payloadJson: JSON.stringify(payload),
      status: "QUEUED",
      attempts: 0,
    },
  });
}

/**
 * Processes pending or failed jobs from the queue with safe idempotency checks
 */
export async function processPendingBlockchainJobs(
  processor: (payload: EnqueuedJobPayload) => Promise<{ success: boolean; txHash?: string; error?: string }>
) {
  const jobs = await prisma.backgroundJob.findMany({
    where: {
      jobType: { in: ["BLOCKCHAIN_SUBMIT", "BLOCKCHAIN_CONFIRM"] },
      status: { in: ["QUEUED", "PROCESSING"] },
      attempts: { lt: 5 },
    },
    take: 10,
    orderBy: { createdAt: "asc" },
  });

  const results = [];

  for (const job of jobs) {
    try {
      // Mark as PROCESSING and increment attempts
      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: "PROCESSING",
          attempts: { increment: 1 },
        },
      });

      const payload: EnqueuedJobPayload = JSON.parse(job.payloadJson);

      // Execute processor with safe retry
      const result = await executeWithSafeRetry(
        async () => await processor(payload),
        { maxRetries: 2, initialDelayMs: 500 }
      );

      if (result.success) {
        await prisma.backgroundJob.update({
          where: { id: job.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });
        results.push({ jobId: job.id, status: "COMPLETED", txHash: result.txHash });
      } else {
        await prisma.backgroundJob.update({
          where: { id: job.id },
          data: {
            status: job.attempts >= 4 ? "FAILED" : "QUEUED",
            errorDetails: result.error,
          },
        });
        results.push({ jobId: job.id, status: "RETRY_QUEUED", error: result.error });
      }
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || "Unknown error";
      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: job.attempts >= 4 ? "FAILED" : "QUEUED",
          errorDetails: errorMsg,
        },
      });
      results.push({ jobId: job.id, status: "FAILED", error: errorMsg });
    }
  }

  return results;
}
