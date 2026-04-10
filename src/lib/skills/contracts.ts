import type {
  AlternativeApproach,
  AssumptionItem,
  CostOptimizerItem,
  CostTier,
  DecisionCard,
  EvidenceItem,
  ExecutionPlan,
  HonestyMode,
  IdeaScore,
  DomainGuide,
  InvestmentPerspective,
  ModeGuide,
  PlanningMode,
  RiskItem,
  RoadmapPhase,
  ProjectDomain,
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
  domain: ProjectDomain;
  honestyMode: HonestyMode;
  productName: string;
  flags: SignalFlags;
  modeGuide: ModeGuide;
  domainGuide: DomainGuide;
}

export interface PrdAnalysisOutput {
  problemStatement: string;
  targetUsers: string[];
  mustHaveFeatures: string[];
  nonFunctionalRequirements: string[];
  openQuestions: string[];
  assumptions: string[];
  evidence: EvidenceItem[];
  assumptionTracker: AssumptionItem[];
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
