import { ApiError } from "@/lib/runtime/errors";
import {
  assertPayloadSizeOrThrow,
  fetchAnalysis,
  submitAnalysisRequest,
} from "@/lib/runtime/analysis-service";
import type { AnalyzeRequest } from "@/lib/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    assertPayloadSizeOrThrow(rawBody);

    let input: AnalyzeRequest;
    try {
      input = JSON.parse(rawBody) as AnalyzeRequest;
    } catch {
      throw new ApiError(400, "Request body must be valid JSON.");
    }

    const response = await submitAnalysisRequest({
      input,
      clientIp: getClientIp(request),
    });

    const status = response.success ? 200 : 400;
    return NextResponse.json(response, { status });
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get("analysisId")?.trim();

    if (!analysisId) {
      throw new ApiError(400, "Query param analysisId is required.");
    }

    const response = fetchAnalysis(analysisId);
    const status = response.success ? 200 : 400;
    return NextResponse.json(response, { status });
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
