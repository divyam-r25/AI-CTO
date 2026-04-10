import type {
  AlternativeApproach,
  DecisionCard,
  TechStackComparator,
} from "@/lib/types";
import type {
  PrdAnalysisOutput,
  SkillRuntimeContext,
  SystemDesignOutput,
} from "@/lib/skills/contracts";

function architectureDecisions(
  context: SkillRuntimeContext,
  evidenceIds: string[],
): DecisionCard[] {
  const frontendDecision: DecisionCard = {
    stage: "architecture",
    title: "Frontend Platform Decision",
    context: "Delivery channel and user experience",
    evidenceIds: evidenceIds.slice(0, 2),
    evidenceSummary:
      context.domain === "marketplace"
        ? "Marketplace discovery and trust flows need a fast web surface with SEO and iteration speed."
        : context.domain === "internal-tools"
          ? "Internal tools benefit from the fastest path to operational workflows and admin surfaces."
          : "The PRD favors rapid delivery and a reusable front-end surface for the primary workflow.",
    chosen: context.flags.isMobileHeavy && context.mode === "beginner-startup" ? "Flutter" : "Next.js",
    why:
      context.flags.isMobileHeavy && context.mode === "beginner-startup"
        ? [
            "Mobile-heavy requirement benefits from native-like UX control",
            "Single codebase accelerates iOS and Android parity",
          ]
        : [
            "Web-first rollout improves discovery and launch speed",
            "Unified full-stack model reduces operational overhead",
          ],
    alternatives: [
      {
        option: "Next.js",
        pros: ["Fast web deployment and SEO", "Unified frontend/backend workflow"],
        cons: ["Less native mobile depth", "Advanced device interactions need extra work"],
      },
      {
        option: "Flutter",
        pros: ["Strong cross-platform mobile UX", "Better control for device features"],
        cons: ["Web SEO is weaker", "Backend and web integration overhead"],
      },
    ],
    comparisonSummary:
      "Choose Flutter only when native mobile UX is the primary differentiator; otherwise Next.js is faster to market.",
  };

  const dataDecision: DecisionCard = {
    stage: "architecture",
    title: "Data Platform Decision",
    context: "Speed vs control for backend data layer",
    evidenceIds: evidenceIds.slice(1, 4),
    evidenceSummary:
      context.domain === "fintech" || context.domain === "regulated"
        ? "Regulated and financial products need Postgres-style control and audit-ready data posture."
        : "The product needs a data layer that can be managed quickly and migrated cleanly later.",
    chosen: context.mode === "beginner-startup" ? "Firebase" : "Supabase",
    why:
      context.mode === "beginner-startup"
        ? [
            "Fastest path for MVP primitives and auth",
            "Minimal ops burden for very small teams",
          ]
        : [
            "Postgres compatibility improves long-term query flexibility",
            "Better migration path and tooling for scale",
          ],
    alternatives: [
      {
        option: "Firebase",
        pros: ["Fast setup", "Managed auth and realtime primitives"],
        cons: ["Relational query constraints", "Potential lock-in at growth stage"],
      },
      {
        option: "Supabase",
        pros: ["Postgres-native model", "Stronger portability and SQL ecosystem"],
        cons: ["Needs schema discipline", "Realtime tuning required at high scale"],
      },
    ],
    comparisonSummary:
      "Firebase wins for immediate velocity; Supabase wins for scale portability and data control.",
  };

  const cards = [frontendDecision, dataDecision];

  if (context.flags.hasAI) {
    cards.push({
      stage: "architecture",
      title: "AI Provider Strategy Decision",
      context: "Model reliability and vendor risk posture",
      evidenceIds: evidenceIds.slice(0, 3),
      evidenceSummary: "PRD references AI behavior directly, so provider routing and fallback quality are strategic decisions.",
      chosen: "Hybrid provider strategy",
      why: [
        "Protects against single-vendor outages and abrupt pricing shifts",
        "Enables quality-latency-cost routing policies by request class",
      ],
      alternatives: [
        {
          option: "Single API provider",
          pros: ["Fastest initial integration", "Lowest ops complexity"],
          cons: ["High lock-in and outage exposure", "Lower pricing leverage"],
        },
        {
          option: "Self-hosted open model stack",
          pros: ["Potential long-run savings", "More data control"],
          cons: ["High ops burden", "Model maintenance complexity"],
        },
      ],
      comparisonSummary:
        "Hybrid routing balances speed, resilience, and economics better than single-path strategies.",
    });
  }

  return cards;
}

function alternatives(context: SkillRuntimeContext): AlternativeApproach[] {
  const base: AlternativeApproach[] = [
    {
      name: "Fast Validation Stack",
      bestFor: "Teams optimizing for earliest market signal",
      tradeoffs: [
        "Shortest path to launch",
        "Higher managed-service lock-in risk",
        "Migration complexity if growth arrives quickly",
      ],
    },
    {
      name: "Balanced Scale Stack",
      bestFor: "Teams expecting growth in 1-2 quarters",
      tradeoffs: [
        "Slightly slower setup",
        "Better portability and observability",
        "Improved long-term cost control",
      ],
    },
  ];

  if (context.mode === "enterprise") {
    base.push({
      name: "Compliance-First Platform",
      bestFor: "Regulated environments with strict audit requirements",
      tradeoffs: [
        "Highest setup and governance overhead",
        "Best auditability and policy enforcement",
        "Higher baseline cost with lower compliance risk",
      ],
    });
  }

  return base;
}

function techComparator(context: SkillRuntimeContext): TechStackComparator[] {
  return [
    {
      dimension: "Frontend Platform",
      optionA: "Next.js",
      optionB: "Flutter",
      verdict: context.flags.isMobileHeavy && context.mode === "beginner-startup" ? "Flutter" : "Next.js",
      rationale:
        context.flags.isMobileHeavy && context.mode === "beginner-startup"
          ? "Mobile-native UX is central at MVP, so Flutter offers stronger cross-platform control."
          : "Web-first launch speed, SEO, and unified full-stack delivery favor Next.js.",
    },
    {
      dimension: "Backend Platform",
      optionA: "Firebase",
      optionB: "Supabase",
      verdict: context.mode === "beginner-startup" ? "Firebase" : "Supabase",
      rationale:
        context.mode === "beginner-startup"
          ? "For early MVP speed with minimal ops, Firebase is faster."
          : "For scale-readiness and SQL portability, Supabase offers better flexibility.",
    },
  ];
}

export function runSystemDesignSkill(
  context: SkillRuntimeContext,
  analysis: PrdAnalysisOutput,
): SystemDesignOutput {
  const frontendIsFlutter = context.flags.isMobileHeavy && context.mode === "beginner-startup";
  const dataIsFirebase = context.mode === "beginner-startup";
  const domainAdjustments = {
    saas: "subscription analytics and onboarding funnels",
    marketplace: "listing search, trust, and supply-demand balance",
    "internal-tools": "admin workflows and operational efficiency",
    fintech: "ledger safety and policy enforcement",
    regulated: "auditability and access control",
    "ai-tool": "model routing and latency cost controls",
  }[context.domain];

  return {
    architecture: {
      overview:
        `The system uses a modular product surface, policy-driven APIs, and observable execution paths designed to force explicit tradeoff decisions before scale. Domain focus: ${context.domainGuide.domainLabel} (${domainAdjustments}). Analysis assumptions tracked: ${analysis.assumptions.length}.`,
      frontend: frontendIsFlutter
        ? "Flutter mobile app for core experience with a lightweight web shell for acquisition and onboarding"
        : "Next.js web-first app with responsive UX and product APIs in a unified deployable surface",
      backend:
        context.mode === "enterprise"
          ? "Service-layer API with policy enforcement, async workers, and audit-friendly domain boundaries"
          : context.flags.hasRealtime
            ? "Typed Node APIs with queue-backed workers and realtime delivery safeguards"
            : "Typed Node APIs with async job orchestration for heavy workflows",
      data: dataIsFirebase
        ? "Firebase-managed data primitives for MVP speed, with migration checkpoints defined early"
        : context.flags.isB2B || context.mode === "enterprise"
          ? "PostgreSQL with Redis acceleration and governance-ready retention/audit controls"
          : "Supabase Postgres foundation with cache layer and analytics snapshots",
      integrations: context.flags.hasAI
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
    architectureDecisions: architectureDecisions(context, analysis.evidence.map((item) => item.id)),
    alternatives: alternatives(context),
    techComparator: techComparator(context),
  };
}
