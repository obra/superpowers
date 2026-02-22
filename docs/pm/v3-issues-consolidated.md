# Pipeline v3 — Consolidated Issue List

**Created**: 2026-02-22
**Fixed**: 2026-02-22 (all 20 issues + 2 new features)
**Source**: Post-Sudoku MVP evaluation + user feedback session
**Purpose**: One-at-a-time diagnosis reference. Each issue has enough context to diagnose and fix independently.

## Fix Summary (2026-02-22)

All 20 issues fixed. Two additional features added.

| Round | Issues | Changes |
|-------|--------|---------|
| 1 — Architectural | F1, F3, F8 | Intake questionnaire + tier selection; anti-consolidation norm (OS Norm 7); DOA human artifact at each IP |
| 2 — Instrumentation | E1, E2 | SubagentStop: debug log, multi-strategy TASK_RESULT extraction, atomic jq writes; TASK_RESULT contract added to top of all 17 agent files + injected in pre-dispatch hook |
| 3 — Structural | F4, F6 | Skill catalog dispatch (Leads select from catalog by tier); speed/thoroughness bias parameter |
| 4 — Quality gates | E7, E8, E10/E11 | Per-component branch coverage check script; CSS token validation script; UX compliance moved to Iteration 2 (per-component, not batched at IP-3) |
| 5 — Polish | E3, F5, E6, E12-E14 | Iteration plan hard gate; IP skill audit; pod brief auto-summarization alert; lazy directory creation; screenshot dedup; retro overlap note |
| New — Clean context | — | `write-handoff.sh` + updated session-start hook: each IP writes handoff.md; new session auto-loads it |
| New — Self-test | — | `create-hello-world-test.sh` + `run-pipeline-selftest.sh` + `pipeline-self-test` skill: autonomous Hello World pipeline validation |

**Global files modified**: `~/.claude/CLAUDE.md`, all 17 agent files in `~/.claude/agents/`, `~/.claude/skills/orchestration/SKILL.md`, 3 hooks (`session-start`, `subagent-stop`, `pre-dispatch`, `post-dispatch`), 4 new scripts

---

## Tier 1 — Architectural Direction
*From user feedback — these shape everything else*

---

### F1: Adaptive complexity tiers — pipeline should ask intake questions before starting
- **Status**: Fixed (2026-02-22)
- **Source**: User feedback
- **Problem**: The pipeline runs the same heavyweight SAFe process regardless of project complexity. A Sudoku app doesn't need the same process as a production SaaS platform.
- **Direction**: Before starting, the orchestrator should ask a short intake questionnaire (speed of delivery, production-grade vs MVP, audience, timeline, budget estimate) and select a complexity tier:
  - (a) **Lightweight** — Claude Code plans + simple design + ship
  - (b) **Standard** — SAFe-lite
  - (c) **Full** — comprehensive SAFe
  The tier determines which artifacts are required, how many sync rounds happen, and budget allocation.
- **Impact**: Every other issue is affected by this — if the tier is "lightweight", most artifact/sync issues become irrelevant.

---

### F3: LLM consolidation bias — agents merge info for the sake of merging
- **Status**: Fixed (2026-02-22)
- **Source**: User feedback
- **Problem**: Agents sometimes consolidate information into summary documents that lose the specific, actionable details. The synthesis step can dilute rather than sharpen.
- **Direction**: Add to the AI Employee Framework: "Synthesize only when the synthesis produces a new insight. If the original artifacts are more useful than the summary, link to them instead of restating them. Never consolidate for the sake of consolidation."
- **Impact**: Operating norm addition. Small change, applied globally.

---

### F4: Skill-based teams instead of fixed employee rosters
- **Status**: Fixed (2026-02-22)
- **Source**: User feedback
- **Problem**: Each Lead has a fixed list of IC agents (domain-researcher, market-researcher, etc.). This is rigid — the Lead can't adapt the team composition to the project's needs.
- **Direction**: Leads receive a set of available skills (not fixed employees). The Lead decides which skills to invoke based on objectives. A simple app might need 2 skills; a complex one might need 8. Budget is allocated to skills/tasks, not headcount. Each skill has a complexity rating that informs budget allocation.
- **Impact**: Requires rewriting Lead agent dispatch logic from "dispatch named agent X" to "select from skill catalog based on objective."

---

### F5: IP Iteration skill audit — Leads evaluate and evolve their skill catalog
- **Status**: Fixed (2026-02-22)
- **Source**: User feedback
- **Problem**: Skills are static across PIs. There's no mechanism for Leads to evaluate which skills were useful, propose new skills, or retire unused ones.
- **Direction**: In the IP Iteration, Product Lead (or each Lead) audits their skill usage: which skills were invoked, which produced high-value output, which were skipped. Output: skill effectiveness report + proposals for new skills (find online, design custom, or optimize existing). This compounds across PIs.
- **Dependencies**: F4 (skill-based teams) should be implemented first.

---

### F6: Speed over correctness — planning stages take too long
- **Status**: Fixed (2026-02-22)
- **Source**: User feedback
- **Problem**: The coordination stages consume disproportionate tokens and wall-clock time. The system tries to be comprehensive rather than fast. In early PIs especially, speed of learning matters more than quality of planning.
- **Direction**: Add a "bias" parameter (speed vs thoroughness) that affects: number of sync rounds, brief length expectations, whether cross-pollination (C2) is required or optional, token budget for planning vs execution. Default to speed-biased for early iterations.
- **Dependencies**: Ties directly to F1 (tier selection) and F8 (overlapping work during syncs).

---

### F8: Human artifacts agent — DOA (Deliverable of Artifacts)
- **Status**: Fixed (2026-02-22)
- **Source**: User feedback
- **Problem**: After each iteration, there's no consolidated human-readable summary. The Founder has to dig through sync resolutions, retros, and pipeline.json to understand what happened.
- **Direction**: Create a dedicated "DOA agent" (or orchestrator responsibility) that produces a concise human-facing artifact after each Integration Point: what was decided, what was built, what's next, what risks remain. Not bound by team budget — this is orchestrator overhead. Alternatively, integrate with a PM tool as the human review surface.
- **Impact**: Small implementation; high human value. Can be done independently of other changes.

---

## Tier 2 — Instrumentation Failures
*Broken v3 machinery — must fix for v3 to work*

---

### E1: Hook system did not write task-level state to pipeline.json
- **Status**: Fixed (2026-02-22)
- **Source**: Evaluation
- **Problem**: Every task entry has `tokens: 0, key_outputs: [], artifacts: []`. The SubagentStop hook either didn't fire or failed silently. Iteration-level `budget_consumed` has numbers but task-level is all zeros. Iteration 3 is marked "complete" but all tasks show "pending."
- **Diagnosis needed**:
  - (a) Check if SubagentStop hook fires at all (add a log line)
  - (b) Check if TASK_RESULT parsing regex works on actual agent output
  - (c) Check if the Task tool dispatch path triggers SubagentStop events
  - (d) Check if jq writes succeed (temp file race condition possible)
- **Impact**: Until this works, token tracking, budget enforcement, and velocity metrics are all dark.

---

### E2: TASK_RESULT blocks dropped after Iteration 1
- **Status**: Fixed (2026-02-22)
- **Source**: Evaluation
- **Problem**: TASK_RESULT present in PI planning + Iteration 1, absent from Iterations 2 and 3. The contract is in the agent files but agents forgot it mid-run.
- **Root cause**: Agent context window fills up; instructions from the agent file get pushed out. The TASK_RESULT contract is at the bottom of the file (pipeline:v3 section), and long task context crowds it out.
- **Fix**:
  - (a) Move TASK_RESULT instruction to the TOP of each agent file (before the body content)
  - (b) Include it in the dispatch prompt template (not just agent file)
  - (c) Have the PreToolUse hook inject a TASK_RESULT reminder in every dispatch
- **Impact**: Without TASK_RESULT blocks, the SubagentStop hook can't update state even if it fires.

---

### E3: Iteration plans directory is empty
- **Status**: Fixed (2026-02-22)
- **Source**: Evaluation
- **Problem**: `docs/pm/iteration-plans/` has zero files. The orchestrator was supposed to dispatch each Lead to write an iteration plan before work began. It didn't happen for any iteration.
- **Fix**: Make iteration plan creation a hard gate — orchestrator checks for `iteration-{N}-plan.md` existence before dispatching any parallel work. If missing, dispatch Lead to write it first.
- **Impact**: Medium — the work happened without plans, but the plans would have improved budget allocation and caught scope issues earlier.

---

## Tier 3 — Protocol Decay
*Process worked initially, degraded over time*

---

### E4: Iteration 2 sync briefs compressed 10x (12–21K → 1.2–1.8K)
- **Status**: Fixed (2026-02-22)
- **Source**: Evaluation
- **Problem**: The converge-diverge protocol was fully executed in Iteration 1 but reduced to lightweight status summaries in Iteration 2. C2 cross-pollination may have been skipped entirely.
- **Root cause**: Likely budget pressure — agents were told to conserve tokens, and lengthy briefs are expensive. Also, Iteration 2 had less architectural ambiguity than Iteration 1.
- **Direction**: Tie to F1/F6 — for lightweight projects, short briefs may be correct. For production-grade, enforce minimum brief quality. The tier should determine expectations, not a fixed rule.
- **Impact**: Low for Sudoku (the resolution compensated). Medium for complex projects.

---

### E5: IP iteration sync produced zero artifacts
- **Status**: Fixed (2026-02-22)
- **Source**: Evaluation
- **Problem**: `docs/sync/iteration-ip/briefs/` and `responses/` are empty. Four PI-level retros exist, but the structured close-out sync didn't happen.
- **Fix**: IP iteration needs the same converge-diverge gate as other iterations. Or: F5 (skill audit) replaces the IP sync with something more useful.
- **Impact**: Low — retros captured the important learnings.

---

### E6: Pod brief exceeded 3K token cap without summarization
- **Status**: Fixed (2026-02-22)
- **Source**: Evaluation
- **Problem**: Pod brief is 10K at Iteration 3. Orchestrator's own instructions say to summarize at 3K. Didn't happen.
- **Fix**: Add a size check in the PostToolUse hook — if pod brief exceeds threshold, inject a "summarize pod brief" reminder in the orchestrator's additionalContext.
- **Impact**: Low for Sudoku (content was useful). Scales badly for larger projects.

---

## Tier 4 — Quality Gaps
*Real bugs that the pipeline should have caught earlier*

---

### E7: Branch coverage P1 at Harden gate — should be merge gate
- **Status**: Fixed (2026-02-22)
- **Source**: Evaluation
- **Problem**: `SudokuBoard.tsx` had 20% branch coverage through all of Iteration 2. Caught at ship gate, fixed in Harden. Should have been caught at task completion.
- **Fix**: Add per-component coverage check as a task-level sanity check in pipeline.json. The SubagentStop hook (or a post-task hook) runs `vitest --coverage` and checks the delta.
- **Impact**: Prevents coverage debt from accumulating.

---

### E8: CSS token undefined reference (`var(--transition-conflict)`) — silent failure
- **Status**: Fixed (2026-02-22)
- **Source**: Evaluation
- **Problem**: CSS custom property was misspelled for the entire build phase. CSS silently falls back to `none`. No test, no console error.
- **Fix**: Add a design token validation step: extract all `var(--*)` references from CSS modules, compare against `design-tokens.css` exported properties. P1 on any undefined reference.
- **Impact**: Catches an entire class of CSS-specific silent failures.

---

### E9: Activation metrics not implemented
- **Status**: Fixed (2026-02-22)
- **Source**: Evaluation
- **Problem**: PM spec defines `gamesStarted`, `gamesCompleted`, `avgSolveTimeSec` as success metrics. None are implemented. The app can't measure its own success.
- **Fix**: Tie to F1 (tier selection) — for MVP tier, activation metrics may be deferred. For production tier, they should be Must Have stories in the PM spec, not assumptions.
- **Impact**: PM-level process gap. The PM spec should auto-generate "implement activation metrics" as a Must Have story.

---

### E10: Win state celebration layer absent
- **Status**: Fixed (2026-02-22)
- **Source**: Evaluation
- **Problem**: No badge, no confetti. Design mockup specified it. Missed through entire Iteration 2, caught at Iteration 3 UX compliance. Carried to PI-002.
- **Root cause**: Design mockup existed but the UX compliance check happened too late (Iteration 3 instead of immediately after implementation).
- **Fix**: Tie UX compliance to Iteration 2 task dependencies — `quality:ux-review` should run per-component during Iteration 2, not as a batch at Iteration 3.
- **Impact**: Medium — catches design drift during the build iteration.

---

### E11: Difficulty select screen ~40% missing from mockup
- **Status**: Fixed (2026-02-22)
- **Source**: Evaluation
- **Problem**: Dots, icons, checkmarks, card meta text, correct H1 hierarchy — all absent from implementation. Carried to PI-002.
- **Root cause**: Same as E10 — UX compliance ran too late.
- **Fix**: Same as E10 — move UX compliance to Iteration 2.

---

## Tier 5 — Artifact Housekeeping
*Cleanup, not behavioral changes*

---

### E12: 6 empty directories created at pipeline start
- **Status**: Fixed (2026-02-22)
- **Source**: Evaluation
- **Problem**: `feedback/`, `iteration-plans/`, `learnings/`, and several sync subdirectories are empty. They were scaffolded but never populated.
- **Direction**: Tie to F1 — lightweight tier shouldn't create directories for artifacts it won't produce. Only create directories when an artifact is about to be written.
- **Impact**: Low — visual clutter, no functional impact.

---

### E13: Duplicate screenshots (5 files in 2 groups)
- **Status**: Fixed (2026-02-22)
- **Source**: Evaluation
- **Problem**: Same image saved under multiple names. Wasted storage, misleading filenames.
- **Fix**: Browser test agent should check file hashes before saving; deduplicate on write.
- **Impact**: Low.

---

### E14: Overlapping iteration-level and PI-level retrospectives
- **Status**: Fixed (2026-02-22)
- **Source**: Evaluation
- **Problem**: PI retros subsume and repeat most iteration retro content. Both tiers exist per department = 8 retro files with ~50% overlap.
- **Direction**: Tie to F1/F6 — for lightweight tier, iteration retros feed directly into the IP Iteration knowledge compounding (no separate PI retro). For full tier, keep both but PI retro should reference iteration retros rather than restating them.
- **Impact**: Low.

---

## Recommended Fix Order

```
Round 1 — Architectural (sets the frame for everything else):
  F1: Adaptive complexity tiers (intake questionnaire)
  F8: Human artifacts agent (DOA)
  F3: Anti-consolidation-bias operating norm

Round 2 — Fix broken instrumentation:
  E1: Hook write-back diagnosis and fix
  E2: TASK_RESULT enforcement (move to top of agent files + inject in dispatch prompt)

Round 3 — Structural improvements:
  F4: Skill-based teams (Leads select from skill catalog)
  F6: Speed bias parameter

Round 4 — Quality gates:
  E7: Branch coverage as merge gate
  E8: CSS token validation
  E10/E11: UX compliance during build iteration

Round 5 — Polish:
  E3: Iteration plan gate
  F5: IP skill audit
  E6: Pod brief auto-summarization
  E12–E14: Artifact housekeeping
```

---

## Issue Count

| Tier | Count | Issues |
|------|-------|--------|
| 1 — Architectural | 6 | F1, F3, F4, F5, F6, F8 |
| 2 — Instrumentation | 3 | E1, E2, E3 |
| 3 — Protocol Decay | 3 | E4, E5, E6 |
| 4 — Quality Gaps | 5 | E7, E8, E9, E10, E11 |
| 5 — Housekeeping | 3 | E12, E13, E14 |
| **Total** | **20** | |

*Note: F2 and F7 were removed per user direction and are not tracked here.*
