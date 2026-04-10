# 🏗️ Architecture
The system uses a modular product surface, policy-driven APIs, and observable execution paths designed to force explicit tradeoff decisions before scale. Analysis assumptions tracked: 3.
- Mode: Scalable Startup
- Mode Priorities: Balance velocity with architecture discipline; Design for near-term growth and controllable complexity; Build observability and cost controls alongside features
- Mode Guardrails: Avoid one-way vendor lock-in for critical paths; Define upgrade paths before scale pressure; Use weekly risk and unit-economics reviews
- Frontend: Next.js web-first app with responsive UX and product APIs in a unified deployable surface
- Backend: Typed Node APIs with queue-backed workers and realtime delivery safeguards
- Data: PostgreSQL with Redis acceleration and governance-ready retention/audit controls
- Integrations: Primary inference provider with fallback routing; Quality and cost telemetry pipeline; Notification and monitoring services

Evidence Layer
- E1 [requirement] Students collaborating across languages (confidence 0.84)
- E2 [requirement] Small business teams handling multilingual customer requests (confidence 0.84)
- E3 [requirement] Marketplace sellers translating listings and support messages (confidence 0.84)
- E4 [requirement] Translate text across 25 languages (confidence 0.84)
- E5 [requirement] Formal and informal tone controls (confidence 0.84)
- E6 [requirement] Team workspace with usage analytics (confidence 0.84)
- E7 [requirement] Low-latency translation for live chat (confidence 0.84)
- E8 [requirement] Mobile-friendly interface (confidence 0.84)
- E9 [requirement] P95 response latency under 1.8s for standard requests (confidence 0.84)
- E10 [requirement] 99.5% monthly service availability (confidence 0.84)
- E11 [requirement] Predictable cost per active user (confidence 0.84)
- E12 [requirement] Privacy-safe handling of user text (confidence 0.84)
- E13 [requirement] Team size: 3 engineers + 1 designer (confidence 0.84)
- E14 [requirement] MVP launch target: 7 days for demo scope (confidence 0.84)
- E15 [requirement] Budget sensitive for API usage (confidence 0.84)
- E16 [requirement] 30% week-1 retention in pilot users (confidence 0.84)
- E17 [requirement] 20% decrease in support response time for business users (confidence 0.84)
- E18 [requirement] Cost per active user below $0.70 in early traction (confidence 0.84)
- E19 [risk] Differentiation risk inferred from broad problem framing. (confidence 0.62)
- E20 [assumption] A cross-functional team can deliver first release scope. (confidence 0.66)
- E21 [assumption] Managed services are acceptable for initial launch speed. (confidence 0.66)
- E22 [assumption] Operational metrics will be reviewed weekly from day one. (confidence 0.66)

Decision Framework (Analysis -> Architecture)
- [analysis] Market Wedge Decision
  Context: Positioning and launch focus
  Evidence: E1, E2, E3
  Option 1: Horizontal launch for multiple segments | Pros: Bigger top-of-funnel opportunity; More potential use cases quickly | Cons: Weak differentiation; Higher roadmap complexity and messaging dilution
  Option 2: Vertical wedge-first launch | Pros: Clear value proposition; Faster feedback loops on one segment | Cons: Smaller initial TAM; Requires strong segment-specific insight
  Comparison: Wedge-first has lower market breadth but much higher odds of early product-market fit.
  Chosen: Double down on the existing niche wedge
  Why: Signals suggest a defensible angle already exists in the PRD; Concentrated execution increases conversion and retention odds
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
