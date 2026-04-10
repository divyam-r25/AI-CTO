"use client";

import { ResultPanel } from "@/components/ResultPanel";
import type {
  AnalysisComparison,
  AnalysisRecordSummary,
  AnalyzeCompareResponse,
  AnalyzeHistoryResponse,
  AnalysisResult,
  AnalyzeResponse,
  AnalysisStatus,
  HonestyMode,
  PlanningMode,
} from "@/lib/types";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

const DEMO_PRD = `# Language Translator for Emerging Markets
Build a translation product for students and small businesses with AI-assisted translation for email, chat, and product listings.

Requirements:
- Fast translation across 25 languages
- Context aware tone shifting (formal / informal)
- Team workspace with admin analytics
- Mobile-friendly user experience
- Low latency for live chat translation
- Cost must stay sustainable at growth
- Security and privacy expectations for customer text
`;

async function parseApiJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    const bodyPreview = (await response.text()).slice(0, 180);
    throw new Error(`API returned non-JSON response (status ${response.status}). Preview: ${bodyPreview}`);
  }

  return (await response.json()) as T;
}

export default function Home() {
  const [prd, setPrd] = useState(DEMO_PRD);
  const [mode, setMode] = useState<PlanningMode>("scalable-startup");
  const [honestyMode, setHonestyMode] = useState<HonestyMode>("standard");
  const [projectId, setProjectId] = useState("default-project");
  const [loading, setLoading] = useState(false);
  const [loadingAnalysisId, setLoadingAnalysisId] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]);
  const [history, setHistory] = useState<AnalysisRecordSummary[]>([]);
  const [historyStatusFilter, setHistoryStatusFilter] = useState<"all" | AnalysisStatus>("all");
  const [historyOffset, setHistoryOffset] = useState(0);
  const [historyLimit] = useState(8);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);
  const [compareBaseId, setCompareBaseId] = useState<string>("");
  const [compareHeadId, setCompareHeadId] = useState<string>("");
  const [comparison, setComparison] = useState<AnalysisComparison | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wordCount = useMemo(() => {
    return prd.trim().split(/\s+/).filter(Boolean).length;
  }, [prd]);

  function formatTimestamp(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  }

  const loadHistory = useCallback(async (params: { currentProjectId: string; offset?: number; append?: boolean }) => {
    const { currentProjectId, offset = 0, append = false } = params;
    if (!currentProjectId.trim()) {
      setHistory([]);
      return;
    }

    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const search = new URLSearchParams({
        projectId: currentProjectId,
        limit: String(historyLimit),
        offset: String(offset),
      });

      if (historyStatusFilter !== "all") {
        search.set("status", historyStatusFilter);
      }

      const response = await fetch(`/api/analyze/history?${search.toString()}`);
      const data = await parseApiJson<AnalyzeHistoryResponse>(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Unable to load analysis history.");
      }

      setHistory((prev) => (append ? [...prev, ...(data.history ?? [])] : data.history ?? []));
      setHistoryOffset(data.offset + (data.history?.length ?? 0));
      setHistoryHasMore(data.hasMore);
    } catch (historyLoadError) {
      const message =
        historyLoadError instanceof Error
          ? historyLoadError.message
          : "Something went wrong while loading history.";
      setHistoryError(message);
      setHistory([]);
      setHistoryHasMore(false);
      setHistoryOffset(0);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyLimit, historyStatusFilter]);

  const loadAnalysis = useCallback(async (analysisId: string) => {
    setLoadingAnalysisId(analysisId);
    setError(null);

    try {
      const response = await fetch(`/api/analyze?analysisId=${encodeURIComponent(analysisId)}`);
      const data = await parseApiJson<AnalyzeResponse>(response);

      if (!response.ok || !data.success || !data.result) {
        throw new Error(data.error ?? "Unable to load analysis result.");
      }

      setResult(data.result);
      setGeneratedFiles(data.generatedFiles ?? []);
      setActiveAnalysisId(data.analysisId);
    } catch (analysisLoadError) {
      const message =
        analysisLoadError instanceof Error
          ? analysisLoadError.message
          : "Something went wrong while loading analysis.";
      setError(message);
    } finally {
      setLoadingAnalysisId(null);
    }
  }, []);

  useEffect(() => {
    void loadHistory({ currentProjectId: projectId, offset: 0, append: false });
  }, [projectId, historyStatusFilter, loadHistory]);

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prd, mode, honestyMode, projectId, writeFiles: true }),
      });

      const data = await parseApiJson<AnalyzeResponse>(response);

      if (!response.ok || !data.success || !data.result) {
        throw new Error(data.error ?? "Analysis failed.");
      }

      setResult(data.result);
      setGeneratedFiles(data.generatedFiles ?? []);
      setActiveAnalysisId(data.analysisId);
      await loadHistory({ currentProjectId: projectId, offset: 0, append: false });
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong while generating the report.";
      setError(message);
      setResult(null);
      setGeneratedFiles([]);
    } finally {
      setLoading(false);
    }
  }

  async function runComparison() {
    if (!compareBaseId || !compareHeadId) {
      setComparisonError("Select both base and head analyses first.");
      return;
    }

    if (compareBaseId === compareHeadId) {
      setComparisonError("Base and head analyses must be different.");
      return;
    }

    setComparisonLoading(true);
    setComparisonError(null);
    try {
      const query = new URLSearchParams({
        baseAnalysisId: compareBaseId,
        headAnalysisId: compareHeadId,
      });
      const response = await fetch(`/api/analyze/compare?${query.toString()}`);
      const data = await parseApiJson<AnalyzeCompareResponse>(response);

      if (!response.ok || !data.success || !data.comparison) {
        throw new Error(data.error ?? "Unable to compare analyses.");
      }

      setComparison(data.comparison);
    } catch (compareError) {
      const message = compareError instanceof Error ? compareError.message : "Comparison failed.";
      setComparisonError(message);
      setComparison(null);
    } finally {
      setComparisonLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <div className="bg-orb bg-orb-left" aria-hidden="true" />
      <div className="bg-orb bg-orb-right" aria-hidden="true" />

      <section className="hero animate-fade-up">
        <p className="eyebrow">AI CTO</p>
        <h1>Architect + Risk Simulator Agent</h1>
        <p className="hero-copy">
          Turn any PRD into architecture, execution roadmap, risk simulation, and cost forecast in one run.
        </p>
      </section>

      <section className="panel animate-fade-up delay-1">
        <form className="space-y-5" onSubmit={handleAnalyze}>
          <div className="field-group">
            <label htmlFor="projectId">Project ID</label>
            <input
              id="projectId"
              type="text"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              placeholder="default-project"
              minLength={1}
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="prd">Paste your PRD</label>
            <textarea
              id="prd"
              value={prd}
              onChange={(event) => setPrd(event.target.value)}
              placeholder="Describe the product, users, constraints, and success metrics..."
              required
              minLength={30}
            />
            <p className="helper">{wordCount} words</p>
          </div>

          <div className="field-row">
            <div className="field-group">
              <label htmlFor="mode">Simulation Mode</label>
              <select
                id="mode"
                value={mode}
                onChange={(event) => setMode(event.target.value as PlanningMode)}
              >
                <option value="beginner-startup">Beginner Startup</option>
                <option value="scalable-startup">Scalable Startup</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div className="field-group">
              <label htmlFor="honestyMode">Challenge Mode</label>
              <select
                id="honestyMode"
                value={honestyMode}
                onChange={(event) => setHonestyMode(event.target.value as HonestyMode)}
              >
                <option value="standard">Standard</option>
                <option value="brutal">Brutal Honesty</option>
              </select>
            </div>

            <button disabled={loading} type="submit" className="cta-btn">
              {loading ? "Simulating..." : "Generate CTO Plan"}
            </button>
          </div>

          {error ? <p className="error-text">{error}</p> : null}
        </form>
      </section>

      <section className="panel animate-fade-up delay-1">
        <h2>Recent Analyses</h2>
        <div className="field-row mt-3">
          <div className="field-group">
            <label htmlFor="historyStatus">Status Filter</label>
            <select
              id="historyStatus"
              value={historyStatusFilter}
              onChange={(event) => setHistoryStatusFilter(event.target.value as "all" | AnalysisStatus)}
            >
              <option value="all">All</option>
              <option value="queued">Queued</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {historyLoading ? <p className="mt-3">Loading history...</p> : null}
        {historyError ? <p className="error-text mt-3">{historyError}</p> : null}
        {!historyLoading && !historyError && history.length === 0 ? (
          <p className="mt-3">No analyses yet for this project.</p>
        ) : null}

        {!historyLoading && history.length > 0 ? (
          <ul className="history-list mt-3">
            {history.map((item) => (
              <li key={item.analysisId} className="history-item">
                <div>
                  <p className="history-title">
                    {item.verdict ? item.verdict.replaceAll("-", " ") : "pending"}
                    {item.confidence !== undefined ? ` (${item.confidence}%)` : ""}
                  </p>
                  <p className="history-meta">
                    {item.status} | {formatTimestamp(item.updatedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    void loadAnalysis(item.analysisId);
                  }}
                  disabled={loadingAnalysisId === item.analysisId}
                >
                  {loadingAnalysisId === item.analysisId ? "Loading..." : "Load"}
                </button>
                {activeAnalysisId === item.analysisId ? <span className="active-badge">Active</span> : null}
              </li>
            ))}
          </ul>
        ) : null}

        {!historyLoading && historyHasMore ? (
          <button
            type="button"
            className="secondary-btn mt-3"
            onClick={() => {
              void loadHistory({ currentProjectId: projectId, offset: historyOffset, append: true });
            }}
          >
            Load More
          </button>
        ) : null}
      </section>

      <section className="panel animate-fade-up delay-1">
        <h2>Compare Analyses</h2>
        <div className="field-row mt-3">
          <div className="field-group">
            <label htmlFor="compareBase">Base Analysis</label>
            <select
              id="compareBase"
              value={compareBaseId}
              onChange={(event) => setCompareBaseId(event.target.value)}
            >
              <option value="">Select base analysis</option>
              {history.map((item) => (
                <option key={`base-${item.analysisId}`} value={item.analysisId}>
                  {item.analysisId} | {item.status} | {item.verdict ?? "n/a"}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="compareHead">Head Analysis</label>
            <select
              id="compareHead"
              value={compareHeadId}
              onChange={(event) => setCompareHeadId(event.target.value)}
            >
              <option value="">Select head analysis</option>
              {history.map((item) => (
                <option key={`head-${item.analysisId}`} value={item.analysisId}>
                  {item.analysisId} | {item.status} | {item.verdict ?? "n/a"}
                </option>
              ))}
            </select>
          </div>

          <button type="button" className="cta-btn" disabled={comparisonLoading} onClick={runComparison}>
            {comparisonLoading ? "Comparing..." : "Compare Runs"}
          </button>
        </div>

        {comparisonError ? <p className="error-text mt-3">{comparisonError}</p> : null}

        {comparison ? (
          <div className="compare-box mt-3">
            <p>
              Verdict changed: <strong>{comparison.verdictChanged ? "Yes" : "No"}</strong>
            </p>
            <p>
              Confidence delta: <strong>{comparison.confidenceDelta}%</strong>
            </p>

            <p className="risk-subtitle">Risk Changes</p>
            <ul>
              {comparison.topRiskChanges.length > 0 ? (
                comparison.topRiskChanges.map((item) => <li key={item}>{item}</li>)
              ) : (
                <li>No top-risk changes detected.</li>
              )}
            </ul>

            <p className="risk-subtitle">Decision Changes</p>
            <ul>
              {comparison.decisionChanges.length > 0 ? (
                comparison.decisionChanges.map((item) => <li key={item}>{item}</li>)
              ) : (
                <li>No decision changes detected.</li>
              )}
            </ul>

            <p className="risk-subtitle">Blocking Issue Changes</p>
            <ul>
              {comparison.blockingIssueChanges.length > 0 ? (
                comparison.blockingIssueChanges.map((item) => <li key={item}>{item}</li>)
              ) : (
                <li>No blocking issue changes detected.</li>
              )}
            </ul>
          </div>
        ) : null}
      </section>

      {result ? <ResultPanel result={result} generatedFiles={generatedFiles} /> : null}
    </main>
  );
}
