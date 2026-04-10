# 🏗️ Architecture
The system uses a modular product surface, policy-driven APIs, and observable execution paths designed to force explicit tradeoff decisions before scale. Domain focus: Marketplace (listing search, trust, and supply-demand balance). Analysis assumptions tracked: 3.
- Mode: Enterprise
- Mode Priorities: Reliability, governance, and compliance before growth; Clear service boundaries and ownership; Auditability across data and model usage paths
- Mode Guardrails: No launch without security review and incident runbook; Define and enforce retention/classification policy; Track SLO and compliance drift from day one
- Frontend: Next.js web-first app with responsive UX and product APIs in a unified deployable surface
- Backend: Service-layer API with policy enforcement, async workers, and audit-friendly domain boundaries
- Data: PostgreSQL with Redis acceleration and governance-ready retention/audit controls
- Integrations: Primary inference provider with fallback routing; Quality and cost telemetry pipeline; Notification and monitoring services

Evidence Layer
- E1 [requirement] Requirements: (confidence 0.84)
- E2 [requirement] Fast translation across 25 languages (confidence 0.84)
- E3 [requirement] Context aware tone shifting (formal / informal) (confidence 0.84)
- E4 [requirement] Team workspace with admin analytics (confidence 0.84)
- E5 [requirement] Mobile-friendly user experience (confidence 0.84)
- E6 [requirement] Low latency for live chat translation (confidence 0.84)
- E7 [requirement] Cost must stay sustainable at growth (confidence 0.84)
- E8 [requirement] Security and privacy expectations for customer text (confidence 0.84)
- E9 [constraint] Compliance-sensitive language detected in PRD. (confidence 0.8)
- E10 [risk] Differentiation risk inferred from broad problem framing. (confidence 0.86)
- E11 [assumption] A cross-functional team can deliver first release scope. (confidence 0.66)
- E12 [assumption] Managed services are acceptable for initial launch speed. (confidence 0.66)
- E13 [assumption] Operational metrics will be reviewed weekly from day one. (confidence 0.66)

Decision Framework (Analysis -> Architecture)
- [analysis] Market Wedge Decision
  Context: Positioning and launch focus
  Evidence: E1, E2, E3
  Option 1: Horizontal launch for multiple segments | Pros: Bigger top-of-funnel opportunity; More potential use cases quickly | Cons: Weak differentiation; Higher roadmap complexity and messaging dilution
  Option 2: Vertical wedge-first launch | Pros: Clear value proposition; Faster feedback loops on one segment | Cons: Smaller initial TAM; Requires strong segment-specific insight
  Comparison: Wedge-first has lower market breadth but much higher odds of early product-market fit.
  Chosen: Narrow to one vertical workflow before broad launch
  Why: A broad launch without wedge is likely to become commodity quickly; Vertical focus creates clearer ROI narrative and stronger adoption
- [architecture] Frontend Platform Decision
  Context: Delivery channel and user experience
  Evidence: E1, E2
  Option 1: Next.js | Pros: Fast web deployment and SEO; Unified frontend/backend workflow | Cons: Less native mobile depth; Advanced device interactions need extra work
  Option 2: Flutter | Pros: Strong cross-platform mobile UX; Better control for device features | Cons: Web SEO is weaker; Backend and web integration overhead
  Comparison: Choose Flutter only when native mobile UX is the primary differentiator; otherwise Next.js is faster to market.
  Chosen: Next.js
  Why: Web-first rollout improves discovery and launch speed; Unified full-stack model reduces operational overhead
- [architecture] Data Platform Decision
  Context: Speed vs control for backend data layer
  Evidence: E2, E3, E4
  Option 1: Firebase | Pros: Fast setup; Managed auth and realtime primitives | Cons: Relational query constraints; Potential lock-in at growth stage
  Option 2: Supabase | Pros: Postgres-native model; Stronger portability and SQL ecosystem | Cons: Needs schema discipline; Realtime tuning required at high scale
  Comparison: Firebase wins for immediate velocity; Supabase wins for scale portability and data control.
  Chosen: Supabase
  Why: Postgres compatibility improves long-term query flexibility; Better migration path and tooling for scale
- [architecture] AI Provider Strategy Decision
  Context: Model reliability and vendor risk posture
  Evidence: E1, E2, E3
  Option 1: Single API provider | Pros: Fastest initial integration; Lowest ops complexity | Cons: High lock-in and outage exposure; Lower pricing leverage
  Option 2: Self-hosted open model stack | Pros: Potential long-run savings; More data control | Cons: High ops burden; Model maintenance complexity
  Comparison: Hybrid routing balances speed, resilience, and economics better than single-path strategies.
  Chosen: Hybrid provider strategy
  Why: Protects against single-vendor outages and abrupt pricing shifts; Enables quality-latency-cost routing policies by request class

Skill Chain: PRD -> Analysis -> Architecture -> Roadmap -> Risks -> Cost
