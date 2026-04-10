---
name: cost-estimation
description: "Use when estimating API, infrastructure, data, and observability costs across usage tiers with optimization levers and budget risks."
allowed-tools: Read, Write
---

# Cost Estimation Workflow

## Modes
- Beginner startup: minimize burn while keeping quality acceptable
- Scalable startup: optimize unit economics and growth resilience
- Enterprise: optimize compliance-grade reliability with predictable spend

## Input
- Risk package from risk-simulation

## Output
- Final cost plan and improvement package
- Must include cost optimizer decisions and markdown artifact writes

## Decision Framework (Hard Constraint)
For each cost recommendation:
- Give two alternatives
- Compare cost, reliability, and complexity tradeoffs
- Choose one best option
- Explain why it wins for the selected mode

## Required Cost Fields
1. Cost assumptions and usage tiers
2. Prototype, early-traction, and growth estimates
3. Top cost driver per tier
4. Cost optimizer decisions with alternatives/comparison/chosen/why
5. Budget risk thresholds and alerts

## Failure-Aware Cost Check
- Assume the product fails because unit economics break
- Identify cost assumptions most likely to fail
- Add cheaper pivot options that preserve core value

## Structured Output Format (Hard Constraint)
# 🏗️ Architecture
# 📁 Folder Structure
# 🗺️ Roadmap
# ⚠️ Risks
# 💀 Failure Prediction
# 💡 Improvements

## Skill Chain
PRD -> Analysis -> Architecture -> Roadmap -> Risks -> Cost

Final output must write repo artifacts including `docs/architecture.md`, `docs/roadmap.md`, and `docs/risks.md`.
