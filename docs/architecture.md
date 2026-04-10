# AI CTO Agent Architecture

## Overview
The application uses a Next.js full-stack approach where UI and API route handlers are colocated in one deployable app.

## Request Flow
1. User submits PRD and simulation mode from the UI.
2. API route validates payload.
3. Analysis engine performs requirement extraction and strategy generation.
4. Structured report is returned to UI for rendering.

## Components
- Frontend: interactive dashboard for PRD input and report visualization
- API: typed route handler at /api/analyze
- Domain Engine: deterministic analysis modules for architecture, roadmap, risk, and cost
- Knowledge Artifacts: agent.yaml, SOUL.md, RULES.md, and skills modules

## Scalability Path
- Move heavy analysis steps to background queue workers.
- Add persistence for historical report runs.
- Integrate model provider abstraction for LLM-assisted enhancements.
