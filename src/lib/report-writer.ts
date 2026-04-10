import type { AnalysisResult } from "./types";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function fullReport(result: AnalysisResult): string {
  return [
    result.outputSections.architecture,
    "",
    result.outputSections.folderStructure,
    "",
    result.outputSections.roadmap,
    "",
    result.outputSections.risks,
    "",
    result.outputSections.failurePrediction,
    "",
    result.outputSections.improvements,
  ].join("\n");
}

export async function writeGeneratedReports(result: AnalysisResult): Promise<string[]> {
  const cwd = process.cwd();
  const docsTarget = path.join(cwd, "docs");
  const generatedTarget = path.join(docsTarget, "generated");
  await Promise.all([mkdir(docsTarget, { recursive: true }), mkdir(generatedTarget, { recursive: true })]);

  const generatedFiles: Array<[string, string]> = [
    ["architecture.md", result.outputSections.architecture],
    ["roadmap.md", result.outputSections.roadmap],
    ["risks.md", result.outputSections.risks],
    ["failure-prediction.md", result.outputSections.failurePrediction],
    ["improvements.md", result.outputSections.improvements],
    ["report.md", fullReport(result)],
  ];

  const canonicalFiles: Array<[string, string]> = [
    ["architecture.md", result.outputSections.architecture],
    ["roadmap.md", result.outputSections.roadmap],
    ["risks.md", result.outputSections.risks],
  ];

  await Promise.all(
    generatedFiles.map(async ([name, content]) => {
      await writeFile(path.join(generatedTarget, name), `${content}\n`, "utf8");
    }),
  );

  await Promise.all(
    canonicalFiles.map(async ([name, content]) => {
      await writeFile(path.join(docsTarget, name), `${content}\n`, "utf8");
    }),
  );

  return [
    ...generatedFiles.map(([name]) => `docs/generated/${name}`),
    ...canonicalFiles.map(([name]) => `docs/${name}`),
  ];
}
