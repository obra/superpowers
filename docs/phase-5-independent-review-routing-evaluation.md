# Phase 5: Independent Review Routing Evaluation

## Scope

Phase 5 changes only the reviewer selection inside
`subagent-driven-development`. It does not add a reviewer stage, change the
review rubric, alter the five-round fix loop, or change implementation
routing.

## Behavioral contract

- Codex-authored task work receives a fresh Claude task reviewer.
- Routine Claude-authored task work keeps the existing economical Claude
  reviewer.
- Claude-authored work receives a read-only Codex task reviewer only when an
  independent cross-model challenge is materially justified.
- Re-review recomputes routing from each fix author's type and never reuses a
  Codex implementation thread.
- Codex review absence or failure is disclosed; it is never represented as a
  completed review.
- The final whole-branch review remains the existing most-capable Claude
  review. There is no voting or duplicate review stage.

## Baseline

These scenarios were run in fresh Claude sessions with the Phase 4 skill.

| Scenario | Session | Observed baseline |
|---|---|---|
| Codex-authored authorization task | `794f2b4f-a9e7-4ad5-9cdc-e54ab036addd` | **PARTIAL.** Selected a Claude reviewer, but described independence as incidental because no authorship-aware rule existed. |
| Routine Claude formatter | `f446afc8-52be-4acd-9246-7c5ea1c29af5` | **PASS.** Selected an economical Claude reviewer and did not add Codex. |
| Claude external SDK task with inferred configuration and method | `14084978-fd2a-429f-bed1-5cc66b09f57b` | **FAIL.** Selected a more-capable Claude reviewer; no cross-model review path existed. |

The baseline demonstrates that the existing review stage and economical
default already worked, but authorship and material cross-model challenge were
not explicit routing inputs.

## Post-change pressure scenarios

The post-change harness used fresh, one-turn Claude sessions with the modified
skill appended as system instructions.

| Scenario | Observed decision |
|---|---|
| Valid Codex-authored authorization task | **PASS.** Fresh `general-purpose` Claude reviewer with an explicit model tier. |
| Routine one-file Claude formatter | **PASS.** Fresh `general-purpose` Claude reviewer; no Codex symmetry. |
| Claude-authored external SDK task with an unverified configuration key and method signature | **PASS.** Read-only `codex:codex-rescue` reviewer using `--wait --fresh`, with model and effort unset. |
| Claude-authored fix after a Codex task review | **PASS.** Same read-only Codex reviewer via `--wait --resume`. |
| Codex-authored escalation fix after a Codex task review | **PASS after correction.** Fresh explicit-model Claude re-reviewer; no Codex lifecycle flags. |
| Final whole-branch Codex-authored fix wave | **PASS.** Fresh explicit-model Claude re-reviewer; no nonexistent task-reviewer thread assumed. |
| Codex reviewer capability absent | **PASS.** Most-capable Claude substitute with degraded-routing disclosure; no claim that Codex reviewed. |

The combined initial-routing and final-fix-wave session was
`b87a31b7-6e83-4240-a470-d6c43bf1e44c`. It exposed an ambiguity in the first
fix-transition wording: the controller incorrectly kept Codex on a
Codex-authored escalation fix. After replacing that prose with explicit
author-to-reviewer cases, focused session
`cff14cc2-ae62-4612-8a70-c5b223282e67` selected fresh Claude correctly.
Session `efd90b0c-d49d-4dab-aa88-22349a00249d` verified Codex resume for a
Claude-authored fix and graceful degradation when the Codex capability is
absent.

Before these successful runs, one sandboxed invocation produced no output for
120 seconds and was terminated; another
(`763cdba5-b548-4fc2-a37b-f35a9c724cf9`) failed before inference with
`API Error: Unable to connect to API (ENOTIMP)`. The successful runs were made
with network access outside that restricted sandbox.

An installed-but-failing Codex invocation was not induced in the live
controller harness. Its retry-or-explicit-fallback behavior remains
instruction-level evidence only.

## Overengineering check

Every proposed element is necessary for Phase 5:

- one authorship-aware routing block in the existing skill;
- two existing prompt templates parameterized for the selected agent;
- one evaluation record.

No new skill, scoring system, second reviewer, voting mechanism, persistent
agent, dependency, or Phase 6 routing was added.
