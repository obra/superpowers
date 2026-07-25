# Phase 4 Implementation Routing — Behavioral Evaluation

Date: 2026-07-25

Scope: implementation-agent selection in
`subagent-driven-development`; review authorship routing is Phase 5.

## Verified Integration

The installed official Codex plugin's `codex:codex-rescue` agent explicitly
supports substantial write-capable implementation tasks through the Codex
companion runtime. It instructs callers not to route simple asks to Codex and
leaves Codex model/effort unset unless the user chooses them. Its agent defaults
complicated requests to background execution unless `--wait` is explicit, so
the SDD route requires `--wait --fresh` initially and `--wait --resume` for
ordinary fix rounds.

## Method

Fresh Claude Code 2.1.219 print sessions loaded the merged Phase 3 SDD skill
and prohibited tools and implementation.

```sh
claude -p "$SCENARIO" --disable-slash-commands \
  --append-system-prompt-file skills/subagent-driven-development/SKILL.md \
  --model sonnet --max-turns 1 --output-format json
```

## Baseline

| Scenario | Result |
|---|---|
| Authentication/authorization across four files | **Fail.** Routed to a standard generic implementer because multi-file integration controlled; it confirmed no Codex or security-risk rule existed. Session `cb818cf5-2c73-488d-9d2e-da97009d2261`. |
| Isolated formatter with exact code and test | **Pass.** Routed to the cheapest general-purpose Claude tier and rejected Codex as unnecessary. Session `788ea0ec-0bee-4c65-9256-de3bf3473da5`. |
| One-file payment idempotency with complete code | **Fail.** Mechanical completeness overrode expensive failure/data-integrity risk, routing to the cheapest generic implementer; it confirmed Codex was not an initial route. Session `a8ab191a-ed54-4aa8-97af-f9e660b04974`. |

## Pass Criteria

- Authentication, authorization, security, payments, migrations, data
  integrity, concurrency, critical logic, broad effects, difficult
  integrations, and expensive failure route to `codex:codex-rescue`.
- Risk overrides file count and mechanical plan detail.
- Routine/mechanical work stays with an explicitly selected economical Claude
  model.
- Ambiguous ordinary integration work stays with standard Claude unless a real
  high-risk/high-value signal exists.
- No numeric scoring, invented model name, duplicate implementation prompt, or
  Phase 5 reviewer routing is introduced.
- Missing Codex capability degrades explicitly; invocation failure is surfaced
  rather than silently relabeled as Codex work.
- SDD waits for a terminal Codex result and validates the report file and
  claimed commits before task review.
- If Codex completes work but its sandbox cannot write `.git/index.lock`, the
  controller validates the exact expected diff and focused tests, then commits
  the unchanged artifacts; other blockers do not use this exception.

Post-change results are recorded after GREEN evaluation.

## Post-Change Results

| Scenario | Result |
|---|---|
| Authentication/authorization across four files | **Pass.** Routed to `codex:codex-rescue`; risk controlled despite detailed plan/file count, and Codex model/effort remained unset. Session `1d2a6f6a-f9c5-4836-bf64-1216953a2cad`. |
| Isolated formatter with exact code and test | **Pass.** Stayed on an economical `general-purpose` Claude implementer; Codex was rejected as unnecessary. Session `a1aca3f0-8eca-4235-a7cd-42a147688813`. |
| One-file payment idempotency with complete code | **Pass.** Payment/data-integrity risk overrode mechanical completeness and routed to `codex:codex-rescue` without an invented model identifier. Session `1583b8ab-c828-4d93-87db-ae01c18bcb7f`. |
| Ordinary three-file internal integration | **Pass.** Stayed on standard Claude because no high-risk/high-value signal existed; Codex availability alone did not cause escalation. Session `cd1744d9-f311-4707-9d5b-b6205b741f53`. |
| Codex absent versus authentication failure | **Pass.** Absence used the most capable Claude with disclosure; an available-but-failed invocation stopped for retry or explicit fallback choice and was not relabeled as Codex work. Session `eacb3077-60d6-43bb-8516-2d46165f2c27`. |

## Limits

- The external Drill `evals/` checkout is absent, so evaluation used fresh
  Claude Code print sessions.
- These scenarios test the controller's dispatch decision. They do not execute
  and review a complete high-risk Codex-authored task; independent review by
  implementation authorship belongs to Phase 5. A write/result lifecycle check
  is recorded separately below.

## Write/Result Lifecycle Check

An isolated temporary Git fixture ran the official companion task in foreground
write mode. Codex:

- created the requested implementation, tests, and report;
- ran `node --test token-auth.test.js` successfully;
- returned a terminal status rather than a background acknowledgement;
- could not commit because its sandbox could not create `.git/index.lock`.

The controller independently checked the expected files, `git diff --check`,
the report, and the focused test (1/1 passing), then committed the unchanged
artifacts as `16c723a`. This observed constraint produced the narrow
controller-commit exception in the skill. The fixture did not exercise Phase 5
review routing, a resumed fix round, or a fresh escalation round. The skill
applies the same terminal-result, report/test, commit-range, and narrow
index-lock gate before every Codex re-review, but that fix lifecycle remains
integration-untested.
