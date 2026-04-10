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

function asArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function buildFallbackDomainGuide(domain: string) {
  switch (domain) {
    case "fintech":
      return {
        domain,
        domainLabel: "FinTech",
        priorities: ["Risk controls first", "Auditable transaction paths", "Compliance-aware release gates"],
        guardrails: ["Never ship without audit logging", "Treat fraud and policy review as launch blockers"],
      };
    case "marketplace":
      return {
        domain,
        domainLabel: "Marketplace",
        priorities: ["Liquidity in one core loop", "Trust and safety", "Supply/demand balance"],
        guardrails: ["Measure match rate and conversion", "Avoid broadening segments too early"],
      };
    case "internal-tools":
      return {
        domain,
        domainLabel: "Internal Tools",
        priorities: ["Adoption by the operating team", "Workflow reliability", "Fast iteration"],
        guardrails: ["Optimize for time saved", "Avoid premature platform abstraction"],
      };
    case "regulated":
      return {
        domain,
        domainLabel: "Regulated / Compliance Heavy",
        priorities: ["Policy enforcement", "Auditability", "Access control and retention"],
        guardrails: ["Security review before launch", "Document every data flow"],
      };
    case "saas":
      return {
        domain,
        domainLabel: "SaaS",
        priorities: ["Activation and retention", "Subscription unit economics", "Repeatable onboarding"],
        guardrails: ["Measure time-to-value", "Keep support load low"],
      };
    default:
      return {
        domain: "ai-tool",
        domainLabel: "AI Tool",
        priorities: ["Model quality", "Latency and cost controls", "Fallback behavior"],
        guardrails: ["Track prompt/model drift", "Route by request value"],
      };
  }
}

export function ResultPanel({ result, generatedFiles }: ResultPanelProps) {
  const normalizedDomain = result.domain ?? "ai-tool";
  const domainGuide = result.domainGuide ?? buildFallbackDomainGuide(normalizedDomain);
  const modeLabel = result.mode ?? "scalable-startup";
  const recommendation = result.recommendation ?? {
    verdict: "research-first",
    confidence: 0,
    rationale: [],
  };
  const modeGuide = result.modeGuide ?? { modeLabel: "Scalable Startup", priorities: [], guardrails: [] };
  const architecture = result.architecture ?? {
    overview: "No architecture details found in this legacy analysis.",
    frontend: "Not available",
    backend: "Not available",
    data: "Not available",
    integrations: [],
  };
  const executionPlan = result.executionPlan ?? { mvp: [], scale: [], tasks: [], nextSteps: [] };
  const failureSimulation = result.failureSimulation ?? {
    narrative: "No failure simulation found in this legacy analysis.",
    primaryFailureReason: "Not available",
    likelyFailurePoints: [],
    weakestAssumptions: [],
    pivots: [],
    preBuildChanges: [],
  };
  const selfCritique = result.selfCritique ?? {
    initial: { verdict: "research-first", confidence: 0, primaryFailureReason: "Not available", topRisks: [], topDecisions: [] },
    critiquePoints: [],
    improvementsApplied: [],
    revised: { verdict: "research-first", confidence: 0, primaryFailureReason: "Not available", topRisks: [], topDecisions: [] },
  };
  const investmentPerspective = result.investmentPerspective ?? {
    budgetUsd: 0,
    verdict: "do-not-invest-yet",
    rationale: [],
  };
  const ideaScore = result.ideaScore ?? { feasibility: 0, scalability: 0, uniqueness: 0, summary: "No score available." };
  const evidenceById = new Map(asArray(result.evidence).map((item) => [item.id, item]));

  return (
    <section className="space-y-6 animate-fade-up">
      <div className="grid gap-4 sm:grid-cols-4">
        <article className="metric-card">
          <p className="metric-label">Verdict</p>
          <h3 className="metric-value capitalize">{recommendation.verdict.replaceAll("-", " ")}</h3>
        </article>
        <article className="metric-card">
          <p className="metric-label">Confidence</p>
          <h3 className="metric-value">{recommendation.confidence}%</h3>
        </article>
        <article className="metric-card">
          <p className="metric-label">Product</p>
          <h3 className="metric-value">{result.productName}</h3>
        </article>
        <article className="metric-card">
          <p className="metric-label">Mode</p>
          <h3 className="metric-value capitalize">{modeLabel.replaceAll("-", " ")}</h3>
        </article>
        <article className="metric-card">
          <p className="metric-label">Domain</p>
          <h3 className="metric-value capitalize">{normalizedDomain.replaceAll("-", " ")}</h3>
        </article>
      </div>

      <article className="panel">
        <h2>Domain Strategy</h2>
        <p className="risk-subtitle">{domainGuide.domainLabel}</p>
        <p>Priorities</p>
        <ul>
          {domainGuide.priorities.map((priority) => (
            <li key={priority}>{priority}</li>
          ))}
        </ul>
        <p className="risk-subtitle">Guardrails</p>
        <ul>
          {domainGuide.guardrails.map((guardrail) => (
            <li key={guardrail}>{guardrail}</li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <h2>Architecture</h2>
        <p>{architecture.overview}</p>
        <div className="grid gap-4 mt-4 sm:grid-cols-2">
          <div>
            <h3>Frontend</h3>
            <p>{architecture.frontend}</p>
          </div>
          <div>
            <h3>Backend</h3>
            <p>{architecture.backend}</p>
          </div>
          <div>
            <h3>Data</h3>
            <p>{architecture.data}</p>
          </div>
          <div>
            <h3>Integrations</h3>
            <ul>
              {asArray(architecture.integrations).map((integration) => (
                <li key={integration}>{integration}</li>
              ))}
            </ul>
          </div>
        </div>
      </article>

      <article className="panel">
        <h2>Mode Strategy</h2>
        <p className="risk-subtitle">Mode: {modeGuide.modeLabel}</p>
        <p className="risk-subtitle">Priorities</p>
        <ul>
          {asArray(modeGuide.priorities).map((priority) => (
            <li key={priority}>{priority}</li>
          ))}
        </ul>
        <p className="risk-subtitle">Guardrails</p>
        <ul>
          {asArray(modeGuide.guardrails).map((guardrail) => (
            <li key={guardrail}>{guardrail}</li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <h2>Decision Framework</h2>
        <div className="space-y-4 mt-3">
          {asArray(result.decisions).map((decision) => (
            <div key={decision.title} className="risk-card">
              <h3>{decision.title}</h3>
              <p className="risk-meta">
                <strong>Stage:</strong> {decision.stage} | <strong>Context:</strong> {decision.context}
              </p>
              {decision.evidenceSummary ? <p className="risk-meta"><strong>Evidence summary:</strong> {decision.evidenceSummary}</p> : null}
              <p className="risk-meta">
                <strong>Chosen:</strong> {decision.chosen}
              </p>
              <p>{decision.comparisonSummary}</p>
              <p className="risk-subtitle">Why this choice</p>
              <ul>
                {asArray(decision.why).map((whyPoint) => (
                  <li key={whyPoint}>{whyPoint}</li>
                ))}
              </ul>
              <div className="grid gap-3 md:grid-cols-2">
                {asArray(decision.alternatives).map((alt) => (
                  <div key={alt.option} className="cost-card">
                    <p className="cost-tier">Alternative</p>
                    <p className="metric-value">{alt.option}</p>
                    <p className="risk-subtitle">Pros</p>
                    <ul>
                      {asArray(alt.pros).map((pro) => (
                        <li key={pro}>{pro}</li>
                      ))}
                    </ul>
                    <p className="risk-subtitle">Cons</p>
                    <ul>
                      {asArray(alt.cons).map((con) => (
                        <li key={con}>{con}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <details className="explain-block">
                <summary>Why this decision was chosen</summary>
                {decision.evidenceSummary ? <p className="risk-meta">{decision.evidenceSummary}</p> : null}
                <ul>
                  {asArray(decision.evidenceIds).map((evidenceId) => {
                    const evidenceItem = evidenceById.get(evidenceId);
                    if (!evidenceItem) {
                      return <li key={evidenceId}>{evidenceId}: evidence reference not found in this run.</li>;
                    }

                    return (
                      <li key={evidenceId}>
                        <strong>{evidenceItem.id}</strong>
                        {": "}
                        {evidenceItem.text}
                        {evidenceItem.sourceLine ? ` (PRD line ${evidenceItem.sourceLine})` : ""}
                      </li>
                    );
                  })}
                </ul>
              </details>
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <h2>Evidence Trail</h2>
        <p>These are the specific PRD statements the engine used while forming the plan.</p>
        <div className="space-y-3 mt-3">
          {asArray(result.evidence).map((item) => (
            <div key={item.id} className="risk-card">
              <p className="risk-meta">
                <strong>{item.id}</strong> | {item.category} | confidence {Math.round(item.confidence * 100)}%
              </p>
              <p>
                <strong>Line:</strong> {item.sourceLine ?? "n/a"}
              </p>
              <p>{item.text}</p>
              {item.sourceExcerpt ? <p className="risk-subtitle">Source: {item.sourceExcerpt}</p> : null}
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <h2>Folder Structure</h2>
        <ul className="mt-3">
          {asArray(result.folderStructure).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <h2>Roadmap</h2>
        <div className="space-y-4 mt-3">
          {asArray(result.roadmap).map((phase) => (
            <div key={phase.phase} className="phase-item">
              <p className="phase-timeline">{phase.timeline}</p>
              <h3>{phase.phase}</h3>
              <p>{phase.objective}</p>
              <ul>
                {asArray(phase.deliverables).map((deliverable) => (
                  <li key={deliverable}>{deliverable}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <h2>Execution-Ready Tasks</h2>
        <div className="space-y-4 mt-3">
          {asArray(executionPlan.tasks).map((task) => (
            <div key={task.task} className="risk-card">
              <div className="risk-header">
                <h3>{task.task}</h3>
                <span className={`risk-tag ${task.priority === "High" ? "risk-high" : task.priority === "Medium" ? "risk-medium" : "risk-low"}`}>
                  {task.priority}
                </span>
              </div>
              <p>{task.description}</p>
              <p className="risk-meta">
                <strong>Owner:</strong> {task.owner}
              </p>
              <p className="risk-meta">
                <strong>Effort:</strong> {task.estimatedTime}
              </p>
              <p className="risk-meta">
                <strong>Dependencies:</strong> {task.dependencies.length > 0 ? task.dependencies.join(", ") : "none"}
              </p>
              <p className="risk-subtitle">Acceptance Criteria</p>
              <ul>
                {asArray(task.acceptanceCriteria).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="risk-subtitle mt-4">Next Steps</p>
        <ul>
          {asArray(executionPlan.nextSteps).map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <h2>Risks</h2>
        <p>{failureSimulation.narrative}</p>
        <div className="grid gap-4 mt-4 lg:grid-cols-2">
          {asArray(result.risks).map((risk) => {
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
                  {asArray(risk.warningSignals).map((signal) => (
                    <li key={signal}>{signal}</li>
                  ))}
                </ul>
                <p className="risk-subtitle">Mitigation</p>
                <ul>
                  {asArray(risk.mitigation).map((action) => (
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
          <strong>Primary failure reason:</strong> {failureSimulation.primaryFailureReason}
        </p>
        <p className="risk-subtitle">Likely Failure Points</p>
        <ul>
          {asArray(failureSimulation.likelyFailurePoints).map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <p className="risk-subtitle">Weakest Assumptions</p>
        <ul>
          {asArray(failureSimulation.weakestAssumptions).map((assumption) => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
        <p className="risk-subtitle">Suggested Pivots</p>
        <ul>
          {asArray(failureSimulation.pivots).map((pivot) => (
            <li key={pivot}>{pivot}</li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <h2>Cost Forecast</h2>
        <div className="grid gap-4 mt-4 md:grid-cols-3">
          {asArray(result.costs).map((cost) => (
            <div key={cost.tier} className="cost-card">
              <p className="cost-tier">{cost.tier}</p>
              <p className="cost-range">{cost.monthlyRangeUsd}</p>
              <p className="cost-users">Users: {cost.usersPerMonth}</p>
              <p className="cost-driver">Top Driver: {cost.topCostDriver}</p>
              <ul>
                {asArray(cost.notes).map((note) => (
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
          {asArray(result.costOptimizer).map((item) => (
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
            <h3 className="metric-value">{ideaScore.feasibility}/100</h3>
          </div>
          <div className="metric-card">
            <p className="metric-label">Scalability</p>
            <h3 className="metric-value">{ideaScore.scalability}/100</h3>
          </div>
          <div className="metric-card">
            <p className="metric-label">Uniqueness</p>
            <h3 className="metric-value">{ideaScore.uniqueness}/100</h3>
          </div>
        </div>
        <p className="mt-3">{ideaScore.summary}</p>
      </article>

      <article className="panel">
        <h2>Self-Critique Loop</h2>
        <p className="risk-subtitle">Initial Plan</p>
        <ul>
          <li>
            Verdict: {selfCritique.initial.verdict} ({selfCritique.initial.confidence}%)
          </li>
          <li>Primary failure reason: {selfCritique.initial.primaryFailureReason}</li>
        </ul>
        <p className="risk-subtitle">Critique</p>
        <ul>
          {asArray(selfCritique.critiquePoints).map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <p className="risk-subtitle">Improvements Applied</p>
        <ul>
          {asArray(selfCritique.improvementsApplied).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="risk-subtitle">Revised Plan</p>
        <ul>
          <li>
            Verdict: {selfCritique.revised.verdict} ({selfCritique.revised.confidence}%)
          </li>
          <li>Primary failure reason: {selfCritique.revised.primaryFailureReason}</li>
        </ul>
      </article>

      <article className="panel">
        <h2>Investment Perspective</h2>
        <p className="risk-subtitle">If I were investing ${investmentPerspective.budgetUsd.toLocaleString()}</p>
        <p>
          <strong>Verdict:</strong> {investmentPerspective.verdict}
        </p>
        <ul>
          {asArray(investmentPerspective.rationale).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <h2>MVP vs Scale Plan</h2>
        <p className="risk-subtitle">MVP Plan</p>
        <ul>
          {asArray(executionPlan.mvp).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="risk-subtitle">Scale Plan</p>
        <ul>
          {asArray(executionPlan.scale).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
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
              {asArray(result.techComparator).map((item) => (
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
          {asArray(recommendation.rationale).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <h2>Brutal Challenge Summary</h2>
        <ul className="mt-3">
          {asArray(result.challengeSummary).map((item) => (
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
              {asArray(result.alternatives).map((alternative) => (
                <tr key={alternative.name}>
                  <td>{alternative.name}</td>
                  <td>{alternative.bestFor}</td>
                  <td>{asArray(alternative.tradeoffs).join("; ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="panel">
        <h2>Generated Repo Artifacts</h2>
        <ul className="mt-3">
          {asArray(generatedFiles).map((file) => (
            <li key={file}>{file}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}
