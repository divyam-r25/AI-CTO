import type { AssumptionItem, DecisionCard, EvidenceItem } from "@/lib/types";
import type { PrdAnalysisOutput, SkillRuntimeContext } from "@/lib/skills/contracts";

function extractEvidence(context: SkillRuntimeContext, assumptions: string[]): EvidenceItem[] {
  const evidence: EvidenceItem[] = [];
  const lines = context.prd
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let index = 1;

  for (const line of lines) {
    if (line.startsWith("-") || line.toLowerCase().startsWith("requirements")) {
      evidence.push({
        id: `E${index}`,
        category: "requirement",
        text: line.replace(/^-+\s*/, ""),
        confidence: 0.84,
      });
      index += 1;
    }
  }

  if (context.flags.hasCompliance) {
    evidence.push({
      id: `E${index}`,
      category: "constraint",
      text: "Compliance-sensitive language detected in PRD.",
      confidence: 0.8,
    });
    index += 1;
  }

  evidence.push({
    id: `E${index}`,
    category: "risk",
    text: "Differentiation risk inferred from broad problem framing.",
    confidence: context.flags.hasDifferentiationSignals ? 0.62 : 0.86,
  });
  index += 1;

  assumptions.forEach((assumption) => {
    evidence.push({
      id: `E${index}`,
      category: "assumption",
      text: assumption,
      confidence: 0.66,
    });
    index += 1;
  });

  return evidence;
}

function buildAssumptionTracker(assumptions: string[]): AssumptionItem[] {
  const owners = ["Product Lead", "Engineering Lead", "Founder/PM"];
  const today = new Date();

  return assumptions.map((statement, idx) => {
    const dueDate = new Date(today.getTime() + (idx + 7) * 24 * 60 * 60 * 1000);
    return {
      id: `A${idx + 1}`,
      statement,
      confidence: 0.63 - idx * 0.05,
      owner: owners[idx % owners.length],
      validationTask: `Validate assumption ${idx + 1} with an experiment or stakeholder interview`,
      dueDate: dueDate.toISOString().slice(0, 10),
      status: "pending",
    };
  });
}

function buildAnalysisDecision(context: SkillRuntimeContext, evidenceIds: string[]): DecisionCard {
  return {
    stage: "analysis",
    title: "Market Wedge Decision",
    context: "Positioning and launch focus",
    evidenceIds,
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

  const assumptions = [
    "A cross-functional team can deliver first release scope.",
    "Managed services are acceptable for initial launch speed.",
    "Operational metrics will be reviewed weekly from day one.",
  ];

  const evidence = extractEvidence(context, assumptions);
  const assumptionTracker = buildAssumptionTracker(assumptions);

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
    assumptions,
    evidence,
    assumptionTracker,
    analysisDecisions: [buildAnalysisDecision(context, evidence.slice(0, 3).map((item) => item.id))],
  };
}
