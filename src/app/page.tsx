"use client";

import { ResultPanel } from "@/components/ResultPanel";
import type { AnalysisResult, PlanningMode } from "@/lib/types";
import { FormEvent, useMemo, useState } from "react";

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

export default function Home() {
  const [prd, setPrd] = useState(DEMO_PRD);
  const [mode, setMode] = useState<PlanningMode>("balanced");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wordCount = useMemo(() => {
    return prd.trim().split(/\s+/).filter(Boolean).length;
  }, [prd]);

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
        body: JSON.stringify({ prd, mode }),
      });

      const data = (await response.json()) as {
        success: boolean;
        error?: string;
        result?: AnalysisResult;
      };

      if (!data.success || !data.result) {
        throw new Error(data.error ?? "Analysis failed.");
      }

      setResult(data.result);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong while generating the report.";
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <div className="bg-orb bg-orb-left" aria-hidden="true" />
      <div className="bg-orb bg-orb-right" aria-hidden="true" />

      <section className="hero animate-fade-up">
        <p className="eyebrow">AI CTO in a Git Repo</p>
        <h1>Architect + Risk Simulator Agent</h1>
        <p className="hero-copy">
          Turn any PRD into architecture, execution roadmap, risk simulation, and cost forecast in one run.
        </p>
      </section>

      <section className="panel animate-fade-up delay-1">
        <form className="space-y-5" onSubmit={handleAnalyze}>
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
                <option value="conservative">Conservative (strict risk posture)</option>
                <option value="balanced">Balanced (recommended)</option>
                <option value="aggressive">Aggressive (speed-first posture)</option>
              </select>
            </div>

            <button disabled={loading} type="submit" className="cta-btn">
              {loading ? "Simulating..." : "Generate CTO Plan"}
            </button>
          </div>

          {error ? <p className="error-text">{error}</p> : null}
        </form>
      </section>

      {result ? <ResultPanel result={result} /> : null}
    </main>
  );
}
