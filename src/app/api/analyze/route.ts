import { analyzePrd } from "@/lib/analysis-engine";
import type { AnalyzeRequest, PlanningMode } from "@/lib/types";
import { NextResponse } from "next/server";

const ALLOWED_MODES: PlanningMode[] = ["conservative", "balanced", "aggressive"];

function validateRequest(body: unknown): AnalyzeRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object.");
  }

  const payload = body as Partial<AnalyzeRequest>;

  if (!payload.prd || typeof payload.prd !== "string" || payload.prd.trim().length < 30) {
    throw new Error("PRD must be a string with at least 30 characters.");
  }

  if (!payload.mode || !ALLOWED_MODES.includes(payload.mode)) {
    throw new Error("Mode must be one of: conservative, balanced, aggressive.");
  }

  return {
    prd: payload.prd.trim(),
    mode: payload.mode,
  };
}

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as unknown;
    const payload = validateRequest(json);
    const result = analyzePrd(payload);

    return NextResponse.json(
      {
        success: true,
        generatedAt: new Date().toISOString(),
        result,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process PRD.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
