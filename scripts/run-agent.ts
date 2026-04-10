import { readFile } from "node:fs/promises";
import path from "node:path";
import { analyzePrd } from "../src/lib/analysis-engine";
import { writeGeneratedReports } from "../src/lib/report-writer";
import type { HonestyMode, PlanningMode } from "../src/lib/types";

const VALID_MODES: PlanningMode[] = ["beginner-startup", "scalable-startup", "enterprise"];
const VALID_HONESTY: HonestyMode[] = ["standard", "brutal"];

function getArg(name: string): string | undefined {
  const index = process.argv.findIndex((value) => value === `--${name}`);
  if (index === -1) {
    return undefined;
  }
  return process.argv[index + 1];
}

async function main() {
  const prdPathArg = getArg("prd") ?? "examples/sample-prd.md";
  const modeArgRaw = getArg("mode") ?? "scalable-startup";
  const honestyArgRaw = getArg("honesty") ?? "standard";

  if (!VALID_MODES.includes(modeArgRaw as PlanningMode)) {
    throw new Error("Invalid mode. Use: beginner-startup, scalable-startup, enterprise.");
  }

  if (!VALID_HONESTY.includes(honestyArgRaw as HonestyMode)) {
    throw new Error("Invalid honesty mode. Use: standard, brutal.");
  }

  const modeArg = modeArgRaw as PlanningMode;
  const honestyArg = honestyArgRaw as HonestyMode;

  const prdPath = path.resolve(process.cwd(), prdPathArg);
  const prd = await readFile(prdPath, "utf8");

  const result = analyzePrd({
    prd,
    mode: modeArg,
    honestyMode: honestyArg,
    writeFiles: true,
  });

  const files = await writeGeneratedReports(result);
  console.log("Generated files:");
  files.forEach((file) => {
    console.log(`- ${file}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
