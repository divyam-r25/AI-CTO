import type { DecisionCard, RiskItem } from "@/lib/types";
import type {
  RiskOutput,
  RoadmapOutput,
  SkillRuntimeContext,
} from "@/lib/skills/contracts";
import { clamp, modeProfile, rpn } from "@/lib/skills/shared";

function buildRisks(context: SkillRuntimeContext): RiskItem[] {
  const profile = modeProfile(context.mode);

  const risks: RiskItem[] = [
    {
      category: "product",
      title: "Weak differentiation against incumbents",
      mitigationOwner: "Product Lead",
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
      mitigationOwner: "Engineering Lead",
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
      mitigationOwner: "Founder/PM",
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

  if (context.flags.hasAI) {
    risks.push({
      category: "technical",
      title: "Model dependency and quality drift",
      mitigationOwner: "ML Platform Lead",
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

  if (context.flags.hasRealtime) {
    risks.push({
      category: "technical",
      title: "Realtime channel instability",
      mitigationOwner: "Backend Lead",
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

  if (context.flags.hasCompliance || context.mode === "enterprise") {
    risks.push({
      category: "compliance",
      title: "Data-governance and compliance exposure",
      mitigationOwner: "Security Lead",
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

function riskDecisions(context: SkillRuntimeContext): DecisionCard[] {
  const cards: DecisionCard[] = [
    {
      stage: "risk-mitigation",
      title: "Primary Risk Mitigation Decision",
      context: "Preventing predictable launch failure",
      evidenceIds: ["E2", "E3", "E4"],
      evidenceSummary:
        context.domain === "fintech" || context.domain === "regulated"
          ? "Compliance-sensitive PRD language and audit expectations require mitigation before scale."
          : "The PRD's broadness and cost/reliability cues indicate mitigation must protect the wedge and unit economics.",
      chosen: context.flags.hasDifferentiationSignals
        ? "Set reliability and margin gates before acquisition scale"
        : "Fix differentiation before adding feature breadth",
      why: context.flags.hasDifferentiationSignals
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
  ];

  if (context.flags.hasRealtime || context.flags.hasCompliance) {
    cards.push({
      stage: "risk-mitigation",
      title: "Release Gate Decision",
      context: "Deciding what blocks launch",
      evidenceIds: ["E1", "E5", "E6"],
      chosen:
        context.flags.hasCompliance || context.mode === "enterprise"
          ? "Compliance and audit controls are mandatory launch gates"
          : "Realtime reliability SLOs are mandatory launch gates",
      why:
        context.flags.hasCompliance || context.mode === "enterprise"
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

  if (context.domain === "fintech") {
    cards.push({
      stage: "risk-mitigation",
      title: "FinTech Control Decision",
      context: "Fraud, ledger safety, and regulatory posture",
      evidenceIds: ["E1", "E4", "E6"],
      evidenceSummary: "FinTech products require explicit audit trails and controls before customer-facing growth.",
      chosen: "Make auditability and policy enforcement launch blockers",
      why: [
        "Financial workflows fail catastrophically when controls are weak",
        "Retrofit compliance is usually more expensive than doing it correctly upfront",
      ],
      alternatives: [
        {
          option: "Move fast and add compliance later",
          pros: ["Faster early demo cycle", "Less upfront process overhead"],
          cons: ["High regulatory and trust risk", "Hard to reverse after data is live"],
        },
        {
          option: "Front-load policy and audit controls",
          pros: ["Lower existential risk", "More credible enterprise/compliance story"],
          cons: ["Slower initial build", "More coordination cost"],
        },
      ],
      comparisonSummary: "FinTech workloads should prefer control-first execution because trust failures are expensive and hard to recover from.",
    });
  }

  return cards;
}

export function runRiskSimulationSkill(
  context: SkillRuntimeContext,
  roadmap: RoadmapOutput,
): RiskOutput {
  const risks = buildRisks(context);
  const primaryFailureReason = context.flags.hasDifferentiationSignals
    ? "Margins and reliability collapse during growth because controls were added too late."
    : "No defensible wedge leads to commodity competition before retention is established.";

  const domainFailureReason =
    context.domain === "fintech"
      ? "Regulatory and audit controls were not proven before user funds or sensitive transactions were exposed."
      : context.domain === "regulated"
        ? "Compliance posture was treated as a follow-up instead of a launch requirement."
        : primaryFailureReason;

  const narrativePrefix =
    context.honestyMode === "brutal"
      ? "Brutal honesty mode: assume this fails unless wedge, reliability, and margins are solved before growth."
      : "Failure simulation: growth pressure exposes weak assumptions on differentiation, reliability, and cost.";

  const challengeSummary =
    context.honestyMode === "brutal"
      ? [
          "Current plan is one pricing change away from margin pain if routing controls are weak.",
          "Without a hard wedge, this risks becoming a commodity feature race.",
          "If reliability gates are optional, users will churn before roadmap gains land.",
        ]
      : [
          "Differentiate one core workflow before broad feature expansion.",
          "Use launch gates for reliability and unit economics, not only velocity.",
          "Review weakest assumptions weekly during the first month after launch.",
        ];

  return {
    risks,
    failureSimulation: {
      narrative: `${narrativePrefix} Scaling before proving wedge quality and controlling reliability/cost will produce churn and margin erosion in parallel. Planned phases in scope: ${roadmap.roadmap.length}. Domain risk focus: ${context.domainGuide.domainLabel}.`,
      primaryFailureReason: domainFailureReason,
      likelyFailurePoints: [
        "Acquisition spend scales faster than retention quality",
        "Cost per active user rises above monetization capacity",
        "Incident rate increases as complexity grows without gates",
        ...(context.domain === "fintech"
          ? ["Audit or fraud controls fail under transaction pressure"]
          : context.domain === "regulated"
            ? ["Retention or access policies are insufficient for compliance review"]
            : []),
      ],
      weakestAssumptions: [
        "Users will switch without a clear, measurable ROI wedge",
        "Infrastructure and model costs will scale linearly",
        "Reliability can be fixed post-launch without trust damage",
        ...(context.domain === "fintech"
          ? ["Policy enforcement can be retrofitted after launch"]
          : context.domain === "regulated"
            ? ["Operational compliance can be verified late in the cycle"]
            : []),
      ],
      pivots: [
        "Focus on one vertical workflow and prove ROI before broad rollout",
        "Shift from generic feature breadth to automation around one recurring pain",
        "Monetize premium outcomes rather than raw usage volume",
        ...(context.domain === "fintech"
          ? ["Narrow to read-only or advisory mode until controls are proven"]
          : context.domain === "regulated"
            ? ["Reduce scope to compliance-safe workflows and add audit gates"]
            : []),
      ],
      preBuildChanges: [
        "Define one non-negotiable differentiator and release metric",
        "Set explicit cost-per-active-user and reliability thresholds",
        "Add fallback, caching, and gate checks before scaling traffic",
        ...(context.domain === "fintech" || context.domain === "regulated"
          ? ["Add audit logging, policy review, and data retention gates before launch"]
          : []),
      ],
    },
    riskDecisions: riskDecisions(context),
    challengeSummary,
  };
}
