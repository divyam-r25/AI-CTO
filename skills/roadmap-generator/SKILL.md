---
name: roadmap-generator
description: "Use when generating phased execution plans, priorities, dependencies, timelines, milestones, and release readiness checklists."
allowed-tools: Read, Write
---

# Roadmap Generator Workflow

## Modes
- Beginner startup: shortest path to validated launch
- Scalable startup: phased rollout with targeted hardening
- Enterprise: gate-driven release sequence with compliance and reliability checkpoints

## Input
- Architecture package from system-design

## Output
- Roadmap package consumed by risk-simulation
- Must include phases, dependencies, milestones, and sequencing decision cards

## Decision Framework (Hard Constraint)
For each sequencing recommendation:
- Give two sequencing alternatives
- Compare impact on timeline, risk, and cost
- Choose one sequence
- Explain why it is optimal for the current mode

## Required Roadmap Fields
1. Phases and timeline
2. Milestones and acceptance criteria
3. Dependency map and critical path
4. Testing and release readiness checks
5. Decision cards for sequencing choices

## Failure-Aware Sequencing Check
- Assume launch fails because sequence is wrong
- Identify brittle ordering assumptions
- Add contingency paths for high-risk milestones

## Structured Output Format (Hard Constraint)
# 🏗️ Architecture
# 📁 Folder Structure
# 🗺️ Roadmap
# ⚠️ Risks
# 💀 Failure Prediction
# 💡 Improvements

## Skill Chain
PRD -> Analysis -> Architecture -> Roadmap -> Risks -> Cost

Output must preserve risk-related fields required by risk-simulation.
