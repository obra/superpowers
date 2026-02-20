# Superpowers — SDLC Orchestration Fork

## SDLC Orchestration Extension

This fork adds SDLC orchestration with severity-based judgment gates on top of Superpowers.

### Added Commands
- `/orchestrate` — Run the full SDLC pipeline (PM discovery → brainstorm → plan → implement → review → ship)
- `/scaffold` — Generate project scaffolding from YAML templates

### Added Skills (in ~/.claude/skills/)
- `orchestration` — Pipeline management, stage dispatch, gate logic
- `judgment-gates` — Decision presentation, visual artifacts, decision persistence
- `pm-discovery` — 6-phase PM discovery workflow (ported from pm-artifacts plugin)
- `scaffolding` — Project type templates and generation engine
- `context-management` — Context scoping and model routing rules

### Added Agents (in ~/.claude/agents/)
- `orchestrator` (opus) — Pipeline conductor
- `verifier` (sonnet) — Anti-rationalization checker, P1/P2/P3 classification
- `humanizer` (sonnet) — Strips AI patterns from human-facing output
- `market-researcher` (sonnet) — Web research for PM discovery Phase B
- `artifact-generator` (sonnet) — PM artifact generation

### Pipeline Configuration
Each project defines its pipeline in `docs/pm/pipeline.yaml`. The orchestrator reads this file to determine stage sequence, gate severity levels, and artifact dependencies.

### Design Philosophy
1. Judgment before tools — severity gates surface decisions that matter
2. Research before ask — exhaust automated research before asking the human
3. Verify before trust — anti-rationalization verification at every stage
4. Amplification not replacement — the human validates and refines, not provides
