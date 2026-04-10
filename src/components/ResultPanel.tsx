import type { AnalysisResult } from "@/lib/types";

interface ResultPanelProps {
  result: AnalysisResult;
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

export function ResultPanel({ result }: ResultPanelProps) {
  return (
    <section className="space-y-6 animate-fade-up">
      <div className="grid gap-4 sm:grid-cols-3">
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
        <h2>Execution Roadmap</h2>
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
        <h2>Risk Simulation</h2>
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
    </section>
  );
}
