import type { AnalysisResult } from "@/lib/types";

interface ResultPanelProps {
  result: AnalysisResult;
  generatedFiles: string[];
}

function riskLevel(rpn: number): "high" | "medium" | "low" {
  if (rpn >= 50) {
    return "high";
  }
  if (rpn >= 30) {
    return "medium";
  }
  return "low";
}

export function ResultPanel({ result, generatedFiles }: ResultPanelProps) {
  return (
    <section className="space-y-6 animate-fade-up">
      <div className="grid gap-4 sm:grid-cols-4">
        <article className="metric-card">
          <p className="metric-label">Verdict</p>
          <h3 className="metric-value capitalize">{result.recommendation.verdict.replaceAll("-", " ")}</h3>
        </article>
        <article className="metric-card">
          <p className="metric-label">Confidence</p>
          <h3 className="metric-value">{result.recommendation.confidence}%</h3>
        </article>
        <article className="metric-card">
          <p className="metric-label">Product</p>
          <h3 className="metric-value">{result.productName}</h3>
        </article>
        <article className="metric-card">
          <p className="metric-label">Mode</p>
          <h3 className="metric-value capitalize">{result.mode.replaceAll("-", " ")}</h3>
        </article>
      </div>

      <article className="panel">
        <h2>Architecture</h2>
        <p>{result.architecture.overview}</p>
        <div className="grid gap-4 mt-4 sm:grid-cols-2">
          <div>
            <h3>Frontend</h3>
            <p>{result.architecture.frontend}</p>
          </div>
          <div>
            <h3>Backend</h3>
            <p>{result.architecture.backend}</p>
          </div>
          <div>
            <h3>Data</h3>
            <p>{result.architecture.data}</p>
          </div>
          <div>
            <h3>Integrations</h3>
            <ul>
              {result.architecture.integrations.map((integration) => (
                <li key={integration}>{integration}</li>
              ))}
            </ul>
          </div>
        </div>
      </article>

      <article className="panel">
        <h2>Mode Strategy</h2>
        <p className="risk-subtitle">Mode: {result.modeGuide.modeLabel}</p>
        <p className="risk-subtitle">Priorities</p>
        <ul>
          {result.modeGuide.priorities.map((priority) => (
            <li key={priority}>{priority}</li>
          ))}
        </ul>
        <p className="risk-subtitle">Guardrails</p>
        <ul>
          {result.modeGuide.guardrails.map((guardrail) => (
            <li key={guardrail}>{guardrail}</li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <h2>Decision Framework</h2>
        <div className="space-y-4 mt-3">
          {result.decisions.map((decision) => (
            <div key={decision.title} className="risk-card">
              <h3>{decision.title}</h3>
              <p className="risk-meta">
                <strong>Stage:</strong> {decision.stage} | <strong>Context:</strong> {decision.context}
              </p>
              <p className="risk-meta">
                <strong>Chosen:</strong> {decision.chosen}
              </p>
              <p>{decision.comparisonSummary}</p>
              <p className="risk-subtitle">Why this choice</p>
              <ul>
                {decision.why.map((whyPoint) => (
                  <li key={whyPoint}>{whyPoint}</li>
                ))}
              </ul>
              <div className="grid gap-3 md:grid-cols-2">
                {decision.alternatives.map((alt) => (
                  <div key={alt.option} className="cost-card">
                    <p className="cost-tier">Alternative</p>
                    <p className="metric-value">{alt.option}</p>
                    <p className="risk-subtitle">Pros</p>
                    <ul>
                      {alt.pros.map((pro) => (
                        <li key={pro}>{pro}</li>
                      ))}
                    </ul>
                    <p className="risk-subtitle">Cons</p>
                    <ul>
                      {alt.cons.map((con) => (
                        <li key={con}>{con}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <h2>Folder Structure</h2>
        <ul className="mt-3">
          {result.folderStructure.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <h2>Roadmap</h2>
        <div className="space-y-4 mt-3">
          {result.roadmap.map((phase) => (
            <div key={phase.phase} className="phase-item">
              <p className="phase-timeline">{phase.timeline}</p>
              <h3>{phase.phase}</h3>
              <p>{phase.objective}</p>
              <ul>
                {phase.deliverables.map((deliverable) => (
                  <li key={deliverable}>{deliverable}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <h2>Risks</h2>
        <p>{result.failureSimulation.narrative}</p>
        <div className="grid gap-4 mt-4 lg:grid-cols-2">
          {result.risks.map((risk) => {
            const level = riskLevel(risk.rpn);
            return (
              <div key={risk.title} className="risk-card">
                <div className="risk-header">
                  <h3>{risk.title}</h3>
                  <span className={`risk-tag risk-${level}`}>RPN {risk.rpn}</span>
                </div>
                <p className="risk-meta">
                  {risk.category} | L:{risk.likelihood} I:{risk.impact} D:{risk.detectability}
                </p>
                <p className="risk-subtitle">Warning Signals</p>
                <ul>
                  {risk.warningSignals.map((signal) => (
                    <li key={signal}>{signal}</li>
                  ))}
                </ul>
                <p className="risk-subtitle">Mitigation</p>
                <ul>
                  {risk.mitigation.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </article>

      <article className="panel">
        <h2>Failure Prediction</h2>
        <p>
          <strong>Primary failure reason:</strong> {result.failureSimulation.primaryFailureReason}
        </p>
        <p className="risk-subtitle">Likely Failure Points</p>
        <ul>
          {result.failureSimulation.likelyFailurePoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <p className="risk-subtitle">Weakest Assumptions</p>
        <ul>
          {result.failureSimulation.weakestAssumptions.map((assumption) => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
        <p className="risk-subtitle">Suggested Pivots</p>
        <ul>
          {result.failureSimulation.pivots.map((pivot) => (
            <li key={pivot}>{pivot}</li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <h2>Cost Forecast</h2>
        <div className="grid gap-4 mt-4 md:grid-cols-3">
          {result.costs.map((cost) => (
            <div key={cost.tier} className="cost-card">
              <p className="cost-tier">{cost.tier}</p>
              <p className="cost-range">{cost.monthlyRangeUsd}</p>
              <p className="cost-users">Users: {cost.usersPerMonth}</p>
              <p className="cost-driver">Top Driver: {cost.topCostDriver}</p>
              <ul>
                {cost.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <h2>Cost Optimizer</h2>
        <div className="space-y-4 mt-3">
          {result.costOptimizer.map((item) => (
            <div key={item.area} className="risk-card">
              <h3>{item.area}</h3>
              <p>{item.currentRisk}</p>
              <p className="risk-subtitle">Alternatives</p>
              <ul>
                <li>{item.alternativeA}</li>
                <li>{item.alternativeB}</li>
              </ul>
              <p className="risk-subtitle">Comparison</p>
              <p>{item.comparison}</p>
              <p className="risk-subtitle">Recommended</p>
              <p>
                {item.recommended} - {item.why}
              </p>
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <h2>Idea Score</h2>
        <div className="grid gap-4 mt-3 sm:grid-cols-3">
          <div className="metric-card">
            <p className="metric-label">Feasibility</p>
            <h3 className="metric-value">{result.ideaScore.feasibility}/100</h3>
          </div>
          <div className="metric-card">
            <p className="metric-label">Scalability</p>
            <h3 className="metric-value">{result.ideaScore.scalability}/100</h3>
          </div>
          <div className="metric-card">
            <p className="metric-label">Uniqueness</p>
            <h3 className="metric-value">{result.ideaScore.uniqueness}/100</h3>
          </div>
        </div>
        <p className="mt-3">{result.ideaScore.summary}</p>
      </article>

      <article className="panel">
        <h2>Tech Stack Comparator</h2>
        <div className="overflow-auto mt-3">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Dimension</th>
                <th>Option A</th>
                <th>Option B</th>
                <th>Verdict</th>
                <th>Rationale</th>
              </tr>
            </thead>
            <tbody>
              {result.techComparator.map((item) => (
                <tr key={`${item.dimension}-${item.verdict}`}>
                  <td>{item.dimension}</td>
                  <td>{item.optionA}</td>
                  <td>{item.optionB}</td>
                  <td>{item.verdict}</td>
                  <td>{item.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="panel">
        <h2>Improvements</h2>
        <ul className="mt-3">
          {result.recommendation.rationale.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <h2>Brutal Challenge Summary</h2>
        <ul className="mt-3">
          {result.challengeSummary.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <h2>Alternative Approaches</h2>
        <div className="overflow-auto mt-3">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Approach</th>
                <th>Best For</th>
                <th>Tradeoffs</th>
              </tr>
            </thead>
            <tbody>
              {result.alternatives.map((alternative) => (
                <tr key={alternative.name}>
                  <td>{alternative.name}</td>
                  <td>{alternative.bestFor}</td>
                  <td>{alternative.tradeoffs.join("; ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="panel">
        <h2>Generated Repo Artifacts</h2>
        <ul className="mt-3">
          {generatedFiles.map((file) => (
            <li key={file}>{file}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}
