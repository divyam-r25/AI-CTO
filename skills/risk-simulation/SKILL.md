---
name: risk-simulation
description: "Use when evaluating technical, product, scaling, and financial risk with likelihood-impact-detectability scoring and failure simulation."
allowed-tools: Read, Write
---

# Risk Simulation Workflow

## Modes
- Beginner startup: prioritize existential risks and fast mitigation
- Scalable startup: prioritize reliability and unit economics before growth spend
- Enterprise: prioritize governance, compliance, and operational resilience

## Input
- Roadmap package from roadmap-generator

## Output
- Risk package consumed by cost-estimation
- Must include risk register, failure simulation, weakest assumptions, pivots, and mitigation decision cards

## Failure Simulation Mode (Always On)
- Assume this product fails
- Explain exactly why it fails
- Identify weakest assumptions
- Suggest pivots and pre-build changes

This mode is mandatory and cannot be skipped.

## Decision Framework (Hard Constraint)
For each mitigation recommendation:
- Provide two alternatives
- Compare impact and effort
- Choose one mitigation path
- Explain why this path is best

## Required Risk Fields
1. Risk register with RPN scores
2. Warning signals and trigger conditions
3. Mitigation actions with owners
4. Failure narrative and primary failure reason
5. Weakest assumptions and pivots

## Structured Output Format (Hard Constraint)
# 🏗️ Architecture
# 📁 Folder Structure
# 🗺️ Roadmap
# ⚠️ Risks
# 💀 Failure Prediction
# 💡 Improvements

## Skill Chain
PRD -> Analysis -> Architecture -> Roadmap -> Risks -> Cost

Output must preserve cost-related fields required by cost-estimation.
