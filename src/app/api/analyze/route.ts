import { analyzePrd } from "@/lib/analysis-engine";
import { writeGeneratedReports } from "@/lib/report-writer";
import type { AnalyzeRequest, HonestyMode, PlanningMode } from "@/lib/types";
import { NextResponse } from "next/server";

const ALLOWED_MODES: PlanningMode[] = ["beginner-startup", "scalable-startup", "enterprise"];
const ALLOWED_HONESTY: HonestyMode[] = ["standard", "brutal"];

function validateRequest(body: unknown): AnalyzeRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object.");
  }

  const payload = body as Partial<AnalyzeRequest>;

  if (!payload.prd || typeof payload.prd !== "string" || payload.prd.trim().length < 30) {
    throw new Error("PRD must be a string with at least 30 characters.");
  }

  if (!payload.mode || !ALLOWED_MODES.includes(payload.mode)) {
    throw new Error("Mode must be one of: beginner-startup, scalable-startup, enterprise.");
  }

  if (!payload.honestyMode || !ALLOWED_HONESTY.includes(payload.honestyMode)) {
    throw new Error("Honesty mode must be one of: standard, brutal.");
  }

  return {
    prd: payload.prd.trim(),
    mode: payload.mode,
    honestyMode: payload.honestyMode,
    writeFiles: payload.writeFiles ?? true,
  };
}

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as unknown;
    const payload = validateRequest(json);
    const result = analyzePrd(payload);
    let generatedFiles: string[] = [];
    let generationWarning: string | null = null;

    if (payload.writeFiles) {
      try {
        generatedFiles = await writeGeneratedReports(result);
      } catch {
        generationWarning =
          "Analysis succeeded, but writing markdown artifacts was skipped in this environment.";
      }
    }

    return NextResponse.json(
      {
        success: true,
        generatedAt: new Date().toISOString(),
        result,
        generatedFiles,
        generationWarning,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process PRD.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
