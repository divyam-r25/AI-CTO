import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type {
  AnalysisRecordSummary,
  AnalysisResult,
  AnalysisStatus,
  AnalysisTimings,
  EngineType,
  ExecutionMode,
  HonestyMode,
  PlanningMode,
} from "@/lib/types";

export interface AnalysisHistoryQuery {
  projectId?: string;
  limit?: number;
  offset?: number;
  status?: AnalysisStatus;
}

export interface NormalizedAnalyzeRequest {
  prd: string;
  mode: PlanningMode;
  domain?: import("@/lib/types").ProjectDomain;
  honestyMode: HonestyMode;
  projectId: string;
  requestId: string;
  executionMode: ExecutionMode;
  engine: EngineType;
  enableLlmEnrichment: boolean;
  maxLatencyMs: number;
  writeFiles: boolean;
  requestHash: string;
}

export interface StoredAnalysis {
  analysisId: string;
  projectId: string;
  requestId: string;
  requestHash: string;
  status: AnalysisStatus;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  cached: boolean;
  fallbackUsed: boolean;
  error?: string;
  uncertaintyFlags: string[];
  blockingIssues: string[];
  timings: AnalysisTimings;
  generatedFiles: string[];
  generationWarning: string | null;
  request: NormalizedAnalyzeRequest;
  result?: AnalysisResult;
}

interface RateWindow {
  count: number;
  windowStart: number;
}

interface CircuitBreakerState {
  state: "closed" | "open" | "half-open";
  failureCount: number;
  openUntil: number;
  lastError?: string;
}

interface AnalysisStore {
  records: Map<string, StoredAnalysis>;
  projectIndex: Map<string, string[]>;
  requestIdIndex: Map<string, string>;
  hashIndex: Map<string, string>;
  rateWindows: Map<string, RateWindow>;
  circuit: CircuitBreakerState;
}

interface PersistedStoreFile {
  version: 1;
  records: StoredAnalysis[];
}

const DEFAULT_TIMINGS: AnalysisTimings = {
  totalMs: 0,
  deterministicMs: 0,
  enrichmentMs: 0,
  critiqueMs: 0,
};

function createStore(): AnalysisStore {
  const persisted = readPersistedRecords();
  const records = new Map<string, StoredAnalysis>();
  const projectIndex = new Map<string, string[]>();
  const requestIdIndex = new Map<string, string>();
  const hashIndex = new Map<string, string>();

  for (const record of persisted) {
    records.set(record.analysisId, record);
    requestIdIndex.set(record.requestId, record.analysisId);
    hashIndex.set(record.requestHash, record.analysisId);

    const current = projectIndex.get(record.projectId) ?? [];
    current.push(record.analysisId);
    projectIndex.set(record.projectId, current);
  }

  for (const [projectId, ids] of projectIndex) {
    const sorted = ids
      .map((id) => records.get(id))
      .filter((item): item is StoredAnalysis => Boolean(item))
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .map((item) => item.analysisId)
      .slice(0, 100);
    projectIndex.set(projectId, sorted);
  }

  return {
    records,
    projectIndex,
    requestIdIndex,
    hashIndex,
    rateWindows: new Map(),
    circuit: {
      state: "closed",
      failureCount: 0,
      openUntil: 0,
    },
  };
}

function storagePath(): string {
  const explicit = process.env.AI_CTO_STORE_PATH?.trim();
  if (explicit) {
    return path.resolve(/*turbopackIgnore: true*/ explicit);
  }
  return path.join(/*turbopackIgnore: true*/ process.cwd(), ".data", "analysis-store.json");
}

function readPersistedRecords(): StoredAnalysis[] {
  try {
    const file = storagePath();
    if (!fs.existsSync(file)) {
      return [];
    }
    const raw = fs.readFileSync(file, "utf8");
    const parsed = JSON.parse(raw) as PersistedStoreFile;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.records)) {
      return [];
    }
    return parsed.records;
  } catch {
    return [];
  }
}

function persistStore(store: AnalysisStore): void {
  try {
    const file = storagePath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const payload: PersistedStoreFile = {
      version: 1,
      records: [...store.records.values()],
    };
    fs.writeFileSync(file, JSON.stringify(payload, null, 2), "utf8");
  } catch {
    // Persistence failure should not crash analysis execution.
  }
}

function storeRef(): AnalysisStore {
  const globalKey = "__ai_cto_analysis_store__";
  const scoped = globalThis as unknown as Record<string, AnalysisStore | undefined>;
  if (!scoped[globalKey]) {
    scoped[globalKey] = createStore();
  }
  return scoped[globalKey] as AnalysisStore;
}

function nowIso(): string {
  return new Date().toISOString();
}

function genId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

export function createRequestHash(input: {
  prd: string;
  mode: PlanningMode;
  domain: string;
  honestyMode: HonestyMode;
  engine: EngineType;
  enableLlmEnrichment: boolean;
  maxLatencyMs: number;
}): string {
  const serialized = JSON.stringify(input);
  return crypto.createHash("sha256").update(serialized).digest("hex");
}

export function createStoredAnalysis(request: NormalizedAnalyzeRequest, cached: boolean): StoredAnalysis {
  const now = nowIso();
  const analysisId = genId("analysis");

  const record: StoredAnalysis = {
    analysisId,
    projectId: request.projectId,
    requestId: request.requestId,
    requestHash: request.requestHash,
    status: "queued",
    createdAt: now,
    updatedAt: now,
    cached,
    fallbackUsed: false,
    uncertaintyFlags: [],
    blockingIssues: [],
    timings: { ...DEFAULT_TIMINGS },
    generatedFiles: [],
    generationWarning: null,
    request,
  };

  const store = storeRef();
  store.records.set(analysisId, record);
  store.requestIdIndex.set(request.requestId, analysisId);
  store.hashIndex.set(request.requestHash, analysisId);
  const existingProjectItems = store.projectIndex.get(request.projectId) ?? [];
  existingProjectItems.unshift(analysisId);
  store.projectIndex.set(request.projectId, existingProjectItems.slice(0, 100));
  persistStore(store);

  return record;
}

export function getAnalysisById(analysisId: string): StoredAnalysis | undefined {
  return storeRef().records.get(analysisId);
}

export function getAnalysisByRequestId(requestId: string): StoredAnalysis | undefined {
  const store = storeRef();
  const analysisId = store.requestIdIndex.get(requestId);
  return analysisId ? store.records.get(analysisId) : undefined;
}

export function getAnalysisByHash(requestHash: string): StoredAnalysis | undefined {
  const store = storeRef();
  const analysisId = store.hashIndex.get(requestHash);
  return analysisId ? store.records.get(analysisId) : undefined;
}

export function updateAnalysis(
  analysisId: string,
  updater: (prev: StoredAnalysis) => StoredAnalysis,
): StoredAnalysis | undefined {
  const store = storeRef();
  const current = store.records.get(analysisId);
  if (!current) {
    return undefined;
  }
  const next = updater(current);
  next.updatedAt = nowIso();
  store.records.set(analysisId, next);
  persistStore(store);
  return next;
}

export function listAnalyses(query?: AnalysisHistoryQuery): AnalysisRecordSummary[] {
  const store = storeRef();
  const projectId = query?.projectId;
  const ids = projectId ? store.projectIndex.get(projectId) ?? [] : [...store.records.keys()];
  const uniqueIds = Array.from(new Set(ids));
  const all = uniqueIds
    .map((id) => store.records.get(id))
    .filter((item): item is StoredAnalysis => Boolean(item))
    .filter((item) => {
      if (!query?.status) {
        return true;
      }
      return item.status === query.status;
    })
    .map((item) => ({
      analysisId: item.analysisId,
      projectId: item.projectId,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      verdict: item.result?.recommendation.verdict,
      confidence: item.result?.recommendation.confidence,
      fallbackUsed: item.fallbackUsed,
      cached: item.cached,
      blockingIssues: item.blockingIssues,
    }))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const safeOffset = Math.max(0, query?.offset ?? 0);
  const safeLimit = Math.max(1, Math.min(100, query?.limit ?? 20));
  return all.slice(safeOffset, safeOffset + safeLimit);
}

export function getRateLimitState(params: {
  ip: string;
  projectId: string;
  limit: number;
  windowMs: number;
}): { allowed: boolean; remaining: number; resetAtMs: number } {
  const store = storeRef();
  const key = `${params.ip}::${params.projectId}`;
  const now = Date.now();
  const existing = store.rateWindows.get(key);

  if (!existing || now - existing.windowStart >= params.windowMs) {
    store.rateWindows.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: params.limit - 1,
      resetAtMs: now + params.windowMs,
    };
  }

  if (existing.count >= params.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAtMs: existing.windowStart + params.windowMs,
    };
  }

  existing.count += 1;
  store.rateWindows.set(key, existing);
  return {
    allowed: true,
    remaining: Math.max(0, params.limit - existing.count),
    resetAtMs: existing.windowStart + params.windowMs,
  };
}

export function readCircuitBreaker(): CircuitBreakerState {
  const circuit = storeRef().circuit;
  const now = Date.now();
  if (circuit.state === "open" && now >= circuit.openUntil) {
    circuit.state = "half-open";
  }
  return { ...circuit };
}

export function markCircuitFailure(reason: string): void {
  const circuit = storeRef().circuit;
  circuit.failureCount += 1;
  circuit.lastError = reason;
  if (circuit.failureCount >= 3) {
    circuit.state = "open";
    circuit.openUntil = Date.now() + 60_000;
  }
}

export function markCircuitSuccess(): void {
  const circuit = storeRef().circuit;
  circuit.state = "closed";
  circuit.failureCount = 0;
  circuit.openUntil = 0;
  circuit.lastError = undefined;
}
