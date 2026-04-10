# ⚠️ Risks
- Weak differentiation against incumbents [product] RPN 75. Owner: Product Lead. Signals: Prospects compare the product to free alternatives; Activation and retention flatten after initial onboarding. Mitigation: Narrow to one high-pain workflow and own it deeply; Gate launch on measurable value proof in target segment
- Latency and reliability degrade with growth spikes [scaling] RPN 48. Owner: Engineering Lead. Signals: P95 latency breaches SLO; Queue depth grows faster than drain rate. Mitigation: Split synchronous and asynchronous execution paths; Cache repeat-heavy flows and add backpressure controls
- Unit economics worsen as usage grows [financial] RPN 40. Owner: Founder/PM. Signals: Cost per active user rises for two consecutive weeks; Variable cost scales faster than revenue or conversion. Mitigation: Introduce pricing tiers and usage-aware feature limits; Route low-value traffic to lower-cost execution paths
- Model dependency and quality drift [technical] RPN 60. Owner: ML Platform Lead. Signals: Quality score regressions; Provider throttling or outage spikes. Mitigation: Maintain fallback model routes with health checks; Track quality-cost-latency metrics per request class
- Realtime channel instability [technical] RPN 48. Owner: Backend Lead. Signals: Reconnect spikes; Dropped acknowledgements in event stream. Mitigation: Use idempotent event replay and consumer offsets; Add transport health monitoring with fallback mode
- Data-governance and compliance exposure [compliance] RPN 80. Owner: Security Lead. Signals: No retention or deletion controls for sensitive data; Missing data classification and access audit trails. Mitigation: Implement classification, retention, and deletion policy; Add audit logging and privacy/compliance review gates

Decision Framework (Risk Mitigation)
- [risk-mitigation] Primary Risk Mitigation Decision
  Context: Preventing predictable launch failure
  Evidence: E2, E3, E4
  Option 1: Scale acquisition now and fix later | Pros: Faster top-line growth in the short term; More user data sooner | Cons: Magnifies churn and cost leaks; Can create unsustainable burn
  Option 2: De-risk before growth push | Pros: Protects unit economics; Improves retention and trust quality | Cons: Slower visible growth early; Requires hard prioritization discipline
  Comparison: De-risking before growth lowers probability of expensive failure loops.
  Chosen: Fix differentiation before adding feature breadth
  Why: Without wedge, feature velocity increases cost but not defensibility; Focused positioning raises retention and pricing power
- [risk-mitigation] Release Gate Decision
  Context: Deciding what blocks launch
  Evidence: E1, E5, E6
  Option 1: Launch first, remediate after incidents | Pros: Faster initial release; Less pre-launch overhead | Cons: Higher reputational risk; Greater rollback and fire-fighting risk
  Option 2: Block launch until defined gates pass | Pros: Lower operational and reputational risk; Creates accountability and quality discipline | Cons: Longer pre-launch cycle; Requires stronger cross-team alignment
  Comparison: Gate-based launches reduce existential downside and should be default for high-risk systems.
  Chosen: Compliance and audit controls are mandatory launch gates
  Why: Governance failures can kill enterprise adoption immediately; Retroactive compliance fixes are expensive and risky
