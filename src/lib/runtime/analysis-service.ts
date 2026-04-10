import crypto from "node:crypto";
import { analyzePrd, refreshOutputSections } from "@/lib/analysis-engine";
import { writeGeneratedReports } from "@/lib/report-writer";
import { enrichWithResilience } from "@/lib/runtime/enrichment";
import { ApiError } from "@/lib/runtime/errors";
import {
  createRequestHash,
  createStoredAnalysis,
  getAnalysisByHash,
  getAnalysisById,
  getAnalysisByRequestId,
  getRateLimitState,
  listAnalyses,
  type AnalysisHistoryQuery,
  type NormalizedAnalyzeRequest,
  type StoredAnalysis,
  updateAnalysis,
} from "@/lib/runtime/store";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  AnalysisComparison,
  AnalysisRecordSummary,
  AnalysisResult,
  EngineType,
  ExecutionMode,
  HonestyMode,
  PlanningMode,
  ProjectDomain,
} from "@/lib/types";

const MAX_PAYLOAD_BYTES = 60_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

const ALLOWED_MODES: PlanningMode[] = ["beginner-startup", "scalable-startup", "enterprise"];
const ALLOWED_HONESTY: HonestyMode[] = ["standard", "brutal"];
const ALLOWED_DOMAINS: ProjectDomain[] = ["saas", "marketplace", "internal-tools", "fintech", "regulated", "ai-tool"];

function sanitizeRequestId(input?: string): string {
  if (input && input.trim().length > 0) {
    return input.trim().slice(0, 128);
  }
  return `req_${crypto.randomBytes(6).toString("hex")}`;
}

function normalizeAnalyzeRequest(input: AnalyzeRequest): NormalizedAnalyzeRequest {
  if (!input.prd || typeof input.prd !== "string" || input.prd.trim().length < 30) {
    throw new ApiError(400, "PRD must be a string with at least 30 characters.");
  }

  if (!input.mode || !ALLOWED_MODES.includes(input.mode)) {
    throw new ApiError(400, "Mode must be one of: beginner-startup, scalable-startup, enterprise.");
  }

  if (!input.honestyMode || !ALLOWED_HONESTY.includes(input.honestyMode)) {
    throw new ApiError(400, "Honesty mode must be one of: standard, brutal.");
  }

  const executionMode: ExecutionMode = input.executionMode ?? "sync";
  const engine: EngineType = input.engine ?? "hybrid";
  const enableLlmEnrichment = input.enableLlmEnrichment ?? engine === "hybrid";
  const maxLatencyMs = Math.min(10_000, Math.max(500, input.maxLatencyMs ?? 2_500));
  const projectId = input.projectId?.trim() || "default-project";
  const requestId = sanitizeRequestId(input.requestId);
  const writeFiles = input.writeFiles ?? true;
  const domain = input.domain && ALLOWED_DOMAINS.includes(input.domain) ? input.domain : undefined;

  const requestHash = createRequestHash({
    prd: input.prd.trim(),
    mode: input.mode,
    domain: domain ?? "ai-tool",
    honestyMode: input.honestyMode,
    engine,
    enableLlmEnrichment,
    maxLatencyMs,
  });

  return {
    prd: input.prd.trim(),
    mode: input.mode,
    domain,
    honestyMode: input.honestyMode,
    projectId,
    requestId,
    executionMode,
    engine,
    enableLlmEnrichment,
    maxLatencyMs,
    writeFiles,
    requestHash,
  };
}

export function assertPayloadSizeOrThrow(rawBody: string): void {
  const bytes = Buffer.byteLength(rawBody, "utf8");
  if (bytes > MAX_PAYLOAD_BYTES) {
    throw new ApiError(
      413,
      `Payload too large. Max allowed is ${MAX_PAYLOAD_BYTES} bytes, received ${bytes}.`,
    );
  }
}

function deriveCritiqueTiming(result: AnalysisResult): number {
  return Math.min(900, Math.max(80, result.selfCritique.critiquePoints.length * 120));
}

function mergeUnique(base: string[], extra: string[]): string[] {
  return Array.from(new Set([...base, ...extra]));
}

async function runAnalysisPipeline(analysisId: string): Promise<void> {
  const record = getAnalysisById(analysisId);
  if (!record) {
    return;
  }

  updateAnalysis(analysisId, (prev) => ({
    ...prev,
    status: "running",
    startedAt: new Date().toISOString(),
  }));

  const totalStart = Date.now();
  try {
    const deterministicStart = Date.now();
    const result = analyzePrd({
      prd: record.request.prd,
      mode: record.request.mode,
      domain: record.request.domain,
      honestyMode: record.request.honestyMode,
      writeFiles: false,
    });
    const deterministicMs = Date.now() - deterministicStart;

    const enrichmentStart = Date.now();
    const enrichment = await enrichWithResilience(record.request);
    const enrichmentMs = Date.now() - enrichmentStart;

    result.challengeSummary = mergeUnique(
      result.challengeSummary,
      enrichment.output.notes.map((note) => `Enrichment: ${note}`),
    );
    result.uncertaintyFlags = mergeUnique(
      result.uncertaintyFlags,
      enrichment.output.uncertaintyFlags,
    );
    result.blockingIssues = mergeUnique(
      result.blockingIssues,
      enrichment.output.blockingIssues,
    );
    result.fallbackUsed = enrichment.fallbackUsed;

    if (result.blockingIssues.length > 0 && result.recommendation.verdict === "build-now") {
      result.recommendation = {
        ...result.recommendation,
        verdict: "build-with-pivot",
        rationale: [
          ...result.recommendation.rationale,
          "Recommendation downgraded due to unresolved blocking issues.",
        ],
      };
    }

    if (result.fallbackUsed) {
      result.recommendation = {
        ...result.recommendation,
        confidence: Math.max(35, result.recommendation.confidence - 5),
        rationale: [
          ...result.recommendation.rationale,
          "Confidence reduced due to enrichment fallback path.",
        ],
      };
    }

    const refreshed = refreshOutputSections(result);
    const critiqueMs = deriveCritiqueTiming(refreshed);
    const totalMs = Date.now() - totalStart;
    let generatedFiles: string[] = [];
    let generationWarning: string | null = null;

    if (record.request.writeFiles) {
      try {
        generatedFiles = await writeGeneratedReports(refreshed);
      } catch {
        generationWarning =
          "Analysis completed, but markdown artifact writing was skipped in this environment.";
      }
    }

    updateAnalysis(analysisId, (prev) => ({
      ...prev,
      status: "completed",
      completedAt: new Date().toISOString(),
      fallbackUsed: refreshed.fallbackUsed,
      uncertaintyFlags: refreshed.uncertaintyFlags,
      blockingIssues: refreshed.blockingIssues,
      result: refreshed,
      generatedFiles,
      generationWarning,
      timings: {
        totalMs,
        deterministicMs,
        enrichmentMs,
        critiqueMs,
      },
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown analysis failure.";
    const totalMs = Date.now() - totalStart;
    updateAnalysis(analysisId, (prev) => ({
      ...prev,
      status: "failed",
      completedAt: new Date().toISOString(),
      error: message,
      timings: {
        totalMs,
        deterministicMs: prev.timings.deterministicMs,
        enrichmentMs: prev.timings.enrichmentMs,
        critiqueMs: prev.timings.critiqueMs,
      },
    }));
  }
}

function scheduleAsyncRun(analysisId: string): void {
  setTimeout(() => {
    void runAnalysisPipeline(analysisId);
  }, 0);
}

function toResponse(record: StoredAnalysis): AnalyzeResponse {
  return {
    success: record.status !== "failed",
    analysisId: record.analysisId,
    projectId: record.projectId,
    status: record.status,
    executionMode: record.request.executionMode,
    cached: record.cached,
    fallbackUsed: record.fallbackUsed,
    timings: record.timings,
    uncertaintyFlags: record.uncertaintyFlags,
    blockingIssues: record.blockingIssues,
    generatedAt: record.updatedAt,
    result: record.result,
    generatedFiles: record.generatedFiles,
    generationWarning: record.generationWarning,
    error: record.error,
  };
}

function assertRateLimit(ip: string, projectId: string): void {
  const rate = getRateLimitState({
    ip,
    projectId,
    limit: RATE_LIMIT_MAX_REQUESTS,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (!rate.allowed) {
    throw new ApiError(
      429,
      `Rate limit exceeded for project ${projectId}. Retry after ${Math.ceil(
        (rate.resetAtMs - Date.now()) / 1000,
      )}s.`,
    );
  }
}

export async function submitAnalysisRequest(params: {
  input: AnalyzeRequest;
  clientIp: string;
}): Promise<AnalyzeResponse> {
  const normalized = normalizeAnalyzeRequest(params.input);
  assertRateLimit(params.clientIp, normalized.projectId);

  const existingByRequestId = getAnalysisByRequestId(normalized.requestId);
  if (existingByRequestId) {
    return toResponse(existingByRequestId);
  }

  const cachedRecord = getAnalysisByHash(normalized.requestHash);
  if (cachedRecord && cachedRecord.status === "completed") {
    return toResponse({
      ...cachedRecord,
      cached: true,
      request: {
        ...cachedRecord.request,
        requestId: normalized.requestId,
        executionMode: normalized.executionMode,
      },
    });
  }

  const record = createStoredAnalysis(normalized, Boolean(cachedRecord));

  if (normalized.executionMode === "async") {
    scheduleAsyncRun(record.analysisId);
    return toResponse(record);
  }

  await runAnalysisPipeline(record.analysisId);
  const completed = getAnalysisById(record.analysisId);
  if (!completed) {
    throw new ApiError(500, "Analysis record missing after execution.");
  }
  return toResponse(completed);
}

export function fetchAnalysis(analysisId: string): AnalyzeResponse {
  const record = getAnalysisById(analysisId);
  if (!record) {
    throw new ApiError(404, `Analysis ${analysisId} not found.`);
  }
  return toResponse(record);
}

export function fetchAnalysisHistory(projectId?: string): AnalysisRecordSummary[] {
  return listAnalyses({ projectId });
}

export function fetchAnalysisHistoryPaged(query: AnalysisHistoryQuery): {
  items: AnalysisRecordSummary[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
} {
  const total = listAnalyses({
    projectId: query.projectId,
    status: query.status,
    limit: 100_000,
    offset: 0,
  }).length;

  const limit = Math.max(1, Math.min(100, query.limit ?? 20));
  const offset = Math.max(0, query.offset ?? 0);
  const items = listAnalyses({
    projectId: query.projectId,
    status: query.status,
    limit,
    offset,
  });

  return {
    items,
    total,
    limit,
    offset,
    hasMore: offset + items.length < total,
  };
}

export async function retryAnalysis(params: {
  analysisId: string;
  executionMode?: ExecutionMode;
}): Promise<AnalyzeResponse> {
  const existing = getAnalysisById(params.analysisId);
  if (!existing) {
    throw new ApiError(404, `Analysis ${params.analysisId} not found.`);
  }

  const retryRequest: AnalyzeRequest = {
    ...existing.request,
    requestId: `retry_${crypto.randomBytes(6).toString("hex")}`,
    executionMode: params.executionMode ?? "async",
  };

  return await submitAnalysisRequest({
    input: retryRequest,
    clientIp: "internal-retry",
  });
}

export function compareAnalyses(params: {
  baseAnalysisId: string;
  headAnalysisId: string;
}): AnalysisComparison {
  const base = getAnalysisById(params.baseAnalysisId);
  const head = getAnalysisById(params.headAnalysisId);

  if (!base?.result || !head?.result) {
    throw new ApiError(400, "Both analyses must exist and be completed before compare.");
  }

  const baseRiskTitles = base.result.risks.slice(0, 3).map((risk) => risk.title);
  const headRiskTitles = head.result.risks.slice(0, 3).map((risk) => risk.title);
  const baseDecisions = base.result.decisions.map((decision) => `${decision.title}:${decision.chosen}`);
  const headDecisions = head.result.decisions.map((decision) => `${decision.title}:${decision.chosen}`);

  return {
    baseAnalysisId: params.baseAnalysisId,
    headAnalysisId: params.headAnalysisId,
    verdictChanged: base.result.recommendation.verdict !== head.result.recommendation.verdict,
    confidenceDelta: head.result.recommendation.confidence - base.result.recommendation.confidence,
    topRiskChanges: [
      ...headRiskTitles.filter((item) => !baseRiskTitles.includes(item)).map((item) => `Added risk: ${item}`),
      ...baseRiskTitles.filter((item) => !headRiskTitles.includes(item)).map((item) => `Removed risk: ${item}`),
    ],
    decisionChanges: [
      ...headDecisions.filter((item) => !baseDecisions.includes(item)).map((item) => `Changed/added: ${item}`),
      ...baseDecisions.filter((item) => !headDecisions.includes(item)).map((item) => `Removed: ${item}`),
    ],
    blockingIssueChanges: [
      ...head.result.blockingIssues
        .filter((item) => !base.result?.blockingIssues.includes(item))
        .map((item) => `New blocking issue: ${item}`),
      ...base.result.blockingIssues
        .filter((item) => !head.result?.blockingIssues.includes(item))
        .map((item) => `Resolved blocking issue: ${item}`),
    ],
    differences: {
      risksChanged: [
        ...head.result.risks.map((item) => item.title).filter((item) => !base.result!.risks.map((risk) => risk.title).includes(item)),
        ...base.result.risks.map((item) => item.title).filter((item) => !head.result!.risks.map((risk) => risk.title).includes(item)),
      ],
      decisionsChanged: [
        ...head.result.decisions.map((item) => `${item.stage}:${item.title}`).filter((item) => !base.result!.decisions.map((decision) => `${decision.stage}:${decision.title}`).includes(item)),
        ...base.result.decisions.map((item) => `${item.stage}:${item.title}`).filter((item) => !head.result!.decisions.map((decision) => `${decision.stage}:${decision.title}`).includes(item)),
      ],
      blockingIssuesChanged: [
        ...head.result.blockingIssues.filter((item) => !base.result!.blockingIssues.includes(item)).map((item) => `New: ${item}`),
        ...base.result.blockingIssues.filter((item) => !head.result!.blockingIssues.includes(item)).map((item) => `Resolved: ${item}`),
      ],
      scoreDiff: head.result.readinessScore.score - base.result.readinessScore.score,
    },
  };
}

export function simulateScenario(params: {
  analysisId: string;
  trafficMultiplier: number;
  modelCostMultiplier: number;
  latencyTargetMs: number;
  teamSize: number;
}): {
  analysisId: string;
  projectedCostDeltaPercent: number;
  projectedRiskDelta: string;
  recommendation: string;
} {
  const record = getAnalysisById(params.analysisId);
  if (!record?.result) {
    throw new ApiError(404, "Analysis not found or not completed.");
  }

  const trafficMultiplier = Math.max(0.5, Math.min(10, params.trafficMultiplier));
  const modelCostMultiplier = Math.max(0.5, Math.min(5, params.modelCostMultiplier));
  const latencyTargetMs = Math.max(200, Math.min(5_000, params.latencyTargetMs));
  const teamSize = Math.max(1, Math.min(50, params.teamSize));

  const projectedCostDeltaPercent = Math.round((trafficMultiplier * modelCostMultiplier - 1) * 100);
  const riskyLatency = latencyTargetMs < 600 && trafficMultiplier > 2;
  const teamConstraint = teamSize < 4 && trafficMultiplier > 3;

  const projectedRiskDelta =
    riskyLatency || teamConstraint
      ? "Risk increases due to aggressive latency target or limited team capacity."
      : "Risk remains moderate with current scenario assumptions.";

  const recommendation =
    projectedCostDeltaPercent > 120 || riskyLatency
      ? "Prioritize cost controls and asynchronous architecture before growth."
      : "Current plan remains viable with incremental hardening.";

  return {
    analysisId: params.analysisId,
    projectedCostDeltaPercent,
    projectedRiskDelta,
    recommendation,
  };
}

export function exportActionChecklist(analysisId: string): { analysisId: string; markdown: string } {
  const record = getAnalysisById(analysisId);
  if (!record?.result) {
    throw new ApiError(404, "Analysis not found or not completed.");
  }

  const result = record.result;
  const markdown = [
    `# Action Checklist for ${result.productName}`,
    "",
    "## Roadmap Tasks",
    ...result.roadmap.map((phase) => `- [ ] ${phase.phase}: ${phase.objective}`),
    "",
    "## Risk Mitigations",
    ...result.risks.map(
      (risk) => `- [ ] ${risk.title} (owner: ${risk.mitigationOwner}) -> ${risk.mitigation.join("; ")}`,
    ),
    "",
    "## Blocking Issues Before Build",
    ...(result.blockingIssues.length > 0
      ? result.blockingIssues.map((issue) => `- [ ] ${issue}`)
      : ["- [ ] none"]),
  ].join("\n");

  return { analysisId, markdown };
}
