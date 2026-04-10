export type PlanningMode = "beginner-startup" | "scalable-startup" | "enterprise";

export type HonestyMode = "standard" | "brutal";

export type ExecutionMode = "sync" | "async";

export type EngineType = "hybrid" | "deterministic";

export type AnalysisStatus = "queued" | "running" | "completed" | "failed";

export interface RoadmapPhase {
  phase: string;
  timeline: string;
  objective: string;
  deliverables: string[];
}

export interface RiskItem {
  category: "technical" | "product" | "scaling" | "financial" | "compliance";
  title: string;
  mitigationOwner: string;
  likelihood: number;
  impact: number;
  detectability: number;
  rpn: number;
  warningSignals: string[];
  mitigation: string[];
}

export interface CostTier {
  tier: "prototype" | "early-traction" | "growth";
  usersPerMonth: string;
  monthlyRangeUsd: string;
  topCostDriver: string;
  notes: string[];
}

export interface AlternativeApproach {
  name: string;
  bestFor: string;
  tradeoffs: string[];
}

export interface DecisionAlternative {
  option: string;
  pros: string[];
  cons: string[];
}

export type DecisionStage = "analysis" | "architecture" | "roadmap" | "risk-mitigation" | "cost";

export interface DecisionCard {
  stage: DecisionStage;
  title: string;
  context: string;
  evidenceIds: string[];
  chosen: string;
  why: string[];
  alternatives: [DecisionAlternative, DecisionAlternative];
  comparisonSummary: string;
}

export interface ModeGuide {
  modeLabel: string;
  priorities: string[];
  guardrails: string[];
}

export interface IdeaScore {
  feasibility: number;
  scalability: number;
  uniqueness: number;
  summary: string;
}

export interface EvidenceItem {
  id: string;
  category: "requirement" | "constraint" | "assumption" | "risk" | "persona";
  text: string;
  confidence: number;
}

export interface AssumptionItem {
  id: string;
  statement: string;
  confidence: number;
  owner: string;
  validationTask: string;
  dueDate: string;
  status: "pending" | "validated" | "invalidated";
}

export interface ReadinessGate {
  name: string;
  passed: boolean;
  reason: string;
}

export interface ReadinessScore {
  score: number;
  verdict: "go" | "no-go";
  gates: ReadinessGate[];
}

export interface PlanSnapshot {
  verdict: "build-now" | "build-with-pivot" | "research-first";
  confidence: number;
  primaryFailureReason: string;
  topRisks: string[];
  topDecisions: string[];
}

export interface SelfCritique {
  initial: PlanSnapshot;
  critiquePoints: string[];
  improvementsApplied: string[];
  revised: PlanSnapshot;
}

export interface InvestmentPerspective {
  budgetUsd: number;
  verdict: "invest-now" | "invest-with-conditions" | "do-not-invest-yet";
  rationale: string[];
}

export interface ExecutionPlan {
  mvp: string[];
  scale: string[];
}

export interface TechStackComparator {
  dimension: string;
  optionA: string;
  optionB: string;
  verdict: string;
  rationale: string;
}

export interface CostOptimizerItem {
  area: string;
  currentRisk: string;
  alternativeA: string;
  alternativeB: string;
  comparison: string;
  recommended: string;
  why: string;
}

export interface StructuredSections {
  architecture: string;
  folderStructure: string;
  roadmap: string;
  risks: string;
  failurePrediction: string;
  improvements: string;
}

export interface AnalysisTimings {
  totalMs: number;
  deterministicMs: number;
  enrichmentMs: number;
  critiqueMs: number;
}

export interface AnalysisResult {
  productName: string;
  mode: PlanningMode;
  honestyMode: HonestyMode;
  modeGuide: ModeGuide;
  skillChain: string[];
  executiveSummary: string;
  architecture: {
    overview: string;
    frontend: string;
    backend: string;
    data: string;
    integrations: string[];
  };
  techStack: {
    frontend: string[];
    backend: string[];
    dataInfra: string[];
    observability: string[];
  };
  evidence: EvidenceItem[];
  assumptionTracker: AssumptionItem[];
  folderStructure: string[];
  roadmap: RoadmapPhase[];
  risks: RiskItem[];
  failureSimulation: {
    narrative: string;
    primaryFailureReason: string;
    likelyFailurePoints: string[];
    weakestAssumptions: string[];
    pivots: string[];
    preBuildChanges: string[];
  };
  costs: CostTier[];
  alternatives: AlternativeApproach[];
  decisions: DecisionCard[];
  ideaScore: IdeaScore;
  techComparator: TechStackComparator[];
  costOptimizer: CostOptimizerItem[];
  executionPlan: ExecutionPlan;
  investmentPerspective: InvestmentPerspective;
  selfCritique: SelfCritique;
  readinessScore: ReadinessScore;
  uncertaintyFlags: string[];
  blockingIssues: string[];
  fallbackUsed: boolean;
  challengeSummary: string[];
  recommendation: {
    verdict: "build-now" | "build-with-pivot" | "research-first";
    confidence: number;
    rationale: string[];
  };
  assumptions: string[];
  outputSections: StructuredSections;
}

export interface AnalyzeRequest {
  prd: string;
  mode: PlanningMode;
  honestyMode: HonestyMode;
  projectId?: string;
  requestId?: string;
  executionMode?: ExecutionMode;
  engine?: EngineType;
  enableLlmEnrichment?: boolean;
  maxLatencyMs?: number;
  writeFiles?: boolean;
}

export interface AnalyzeResponse {
  success: boolean;
  analysisId: string;
  projectId: string;
  status: AnalysisStatus;
  executionMode: ExecutionMode;
  cached: boolean;
  fallbackUsed: boolean;
  timings: AnalysisTimings;
  uncertaintyFlags: string[];
  blockingIssues: string[];
  generatedAt: string;
  result?: AnalysisResult;
  generatedFiles?: string[];
  generationWarning?: string | null;
  error?: string;
}

export interface AnalysisRecordSummary {
  analysisId: string;
  projectId: string;
  status: AnalysisStatus;
  createdAt: string;
  updatedAt: string;
  verdict?: AnalysisResult["recommendation"]["verdict"];
  confidence?: number;
  fallbackUsed: boolean;
  cached: boolean;
  blockingIssues: string[];
}

export interface AnalysisComparison {
  baseAnalysisId: string;
  headAnalysisId: string;
  verdictChanged: boolean;
  confidenceDelta: number;
  topRiskChanges: string[];
  decisionChanges: string[];
  blockingIssueChanges: string[];
}

export interface AnalyzeHistoryResponse {
  success: boolean;
  count: number;
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  history: AnalysisRecordSummary[];
  generatedAt: string;
  error?: string;
}

export interface AnalyzeCompareResponse {
  success: boolean;
  comparison?: AnalysisComparison;
  generatedAt: string;
  error?: string;
}
