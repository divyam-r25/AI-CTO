import type { CostOptimizerItem, DecisionCard } from "@/lib/types";
import type { CostOutput, RiskOutput, SkillRuntimeContext } from "@/lib/skills/contracts";
import { clamp, modeProfile } from "@/lib/skills/shared";

function buildCosts(context: SkillRuntimeContext) {
  const profile = modeProfile(context.mode);
  const multiplier =
    context.mode === "enterprise" ? 1.4 : context.mode === "beginner-startup" ? 0.85 : 1;

  function scaleRange(range: [number, number]): string {
    const low = Math.round(range[0] * multiplier);
    const high = Math.round(range[1] * multiplier);
    return `$${low.toLocaleString()}-$${high.toLocaleString()}`;
  }

  const base = context.flags.hasAI
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

  const tiers = [
    {
      tier: "prototype" as const,
      usersPerMonth: "1,000-5,000",
      monthlyRangeUsd: scaleRange(base.prototype),
      topCostDriver: context.flags.hasAI ? "Inference/API usage" : "Managed platform baseline",
      notes: [profile.costBias, "Define spend alerts before opening public access"],
    },
    {
      tier: "early-traction" as const,
      usersPerMonth: "10,000-50,000",
      monthlyRangeUsd: scaleRange(base.traction),
      topCostDriver: context.flags.hasAI ? "Model traffic + egress" : "Autoscaling compute + storage",
      notes: [
        "Introduce request-level caching and quota policy",
        "Review cost per active user weekly",
      ],
    },
    {
      tier: "growth" as const,
      usersPerMonth: "100,000+",
      monthlyRangeUsd: scaleRange(base.growth),
      topCostDriver: context.flags.hasAI ? "Inference throughput" : "Data throughput and background jobs",
      notes: [
        "Re-evaluate provider mix and reserved capacity strategy",
        "Offload non-critical flows to asynchronous pipelines",
      ],
    },
  ];

  if (context.flags.hasRealtime) {
    tiers.forEach((tier) => {
      tier.notes.push("Reserve budget for realtime messaging and delivery guarantees");
    });
  }

  return tiers;
}

function buildCostOptimizer(context: SkillRuntimeContext): CostOptimizerItem[] {
  const items: CostOptimizerItem[] = [
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

  if (context.flags.hasAI) {
    items.push({
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

  if (context.mode === "enterprise") {
    items.push({
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

  return items;
}

function costDecision(context: SkillRuntimeContext): DecisionCard {
  return {
    stage: "cost",
    title: "Cost Control Strategy Decision",
    context: "Protecting margins as usage scales",
    chosen: context.flags.hasAI
      ? "Dynamic model routing by request value"
      : "Queue heavy workloads and cache read-heavy paths",
    why: context.flags.hasAI
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
        option: context.flags.hasAI ? "Single premium model for all traffic" : "Scale app instances only",
        pros: ["Simpler operations", "Lower initial engineering effort"],
        cons: ["Costs grow linearly with usage", "Margin and reliability risk under spikes"],
      },
      {
        option: context.flags.hasAI
          ? "Tiered routing across model providers"
          : "Queue + cache + right-sized workers",
        pros: ["Better marginal cost control", "Improved resilience under load"],
        cons: ["More policy and observability complexity", "Requires ongoing tuning"],
      },
    ],
    comparisonSummary:
      "Routing and queue strategies add complexity, but materially improve survivability at growth scale.",
  };
}

function selectVerdict(riskAverage: number, hasDifferentiationSignals: boolean) {
  if (riskAverage >= 54) {
    return "research-first" as const;
  }
  if (!hasDifferentiationSignals) {
    return "build-with-pivot" as const;
  }
  return "build-now" as const;
}

export function runCostEstimationSkill(
  context: SkillRuntimeContext,
  riskOutput: RiskOutput,
): CostOutput {
  const riskAverage =
    riskOutput.risks.reduce((sum, item) => sum + item.rpn, 0) / Math.max(riskOutput.risks.length, 1);

  const verdict = selectVerdict(riskAverage, context.flags.hasDifferentiationSignals);
  const baseConfidence = verdict === "build-now" ? 84 : verdict === "build-with-pivot" ? 72 : 60;
  const confidence = clamp(baseConfidence + modeProfile(context.mode).confidenceDelta, 45, 93);

  const ideaScore = {
    feasibility: clamp(
      88 - Math.round(riskAverage / 2) + (context.mode === "beginner-startup" ? 4 : 0),
      35,
      96,
    ),
    scalability: clamp(
      79 +
        (context.mode === "enterprise" ? 7 : context.mode === "scalable-startup" ? 4 : -4) -
        (context.flags.hasRealtime ? 5 : 0) -
        (context.flags.hasAI ? 4 : 0),
      35,
      95,
    ),
    uniqueness: clamp(context.flags.hasDifferentiationSignals ? 74 : 46, 30, 90),
    summary: context.flags.hasDifferentiationSignals
      ? "The idea is execution-sensitive but has a credible wedge if focus is maintained."
      : "Execution can be strong, but uniqueness is fragile until a sharper wedge is chosen.",
  };

  const investmentPerspective = {
    budgetUsd: 10000,
    verdict:
      verdict === "research-first"
        ? ("do-not-invest-yet" as const)
        : verdict === "build-with-pivot"
          ? ("invest-with-conditions" as const)
          : ("invest-now" as const),
    rationale:
      verdict === "research-first"
        ? [
            "Differentiation and economics are too uncertain for immediate capital deployment.",
            "Risk profile suggests validating assumptions before increasing spend.",
          ]
        : verdict === "build-with-pivot"
          ? [
              "Fund only if wedge and margin guardrails are locked before launch.",
              "Capital should be tied to explicit risk-reduction milestones.",
            ]
          : [
              "Plan is investable if reliability and cost thresholds are enforced as release gates.",
              "Wedge viability and unit economics should be monitored weekly.",
            ],
  };

  return {
    costs: buildCosts(context),
    costOptimizer: buildCostOptimizer(context),
    costDecisions: [costDecision(context)],
    ideaScore,
    recommendation: {
      verdict,
      confidence,
      rationale: [
        "Use decision framework outputs in each stage to avoid one-path bias.",
        "Treat failure simulation findings as build blockers, not optional notes.",
        `Execute with ${context.modeGuide.modeLabel} priorities and guardrails to control downside.`,
      ],
    },
    investmentPerspective,
  };
}
