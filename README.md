# AI CTO Agent

AI CTO Agent is a production-grade planning system that transforms a PRD into:

- Architecture and stack recommendations
- Folder structure and implementation blueprint
- 7-day execution roadmap
- Risk simulation with failure scenarios
- Cost forecasts across growth tiers
- Build recommendation with confidence

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
	"mode": "conservative | balanced | aggressive"
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

## Repository Map

- agent.yaml: Agent registration metadata
- SOUL.md: Agent identity and communication principles
- RULES.md: Hard constraints for response quality
- skills/: Capability modules for PRD analysis, architecture, roadmap, risk, and cost
- src/lib/analysis-engine.ts: Core planning and simulation logic
- src/app/api/analyze/route.ts: Typed analysis API
- docs/: Architecture, roadmap, risk, cost, and demo script docs
- examples/sample-prd.md: Demo-ready PRD input

## Demo Flow

1. Paste PRD into UI
2. Select simulation mode
3. Generate CTO Plan
4. Walk judges through architecture, roadmap, and risk/failure simulation sections
5. Close with cost forecast and recommendation verdict

Detailed script: docs/demo-script.md.

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
