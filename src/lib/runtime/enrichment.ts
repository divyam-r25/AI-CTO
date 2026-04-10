import type { NormalizedAnalyzeRequest } from "@/lib/runtime/store";
import { markCircuitFailure, markCircuitSuccess, readCircuitBreaker } from "@/lib/runtime/store";

export interface EnrichmentOutput {
  notes: string[];
  uncertaintyFlags: string[];
  blockingIssues: string[];
}

interface EnrichmentResult {
  output: EnrichmentOutput;
  fallbackUsed: boolean;
  reason?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(promiseFactory: () => Promise<T>, timeoutMs: number): Promise<T> {
  return await Promise.race([
    promiseFactory(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Enrichment timeout after ${timeoutMs}ms`)), timeoutMs),
    ),
  ]);
}

async function runWithRetry<T>(
  run: () => Promise<T>,
  options: { attempts: number; backoffMs: number },
): Promise<T> {
  let attempt = 0;
  let lastError: unknown;
  while (attempt < options.attempts) {
    attempt += 1;
    try {
      return await run();
    } catch (error) {
      lastError = error;
      if (attempt < options.attempts) {
        await sleep(options.backoffMs * attempt);
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Unknown retry failure");
}

async function simulatedProvider(request: NormalizedAnalyzeRequest): Promise<EnrichmentOutput> {
  if (request.prd.toLowerCase().includes("[force_enrichment_failure]")) {
    throw new Error("Forced enrichment failure token detected.");
  }

  const notes: string[] = [];
  const uncertaintyFlags: string[] = [];
  const blockingIssues: string[] = [];
  const text = request.prd.toLowerCase();

  if (text.includes("marketplace")) {
    notes.push("Add fraud/abuse risk controls before launch due to marketplace dynamics.");
    blockingIssues.push("Marketplace abuse controls are not explicitly defined in the PRD.");
  }

  if (text.includes("health") || text.includes("medical")) {
    notes.push("Strengthen compliance readiness for sensitive health-related workflows.");
    uncertaintyFlags.push("Domain may require additional regulatory review.");
  }

  if (!text.includes("pricing")) {
    notes.push("Define pricing hypothesis early to protect unit economics assumptions.");
    uncertaintyFlags.push("Pricing strategy is not explicit in PRD and may impact confidence.");
  }

  if (notes.length === 0) {
    notes.push("No major enrichment deltas detected; deterministic baseline remains primary signal.");
  }

  return { notes, uncertaintyFlags, blockingIssues };
}

export async function enrichWithResilience(
  request: NormalizedAnalyzeRequest,
): Promise<EnrichmentResult> {
  if (!request.enableLlmEnrichment || request.engine !== "hybrid") {
    return {
      output: {
        notes: ["Hybrid enrichment disabled; deterministic baseline used."],
        uncertaintyFlags: [],
        blockingIssues: [],
      },
      fallbackUsed: false,
    };
  }

  const circuit = readCircuitBreaker();
  if (circuit.state === "open") {
    return {
      output: {
        notes: ["Enrichment skipped due to open circuit breaker; fallback path used."],
        uncertaintyFlags: [
          "Enrichment circuit is open; fallback deterministic output returned.",
        ],
        blockingIssues: [],
      },
      fallbackUsed: true,
      reason: "circuit-open",
    };
  }

  try {
    const output = await runWithRetry(
      async () =>
        await withTimeout(
          async () => {
            await sleep(120);
            return await simulatedProvider(request);
          },
          request.maxLatencyMs,
        ),
      { attempts: 2, backoffMs: 120 },
    );
    markCircuitSuccess();
    return {
      output,
      fallbackUsed: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown enrichment error";
    markCircuitFailure(message);
    return {
      output: {
        notes: [
          "Enrichment failed and deterministic fallback was used to keep response reliable.",
        ],
        uncertaintyFlags: [`Enrichment fallback: ${message}`],
        blockingIssues: [],
      },
      fallbackUsed: true,
      reason: message,
    };
  }
}
