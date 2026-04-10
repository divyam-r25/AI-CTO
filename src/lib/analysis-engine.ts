import type {
  AnalysisResult,
  AnalyzeRequest,
  AlternativeApproach,
  CostTier,
  PlanningMode,
  RiskItem,
  RoadmapPhase,
} from "@/lib/types";

const MODEL_INTEGRATION_KEYWORDS = [
  "ai",
  "llm",
  "translator",
  "summarizer",
  "chat",
  "vision",
  "speech",
  "huggingface",
  "openai",
  "gemini",
];

const REALTIME_KEYWORDS = ["real-time", "realtime", "live", "streaming", "voice"];
const B2B_KEYWORDS = ["enterprise", "team", "workspace", "admin", "dashboard"];
const MOBILE_KEYWORDS = ["mobile", "ios", "android", "app store"];
const COMPLIANCE_KEYWORDS = ["gdpr", "hipaa", "soc2", "pci", "compliance", "security"];

function normalize(text: string): string {
  return text.toLowerCase();
}

function hasAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function rpn(likelihood: number, impact: number, detectability: number): number {
  return likelihood * impact * detectability;
}

function deriveProductName(prd: string): string {
  const firstLine = prd
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!firstLine) {
    return "Untitled Product";
  }

  const clean = firstLine.replace(/^#+\s*/, "");
  return clean.length > 70 ? `${clean.slice(0, 67)}...` : clean;
}

function buildRoadmap(hasAI: boolean, hasRealtime: boolean): RoadmapPhase[] {
  const base: RoadmapPhase[] = [
    {
      phase: "Phase 1 - Discovery and Spec Lock",
      timeline: "Day 1",
      objective: "Convert PRD to implementation-ready engineering spec",
      deliverables: [
        "Final user stories and success metrics",
        "Data model draft + API contracts",
        "Risk baseline and assumptions register",
      ],
    },
    {
      phase: "Phase 2 - Platform Foundation",
      timeline: "Day 2",
      objective: "Set up project skeleton and quality gates",
      deliverables: [
        "Monorepo/app skeleton with CI",
        "Auth and config management",
        "Observability baseline (logs, errors, traces)",
      ],
    },
    {
      phase: "Phase 3 - Core Product Workflow",
      timeline: "Day 3-4",
      objective: "Implement core user flow end to end",
      deliverables: [
        "Primary UI workflow",
        "Backend orchestration and persistence",
        "Validation and failure handling",
      ],
    },
    {
      phase: "Phase 4 - Reliability and Cost Controls",
      timeline: "Day 5",
      objective: "Protect margin and improve user experience",
      deliverables: [
        "Caching + retries + timeouts",
        "Rate limiting and abuse controls",
        "Latency budgets with alert thresholds",
      ],
    },
    {
      phase: "Phase 5 - Launch Readiness",
      timeline: "Day 6-7",
      objective: "Prepare for production release",
      deliverables: [
        "Smoke tests and integration tests",
        "Runbook and rollback plan",
        "Go/No-Go review with risk closure report",
      ],
    },
  ];

  if (hasAI) {
    base[2].deliverables.push("Prompt and model fallback strategy");
    base[3].deliverables.push("Token usage tracking + model routing");
  }

  if (hasRealtime) {
    base[2].deliverables.push("WebSocket/SSE transport for live updates");
    base[3].deliverables.push("Backpressure and queue safety checks");
  }

  return base;
}

function buildRisks(hasAI: boolean, hasRealtime: boolean, hasCompliance: boolean): RiskItem[] {
  const risks: RiskItem[] = [
    {
      category: "product",
      title: "Weak differentiation against incumbents",
      likelihood: 4,
      impact: 5,
      detectability: 3,
      rpn: 0,
      warningSignals: [
        "User interviews cite existing tools as equivalent",
        "Low retention after first week",
      ],
      mitigation: [
        "Define one workflow incumbents handle poorly",
        "Narrow down to an underserved user segment",
      ],
    },
    {
      category: "scaling",
      title: "Latency regression during traffic spikes",
      likelihood: 3,
      impact: 4,
      detectability: 3,
      rpn: 0,
      warningSignals: ["P95 response time above target", "Queue depth keeps growing"],
      mitigation: ["Introduce queue-based async paths", "Cache expensive responses"],
    },
    {
      category: "financial",
      title: "Unit economics degrade at growth stage",
      likelihood: 4,
      impact: 5,
      detectability: 2,
      rpn: 0,
      warningSignals: [
        "Cost per active user rises faster than revenue",
        "API bills exceed forecast for two consecutive weeks",
      ],
      mitigation: [
        "Add usage quotas and tier limits",
        "Route low-priority traffic to cheaper models",
      ],
    },
  ];

  if (hasAI) {
    risks.push({
      category: "technical",
      title: "External model/provider dependency risk",
      likelihood: 4,
      impact: 4,
      detectability: 3,
      rpn: 0,
      warningSignals: ["Model quality drift", "Rate-limit errors from provider"],
      mitigation: [
        "Define fallback provider and open-source backup path",
        "Store prompts and evaluate output quality continuously",
      ],
    });
  }

  if (hasRealtime) {
    risks.push({
      category: "technical",
      title: "Realtime transport instability",
      likelihood: 3,
      impact: 4,
      detectability: 3,
      rpn: 0,
      warningSignals: ["Frequent reconnects", "Dropped update events"],
      mitigation: ["Use idempotent event handlers", "Introduce delivery acknowledgment"],
    });
  }

  if (hasCompliance) {
    risks.push({
      category: "compliance",
      title: "Regulatory non-compliance exposure",
      likelihood: 3,
      impact: 5,
      detectability: 4,
      rpn: 0,
      warningSignals: [
        "No data retention policy",
        "Sensitive PII stored without clear purpose",
      ],
      mitigation: [
        "Data classification with retention rules",
        "Audit trail and privacy review before launch",
      ],
    });
  }

  return risks.map((risk) => ({
    ...risk,
    rpn: rpn(risk.likelihood, risk.impact, risk.detectability),
  }));
}

function buildCosts(hasAI: boolean, hasRealtime: boolean): CostTier[] {
  const tiers: CostTier[] = [
    {
      tier: "prototype",
      usersPerMonth: "1,000-5,000",
      monthlyRangeUsd: hasAI ? "$80-$450" : "$40-$200",
      topCostDriver: hasAI ? "Inference/API calls" : "Hosting and storage",
      notes: [
        "Use managed DB and serverless runtime",
        "Enforce request limits from day one",
      ],
    },
    {
      tier: "early-traction",
      usersPerMonth: "10,000-50,000",
      monthlyRangeUsd: hasAI ? "$1,000-$5,500" : "$500-$2,200",
      topCostDriver: hasAI ? "Model usage + egress" : "Compute autoscaling",
      notes: [
        "Add response caching and request batching",
        "Monitor cost per active user weekly",
      ],
    },
    {
      tier: "growth",
      usersPerMonth: "100,000+",
      monthlyRangeUsd: hasAI ? "$9,000-$45,000" : "$3,500-$18,000",
      topCostDriver: hasAI ? "Inference throughput" : "Data and global traffic",
      notes: [
        "Consider partial self-hosting for high-volume paths",
        "Use asynchronous processing where possible",
      ],
    },
  ];

  if (hasRealtime) {
    tiers.forEach((tier) => {
      tier.notes.push("Allocate budget for realtime messaging infrastructure");
    });
  }

  return tiers;
}

function buildAlternatives(hasAI: boolean): AlternativeApproach[] {
  const alternatives: AlternativeApproach[] = [
    {
      name: "Speed MVP Stack",
      bestFor: "Fast launch with smallest team",
      tradeoffs: [
        "Higher vendor lock-in",
        "Lower infra control",
        "Quickest development velocity",
      ],
    },
    {
      name: "Balanced Control Stack",
      bestFor: "Teams expecting mid-term growth",
      tradeoffs: [
        "More engineering complexity",
        "Better cost controls over time",
        "Improved portability",
      ],
    },
  ];

  if (hasAI) {
    alternatives.push({
      name: "Hybrid Model Strategy (API + Open Source)",
      bestFor: "Products with variable traffic and margin sensitivity",
      tradeoffs: [
        "Extra ops overhead",
        "Best long-term cost resilience",
        "Requires model evaluation pipeline",
      ],
    });
  }

  return alternatives;
}

function selectVerdict(riskAverage: number, hasDifferentiationSignals: boolean): AnalysisResult["recommendation"]["verdict"] {
  if (riskAverage >= 52) {
    return "research-first";
  }
  if (!hasDifferentiationSignals) {
    return "build-with-pivot";
  }
  return "build-now";
}

function adjustRiskByMode(risk: RiskItem, mode: PlanningMode): RiskItem {
  const delta = mode === "aggressive" ? -1 : mode === "conservative" ? 1 : 0;
  const likelihood = clamp(risk.likelihood + delta, 1, 5);
  const impact = clamp(risk.impact + (mode === "conservative" ? 1 : 0), 1, 5);
  const detectability = clamp(risk.detectability + (mode === "conservative" ? 1 : 0), 1, 5);

  return {
    ...risk,
    likelihood,
    impact,
    detectability,
    rpn: rpn(likelihood, impact, detectability),
  };
}

export function analyzePrd({ prd, mode }: AnalyzeRequest): AnalysisResult {
  const normalized = normalize(prd);
  const hasAI = hasAny(normalized, MODEL_INTEGRATION_KEYWORDS);
  const hasRealtime = hasAny(normalized, REALTIME_KEYWORDS);
  const isB2B = hasAny(normalized, B2B_KEYWORDS);
  const isMobileHeavy = hasAny(normalized, MOBILE_KEYWORDS);
  const hasCompliance = hasAny(normalized, COMPLIANCE_KEYWORDS);

  const productName = deriveProductName(prd);
  const roadmap = buildRoadmap(hasAI, hasRealtime);
  const risks = buildRisks(hasAI, hasRealtime, hasCompliance).map((risk) =>
    adjustRiskByMode(risk, mode),
  );
  const costs = buildCosts(hasAI, hasRealtime);
  const alternatives = buildAlternatives(hasAI);

  const riskAverage = risks.reduce((sum, item) => sum + item.rpn, 0) / risks.length;
  const hasDifferentiationSignals =
    normalized.includes("niche") ||
    normalized.includes("unique") ||
    normalized.includes("community") ||
    normalized.includes("vertical");

  const verdict = selectVerdict(riskAverage, hasDifferentiationSignals);
  const confidence =
    verdict === "build-now"
      ? 82
      : verdict === "build-with-pivot"
        ? 74
        : 63;

  const frontendStack = [
    "Next.js 16 + TypeScript",
    "Tailwind CSS v4",
    "Component-driven UI with strict accessibility checks",
  ];

  if (isMobileHeavy) {
    frontendStack.push("Progressive Web App shell for mobile-first rollout");
  }

  return {
    productName,
    executiveSummary:
      "The PRD is feasible for an MVP timeline, but success depends on deliberate differentiation, cost controls, and early reliability engineering.",
    architecture: {
      overview:
        "Client app routes user intent to a stateless API layer, which orchestrates domain services, persistence, and optional AI providers behind retry, caching, and observability controls.",
      frontend: isMobileHeavy
        ? "Next.js web app with responsive PWA behavior and optimistic UX patterns"
        : "Next.js web app with server-rendered landing and dynamic product surfaces",
      backend: hasRealtime
        ? "Node.js API routes + event stream layer (SSE/WebSocket) with queue-backed workers"
        : "Node.js API routes with service-oriented modules and job queue for heavy tasks",
      data: isB2B
        ? "PostgreSQL for transactional data + Redis for cache and session acceleration"
        : "PostgreSQL + object storage for generated assets and analytics snapshots",
      integrations: hasAI
        ? [
            "Primary LLM/inference provider",
            "Fallback model provider for continuity",
            "Telemetry pipeline for quality/cost tracking",
          ]
        : ["Email/notification provider", "Analytics + error monitoring"],
    },
    techStack: {
      frontend: frontendStack,
      backend: [
        "Route handlers + typed domain services",
        "Zod-style payload validation patterns",
        "Background jobs for non-blocking workflows",
      ],
      dataInfra: ["PostgreSQL", "Redis", "Object storage", "Queue (managed or Redis-backed)"],
      observability: ["Structured logging", "P95 latency dashboard", "Cost and usage alerts"],
    },
    folderStructure: [
      "src/app/(marketing)",
      "src/app/(product)",
      "src/app/api/analyze",
      "src/components",
      "src/lib/analysis",
      "src/lib/domain",
      "src/lib/infra",
      "src/lib/validation",
      "docs/architecture.md",
      "docs/roadmap.md",
      "docs/risks.md",
      "docs/costs.md",
    ],
    roadmap,
    risks,
    failureSimulation: {
      narrative:
        "If the team ships feature parity without a narrow wedge and cost guardrails, adoption may look good initially but margins and retention will deteriorate by the first growth spike.",
      likelyFailurePoints: [
        "Provider cost shock after usage growth",
        "User churn due to inconsistent response latency",
        "Low conversion because value proposition is not distinct",
      ],
      preBuildChanges: [
        "Define one user segment and measurable differentiation claim",
        "Set strict latency SLO and cost-per-user threshold",
        "Implement fallback and caching before public launch",
      ],
    },
    costs,
    alternatives,
    recommendation: {
      verdict,
      confidence,
      rationale: [
        "Architecture is implementable by a small team within one sprint",
        "Risk profile is acceptable only with proactive cost and reliability controls",
        "Differentiation strategy needs to be explicit before scaling spend",
      ],
    },
    assumptions: [
      "A single cross-functional team will build MVP",
      "Cloud-managed services are acceptable for first release",
      "No hard real-time requirement below 200ms unless stated in PRD",
    ],
  };
}
