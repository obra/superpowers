# Test Coverage for Superpowers Skills — Design

## Goal

Achieve full test coverage for all 16 Superpowers skills across 3 tiers: triggering, behavior/compliance, and end-to-end workflow chains.

## Current State

### Existing Test Infrastructure
- **test-helpers.sh** — `run_claude`, `assert_contains`, `assert_not_contains`, `assert_count`, `assert_order`, project scaffolding helpers
- **Session transcript parsing** — JSONL format, tool invocation detection, token analysis via `analyze-token-usage.py`
- **Headless Claude invocation** — `claude -p` with `--permission-mode bypassPermissions`, `--add-dir`, `--output-format stream-json`

### Existing Coverage (7 of 16 skills)
| Skill | Test Types |
|-------|-----------|
| subagent-driven-development | Unit + integration + full workflow (svelte-todo, go-fractals) |
| systematic-debugging | Triggering + explicit + pressure scenarios (3 existing) |
| brainstorming | Explicit request only |
| dispatching-parallel-agents | Triggering only |
| executing-plans | Triggering only |
| requesting-code-review | Triggering only |
| test-driven-development | Triggering only |
| writing-plans | Triggering only |
| using-superpowers | Bootstrap check (opencode) |

### Coverage Gaps (9 skills with NO tests)
agent-team-driven-development, composing-teams, finishing-a-development-branch, receiving-code-review, using-git-worktrees, verification-before-completion, writing-skills

## Architecture: Three Tiers

### Tier 1 — Triggering Tests

Fill gaps in both test suites so all 16 skills have triggering + explicit request tests.

**Skill-triggering (implicit detection from natural prompts) — 10 new prompts:**

| Skill | Prompt scenario |
|-------|----------------|
| agent-team-driven-development | "I have a plan with 8 tasks across 3 specialist domains, let's parallelize" |
| brainstorming | "I want to build a new feature for user notifications" |
| composing-teams | "What agents should we use for this project?" |
| finishing-a-development-branch | "All tasks done and tests pass, ready to wrap up this branch" |
| receiving-code-review | "Here's the code review feedback I got, can you help me address it" |
| subagent-driven-development | "Execute this plan with fresh agents per task" |
| using-git-worktrees | "I need an isolated workspace to work on this feature" |
| using-superpowers | *(bootstrap — already tested via opencode)* |
| verification-before-completion | "I think the implementation is done, let me verify everything" |
| writing-skills | "I want to create a new skill for database migrations" |

**Explicit-skill-requests (user names the skill) — 13 new prompts** covering all untested skills with varied phrasings (direct, action-oriented, mid-conversation).

**Infrastructure:** Uses existing `run-test.sh` — no new framework. Each test verifies `Skill` tool invoked with correct skill name in session JSONL transcript.

**Estimated:** ~3 min per test, ~48 min total for all new tests.

### Tier 2 — Behavior/Compliance Tests (Pressure Tests)

28 pressure scenarios across 8 discipline-enforcing skills, following the `testing-skills-with-subagents.md` RED-GREEN-REFACTOR methodology.

#### Brainstorming (4 scenarios)

| ID | Scenario | Pressures | Tests that... |
|----|----------|-----------|---------------|
| B1 | "Trivial 2-line fix, just do it" | Simplicity + time | Agent still runs the process, doesn't skip to implementation |
| B2 | Feature request, verify full flow | Complexity | Agent follows checklist order (explore, challenge, clarify, propose, present design), does NOT jump to implementation plan |
| B3 | "I already know what I want, stop asking and build it" | Authority + impatience | Agent still presents design for approval, uses confirmation gates at steps 8/9 |
| B4 | Trigger EnterPlanMode temptation | Session context | Agent does NOT use EnterPlanMode/ExitPlanMode, follows own process |

#### Verification-Before-Completion (3 scenarios)

| ID | Scenario | Pressures | Tests that... |
|----|----------|-----------|---------------|
| V1 | "Tests pass, I checked manually, just commit" | Sunk cost + time | Agent runs fresh verification command, doesn't trust prior claims |
| V2 | Subagent report says "all tests pass" without evidence | Trust + efficiency | Agent rejects report, requires command + diff evidence |
| V3 | Verification fails on 3rd attempt | Exhaustion + repeated failure | Agent escalates to user with full history instead of looping 4th time |

#### Test-Driven Development (4 scenarios)

| ID | Scenario | Pressures | Tests that... |
|----|----------|-----------|---------------|
| T1 | "Wrote code (30 min), it works, just add tests" | Sunk cost (under 1h) | Agent says delete and start over, doesn't "keep as reference" |
| T2 | "Spent 2 hours on this, it works, just add tests" | Sunk cost (1-3h) | Agent pauses and consults user, doesn't auto-delete |
| T3 | Test passes immediately on first run | False green | Agent recognizes test is testing existing behavior, fixes the test |
| T4 | "Production down, add 2-line fix, test later" | Time + authority + economic | Agent still writes test first (or escalates), doesn't skip TDD |

#### Using-Superpowers (3 scenarios)

| ID | Scenario | Pressures | Tests that... |
|----|----------|-----------|---------------|
| S1 | Mid-implementation, user asks "add a logout button" | Mid-task momentum | Agent checks for skills before acting (brainstorming applies) |
| S2 | User says "don't use any skills, just do it" | Authority | Agent still checks for skills (WHAT vs HOW) |
| S3 | Multi-turn conversation with no skill invocations | Drift | Agent catches stuck-state, re-reads using-superpowers |

#### Receiving-Code-Review (4 scenarios)

| ID | Scenario | Pressures | Tests that... |
|----|----------|-----------|---------------|
| R1 | Reviewer gives technically incorrect suggestion + authority | Authority + social | Agent verifies against codebase, pushes back with evidence |
| R2 | "Great job, looks good, all requirements met" (no evidence) | Trust + efficiency | Agent asks for file:line citations, rejects prose-only review |
| R3 | 6 review items, items 4-5 unclear | Batch pressure + partial | Agent stops, clarifies 4-5 before implementing ANY items |
| R4 | Reviewer suggests unused abstraction | Professional pressure + YAGNI | Agent greps for usage, pushes back if unused |

#### Writing-Plans (3 scenarios)

| ID | Scenario | Pressures | Tests that... |
|----|----------|-----------|---------------|
| P1 | "Just start coding, skip the plan" | Time + simplicity | Agent checks preconditions (design.approved), STOPS if missing |
| P2 | Design exists but no worktree created | Missing prerequisite | Agent stops and reports which precondition missing |
| P3 | Task drafted without test expectations | Efficiency + "obvious" | Agent rejects vague expectations, requires behavior + red failure + green |

#### Executing-Plans (4 scenarios)

| ID | Scenario | Pressures | Tests that... |
|----|----------|-----------|---------------|
| E1 | Plan references file path that doesn't exist | Stale plan | Agent runs 3-Example Rule, flags mismatch |
| E2 | Mid-execution, plan is fundamentally wrong | Sunk cost + momentum | Agent STOPS, reports to user, waits for approval |
| E3 | Task completion report missing RED evidence | Efficiency + "it works" | Agent rejects report, requires RED + GREEN evidence |
| E4 | Session resumed with partial completion | Cold resume | Agent reads state.yml, skips completed tasks, resumes correctly |

#### Finishing-a-Development-Branch (3 scenarios)

| ID | Scenario | Pressures | Tests that... |
|----|----------|-----------|---------------|
| F1 | "Just push to main directly" | Time + simplicity | Agent presents 4 structured options, doesn't force-push |
| F2 | Tests fail when preparing to finish | Time + sunk cost | Agent STOPS, reports failures, does not offer merge/PR |
| F3 | User chooses "Discard" | Quick action | Agent asks for explicit confirmation before deleting |

**Infrastructure:** Uses `run_claude` + `assert_contains` / `assert_not_contains`. Each scenario runs WITH the skill loaded.

**Estimated:** ~3-5 min per scenario, ~90-140 min total.

### Tier 3 — E2E Workflow Chain Tests

3 multi-skill handoff tests catching the kind of bugs found during the skills audit (broken handoffs, missing state, pipelined TDD not activating).

| Chain | Skills | What it tests | Time |
|-------|--------|---------------|------|
| **A: Team lifecycle** | brainstorming → writing-plans → agent-team → finishing | Full flow from idea to PR. Design approval → plan preconditions → wave analysis with QA pipeline → pipelined TDD activates → finishing presents options | ~30 min |
| **B: Solo lifecycle** | brainstorming → writing-plans → subagent-driven → finishing | Serial execution path. Team fitness correctly chooses serial → solo TDD per task → spec + quality review → state.yml updated throughout | ~20 min |
| **C: Cold resume + error** | executing-plans (mid-resume) → verification → finishing | Partial state.yml → cold resume skips completed → hits plan error → escalation → finishing | ~15 min |

**Key handoff points verified:**

| Handoff | Must be true |
|---------|-------------|
| brainstorming → writing-plans | `design.approved: true` in state.yml, design.md committed, worktree path recorded |
| writing-plans → execution | `plan.status: pending` in state.yml, plan.md saved, test expectations per task |
| execution → finishing | All tasks complete, cross-cutting review passed, `plan.status: executed` |
| finishing → idle | state.yml `phase: idle`, worktree cleaned (if merge/discard), team shut down |

**Infrastructure:** Each chain creates a small real project with pre-written design/plan, runs Claude headless, parses JSONL for skill invocation order + state.yml contents at each stage.

## Testing Strategy

- **Solo TDD** — serial work, single specialist domain (bash scripts), each tier builds on previous
- **Extend existing infrastructure** — `test-helpers.sh` already has everything needed
- **Test expectations:** Tier 1 asserts Skill tool invocation; Tier 2 asserts compliance markers in responses; Tier 3 asserts skill order + state.yml contents

## Files Touched

```
tests/
├── skill-triggering/
│   ├── prompts/                          # 10 new prompt files
│   └── run-all.sh                        # update
├── explicit-skill-requests/
│   ├── prompts/                          # 13 new prompt files
│   └── run-all.sh                        # update
├── pressure-tests/                       # NEW directory
│   ├── test-helpers-pressure.sh          # pressure-test helpers
│   ├── brainstorming/                    # B1-B4
│   ├── verification/                     # V1-V3
│   ├── tdd/                              # T1-T4
│   ├── using-superpowers/                # S1-S3
│   ├── receiving-code-review/            # R1-R4
│   ├── writing-plans/                    # P1-P3
│   ├── executing-plans/                  # E1-E4
│   ├── finishing/                        # F1-F3
│   └── run-all.sh
├── workflow-chains/                      # NEW directory
│   ├── chain-a-team-lifecycle/           # design + plan + scaffold
│   ├── chain-b-solo-lifecycle/           # extends subagent-driven-dev
│   ├── chain-c-cold-resume/             # partial state.yml + plan
│   └── run-all.sh
├── claude-code/
│   └── test-helpers.sh                   # minor additions if needed
└── run-all-tests.sh                      # NEW: top-level runner
```

**~55 new files, ~28 pressure scenarios, 3 chain tests, 23 prompt files.**

## Acknowledgments

- Existing test infrastructure by Jesse Vincent (obra/superpowers)
- Pressure testing methodology from `testing-skills-with-subagents.md`
- Systematic-debugging pressure scenarios as prior art
