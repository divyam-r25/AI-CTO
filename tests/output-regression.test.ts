import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";

process.env.AI_CTO_STORE_PATH = path.join(process.cwd(), ".data", `analysis-store.test.${process.pid}.json`);

import { analyzePrd } from "@/lib/analysis-engine";
import {
  compareAnalyses,
  fetchAnalysisHistoryPaged,
  submitAnalysisRequest,
} from "@/lib/runtime/analysis-service";

const SAMPLE_PRD_A = `# Team Incident Copilot
Build an AI assistant for engineering teams to triage incidents faster.

Requirements:
- detect incident patterns from logs
- suggest runbooks and responders
- low latency updates in active incidents
- Slack integration
- role-based access controls
- budget-conscious model usage
`;

const SAMPLE_PRD_B = `# Team Incident Copilot
Build an AI assistant for engineering teams to triage incidents faster.

Requirements:
- detect incident patterns from logs
- suggest runbooks and responders
- low latency updates in active incidents
- Slack integration
- role-based access controls
- budget-conscious model usage
- compliance and audit visibility for every incident action
`;

test("snapshot: structured sections contain execution and evidence outputs", () => {
  const result = analyzePrd({
    prd: SAMPLE_PRD_A,
    mode: "scalable-startup",
    domain: "saas",
    honestyMode: "standard",
    writeFiles: false,
  });

  const snapshot = {
    sectionHeaders: {
      architecture: result.outputSections.architecture.split("\n")[0],
      folderStructure: result.outputSections.folderStructure.split("\n")[0],
      roadmap: result.outputSections.roadmap.split("\n")[0],
      risks: result.outputSections.risks.split("\n")[0],
      failurePrediction: result.outputSections.failurePrediction.split("\n")[0],
      improvements: result.outputSections.improvements.split("\n")[0],
      executionReadyTasks: result.outputSections.executionReadyTasks.split("\n")[0],
      evidenceTrail: result.outputSections.evidenceTrail.split("\n")[0],
    },
    executionTaskShape: result.executionPlan.tasks.map((task) => ({
      task: task.task,
      owner: task.owner,
      hasAcceptance: task.acceptanceCriteria.length > 0,
      dependencyCount: task.dependencies.length,
    })),
  };

  assert.deepEqual(snapshot.sectionHeaders, {
    architecture: "# 🏗️ Architecture",
    folderStructure: "# 📁 Folder Structure",
    roadmap: "# 🗺️ Roadmap",
    risks: "# ⚠️ Risks",
    failurePrediction: "# 💀 Failure Prediction",
    improvements: "# 💡 Improvements",
    executionReadyTasks: "# 🧩 Execution-Ready Tasks",
    evidenceTrail: "# 🧷 Evidence Trail",
  });

  assert.ok(snapshot.executionTaskShape.length >= 4, "expected multiple ticket-sized execution tasks");
  assert.ok(
    snapshot.executionTaskShape.every((task) => task.owner.trim().length > 0),
    "every execution task must include an owner",
  );
  assert.ok(
    snapshot.executionTaskShape.every((task) => task.hasAcceptance),
    "every execution task must include acceptance criteria",
  );
});

test("snapshot: compare/history runtime response shape remains stable", async () => {
  const projectId = `snapshot-project-${Date.now()}`;

  const first = await submitAnalysisRequest({
    input: {
      prd: SAMPLE_PRD_A,
      mode: "scalable-startup",
      domain: "saas",
      honestyMode: "standard",
      executionMode: "sync",
      projectId,
      requestId: `req-a-${Date.now()}`,
      writeFiles: false,
    },
    clientIp: "127.0.0.1",
  });

  const second = await submitAnalysisRequest({
    input: {
      prd: SAMPLE_PRD_B,
      mode: "enterprise",
      domain: "regulated",
      honestyMode: "brutal",
      executionMode: "sync",
      projectId,
      requestId: `req-b-${Date.now()}`,
      writeFiles: false,
    },
    clientIp: "127.0.0.1",
  });

  assert.ok(first.analysisId.length > 0 && second.analysisId.length > 0, "analysis IDs are required");

  const history = fetchAnalysisHistoryPaged({
    projectId,
    limit: 10,
    offset: 0,
  });

  const comparison = compareAnalyses({
    baseAnalysisId: first.analysisId,
    headAnalysisId: second.analysisId,
  });

  const normalizedSnapshot = {
    historyShape: {
      totalAtLeastTwo: history.total >= 2,
      firstItemHasVerdict: Boolean(history.items[0]?.verdict),
      statuses: history.items.map((item) => item.status),
    },
    comparisonShape: {
      hasVerdictChangeFlag: typeof comparison.verdictChanged === "boolean",
      hasConfidenceDelta: typeof comparison.confidenceDelta === "number",
      hasScoreDiff: typeof comparison.differences.scoreDiff === "number",
      riskChangeArray: Array.isArray(comparison.topRiskChanges),
      decisionChangeArray: Array.isArray(comparison.decisionChanges),
      blockingChangeArray: Array.isArray(comparison.blockingIssueChanges),
      risksChangedArray: Array.isArray(comparison.differences.risksChanged),
      decisionsChangedArray: Array.isArray(comparison.differences.decisionsChanged),
      blockingIssuesChangedArray: Array.isArray(comparison.differences.blockingIssuesChanged),
    },
  };

  assert.deepEqual(normalizedSnapshot.comparisonShape, {
    hasVerdictChangeFlag: true,
    hasConfidenceDelta: true,
    hasScoreDiff: true,
    riskChangeArray: true,
    decisionChangeArray: true,
    blockingChangeArray: true,
    risksChangedArray: true,
    decisionsChangedArray: true,
    blockingIssuesChangedArray: true,
  });
  assert.ok(normalizedSnapshot.historyShape.totalAtLeastTwo, "history should include both runs");
  assert.ok(
    normalizedSnapshot.historyShape.statuses.every((status) => ["completed", "failed", "queued", "running"].includes(status)),
    "history statuses must be valid",
  );
});
