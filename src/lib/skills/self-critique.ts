import type { DecisionCard, PlanSnapshot } from "@/lib/types";
import type {
  CostOutput,
  RiskOutput,
  SelfCritiqueOutput,
  SkillRuntimeContext,
} from "@/lib/skills/contracts";

function averageRpn(risks: RiskOutput["risks"]): number {
  if (risks.length === 0) {
    return 0;
  }
  return risks.reduce((sum, risk) => sum + risk.rpn, 0) / risks.length;
}

function topRiskTitles(risks: RiskOutput["risks"]): string[] {
  return [...risks].sort((a, b) => b.rpn - a.rpn).slice(0, 3).map((risk) => risk.title);
}

function topDecisionTitles(decisions: DecisionCard[]): string[] {
  return decisions.slice(0, 3).map((decision) => decision.title);
}

export function createPlanSnapshot(params: {
  verdict: "build-now" | "build-with-pivot" | "research-first";
  confidence: number;
  primaryFailureReason: string;
  risks: RiskOutput["risks"];
  decisions: DecisionCard[];
}): PlanSnapshot {
  return {
    verdict: params.verdict,
    confidence: params.confidence,
    primaryFailureReason: params.primaryFailureReason,
    topRisks: topRiskTitles(params.risks),
    topDecisions: topDecisionTitles(params.decisions),
  };
}

export function runSelfCritiqueSkill(
  context: SkillRuntimeContext,
  riskOutput: RiskOutput,
  costOutput: CostOutput,
): SelfCritiqueOutput {
  const critiquePoints: string[] = [];
  const improvementsApplied: string[] = [];

  const rpnAverage = averageRpn(riskOutput.risks);

  if (costOutput.ideaScore.uniqueness < 55) {
    critiquePoints.push(
      "Plan still risks commodity positioning; differentiation is not yet strong enough to defend margin.",
    );
    improvementsApplied.push(
      "Moved recommendation toward pivot-first execution and tightened wedge requirement.",
    );
  }

  if (rpnAverage >= 48) {
    critiquePoints.push(
      "Risk concentration is high; release should be blocked until highest RPN risks have explicit owners and gates.",
    );
    improvementsApplied.push(
      "Lowered confidence and reinforced gate-based launch policy for top risks.",
    );
  }

  if (context.flags.hasAI && !riskOutput.risks.some((risk) => risk.title.includes("Model"))) {
    critiquePoints.push("AI dependency risk is under-modeled relative to product exposure.");
    improvementsApplied.push("Strengthened model fallback and quality-routing expectations.");
  }

  if (context.mode === "enterprise" && !context.flags.hasCompliance) {
    critiquePoints.push(
      "Enterprise mode without explicit compliance language in PRD is a hidden assumption risk.",
    );
    improvementsApplied.push(
      "Forced compliance and audit controls into pre-launch gating criteria.",
    );
  }

  if (critiquePoints.length === 0) {
    critiquePoints.push("Plan quality is solid, but confidence should still be tempered by market uncertainty.");
    improvementsApplied.push("Applied a modest confidence haircut to maintain realistic execution posture.");
  }

  const confidencePenalty = Math.min(12, 4 + critiquePoints.length * 2);

  let revisedVerdict = costOutput.recommendation.verdict;
  if (costOutput.ideaScore.uniqueness < 55 && revisedVerdict === "build-now") {
    revisedVerdict = "build-with-pivot";
  }

  if (rpnAverage >= 52 && revisedVerdict !== "research-first") {
    revisedVerdict = "research-first";
  }

  const revisedFailureReason =
    critiquePoints.length > 0
      ? `${riskOutput.failureSimulation.primaryFailureReason} Self-critique added: ${critiquePoints[0]}`
      : riskOutput.failureSimulation.primaryFailureReason;

  return {
    critiquePoints,
    improvementsApplied,
    revisedVerdict,
    confidencePenalty,
    revisedFailureReason,
  };
}
