import assert from "node:assert/strict";
import test from "node:test";
import { analyzePrd } from "@/lib/analysis-engine";

const SAMPLE_PRD = `# AI Meeting Copilot
Build a meeting assistant for startup teams.

Requirements:
- summarize meetings with AI
- realtime notes collaboration
- mobile support
- low latency for live updates
- cost-efficient scaling
`;

test("decision framework contract: each decision has 2 alternatives + comparison + chosen + why", () => {
  const result = analyzePrd({
    prd: SAMPLE_PRD,
    mode: "scalable-startup",
    honestyMode: "brutal",
    writeFiles: false,
  });

  assert.ok(result.decisions.length >= 5, "expected at least five decision cards");

  for (const decision of result.decisions) {
    assert.equal(decision.alternatives.length, 2, `${decision.title} must include exactly two alternatives`);
    assert.ok(decision.comparisonSummary.trim().length > 0, `${decision.title} needs comparison summary`);
    assert.ok(decision.chosen.trim().length > 0, `${decision.title} needs chosen option`);
    assert.ok(decision.why.length > 0, `${decision.title} needs why points`);
  }
});

test("structured output contract: all required sections exist in expected order", () => {
  const result = analyzePrd({
    prd: SAMPLE_PRD,
    mode: "enterprise",
    honestyMode: "standard",
    writeFiles: false,
  });

  assert.ok(result.outputSections.architecture.startsWith("# 🏗️ Architecture"));
  assert.ok(result.outputSections.folderStructure.startsWith("# 📁 Folder Structure"));
  assert.ok(result.outputSections.roadmap.startsWith("# 🗺️ Roadmap"));
  assert.ok(result.outputSections.risks.startsWith("# ⚠️ Risks"));
  assert.ok(result.outputSections.failurePrediction.startsWith("# 💀 Failure Prediction"));
  assert.ok(result.outputSections.improvements.startsWith("# 💡 Improvements"));
});

test("multi-pass critique contract: includes initial and revised plan snapshots", () => {
  const result = analyzePrd({
    prd: SAMPLE_PRD,
    mode: "beginner-startup",
    honestyMode: "brutal",
    writeFiles: false,
  });

  assert.ok(result.selfCritique.critiquePoints.length > 0, "expected critique points");
  assert.ok(result.selfCritique.improvementsApplied.length > 0, "expected applied improvements");
  assert.ok(result.selfCritique.initial.verdict.length > 0, "missing initial verdict");
  assert.ok(result.selfCritique.revised.verdict.length > 0, "missing revised verdict");
  assert.equal(result.skillChain.join(" -> "), "PRD -> Analysis -> Architecture -> Roadmap -> Risks -> Cost");

  assert.ok(
    result.outputSections.improvements.includes("Self-Critique Loop"),
    "improvements section should include self-critique",
  );
  assert.ok(
    result.outputSections.improvements.includes("Investment Perspective"),
    "improvements section should include investment perspective",
  );
  assert.ok(
    result.outputSections.improvements.includes("MVP vs Scale Plan"),
    "improvements section should include MVP vs Scale plan",
  );
});
