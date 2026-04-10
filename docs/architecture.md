# 🏗️ Architecture
The system uses a modular product surface, policy-driven APIs, and observable execution paths designed to force explicit tradeoff decisions before scale. Analysis assumptions tracked: 3.
- Mode: Scalable Startup
- Mode Priorities: Balance velocity with architecture discipline; Design for near-term growth and controllable complexity; Build observability and cost controls alongside features
- Mode Guardrails: Avoid one-way vendor lock-in for critical paths; Define upgrade paths before scale pressure; Use weekly risk and unit-economics reviews
- Frontend: Next.js web-first app with responsive UX and product APIs in a unified deployable surface
- Backend: Typed Node APIs with queue-backed workers and realtime delivery safeguards
- Data: PostgreSQL with Redis acceleration and governance-ready retention/audit controls
- Integrations: Primary inference provider with fallback routing; Quality and cost telemetry pipeline; Notification and monitoring services

Decision Framework (Analysis -> Architecture)
- [analysis] Market Wedge Decision
  Context: Positioning and launch focus
  Option 1: Horizontal launch for multiple segments | Pros: Bigger top-of-funnel opportunity; More potential use cases quickly | Cons: Weak differentiation; Higher roadmap complexity and messaging dilution
  Option 2: Vertical wedge-first launch | Pros: Clear value proposition; Faster feedback loops on one segment | Cons: Smaller initial TAM; Requires strong segment-specific insight
  Comparison: Wedge-first has lower market breadth but much higher odds of early product-market fit.
  Chosen: Narrow to one vertical workflow before broad launch
  Why: A broad launch without wedge is likely to become commodity quickly; Vertical focus creates clearer ROI narrative and stronger adoption
- [architecture] Frontend Platform Decision
  Context: Delivery channel and user experience
  Option 1: Next.js | Pros: Fast web deployment and SEO; Unified frontend/backend workflow | Cons: Less native mobile depth; Advanced device interactions need extra work
  Option 2: Flutter | Pros: Strong cross-platform mobile UX; Better control for device features | Cons: Web SEO is weaker; Backend and web integration overhead
  Comparison: Choose Flutter only when native mobile UX is the primary differentiator; otherwise Next.js is faster to market.
  Chosen: Next.js
  Why: Web-first rollout improves discovery and launch speed; Unified full-stack model reduces operational overhead
- [architecture] Data Platform Decision
  Context: Speed vs control for backend data layer
  Option 1: Firebase | Pros: Fast setup; Managed auth and realtime primitives | Cons: Relational query constraints; Potential lock-in at growth stage
  Option 2: Supabase | Pros: Postgres-native model; Stronger portability and SQL ecosystem | Cons: Needs schema discipline; Realtime tuning required at high scale
  Comparison: Firebase wins for immediate velocity; Supabase wins for scale portability and data control.
  Chosen: Supabase
  Why: Postgres compatibility improves long-term query flexibility; Better migration path and tooling for scale
- [architecture] AI Provider Strategy Decision
  Context: Model reliability and vendor risk posture
  Option 1: Single API provider | Pros: Fastest initial integration; Lowest ops complexity | Cons: High lock-in and outage exposure; Lower pricing leverage
  Option 2: Self-hosted open model stack | Pros: Potential long-run savings; More data control | Cons: High ops burden; Model maintenance complexity
  Comparison: Hybrid routing balances speed, resilience, and economics better than single-path strategies.
  Chosen: Hybrid provider strategy
  Why: Protects against single-vendor outages and abrupt pricing shifts; Enables quality-latency-cost routing policies by request class

Skill Chain: PRD -> Analysis -> Architecture -> Roadmap -> Risks -> Cost
