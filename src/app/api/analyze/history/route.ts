import { ApiError } from "@/lib/runtime/errors";
import { fetchAnalysisHistoryPaged } from "@/lib/runtime/analysis-service";
import type { AnalysisStatus } from "@/lib/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_STATUS: AnalysisStatus[] = ["queued", "running", "completed", "failed"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId")?.trim();
    const limit = Number(searchParams.get("limit") ?? "20");
    const offset = Number(searchParams.get("offset") ?? "0");
    const statusParam = searchParams.get("status")?.trim() as AnalysisStatus | undefined;

    if (statusParam && !ALLOWED_STATUS.includes(statusParam)) {
      throw new ApiError(400, "status must be one of: queued, running, completed, failed.");
    }

    const paged = fetchAnalysisHistoryPaged({
      projectId: projectId && projectId.length > 0 ? projectId : undefined,
      limit: Number.isFinite(limit) ? limit : 20,
      offset: Number.isFinite(offset) ? offset : 0,
      status: statusParam,
    });

    return NextResponse.json(
      {
        success: true,
        count: paged.items.length,
        total: paged.total,
        limit: paged.limit,
        offset: paged.offset,
        hasMore: paged.hasMore,
        history: paged.items,
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
