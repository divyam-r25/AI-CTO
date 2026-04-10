import { compareAnalyses } from "@/lib/runtime/analysis-service";
import { ApiError } from "@/lib/runtime/errors";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const baseAnalysisId = searchParams.get("baseAnalysisId")?.trim();
    const headAnalysisId = searchParams.get("headAnalysisId")?.trim();

    if (!baseAnalysisId || !headAnalysisId) {
      throw new ApiError(400, "baseAnalysisId and headAnalysisId are required.");
    }

    const comparison = compareAnalyses({ baseAnalysisId, headAnalysisId });

    return NextResponse.json(
      {
        success: true,
        comparison,
        generatedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          generatedAt: new Date().toISOString(),
        },
        { status: error.status },
      );
    }

    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json(
      {
        success: false,
        error: message,
        generatedAt: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
