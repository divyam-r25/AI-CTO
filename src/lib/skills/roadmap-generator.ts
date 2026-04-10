import type { DecisionCard, RoadmapPhase } from "@/lib/types";
import type {
  RoadmapOutput,
  SkillRuntimeContext,
  SystemDesignOutput,
} from "@/lib/skills/contracts";
import { modeProfile } from "@/lib/skills/shared";

function buildRoadmap(
  context: SkillRuntimeContext,
  architecture: SystemDesignOutput,
): RoadmapPhase[] {
  const profile = modeProfile(context.mode);
  const compact = context.mode === "beginner-startup";
  const enterprise = context.mode === "enterprise";

  const phases: RoadmapPhase[] = [
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
        `Frontend path: ${architecture.architecture.frontend}`,
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

  if (context.flags.hasAI) {
    phases[2].deliverables.push("Prompt quality evaluations and fallback behavior");
    phases[3].deliverables.push("Token budget thresholds and routing strategy");
  }

  if (context.flags.hasRealtime) {
    phases[2].deliverables.push("Realtime stream reliability tests");
    phases[3].deliverables.push("Backpressure controls and queue telemetry");
  }

  if (context.mode === "enterprise") {
    phases[1].deliverables.push("Compliance and security design review");
    phases[4].deliverables.push("Policy and audit sign-off");
  }

  return phases;
}

function roadmapDecision(context: SkillRuntimeContext): DecisionCard {
  return {
    stage: "roadmap",
    title: "Execution Sequencing Decision",
    context: "Roadmap order and critical path",
    chosen:
      context.mode === "enterprise"
        ? "Security/compliance gate before broad beta"
        : "Core value path first, infrastructure depth second",
    why:
      context.mode === "enterprise"
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
        cons: ["Reliability debt accumulates quickly", "Higher rework risk under growth pressure"],
      },
      {
        option: "Value path then targeted hardening",
        pros: ["Balanced speed and resilience", "Lower risk of late-stage architecture churn"],
        cons: ["Requires disciplined scope control", "Needs clear go/no-go gates"],
      },
    ],
    comparisonSummary:
      "Value-path-first with planned hardening is the most robust sequence for startup execution.",
  };
}

export function runRoadmapGeneratorSkill(
  context: SkillRuntimeContext,
  architecture: SystemDesignOutput,
): RoadmapOutput {
  return {
    roadmap: buildRoadmap(context, architecture),
    roadmapDecisions: [roadmapDecision(context)],
    executionPlan: {
      mvp: [
        "Deliver one wedge workflow end-to-end with usage tracking",
        "Ship essential reliability safeguards and fallback behavior",
        "Launch with explicit cost and latency thresholds",
      ],
      scale: [
        "Introduce queue workers and route-level cost policies",
        "Harden compliance, incident response, and observability depth",
        "Expand horizontally only after wedge metrics are stable",
      ],
    },
  };
}
