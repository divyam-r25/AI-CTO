import type {
  AlternativeApproach,
  AnalysisResult,
  AnalyzeRequest,
  CostOptimizerItem,
  CostTier,
  DecisionCard,
  ModeGuide,
  PlanningMode,
  RiskItem,
  RoadmapPhase,
  TechStackComparator,
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

function modeProfile(mode: PlanningMode): {
  roadmapBias: string;
  architectureBias: string;
  riskDelta: number;
  confidenceDelta: number;
  costBias: string;
} {
  switch (mode) {
    case "beginner-startup":
      return {
        roadmapBias: "Compress delivery into short validation loops.",
        architectureBias: "Prefer managed services over custom infrastructure.",
        riskDelta: 1,
        confidenceDelta: -2,
        costBias: "Minimize upfront spend and keep burn predictable.",
      };
    case "enterprise":
      return {
        roadmapBias: "Gate releases with security, governance, and reliability checks.",
        architectureBias: "Favor control, auditability, and policy enforcement.",
        riskDelta: 1,
        confidenceDelta: -5,
        costBias: "Accept higher base cost for compliance-grade guarantees.",
      };
    default:
      return {
        roadmapBias: "Balance launch speed with scale-readiness.",
        architectureBias: "Use pragmatic modular architecture with clear upgrade paths.",
        riskDelta: 0,
        confidenceDelta: 1,
        costBias: "Optimize cost per active user while protecting reliability.",
      };
  }
}

function buildModeGuide(mode: PlanningMode): ModeGuide {
  switch (mode) {
    case "beginner-startup":
      return {
        modeLabel: "Beginner Startup",
        priorities: [
          "Ship fast to validate a narrow value proposition",
          "Use defaults and managed services to reduce setup time",
          "Avoid architecture complexity before product pull is proven",
        ],
        guardrails: [
          "Set hard monthly spend caps",
          "Delay custom infrastructure until repeat usage is proven",
          "Treat differentiation as a release gate",
        ],
      };
    case "enterprise":
      return {
        modeLabel: "Enterprise",
        priorities: [
          "Reliability, governance, and compliance before growth",
          "Clear service boundaries and ownership",
          "Auditability across data and model usage paths",
        ],
        guardrails: [
          "No launch without security review and incident runbook",
          "Define and enforce retention/classification policy",
          "Track SLO and compliance drift from day one",
        ],
      };
    default:
      return {
        modeLabel: "Scalable Startup",
        priorities: [
          "Balance velocity with architecture discipline",
          "Design for near-term growth and controllable complexity",
          "Build observability and cost controls alongside features",
        ],
        guardrails: [
          "Avoid one-way vendor lock-in for critical paths",
          "Define upgrade paths before scale pressure",
          "Use weekly risk and unit-economics reviews",
        ],
      };
  }
}

function buildRoadmap(hasAI: boolean, hasRealtime: boolean, mode: PlanningMode): RoadmapPhase[] {
  const profile = modeProfile(mode);
  const compact = mode === "beginner-startup";
  const enterprise = mode === "enterprise";

  const base: RoadmapPhase[] = [
    {
      phase: "Phase 1 - PRD Decomposition and Wedge",
      timeline: enterprise ? "Week 1, Day 1-2" : "Day 1",
      objective: "Extract requirements, assumptions, and defensible market wedge",
      deliverables: [
        "Feature map with must-have vs optional scope",
        "Decision card for product wedge",
        `Mode bias: ${profile.roadmapBias}`,
      ],
    },
    {
      phase: "Phase 2 - Architecture and Contracts",
      timeline: enterprise ? "Week 1, Day 3-5" : "Day 2",
      objective: "Define architecture, APIs, and operational contracts",
      deliverables: [
        `Architecture posture: ${profile.architectureBias}`,
        "API and data contracts with ownership boundaries",
        "Telemetry baseline and quality gates",
      ],
    },
    {
      phase: "Phase 3 - Core Build",
      timeline: compact ? "Day 3" : enterprise ? "Week 2, Day 1-2" : "Day 3-4",
      objective: "Implement core value flow end-to-end",
      deliverables: [
        "Primary user journey implementation",
        "Backend orchestration and persistence",
        "Contract and integration test coverage for core flow",
      ],
    },
    {
      phase: "Phase 4 - Risk Hardening",
      timeline: compact ? "Day 4" : enterprise ? "Week 2, Day 3-4" : "Day 5-6",
      objective: "Reduce top failure risks before launch pressure",
      deliverables: [
        "Failure simulation pass with mitigation owners",
        "Performance and reliability hardening",
        "Cost guardrails and anomaly alerts",
      ],
    },
    {
      phase: "Phase 5 - Launch Decision",
      timeline: compact ? "Day 5" : enterprise ? "Week 2, Day 5" : "Day 7",
      objective: "Execute go/no-go with explicit release checks",
      deliverables: [
        "Go/no-go checklist with exit criteria",
        "Rollback and incident response playbook",
        "Post-launch metric review plan",
      ],
    },
  ];

  if (hasAI) {
    base[2].deliverables.push("Prompt quality evaluations and fallback behavior");
    base[3].deliverables.push("Token budget thresholds and routing strategy");
  }

  if (hasRealtime) {
    base[2].deliverables.push("Realtime stream reliability tests");
    base[3].deliverables.push("Backpressure controls and queue telemetry");
  }

  if (enterprise) {
    base[1].deliverables.push("Compliance and security design review");
    base[4].deliverables.push("Policy and audit sign-off");
  }

  return base;
}

function buildRisks(
  hasAI: boolean,
  hasRealtime: boolean,
  hasCompliance: boolean,
  mode: PlanningMode,
): RiskItem[] {
  const profile = modeProfile(mode);

  const risks: RiskItem[] = [
    {
      category: "product",
      title: "Weak differentiation against incumbents",
      likelihood: clamp(4 + profile.riskDelta, 1, 5),
      impact: 5,
      detectability: 3,
      rpn: 0,
      warningSignals: [
        "Prospects compare the product to free alternatives",
        "Activation and retention flatten after initial onboarding",
      ],
      mitigation: [
        "Narrow to one high-pain workflow and own it deeply",
        "Gate launch on measurable value proof in target segment",
      ],
    },
    {
      category: "scaling",
      title: "Latency and reliability degrade with growth spikes",
      likelihood: clamp(3 + profile.riskDelta, 1, 5),
      impact: 4,
      detectability: 3,
      rpn: 0,
      warningSignals: ["P95 latency breaches SLO", "Queue depth grows faster than drain rate"],
      mitigation: [
        "Split synchronous and asynchronous execution paths",
        "Cache repeat-heavy flows and add backpressure controls",
      ],
    },
    {
      category: "financial",
      title: "Unit economics worsen as usage grows",
      likelihood: 4,
      impact: 5,
      detectability: 2,
      rpn: 0,
      warningSignals: [
        "Cost per active user rises for two consecutive weeks",
        "Variable cost scales faster than revenue or conversion",
      ],
      mitigation: [
        "Introduce pricing tiers and usage-aware feature limits",
        "Route low-value traffic to lower-cost execution paths",
      ],
    },
  ];

  if (hasAI) {
    risks.push({
      category: "technical",
      title: "Model dependency and quality drift",
      likelihood: clamp(4 + profile.riskDelta, 1, 5),
      impact: 4,
      detectability: 3,
      rpn: 0,
      warningSignals: ["Quality score regressions", "Provider throttling or outage spikes"],
      mitigation: [
        "Maintain fallback model routes with health checks",
        "Track quality-cost-latency metrics per request class",
      ],
    });
  }

  if (hasRealtime) {
    risks.push({
      category: "technical",
      title: "Realtime channel instability",
      likelihood: clamp(3 + profile.riskDelta, 1, 5),
      impact: 4,
      detectability: 3,
      rpn: 0,
      warningSignals: ["Reconnect spikes", "Dropped acknowledgements in event stream"],
      mitigation: [
        "Use idempotent event replay and consumer offsets",
        "Add transport health monitoring with fallback mode",
      ],
    });
  }

  if (hasCompliance || mode === "enterprise") {
    risks.push({
      category: "compliance",
      title: "Data-governance and compliance exposure",
      likelihood: clamp(3 + profile.riskDelta, 1, 5),
      impact: 5,
      detectability: 4,
      rpn: 0,
      warningSignals: [
        "No retention or deletion controls for sensitive data",
        "Missing data classification and access audit trails",
      ],
      mitigation: [
        "Implement classification, retention, and deletion policy",
        "Add audit logging and privacy/compliance review gates",
      ],
    });
  }

  return risks.map((risk) => ({
    ...risk,
    rpn: rpn(risk.likelihood, risk.impact, risk.detectability),
  }));
}

function buildCosts(hasAI: boolean, hasRealtime: boolean, mode: PlanningMode): CostTier[] {
  const profile = modeProfile(mode);
  const multiplier =
    mode === "enterprise" ? 1.4 : mode === "beginner-startup" ? 0.85 : 1;

  function scaleRange(range: [number, number]): string {
    const low = Math.round(range[0] * multiplier);
    const high = Math.round(range[1] * multiplier);
    return `$${low.toLocaleString()}-$${high.toLocaleString()}`;
  }

  const base = hasAI
    ? {
        prototype: [140, 850] as [number, number],
        traction: [1500, 7600] as [number, number],
        growth: [12000, 58000] as [number, number],
      }
    : {
        prototype: [80, 380] as [number, number],
        traction: [850, 3200] as [number, number],
        growth: [5800, 26000] as [number, number],
      };

  const tiers: CostTier[] = [
    {
      tier: "prototype",
      usersPerMonth: "1,000-5,000",
      monthlyRangeUsd: scaleRange(base.prototype),
      topCostDriver: hasAI ? "Inference/API usage" : "Managed platform baseline",
      notes: [profile.costBias, "Define spend alerts before opening public access"],
    },
    {
      tier: "early-traction",
      usersPerMonth: "10,000-50,000",
      monthlyRangeUsd: scaleRange(base.traction),
      topCostDriver: hasAI ? "Model traffic + egress" : "Autoscaling compute + storage",
      notes: [
        "Introduce request-level caching and quota policy",
        "Review cost per active user weekly",
      ],
    },
    {
      tier: "growth",
      usersPerMonth: "100,000+",
      monthlyRangeUsd: scaleRange(base.growth),
      topCostDriver: hasAI ? "Inference throughput" : "Data throughput and background jobs",
      notes: [
        "Re-evaluate provider mix and reserved capacity strategy",
        "Offload non-critical flows to asynchronous pipelines",
      ],
    },
  ];

  if (hasRealtime) {
    tiers.forEach((tier) => {
      tier.notes.push("Reserve budget for realtime messaging and delivery guarantees");
    });
  }

  return tiers;
}

function buildAlternatives(hasAI: boolean, mode: PlanningMode): AlternativeApproach[] {
  const alternatives: AlternativeApproach[] = [
    {
      name: "Fast Validation Stack",
      bestFor: "Teams optimizing for earliest market signal",
      tradeoffs: [
        "Shortest path to launch",
        "Higher lock-in risk from managed services",
        "Migration complexity increases if growth arrives quickly",
      ],
    },
    {
      name: "Balanced Scale Stack",
      bestFor: "Teams expecting growth within 1-2 quarters",
      tradeoffs: [
        "Slightly slower initial setup",
        "Better long-term portability and observability",
        "Improved cost control under scale pressure",
      ],
    },
  ];

  if (mode === "enterprise") {
    alternatives.push({
      name: "Compliance-First Platform",
      bestFor: "Regulated environments with strict audit requirements",
      tradeoffs: [
        "Highest setup and governance overhead",
        "Best auditability and policy enforcement",
        "Higher baseline cost but lower compliance risk",
      ],
    });
  } else if (hasAI) {
    alternatives.push({
      name: "Hybrid Inference Stack",
      bestFor: "AI products sensitive to long-run margin and uptime",
      tradeoffs: [
        "Operational complexity increases",
        "More resilient to provider outages and pricing swings",
        "Better long-run control of inference economics",
      ],
    });
  }

  return alternatives;
}

function selectVerdict(
  riskAverage: number,
  hasDifferentiationSignals: boolean,
): AnalysisResult["recommendation"]["verdict"] {
  if (riskAverage >= 54) {
    return "research-first";
  }
  if (!hasDifferentiationSignals) {
    return "build-with-pivot";
  }
  return "build-now";
}

function buildDecisionCards(params: {
  hasAI: boolean;
  hasRealtime: boolean;
  mode: PlanningMode;
  hasDifferentiationSignals: boolean;
  isMobileHeavy: boolean;
  hasCompliance: boolean;
}): DecisionCard[] {
  const {
    hasAI,
    hasRealtime,
    mode,
    hasDifferentiationSignals,
    isMobileHeavy,
    hasCompliance,
  } = params;

  const chooseFlutter = isMobileHeavy && mode === "beginner-startup";
  const chooseSupabase = mode !== "beginner-startup";

  const cards: DecisionCard[] = [
    {
      stage: "analysis",
      title: "Market Wedge Decision",
      context: "Positioning and launch focus",
      chosen: hasDifferentiationSignals
        ? "Double down on the existing niche wedge"
        : "Narrow to one vertical workflow before broad launch",
      why: hasDifferentiationSignals
        ? [
            "Signals suggest a defensible angle already exists in the PRD",
            "Concentrated execution increases conversion and retention odds",
          ]
        : [
            "A broad launch without wedge is likely to become commodity quickly",
            "Vertical focus creates clearer ROI narrative and stronger adoption",
          ],
      alternatives: [
        {
          option: "Horizontal launch for multiple segments",
          pros: ["Bigger top-of-funnel opportunity", "More potential use cases quickly"],
          cons: ["Weak differentiation", "Higher roadmap complexity and messaging dilution"],
        },
        {
          option: "Vertical wedge-first launch",
          pros: ["Clear value proposition", "Faster feedback loops on one segment"],
          cons: ["Smaller initial TAM", "Requires strong segment-specific insight"],
        },
      ],
      comparisonSummary:
        "Wedge-first has lower market breadth but much higher odds of early product-market fit.",
    },
    {
      stage: "architecture",
      title: "Frontend Platform Decision",
      context: "Delivery channel and user experience",
      chosen: chooseFlutter ? "Flutter" : "Next.js",
      why: chooseFlutter
        ? [
            "Mobile-heavy requirement benefits from native-like UX and offline control",
            "Single codebase accelerates iOS and Android parity for MVP",
          ]
        : [
            "Web-first rollout improves discovery and launch speed",
            "Unified full-stack development reduces operational overhead",
          ],
      alternatives: [
        {
          option: "Next.js",
          pros: ["Fast web deployment and SEO", "Unified frontend/backend workflow"],
          cons: ["Less native mobile depth", "Advanced mobile interactions need more effort"],
        },
        {
          option: "Flutter",
          pros: ["Strong cross-platform mobile UX", "Better control for device features"],
          cons: ["Web SEO is weaker", "Backend integration and web support add overhead"],
        },
      ],
      comparisonSummary:
        "Choose Flutter only when mobile-native UX is core; otherwise choose Next.js for speed and web reach.",
    },
    {
      stage: "architecture",
      title: "Data Platform Decision",
      context: "Speed vs control for backend data layer",
      chosen: chooseSupabase ? "Supabase" : "Firebase",
      why: chooseSupabase
        ? [
            "Postgres compatibility improves long-term query flexibility",
            "Migration path and SQL tooling are stronger for scaling teams",
          ]
        : [
            "Managed primitives can cut setup time for early MVP",
            "Minimal operational burden for tiny teams",
          ],
      alternatives: [
        {
          option: "Firebase",
          pros: ["Fastest setup path", "Managed auth and realtime building blocks"],
          cons: ["Relational query constraints", "Potential lock-in at growth stage"],
        },
        {
          option: "Supabase",
          pros: ["Postgres-native model", "Better portability and SQL ecosystem"],
          cons: ["Needs stronger schema discipline", "Realtime tuning required at high scale"],
        },
      ],
      comparisonSummary:
        "Firebase wins for extreme speed; Supabase wins for scale portability and data control.",
    },
    {
      stage: "roadmap",
      title: "Execution Sequencing Decision",
      context: "Roadmap order and critical path",
      chosen:
        mode === "enterprise"
          ? "Security/compliance gate before broad beta"
          : "Core value path first, infrastructure depth second",
      why:
        mode === "enterprise"
          ? [
              "Enterprise deals fail fast when governance is an afterthought",
              "Front-loading policy controls reduces late rework",
            ]
          : [
              "Early traction depends on proving end-user value quickly",
              "Infrastructure should harden after signal, not before it",
            ],
      alternatives: [
        {
          option: "Feature-first then hardening",
          pros: ["Fast demo velocity", "Early user-visible progress"],
          cons: ["Reliability debt accumulates quickly", "Risk of rework under growth pressure"],
        },
        {
          option: "Value path then targeted hardening",
          pros: ["Balanced speed and resilience", "Lower risk of late-stage architecture churn"],
          cons: ["Requires disciplined scope control", "Needs clear go/no-go gates"],
        },
      ],
      comparisonSummary:
        "Value-path-first with planned hardening is the most robust sequence for most startup scenarios.",
    },
    {
      stage: "risk-mitigation",
      title: "Primary Risk Mitigation Decision",
      context: "Preventing predictable launch failure",
      chosen: hasDifferentiationSignals
        ? "Set reliability and margin gates before acquisition scale"
        : "Fix differentiation before adding feature breadth",
      why: hasDifferentiationSignals
        ? [
            "Wedge exists, so execution risk shifts to reliability and economics",
            "Growth spend should follow operational confidence, not precede it",
          ]
        : [
            "Without wedge, feature velocity increases cost but not defensibility",
            "Focused positioning raises retention and pricing power",
          ],
      alternatives: [
        {
          option: "Scale acquisition now and fix later",
          pros: ["Faster top-line growth in the short term", "More user data sooner"],
          cons: ["Magnifies churn and cost leaks", "Can create unsustainable burn"],
        },
        {
          option: "De-risk before growth push",
          pros: ["Protects unit economics", "Improves retention and trust quality"],
          cons: ["Slower visible growth early", "Requires hard prioritization discipline"],
        },
      ],
      comparisonSummary:
        "De-risking before growth lowers probability of expensive failure loops.",
    },
    {
      stage: "cost",
      title: "Cost Control Strategy Decision",
      context: "Protecting margins as usage scales",
      chosen: hasAI
        ? "Dynamic model routing by request value"
        : "Queue heavy workloads and cache read-heavy paths",
      why: hasAI
        ? [
            "Premium quality remains available where it matters most",
            "Low-value requests stop draining gross margin",
          ]
        : [
            "Asynchronous execution lowers expensive synchronous compute load",
            "Caching reduces repeated work and latency simultaneously",
          ],
      alternatives: [
        {
          option: hasAI ? "Single premium model for all traffic" : "Scale app instances only",
          pros: ["Simpler operations", "Lower initial engineering effort"],
          cons: ["Costs grow linearly with usage", "Margin and reliability risk under spikes"],
        },
        {
          option: hasAI
            ? "Tiered routing across model providers"
            : "Queue + cache + right-sized workers",
          pros: ["Better marginal cost control", "Improved resilience under load"],
          cons: ["More policy and observability complexity", "Requires ongoing tuning"],
        },
      ],
      comparisonSummary:
        "Routing/queue strategies add complexity, but materially improve survivability at growth scale.",
    },
  ];

  if (hasAI) {
    cards.push({
      stage: "architecture",
      title: "AI Provider Strategy Decision",
      context: "Model reliability and vendor risk posture",
      chosen: "Hybrid provider strategy",
      why: [
        "Protects against single-vendor outages and abrupt pricing shifts",
        "Enables quality-latency-cost policy routing per request type",
      ],
      alternatives: [
        {
          option: "Single API provider",
          pros: ["Fastest initial integration", "Lowest operational complexity"],
          cons: ["High lock-in and outage exposure", "Less leverage on pricing"],
        },
        {
          option: "Self-hosted open model stack",
          pros: ["Potential long-run cost savings", "More control over data"],
          cons: ["High ops burden", "Model maintenance and reliability complexity"],
        },
      ],
      comparisonSummary:
        "Hybrid routing balances speed, resilience, and economics better than single-path strategies.",
    });
  }

  if (hasRealtime || hasCompliance) {
    cards.push({
      stage: "risk-mitigation",
      title: "Release Gate Decision",
      context: "Deciding what blocks launch",
      chosen:
        hasCompliance || mode === "enterprise"
          ? "Compliance and audit controls are mandatory launch gates"
          : "Realtime reliability SLOs are mandatory launch gates",
      why:
        hasCompliance || mode === "enterprise"
          ? [
              "Governance failures can kill enterprise adoption immediately",
              "Retroactive compliance fixes are expensive and risky",
            ]
          : [
              "Realtime instability directly damages user trust and retention",
              "SLO gates force technical debt visibility before launch",
            ],
      alternatives: [
        {
          option: "Launch first, remediate after incidents",
          pros: ["Faster initial release", "Less pre-launch overhead"],
          cons: ["Higher reputational risk", "Greater rollback and fire-fighting risk"],
        },
        {
          option: "Block launch until defined gates pass",
          pros: ["Lower operational and reputational risk", "Creates accountability and quality discipline"],
          cons: ["Longer pre-launch cycle", "Requires stronger cross-team alignment"],
        },
      ],
      comparisonSummary:
        "Gate-based launches reduce existential downside and should be default for high-risk systems.",
    });
  }

  return cards;
}

function buildTechComparator(params: {
  isMobileHeavy: boolean;
  mode: PlanningMode;
}): TechStackComparator[] {
  const { isMobileHeavy, mode } = params;
  const frontendVerdict = isMobileHeavy && mode === "beginner-startup" ? "Flutter" : "Next.js";
  const backendVerdict = mode === "beginner-startup" ? "Firebase" : "Supabase";

  return [
    {
      dimension: "Frontend Platform",
      optionA: "Next.js",
      optionB: "Flutter",
      verdict: frontendVerdict,
      rationale:
        frontendVerdict === "Flutter"
          ? "Mobile-native UX is central, so Flutter has stronger cross-platform control."
          : "Web-first launch speed, SEO, and unified full-stack delivery favor Next.js.",
    },
    {
      dimension: "Backend Platform",
      optionA: "Firebase",
      optionB: "Supabase",
      verdict: backendVerdict,
      rationale:
        backendVerdict === "Firebase"
          ? "For early MVP speed with minimal ops overhead, Firebase is faster to stand up."
          : "For scale-readiness and SQL portability, Supabase offers better long-term flexibility.",
    },
  ];
}

function buildCostOptimizer(hasAI: boolean, mode: PlanningMode): CostOptimizerItem[] {
  const base: CostOptimizerItem[] = [
    {
      area: "Database and cache",
      currentRisk: "Read-heavy paths drive DB and compute costs upward under traffic spikes.",
      alternativeA: "Scale primary database and add replicas",
      alternativeB: "Add Redis with explicit cache invalidation policy",
      comparison:
        "Replica scaling is simpler short term, but Redis usually reduces both latency and marginal read cost.",
      recommended: "Add Redis with explicit cache invalidation policy",
      why: "Delivers faster latency gains and better unit economics before major database scaling spend.",
    },
    {
      area: "Background processing",
      currentRisk: "Synchronous heavy tasks inflate response time and server cost.",
      alternativeA: "Keep synchronous path and autoscale app instances",
      alternativeB: "Queue heavy tasks to dedicated workers",
      comparison:
        "Autoscaling alone is easy but expensive; worker queues reduce user-facing latency at lower cost.",
      recommended: "Queue heavy tasks to dedicated workers",
      why: "Improves UX and allows finer-grained scaling for compute-intensive workloads.",
    },
  ];

  if (hasAI) {
    base.push({
      area: "Inference spend",
      currentRisk: "Provider usage spikes can erase margins during growth.",
      alternativeA: "Single premium model for all requests",
      alternativeB: "Dynamic routing across premium and low-cost models",
      comparison:
        "Single-model usage is operationally simple but expensive; routing adds complexity but protects margins.",
      recommended: "Dynamic routing across premium and low-cost models",
      why: "Keeps quality on high-value paths while containing spend for low-value traffic.",
    });
  }

  if (mode === "enterprise") {
    base.push({
      area: "Compliance operations",
      currentRisk: "Manual governance operations increase audit costs and incident risk.",
      alternativeA: "Manual policy checks and ad-hoc reporting",
      alternativeB: "Automated policy checks with audit pipelines",
      comparison:
        "Manual checks can work at low scale, but automation is cheaper and safer for repeated audits.",
      recommended: "Automated policy checks with audit pipelines",
      why: "Reduces recurring compliance labor and lowers the chance of high-cost control failures.",
    });
  }

  return base;
}

function formatDecision(decision: DecisionCard): string[] {
  const [first, second] = decision.alternatives;
  return [
    `- [${decision.stage}] ${decision.title}`,
    `  Context: ${decision.context}`,
    `  Option 1: ${first.option} | Pros: ${first.pros.join("; ")} | Cons: ${first.cons.join("; ")}`,
    `  Option 2: ${second.option} | Pros: ${second.pros.join("; ")} | Cons: ${second.cons.join("; ")}`,
    `  Comparison: ${decision.comparisonSummary}`,
    `  Chosen: ${decision.chosen}`,
    `  Why: ${decision.why.join("; ")}`,
  ];
}

function buildStructuredSections(
  result: Omit<AnalysisResult, "outputSections">,
): AnalysisResult["outputSections"] {
  const architectureDecisions = result.decisions.filter(
    (decision) => decision.stage === "analysis" || decision.stage === "architecture",
  );
  const roadmapDecisions = result.decisions.filter((decision) => decision.stage === "roadmap");
  const riskDecisions = result.decisions.filter((decision) => decision.stage === "risk-mitigation");
  const costDecisions = result.decisions.filter((decision) => decision.stage === "cost");

  return {
    architecture: [
      "# 🏗️ Architecture",
      result.architecture.overview,
      `- Mode: ${result.modeGuide.modeLabel}`,
      `- Mode Priorities: ${result.modeGuide.priorities.join("; ")}`,
      `- Mode Guardrails: ${result.modeGuide.guardrails.join("; ")}`,
      `- Frontend: ${result.architecture.frontend}`,
      `- Backend: ${result.architecture.backend}`,
      `- Data: ${result.architecture.data}`,
      `- Integrations: ${result.architecture.integrations.join("; ")}`,
      "",
      "Decision Framework (Analysis -> Architecture)",
      ...architectureDecisions.flatMap(formatDecision),
      "",
      `Skill Chain: ${result.skillChain.join(" -> ")}`,
    ].join("\n"),
    folderStructure: [
      "# 📁 Folder Structure",
      ...result.folderStructure.map((item) => `- ${item}`),
    ].join("\n"),
    roadmap: [
      "# 🗺️ Roadmap",
      ...result.roadmap.map(
        (phase) => `- ${phase.timeline} | ${phase.phase}: ${phase.objective} (${phase.deliverables.join("; ")})`,
      ),
      "",
      "Decision Framework (Roadmap)",
      ...roadmapDecisions.flatMap(formatDecision),
    ].join("\n"),
    risks: [
      "# ⚠️ Risks",
      ...result.risks.map(
        (risk) =>
          `- ${risk.title} [${risk.category}] RPN ${risk.rpn}. Signals: ${risk.warningSignals.join("; ")}. Mitigation: ${risk.mitigation.join("; ")}`,
      ),
      "",
      "Decision Framework (Risk Mitigation)",
      ...riskDecisions.flatMap(formatDecision),
    ].join("\n"),
    failurePrediction: [
      "# 💀 Failure Prediction",
      `Primary failure reason: ${result.failureSimulation.primaryFailureReason}`,
      result.failureSimulation.narrative,
      "Likely failure points:",
      ...result.failureSimulation.likelyFailurePoints.map((item) => `- ${item}`),
      "Weakest assumptions:",
      ...result.failureSimulation.weakestAssumptions.map((item) => `- ${item}`),
      "Pivot options:",
      ...result.failureSimulation.pivots.map((item) => `- ${item}`),
    ].join("\n"),
    improvements: [
      "# 💡 Improvements",
      `- Final Verdict: ${result.recommendation.verdict}`,
      `- Confidence: ${result.recommendation.confidence}%`,
      ...result.recommendation.rationale.map((item) => `- ${item}`),
      "",
      "Decision Framework (Cost)",
      ...costDecisions.flatMap(formatDecision),
      "",
      "Cost Optimizer",
      ...result.costOptimizer.map(
        (item) =>
          `- ${item.area}: A) ${item.alternativeA} B) ${item.alternativeB}. Comparison: ${item.comparison}. Chosen: ${item.recommended}. Why: ${item.why}`,
      ),
      "",
      "Tech Stack Comparator",
      ...result.techComparator.map(
        (item) =>
          `- ${item.dimension}: ${item.optionA} vs ${item.optionB}. Verdict: ${item.verdict}. Why: ${item.rationale}`,
      ),
      "",
      `Idea Score: Feasibility ${result.ideaScore.feasibility}/100 | Scalability ${result.ideaScore.scalability}/100 | Uniqueness ${result.ideaScore.uniqueness}/100`,
      `Idea Score Summary: ${result.ideaScore.summary}`,
      ...result.challengeSummary.map((item) => `- ${item}`),
      "",
      `Mode Reminder: ${result.modeGuide.modeLabel} priorities should drive execution discipline.`,
    ].join("\n"),
  };
}

export function analyzePrd({ prd, mode, honestyMode }: AnalyzeRequest): AnalysisResult {
  const normalized = normalize(prd);
  const hasAI = hasAny(normalized, MODEL_INTEGRATION_KEYWORDS);
  const hasRealtime = hasAny(normalized, REALTIME_KEYWORDS);
  const isB2B = hasAny(normalized, B2B_KEYWORDS);
  const isMobileHeavy = hasAny(normalized, MOBILE_KEYWORDS);
  const hasCompliance = hasAny(normalized, COMPLIANCE_KEYWORDS);

  const hasDifferentiationSignals =
    normalized.includes("niche") ||
    normalized.includes("unique") ||
    normalized.includes("community") ||
    normalized.includes("vertical") ||
    normalized.includes("differentiation") ||
    normalized.includes("workflow");

  const profile = modeProfile(mode);
  const modeGuide = buildModeGuide(mode);
  const productName = deriveProductName(prd);
  const roadmap = buildRoadmap(hasAI, hasRealtime, mode);
  const risks = buildRisks(hasAI, hasRealtime, hasCompliance, mode);
  const costs = buildCosts(hasAI, hasRealtime, mode);
  const alternatives = buildAlternatives(hasAI, mode);
  const costOptimizer = buildCostOptimizer(hasAI, mode);
  const decisions = buildDecisionCards({
    hasAI,
    hasRealtime,
    mode,
    hasDifferentiationSignals,
    isMobileHeavy,
    hasCompliance,
  });

  const riskAverage = risks.reduce((sum, item) => sum + item.rpn, 0) / risks.length;
  const verdict = selectVerdict(riskAverage, hasDifferentiationSignals);

  const confidenceBase =
    verdict === "build-now" ? 84 : verdict === "build-with-pivot" ? 72 : 60;
  const confidence = clamp(confidenceBase + profile.confidenceDelta, 45, 93);

  const ideaScore = {
    feasibility: clamp(
      88 - Math.round(riskAverage / 2) + (mode === "beginner-startup" ? 4 : 0),
      35,
      96,
    ),
    scalability: clamp(
      79 +
        (mode === "enterprise" ? 7 : mode === "scalable-startup" ? 4 : -4) -
        (hasRealtime ? 5 : 0) -
        (hasAI ? 4 : 0),
      35,
      95,
    ),
    uniqueness: clamp(hasDifferentiationSignals ? 74 : 46, 30, 90),
    summary: hasDifferentiationSignals
      ? "The idea is execution-sensitive but has a credible wedge if focus is maintained."
      : "Execution can be strong, but uniqueness is fragile until a sharper wedge is chosen.",
  };

  const primaryFailureReason = hasDifferentiationSignals
    ? "Margins and reliability collapse during growth because controls were added too late."
    : "No defensible wedge leads to commodity competition before retention is established.";

  const narrativePrefix =
    honestyMode === "brutal"
      ? "Brutal honesty mode: assume this fails unless wedge, reliability, and margins are solved before growth."
      : "Failure simulation: growth pressure exposes weak assumptions on differentiation, reliability, and cost.";

  const challengeSummary =
    honestyMode === "brutal"
      ? [
          "Current plan is one pricing change away from margin pain if model routing is not enforced.",
          "Without a hard wedge, you are competing in a commodity feature race you likely cannot win.",
          "If reliability gates are optional, users will churn before your roadmap catches up.",
        ]
      : [
          "Differentiate one core workflow before broad feature expansion.",
          "Use launch gates for reliability and unit economics, not only velocity.",
          "Review weakest assumptions weekly during the first month after launch.",
        ];

  const frontendIsFlutter = isMobileHeavy && mode === "beginner-startup";
  const dataIsFirebase = mode === "beginner-startup";

  const skillChain = ["PRD", "Analysis", "Architecture", "Roadmap", "Risks", "Cost"];
  const techComparator = buildTechComparator({ isMobileHeavy, mode });

  const draft: Omit<AnalysisResult, "outputSections"> = {
    productName,
    mode,
    honestyMode,
    modeGuide,
    skillChain,
    executiveSummary:
      "This PRD can ship, but success depends on enforced decision discipline, failure simulation, and mode-aware execution.",
    architecture: {
      overview:
        "The system uses a modular product surface, policy-driven APIs, and observable execution paths designed to force explicit tradeoff decisions before scale.",
      frontend: frontendIsFlutter
        ? "Flutter mobile app for core experience with a lightweight web shell for acquisition and onboarding"
        : "Next.js web-first app with responsive UX and product APIs in a unified deployable surface",
      backend:
        mode === "enterprise"
          ? "Service-layer API with policy enforcement, async workers, and audit-friendly domain boundaries"
          : hasRealtime
            ? "Typed Node APIs with queue-backed workers and realtime delivery channel safeguards"
            : "Typed Node APIs with async job orchestration for heavy workflows",
      data: dataIsFirebase
        ? "Firebase-managed data primitives for MVP speed, with migration checkpoints defined early"
        : isB2B || mode === "enterprise"
          ? "PostgreSQL with Redis acceleration and governance-ready retention/audit controls"
          : "Supabase Postgres foundation with cache layer and analytics snapshots",
      integrations: hasAI
        ? [
            "Primary inference provider with fallback routing",
            "Quality and cost telemetry pipeline",
            "Notification and monitoring services",
          ]
        : ["Notification provider", "Analytics and error monitoring"],
    },
    techStack: {
      frontend: frontendIsFlutter
        ? ["Flutter", "Dart", "Companion Next.js marketing shell"]
        : ["Next.js 16 + TypeScript", "Tailwind CSS v4", "Accessible component patterns"],
      backend: [
        "Typed route handlers",
        "Service-layer architecture",
        "Queue-backed background processing",
      ],
      dataInfra: dataIsFirebase
        ? ["Firebase data services", "Optional Redis for hot-path caching", "Object storage"]
        : ["PostgreSQL/Supabase", "Redis", "Object storage", "Managed queue"],
      observability: ["Structured logs", "P95 latency dashboard", "Cost anomaly alerts"],
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
      "docs/generated/report.md",
    ],
    roadmap,
    risks,
    failureSimulation: {
      narrative: `${narrativePrefix} Scaling before proving wedge quality and controlling reliability/cost will produce churn and margin erosion in parallel.`,
      primaryFailureReason,
      likelyFailurePoints: [
        "Acquisition spend scales faster than retention quality",
        "Cost per active user rises above monetization capacity",
        "Incident rate increases as complexity grows without gates",
      ],
      weakestAssumptions: [
        "Users will switch without a clear, measurable ROI wedge",
        "Infrastructure and model costs will scale linearly",
        "Reliability can be fixed post-launch without trust damage",
      ],
      pivots: [
        "Focus on one vertical workflow and prove ROI before broad rollout",
        "Shift from generic feature breadth to automation around one recurring pain",
        "Monetize premium outcomes rather than raw usage volume",
      ],
      preBuildChanges: [
        "Define one non-negotiable differentiator and release metric",
        "Set explicit cost-per-active-user and reliability thresholds",
        "Add fallback, caching, and gate checks before scaling traffic",
      ],
    },
    costs,
    alternatives,
    decisions,
    ideaScore,
    techComparator,
    costOptimizer,
    challengeSummary,
    recommendation: {
      verdict,
      confidence,
      rationale: [
        "Use the decision framework in each stage to avoid one-path bias.",
        "Treat failure simulation findings as build blockers, not optional notes.",
        `Execute with ${modeGuide.modeLabel} priorities and guardrails to keep risk under control.`,
      ],
    },
    assumptions: [
      "One cross-functional team can deliver the first release slice.",
      "Managed cloud services are acceptable for launch speed.",
      "No hard deterministic latency requirement is specified beyond practical realtime expectations.",
    ],
  };

  return {
    ...draft,
    outputSections: buildStructuredSections(draft),
  };
}
