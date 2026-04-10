---
name: system-design
description: "Use when generating architecture, stack recommendations, and component diagrams with tradeoff reasoning and scalability posture."
allowed-tools: Read, Write
---

# System Design Workflow

## Modes
- Beginner startup: managed defaults, minimal operational overhead
- Scalable startup: modular architecture with clear upgrade path
- Enterprise: policy-driven architecture with auditability and reliability gates

## Input
- Structured analysis package from prd-analysis

## Output
- Architecture package consumed by roadmap-generator
- Must include stack decisions, folder structure, and architecture decision cards

## Decision Framework (Hard Constraint)
For each architecture suggestion:
- Provide two alternatives
- Compare them on speed, risk, cost, and lock-in
- Select one best option
- Explain why it wins in the selected mode

## Required Design Fields
1. Architecture overview and component boundaries
2. Frontend/backend/data/integration strategy
3. Folder structure plan
4. Decision cards for stack choices
5. Reliability and security baseline

## Failure-Aware Design Check
- Assume architecture can fail under growth pressure
- Identify likely bottlenecks and brittle assumptions
- Add mitigation hooks before roadmap handoff

## Structured Output Format (Hard Constraint)
# 🏗️ Architecture
# 📁 Folder Structure
# 🗺️ Roadmap
# ⚠️ Risks
# 💀 Failure Prediction
# 💡 Improvements

## Skill Chain
PRD -> Analysis -> Architecture -> Roadmap -> Risks -> Cost

Output must preserve fields required by roadmap-generator.
