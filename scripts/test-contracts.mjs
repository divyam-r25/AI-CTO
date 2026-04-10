import fs from "node:fs";
import path from "node:path";

function read(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function assertContains(content, needle, message) {
  if (!content.includes(needle)) {
    throw new Error(`${message} (missing: ${needle})`);
  }
}

function checkAnalysisEngineContracts() {
  const engine = read("src/lib/analysis-engine.ts");

  assertContains(engine, "# 🏗️ Architecture", "Structured architecture section header must exist");
  assertContains(engine, "# 📁 Folder Structure", "Structured folder section header must exist");
  assertContains(engine, "# 🗺️ Roadmap", "Structured roadmap section header must exist");
  assertContains(engine, "# ⚠️ Risks", "Structured risks section header must exist");
  assertContains(engine, "# 💀 Failure Prediction", "Structured failure section header must exist");
  assertContains(engine, "# 💡 Improvements", "Structured improvements section header must exist");

  assertContains(engine, "Self-Critique Loop (Initial -> Critique -> Revised)", "Self-critique loop must be present");
  assertContains(engine, "Investment Perspective ($10k)", "Investment perspective section must be present");
  assertContains(engine, "MVP vs Scale Plan", "MVP vs Scale section must be present");
}

function checkSkillContracts() {
  const skillFiles = [
    "skills/prd-analysis/SKILL.md",
    "skills/system-design/SKILL.md",
    "skills/roadmap-generator/SKILL.md",
    "skills/risk-simulation/SKILL.md",
    "skills/cost-estimation/SKILL.md",
  ];

  for (const file of skillFiles) {
    const content = read(file);
    assertContains(content, "## Input", `${file} must define Input`);
    assertContains(content, "## Output", `${file} must define Output`);
    assertContains(content, "Decision Framework", `${file} must enforce decision framework`);
    assertContains(content, "Skill Chain", `${file} must declare skill chain`);
  }
}

function checkWorkflowContracts() {
  const workflow = read(".github/workflows/prd-agent.yml");
  assertContains(workflow, "Run contract tests", "Workflow must run contract tests");
  assertContains(workflow, "Upsert PR summary comment", "Workflow must post PR summary comment");
}

function main() {
  checkAnalysisEngineContracts();
  checkSkillContracts();
  checkWorkflowContracts();
  console.log("Contract checks passed.");
}

main();
