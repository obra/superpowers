---
status: pending
---

# Test Coverage Implementation Plan

> See [design](design.md) for context, rationale, and detailed scenario tables.
> **For Claude:** Use `superpowers:agent-team-driven-development` to execute this plan.

**Goal:** Achieve full test coverage for all 16 Superpowers skills across 3 tiers: triggering, behavior/compliance, and end-to-end workflow chains.

**Architecture:** Extend existing test infrastructure (`test-helpers.sh`, `run-test.sh` scripts, JSONL transcript parsing) with new prompt files, pressure test scenarios, and E2E chain tests. Each tier builds on the previous — Tier 1 verifies skills load, Tier 2 verifies discipline under pressure, Tier 3 verifies multi-skill handoffs.

**Tech Stack:** Bash test scripts, Claude CLI headless mode (`claude -p`), JSONL session transcript parsing, `jq` for JSON extraction.

**Worktree:** `/home/rahulsc/Projects/Superpowers/.claude/worktrees/test-coverage` (branch: `worktree-test-coverage`)

---

## Tasks

1. [Tier 1: Skill Triggering Prompts](tasks/01-tier1-triggering-prompts.md)
2. [Tier 1: Explicit Skill Request Prompts](tasks/02-tier1-explicit-request-prompts.md)
3. [Tier 2: Pressure Test Infrastructure](tasks/03-tier2-pressure-infrastructure.md)
4. [Tier 2: Pressure — Brainstorming + Verification](tasks/04-tier2-pressure-brainstorming-verification.md)
5. [Tier 2: Pressure — TDD + Using-Superpowers](tasks/05-tier2-pressure-tdd-superpowers.md)
6. [Tier 2: Pressure — Code-Review + Finishing](tasks/06-tier2-pressure-review-finishing.md)
7. [Tier 2: Pressure — Writing-Plans + Executing-Plans](tasks/07-tier2-pressure-plans.md)
8. [Tier 3: E2E Workflow Chains A + B](tasks/08-tier3-chains-ab.md)
9. [Tier 3: E2E Chain C + Top-Level Runner](tasks/09-tier3-chain-c-runner.md)

## Wave Analysis

### Specialists

| Role | Expertise | Tasks |
|------|-----------|-------|
| test-writer-1 | Bash test scripts, JSONL parsing, prompt design | Tasks 1, 4, 7 |
| test-writer-2 | Bash test scripts, JSONL parsing, prompt design | Tasks 2, 5, 8 |
| test-writer-3 | Bash test scripts, JSONL parsing, prompt design | Tasks 3, 6, 9 |
| qa-engineer | Test quality review, coverage gap analysis | Reviews between waves |

### Waves

**Wave 1: Foundation — Tier 1 prompts + pressure infrastructure**
- Task 1 (test-writer-1) — 9 new skill-triggering prompt files + update run-all.sh
- Task 2 (test-writer-2) — 13 new explicit-request prompt files + update run-all.sh
- Task 3 (test-writer-3) — Pressure test helpers, directory scaffold, run-all.sh

  *Parallel-safe because:* Task 1 touches `tests/skill-triggering/`, Task 2 touches `tests/explicit-skill-requests/`, Task 3 touches `tests/pressure-tests/` — no overlap.

**Wave 2: Tier 2 batch 1 — 21 pressure scenarios** — needs Wave 1 Task 3 (infrastructure)
- Task 4 (test-writer-1) — Brainstorming B1-B4 + Verification V1-V3 (7 scenarios)
- Task 5 (test-writer-2) — TDD T1-T4 + Using-Superpowers S1-S3 (7 scenarios)
- Task 6 (test-writer-3) — Receiving-Code-Review R1-R4 + Finishing F1-F3 (7 scenarios)

  *Parallel-safe because:* Each task writes to its own skill subdirectories under `tests/pressure-tests/` — no shared files. All depend on Task 3's `test-helpers-pressure.sh` (read-only dependency).

**Wave 3: Tier 2 remainder + Tier 3 chains** — needs Wave 1 Task 3 (infrastructure)
- Task 7 (test-writer-1) — Writing-Plans P1-P3 + Executing-Plans E1-E4 (7 scenarios)
- Task 8 (test-writer-2) — E2E chain A (team lifecycle) + chain B (solo lifecycle)
- Task 9 (test-writer-3) — E2E chain C (cold resume) + top-level `run-all-tests.sh`

  *Parallel-safe because:* Task 7 touches `tests/pressure-tests/writing-plans/` and `tests/pressure-tests/executing-plans/`, Task 8 touches `tests/workflow-chains/chain-a*/` and `chain-b*/`, Task 9 touches `tests/workflow-chains/chain-c*/` and `tests/run-all-tests.sh`.

### Dependency Graph

```
Task 1 ─────────────────────────────────────→ (done)
Task 2 ─────────────────────────────────────→ (done)
Task 3 ──→ Task 4 ──→ (done)
       ──→ Task 5 ──→ (done)
       ──→ Task 6 ──→ (done)
       ──→ Task 7 ──→ (done)
       ──→ Task 8 ──→ (done)
       ──→ Task 9 (also needs Tasks 1-8 for run-all-tests.sh)
```

## Test Expectations Summary

| Task | What to test | Expected red failure |
|------|-------------|----------------------|
| 1 | 9 new prompts trigger correct skills | `run-test.sh` exits non-zero, "FAIL: Skill X was NOT triggered" |
| 2 | 13 new prompts invoke correct skills | `run-test.sh` exits non-zero, "FAIL: Skill X was NOT triggered" |
| 3 | Pressure helpers source correctly, scaffold exists | `source test-helpers-pressure.sh` fails, directories missing |
| 4 | Brainstorming follows process under pressure; verification rejects unverified claims | `assert_contains` fails on expected compliance markers |
| 5 | TDD enforced under sunk-cost; superpowers checked despite user override | `assert_contains` fails on expected compliance markers |
| 6 | Code review verified against codebase; finishing presents options | `assert_contains` fails on expected compliance markers |
| 7 | Plan preconditions checked; execution rejects missing evidence | `assert_contains` fails on expected compliance markers |
| 8 | Chain A: skill invocation order brainstorming→writing-plans→agent-team→finishing; Chain B: solo lifecycle | grep for skill order in JSONL fails |
| 9 | Chain C: cold resume from partial state; run-all-tests.sh orchestrates all tiers | grep for resume behavior fails; runner exits non-zero |
