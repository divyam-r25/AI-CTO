# 🏗️ Architecture
The system uses a modular product surface, policy-driven APIs, and observable execution paths designed to force explicit tradeoff decisions before scale.
- Mode: Beginner Startup
- Mode Priorities: Ship fast to validate a narrow value proposition; Use defaults and managed services to reduce setup time; Avoid architecture complexity before product pull is proven
- Mode Guardrails: Set hard monthly spend caps; Delay custom infrastructure until repeat usage is proven; Treat differentiation as a release gate
- Frontend: Flutter mobile app for core experience with a lightweight web shell for acquisition and onboarding
- Backend: Typed Node APIs with queue-backed workers and realtime delivery channel safeguards
- Data: Firebase-managed data primitives for MVP speed, with migration checkpoints defined early
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
  Option 1: Next.js | Pros: Fast web deployment and SEO; Unified frontend/backend workflow | Cons: Less native mobile depth; Advanced mobile interactions need more effort
  Option 2: Flutter | Pros: Strong cross-platform mobile UX; Better control for device features | Cons: Web SEO is weaker; Backend integration and web support add overhead
  Comparison: Choose Flutter only when mobile-native UX is core; otherwise choose Next.js for speed and web reach.
  Chosen: Flutter
  Why: Mobile-heavy requirement benefits from native-like UX and offline control; Single codebase accelerates iOS and Android parity for MVP
- [architecture] Data Platform Decision
  Context: Speed vs control for backend data layer
  Option 1: Firebase | Pros: Fastest setup path; Managed auth and realtime building blocks | Cons: Relational query constraints; Potential lock-in at growth stage
  Option 2: Supabase | Pros: Postgres-native model; Better portability and SQL ecosystem | Cons: Needs stronger schema discipline; Realtime tuning required at high scale
  Comparison: Firebase wins for extreme speed; Supabase wins for scale portability and data control.
  Chosen: Firebase
  Why: Managed primitives can cut setup time for early MVP; Minimal operational burden for tiny teams
- [architecture] AI Provider Strategy Decision
  Context: Model reliability and vendor risk posture
  Option 1: Single API provider | Pros: Fastest initial integration; Lowest operational complexity | Cons: High lock-in and outage exposure; Less leverage on pricing
  Option 2: Self-hosted open model stack | Pros: Potential long-run cost savings; More control over data | Cons: High ops burden; Model maintenance and reliability complexity
  Comparison: Hybrid routing balances speed, resilience, and economics better than single-path strategies.
  Chosen: Hybrid provider strategy
  Why: Protects against single-vendor outages and abrupt pricing shifts; Enables quality-latency-cost policy routing per request type

Skill Chain: PRD -> Analysis -> Architecture -> Roadmap -> Risks -> Cost
