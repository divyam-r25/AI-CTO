import type { AnalysisResult, AnalyzeRequest, DecisionCard, ReadinessGate } from "@/lib/types";
import { runCostEstimationSkill } from "@/lib/skills/cost-estimation";
import { runPrdAnalysisSkill } from "@/lib/skills/prd-analysis";
import { runRiskSimulationSkill } from "@/lib/skills/risk-simulation";
import { createPlanSnapshot, runSelfCritiqueSkill } from "@/lib/skills/self-critique";
import { clamp, createSkillRuntimeContext } from "@/lib/skills/shared";
import { runSystemDesignSkill } from "@/lib/skills/system-design";
import { runRoadmapGeneratorSkill } from "@/lib/skills/roadmap-generator";

function formatDecision(decision: DecisionCard): string[] {
  const [first, second] = decision.alternatives;
  return [
    `- [${decision.stage}] ${decision.title}`,
    `  Context: ${decision.context}`,
    `  Evidence: ${decision.evidenceIds.join(", ") || "none"}`,
    `  Option 1: ${first.option} | Pros: ${first.pros.join("; ")} | Cons: ${first.cons.join("; ")}`,
    `  Option 2: ${second.option} | Pros: ${second.pros.join("; ")} | Cons: ${second.cons.join("; ")}`,
    `  Comparison: ${decision.comparisonSummary}`,
    `  Chosen: ${decision.chosen}`,
    `  Why: ${decision.why.join("; ")}`,
  ];
}

function buildReadiness(result: Omit<AnalysisResult, "outputSections">): {
  readinessScore: AnalysisResult["readinessScore"];
  blockingIssues: string[];
} {
  const gates: ReadinessGate[] = [];
  const blockingIssues: string[] = [];
  const topRisk = [...result.risks].sort((a, b) => b.rpn - a.rpn)[0];
  const weakAssumptions = result.assumptionTracker.filter((item) => item.confidence < 0.6);
  const missingMitigationOwner = result.risks.some(
    (risk) => risk.rpn >= 45 && (risk.mitigationOwner.trim().length === 0 || risk.mitigation.length === 0),
  );

  gates.push({
    name: "Differentiation gate",
    passed: result.ideaScore.uniqueness >= 60,
    reason:
      result.ideaScore.uniqueness >= 60
        ? "Uniqueness score is strong enough for launch confidence."
        : "Uniqueness score is weak; define a tighter wedge before scaling.",
  });

  gates.push({
    name: "Risk concentration gate",
    passed: !topRisk || topRisk.rpn < 55,
    reason:
      !topRisk || topRisk.rpn < 55
        ? "Top risk RPN is within acceptable threshold."
        : `Top risk "${topRisk.title}" has RPN ${topRisk.rpn}, which is above launch threshold.`,
  });

  gates.push({
    name: "Mitigation ownership gate",
    passed: !missingMitigationOwner,
    reason: !missingMitigationOwner
      ? "High-priority risks include mitigation ownership."
      : "At least one high-priority risk lacks mitigation ownership.",
  });

  gates.push({
    name: "Assumption confidence gate",
    passed: weakAssumptions.length <= 1,
    reason:
      weakAssumptions.length <= 1
        ? "Assumption confidence is acceptable."
        : `${weakAssumptions.length} assumptions are low-confidence and require validation.`,
  });

  for (const gate of gates) {
    if (!gate.passed) {
      blockingIssues.push(gate.reason);
    }
  }

  const passedCount = gates.filter((gate) => gate.passed).length;
  const score = Math.round((passedCount / gates.length) * 100);
  const verdict = passedCount === gates.length ? "go" : "no-go";

  return {
    readinessScore: {
      score,
      verdict,
      gates,
    },
    blockingIssues,
  };
}

function buildStructuredSections(result: Omit<AnalysisResult, "outputSections">): AnalysisResult["outputSections"] {
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
      "Evidence Layer",
      ...result.evidence.map((item) => `- ${item.id} [${item.category}] ${item.text} (confidence ${item.confidence})`),
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
          `- ${risk.title} [${risk.category}] RPN ${risk.rpn}. Owner: ${risk.mitigationOwner}. Signals: ${risk.warningSignals.join("; ")}. Mitigation: ${risk.mitigation.join("; ")}`,
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
      "Uncertainty flags:",
      ...(result.uncertaintyFlags.length > 0
        ? result.uncertaintyFlags.map((item) => `- ${item}`)
        : ["- none"]),
    ].join("\n"),
    improvements: [
      "# 💡 Improvements",
      `- Final Verdict: ${result.recommendation.verdict}`,
      `- Confidence: ${result.recommendation.confidence}%`,
      `- Readiness Score: ${result.readinessScore.score}/100 (${result.readinessScore.verdict})`,
      `- Fallback used: ${result.fallbackUsed ? "yes" : "no"}`,
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
      "",
      "Assumption Tracker",
      ...result.assumptionTracker.map(
        (item) =>
          `- ${item.id}: ${item.statement} | confidence ${item.confidence} | owner ${item.owner} | task ${item.validationTask} | due ${item.dueDate} | status ${item.status}`,
      ),
      "",
      "Self-Critique Loop (Initial -> Critique -> Revised)",
      `- Initial: verdict ${result.selfCritique.initial.verdict}, confidence ${result.selfCritique.initial.confidence}%`,
      ...result.selfCritique.critiquePoints.map((item) => `- Critique: ${item}`),
      ...result.selfCritique.improvementsApplied.map((item) => `- Improvement Applied: ${item}`),
      `- Revised: verdict ${result.selfCritique.revised.verdict}, confidence ${result.selfCritique.revised.confidence}%`,
      "",
      "Investment Perspective ($10k)",
      `- Verdict: ${result.investmentPerspective.verdict}`,
      ...result.investmentPerspective.rationale.map((item) => `- ${item}`),
      "",
      "MVP vs Scale Plan",
      ...result.executionPlan.mvp.map((item) => `- MVP: ${item}`),
      ...result.executionPlan.scale.map((item) => `- Scale: ${item}`),
      "",
      "Blocking issues before build",
      ...(result.blockingIssues.length > 0
        ? result.blockingIssues.map((item) => `- ${item}`)
        : ["- none"]),
      "",
      ...result.challengeSummary.map((item) => `- ${item}`),
      "",
      `Mode Reminder: ${result.modeGuide.modeLabel} priorities should drive execution discipline.`,
    ].join("\n"),
  };
}

export function refreshOutputSections(result: AnalysisResult): AnalysisResult {
  const { outputSections: _ignored, ...withoutSections } = result;
  void _ignored;
  return {
    ...withoutSections,
    outputSections: buildStructuredSections(withoutSections),
  };
}

export function analyzePrd({ prd, mode, honestyMode }: AnalyzeRequest): AnalysisResult {
  const context = createSkillRuntimeContext({ prd, mode, honestyMode });

  const analysisOutput = runPrdAnalysisSkill(context);
  const architectureOutput = runSystemDesignSkill(context, analysisOutput);
  const roadmapOutput = runRoadmapGeneratorSkill(context, architectureOutput);
  const riskOutput = runRiskSimulationSkill(context, roadmapOutput);
  const costOutput = runCostEstimationSkill(context, riskOutput);

  const decisions = [
    ...analysisOutput.analysisDecisions,
    ...architectureOutput.architectureDecisions,
    ...roadmapOutput.roadmapDecisions,
    ...riskOutput.riskDecisions,
    ...costOutput.costDecisions,
  ];

  const initialSnapshot = createPlanSnapshot({
    verdict: costOutput.recommendation.verdict,
    confidence: costOutput.recommendation.confidence,
    primaryFailureReason: riskOutput.failureSimulation.primaryFailureReason,
    risks: riskOutput.risks,
    decisions,
  });

  const selfCritique = runSelfCritiqueSkill(
    context,
    riskOutput,
    costOutput,
    analysisOutput.assumptionTracker,
  );
  const revisedConfidence = clamp(
    costOutput.recommendation.confidence - selfCritique.confidencePenalty,
    35,
    95,
  );

  const revisedFailureSimulation = {
    ...riskOutput.failureSimulation,
    primaryFailureReason: selfCritique.revisedFailureReason,
    narrative: `${riskOutput.failureSimulation.narrative} Self-critique pass tightened this plan before final output.`,
  };

  let revisedRecommendation: AnalysisResult["recommendation"] = {
    verdict: selfCritique.revisedVerdict,
    confidence: revisedConfidence,
    rationale: [
      ...costOutput.recommendation.rationale,
      "Self-critique pass forced additional realism before final recommendation.",
    ],
  };

  const revisedChallengeSummary = [
    ...riskOutput.challengeSummary,
    ...selfCritique.critiquePoints.map((point) => `Self-critique: ${point}`),
  ];

  const revisedInvestmentPerspective =
    selfCritique.revisedVerdict === "research-first"
      ? {
          ...costOutput.investmentPerspective,
          verdict: "do-not-invest-yet" as const,
          rationale: [
            ...costOutput.investmentPerspective.rationale,
            "Self-critique indicates unresolved risk concentration before investment.",
          ],
        }
      : selfCritique.revisedVerdict === "build-with-pivot"
        ? {
            ...costOutput.investmentPerspective,
            verdict: "invest-with-conditions" as const,
            rationale: [
              ...costOutput.investmentPerspective.rationale,
              "Funding is conditional on proving wedge metrics and risk gates.",
            ],
          }
        : costOutput.investmentPerspective;

  const revisedSnapshot = createPlanSnapshot({
    verdict: revisedRecommendation.verdict,
    confidence: revisedRecommendation.confidence,
    primaryFailureReason: revisedFailureSimulation.primaryFailureReason,
    risks: riskOutput.risks,
    decisions,
  });

  const baseDraft: Omit<AnalysisResult, "outputSections"> = {
    productName: context.productName,
    mode,
    honestyMode,
    modeGuide: context.modeGuide,
    skillChain: ["PRD", "Analysis", "Architecture", "Roadmap", "Risks", "Cost"],
    executiveSummary:
      "This PRD can ship, but success depends on enforced decision discipline, failure simulation, and mode-aware execution.",
    architecture: architectureOutput.architecture,
    techStack: architectureOutput.techStack,
    evidence: analysisOutput.evidence,
    assumptionTracker: analysisOutput.assumptionTracker,
    folderStructure: architectureOutput.folderStructure,
    roadmap: roadmapOutput.roadmap,
    risks: riskOutput.risks,
    failureSimulation: revisedFailureSimulation,
    costs: costOutput.costs,
    alternatives: architectureOutput.alternatives,
    decisions,
    ideaScore: costOutput.ideaScore,
    techComparator: architectureOutput.techComparator,
    costOptimizer: costOutput.costOptimizer,
    executionPlan: roadmapOutput.executionPlan,
    investmentPerspective: revisedInvestmentPerspective,
    selfCritique: {
      initial: initialSnapshot,
      critiquePoints: selfCritique.critiquePoints,
      improvementsApplied: selfCritique.improvementsApplied,
      revised: revisedSnapshot,
    },
    readinessScore: {
      score: 0,
      verdict: "no-go",
      gates: [],
    },
    uncertaintyFlags: [],
    blockingIssues: [],
    fallbackUsed: false,
    challengeSummary: revisedChallengeSummary,
    recommendation: revisedRecommendation,
    assumptions: analysisOutput.assumptions,
  };

  const readiness = buildReadiness(baseDraft);
  const blockingIssues = [...readiness.blockingIssues];

  if (revisedRecommendation.verdict === "build-now" && blockingIssues.length > 0) {
    revisedRecommendation = {
      ...revisedRecommendation,
      verdict: "build-with-pivot",
      rationale: [
        ...revisedRecommendation.rationale,
        "Recommendation downgraded due to blocking launch issues.",
      ],
    };
  }

  const draft: Omit<AnalysisResult, "outputSections"> = {
    ...baseDraft,
    readinessScore: readiness.readinessScore,
    blockingIssues,
    recommendation: revisedRecommendation,
  };

  return {
    ...draft,
    outputSections: buildStructuredSections(draft),
  };
}
