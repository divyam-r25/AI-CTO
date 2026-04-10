import type {
  AlternativeApproach,
  CostOptimizerItem,
  CostTier,
  DecisionCard,
  ExecutionPlan,
  HonestyMode,
  IdeaScore,
  InvestmentPerspective,
  ModeGuide,
  PlanningMode,
  RiskItem,
  RoadmapPhase,
  TechStackComparator,
} from "@/lib/types";

export interface SignalFlags {
  hasAI: boolean;
  hasRealtime: boolean;
  isB2B: boolean;
  isMobileHeavy: boolean;
  hasCompliance: boolean;
  hasDifferentiationSignals: boolean;
}

export interface SkillRuntimeContext {
  prd: string;
  normalized: string;
  mode: PlanningMode;
  honestyMode: HonestyMode;
  productName: string;
  flags: SignalFlags;
  modeGuide: ModeGuide;
}

export interface PrdAnalysisOutput {
  problemStatement: string;
  targetUsers: string[];
  mustHaveFeatures: string[];
  nonFunctionalRequirements: string[];
  openQuestions: string[];
  assumptions: string[];
  analysisDecisions: DecisionCard[];
}

export interface SystemDesignOutput {
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
  architectureDecisions: DecisionCard[];
  alternatives: AlternativeApproach[];
  techComparator: TechStackComparator[];
}

export interface RoadmapOutput {
  roadmap: RoadmapPhase[];
  roadmapDecisions: DecisionCard[];
  executionPlan: ExecutionPlan;
}

export interface RiskOutput {
  risks: RiskItem[];
  failureSimulation: {
    narrative: string;
    primaryFailureReason: string;
    likelyFailurePoints: string[];
    weakestAssumptions: string[];
    pivots: string[];
    preBuildChanges: string[];
  };
  riskDecisions: DecisionCard[];
  challengeSummary: string[];
}

export interface CostOutput {
  costs: CostTier[];
  costOptimizer: CostOptimizerItem[];
  costDecisions: DecisionCard[];
  ideaScore: IdeaScore;
  recommendation: {
    verdict: "build-now" | "build-with-pivot" | "research-first";
    confidence: number;
    rationale: string[];
  };
  investmentPerspective: InvestmentPerspective;
}

export interface SelfCritiqueOutput {
  critiquePoints: string[];
  improvementsApplied: string[];
  revisedVerdict: "build-now" | "build-with-pivot" | "research-first";
  confidencePenalty: number;
  revisedFailureReason: string;
}
