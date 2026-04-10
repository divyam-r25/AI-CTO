export type PlanningMode = "conservative" | "balanced" | "aggressive";

export interface RoadmapPhase {
  phase: string;
  timeline: string;
  objective: string;
  deliverables: string[];
}

export interface RiskItem {
  category: "technical" | "product" | "scaling" | "financial" | "compliance";
  title: string;
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

export interface AnalysisResult {
  productName: string;
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
  folderStructure: string[];
  roadmap: RoadmapPhase[];
  risks: RiskItem[];
  failureSimulation: {
    narrative: string;
    likelyFailurePoints: string[];
    preBuildChanges: string[];
  };
  costs: CostTier[];
  alternatives: AlternativeApproach[];
  recommendation: {
    verdict: "build-now" | "build-with-pivot" | "research-first";
    confidence: number;
    rationale: string[];
  };
  assumptions: string[];
}

export interface AnalyzeRequest {
  prd: string;
  mode: PlanningMode;
}
