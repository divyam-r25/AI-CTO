import type { DecisionCard } from "@/lib/types";
import type { PrdAnalysisOutput, SkillRuntimeContext } from "@/lib/skills/contracts";

function buildAnalysisDecision(context: SkillRuntimeContext): DecisionCard {
  return {
    stage: "analysis",
    title: "Market Wedge Decision",
    context: "Positioning and launch focus",
    chosen: context.flags.hasDifferentiationSignals
      ? "Double down on the existing niche wedge"
      : "Narrow to one vertical workflow before broad launch",
    why: context.flags.hasDifferentiationSignals
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
  };
}

export function runPrdAnalysisSkill(context: SkillRuntimeContext): PrdAnalysisOutput {
  const targetUsers = context.flags.isB2B
    ? ["Operations teams", "Team admins", "Business users with workflow pain"]
    : ["Students", "Independent professionals", "Small-business operators"];

  const mustHaveFeatures = [
    "Primary end-to-end workflow for target segment",
    "Decision framework artifacts with explicit tradeoffs",
    "Operational telemetry and failure guardrails",
  ];

  if (context.flags.hasAI) {
    mustHaveFeatures.push("AI quality gates with fallback behavior");
  }

  if (context.flags.hasRealtime) {
    mustHaveFeatures.push("Realtime delivery path with retry and backpressure safety");
  }

  const nonFunctionalRequirements = [
    "P95 latency monitoring and alerting",
    "Cost-per-active-user tracking",
    "Reliability and rollback readiness",
  ];

  if (context.flags.hasCompliance || context.mode === "enterprise") {
    nonFunctionalRequirements.push("Data classification, retention, and auditability");
  }

  return {
    problemStatement:
      "Convert PRD intent into a decision-ready plan that is defensible on differentiation, reliability, and unit economics.",
    targetUsers,
    mustHaveFeatures,
    nonFunctionalRequirements,
    openQuestions: [
      "What exact metric defines a successful wedge for the first 30 days?",
      "What monthly spend threshold must not be exceeded pre-PMF?",
      "Which reliability SLO is non-negotiable before launch?",
    ],
    assumptions: [
      "A cross-functional team can deliver first release scope.",
      "Managed services are acceptable for initial launch speed.",
      "Operational metrics will be reviewed weekly from day one.",
    ],
    analysisDecisions: [buildAnalysisDecision(context)],
  };
}
