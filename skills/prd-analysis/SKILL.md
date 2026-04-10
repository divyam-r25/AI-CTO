---
name: prd-analysis
description: "Use when parsing PRDs, extracting features, constraints, personas, assumptions, and hidden requirements before architecture planning."
allowed-tools: Read, Write
---

# PRD Analysis Workflow

## Modes
- Beginner startup: optimize for speed to first validation
- Scalable startup: optimize for balanced velocity and scale-readiness
- Enterprise: optimize for governance, reliability, and compliance

## Input
- Raw PRD markdown or plain text

## Output
- Structured analysis package for system-design skill
- Must include mode context, assumptions, open questions, and decision cards

## Decision Framework (Hard Constraint)
For every recommendation:
- Give exactly two alternatives
- Compare both alternatives with clear tradeoffs
- Choose the best option
- Explain why the chosen option wins

No recommendation is valid without this sequence.

## Required Analysis Fields
1. Problem statement and target users
2. Must-have features vs optional features
3. Non-functional constraints (latency, compliance, budget, team)
4. Assumption register and open questions
5. Decision cards (alternatives, comparison, chosen, why)

## Failure Pre-Check
- Assume this product can fail due to weak assumptions
- Identify the weakest assumptions already visible in the PRD
- Flag early pivots for architecture planning

## Structured Output Format (Hard Constraint)
# 🏗️ Architecture
# 📁 Folder Structure
# 🗺️ Roadmap
# ⚠️ Risks
# 💀 Failure Prediction
# 💡 Improvements

## Skill Chain
PRD -> Analysis -> Architecture -> Roadmap -> Risks -> Cost

Output must be directly consumable by the next skill.
