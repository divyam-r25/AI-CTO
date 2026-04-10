# AI CTO Agent

AI CTO Agent is a production-grade planning system that transforms a PRD into:

- Architecture and stack recommendations
- Folder structure and implementation blueprint
- 7-day execution roadmap
- Risk simulation with failure scenarios
- Cost forecasts across growth tiers
- Build recommendation with confidence
- Explicit decision cards with alternatives and chosen direction
- Brutal failure simulation with weakest assumptions and pivots
- Mode-aware strategy profiles (Beginner Startup, Scalable Startup, Enterprise)
- Multi-pass self-critique loop (initial plan -> critique -> revised plan)
- Investment perspective and MVP vs Scale execution split
- Generated markdown artifacts in docs/generated

## Why It Is Different

This project focuses on decision quality, not only generation quality.
The built-in Risk Simulation module predicts what can fail and why before implementation starts.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4 + custom design system
- Route handler API at /api/analyze
- Deterministic domain engine in src/lib

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Production Commands

```bash
npm run lint
npm run test:contracts
npm run build
npm run start
```

## API Contract

Endpoint:

```text
POST /api/analyze
```

Request body:

```json
{
	"prd": "string, minimum 30 chars",
	"mode": "beginner-startup | scalable-startup | enterprise",
	"honestyMode": "standard | brutal",
	"writeFiles": true
}
```

Response:

```json
{
	"success": true,
	"generatedAt": "ISO_DATE",
	"result": {
		"productName": "...",
		"architecture": {},
		"roadmap": [],
		"risks": [],
		"costs": [],
		"recommendation": {}
	}
}
```

History endpoint:

```text
GET /api/analyze/history?projectId=<optional>&status=<optional>&limit=<optional>&offset=<optional>
```

Returns analysis summaries for dashboard timelines and audit views.

Comparison endpoint:

```text
GET /api/analyze/compare?baseAnalysisId=<id>&headAnalysisId=<id>
```

Returns verdict/confidence/risk/decision deltas between two completed analyses.

## Repository Map

- agent.yaml: Agent registration metadata
- SOUL.md: Agent identity and communication principles
- RULES.md: Hard constraints for response quality
- skills/: Capability modules for PRD analysis, architecture, roadmap, risk, and cost
- src/lib/analysis-engine.ts: Core planning and simulation logic
- src/lib/report-writer.ts: Writes architecture, roadmap, risks, and full report files
- src/app/api/analyze/route.ts: Typed analysis API
- .github/workflows/prd-agent.yml: Runs planner automatically on PR and uploads artifacts
- scripts/run-agent.ts: CLI entrypoint for automation and CI
- docs/: Architecture, roadmap, risk, cost, and demo script docs
- examples/sample-prd.md: Demo-ready PRD input

## Demo Flow

1. Paste PRD into UI
2. Select simulation mode
3. Generate CTO Plan
4. Walk judges through architecture, roadmap, and risk/failure simulation sections
5. Close with cost forecast and recommendation verdict

Detailed script: docs/demo-script.md.

## Real Git Workflow

Every analysis run can write repository artifacts:

- docs/generated/architecture.md
- docs/generated/roadmap.md
- docs/generated/risks.md
- docs/generated/failure-prediction.md
- docs/generated/improvements.md
- docs/generated/report.md
- docs/architecture.md
- docs/roadmap.md
- docs/risks.md

Run from CLI:

```bash
npm run agent:run -- --prd examples/sample-prd.md --mode scalable-startup --honesty brutal
```

## Durable Runtime Storage

Analysis records persist to disk so history survives server restarts.

- Default path: `.data/analysis-store.json`
- Override path: set `AI_CTO_STORE_PATH`

## GitHub PR Integration

Workflow file: .github/workflows/prd-agent.yml

Triggers:

- pull requests touching PRD/skills/source files
- manual workflow dispatch

Behavior:

- auto-detects changed PRD markdown in PRs and runs planner on that file
- falls back to sample PRD when no PRD file change is detected
- runs contract checks for decision/format guarantees
- posts/upserts PR comment with verdict, top risks, and failure reason
- generates markdown plans
- uploads docs/generated artifacts for review

## Deployment

Deploy on Vercel or any Node-compatible platform that supports Next.js.

Recommended environment profile:

- Node 20+
- Build command: npm run build
- Start command: npm run start

## Quality Notes

- Input validation is enforced server-side
- Output schema is stable and sectioned for consistency
- UI is responsive for desktop and mobile with subtle motion and no blocking animations
