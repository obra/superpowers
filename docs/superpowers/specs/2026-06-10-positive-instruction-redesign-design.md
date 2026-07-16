# Positive-Instruction Redesign of Skill Guidance — Design Spec

**Status:** Proposed (follow-up to the 2026-06-09 SDD review-dispatch work; separate PR per the one-problem-per-PR rule)
**Driver:** Measured evidence (2026-06-10) that some negative instructions in skill prose backfire, while others work — and that the difference is predictable.

## The measured finding this spec generalizes

Micro-tests on 2026-06-10 (opus, 5 reps per phrasing, programmatic scoring;
harness described below) measured how guidance phrasing changes what a
controller composes:

| Case | Phrasing | Result |
|---|---|---|
| Dispatch composition ("don't restate the brief") | prohibition | **4.4** spec values re-typed — *worse than no guidance* (3.6) |
| Dispatch composition | positive recipe ("your dispatch should contain: (1)…(5)") | **3.0, zero variance** — adopted |
| Dispatch composition | recipe + nuance clause ("quote only the fragment…") | 3.8, noisy — nuance dilutes recipes |
| Test-rerun directive ("do not ask reviewer to re-run tests") | prohibition | **0/5 violations** — works fine (control: 3/5) |
| Test-rerun directive | positive recipe | 0/5 — equal, but longer |

**The doctrine** (use this to classify any negative instruction):

1. **Tripwires work.** Phrase-level self-checks on concrete tokens ("if the
   prompt you are writing contains 'do not flag' … stop") fire reliably.
2. **Recognition tables work.** Red-Flags/rationalization tables read at
   decision time, not composition time.
3. **Discrete-directive prohibitions work.** "Do not ask X to do Y" holds
   when the model has no competing incentive to do Y.
4. **Composition prohibitions backfire** when the model has its own agenda
   for the output (e.g., restating specs feels like helpful curation).
   Only a positive composition recipe moves these — and adding nuance
   clauses to a winning recipe makes it worse, not better.
5. **Ties go to the shorter phrasing.** Codex re-reads SKILL.md ~500× per
   long session (measured 2026-06-10); prose length is a real cost.

## Audit results (2026-06-10, all ~30 skills + prompt templates)

Counts: 3 tripwires (keep), 14 recognition tables (keep), ~20 policy gates
(keep — "never push without permission" is policy, not composition
shaping), 5 composition-prohibitions:

| # | Location | Disposition |
|---|---|---|
| 1 | `subagent-driven-development/task-reviewer-prompt.md` — "Cite, don't narrate" | **Queued in PR #1717 batch**: lead with the positive half ("Your report should point at evidence: file:line for every finding…"), drop the prohibition half (dead weight — the positive half already exists and carries the load) |
| 2 | `subagent-driven-development/SKILL.md` — "Do not add open-ended directives" | **Keep as-is**: micro-test could not elicit the failure in 15 samples; no evidence either way; shorter wins |
| 3 | `subagent-driven-development/SKILL.md` — "Do not ask a reviewer to re-run tests" | **Keep as-is**: measured 0/5 violations; the prohibition also usefully propagates itself into dispatches |
| 4 | `subagent-driven-development/SKILL.md` — "do not re-review on top of it" | **Queued in PR #1717 batch**: replace with the three-element checklist ("Before re-dispatching the reviewer, confirm the fix report contains: the covering tests, the command run, and the output") |
| 5 | `writing-plans/SKILL.md` — the "No Placeholders" banned-patterns list | **This spec's main subject** — see below |

Borderline, deferred with #5: `task-reviewer-prompt.md` "Don't flag
pre-existing file sizes — focus on what this change contributed" (positive
half present and load-bearing; low impact; test alongside #5 if convenient).

## The writing-plans change (deferred item #5)

### Current state

`skills/writing-plans/SKILL.md`, "No Placeholders": one positive sentence
("Every step must contain the actual content an engineer needs") followed
by a six-bullet banned-patterns list ("never write them: 'TBD', 'TODO',
'Add appropriate error handling', 'Write tests for the above', 'Similar to
Task N', …").

### Why it matters and why it is genuinely uncertain

- Plans are the **largest generated artifact** in the workflow, and the
  model has a real competing incentive to emit placeholders (they are the
  path of least effort under length pressure) — the incentive structure of
  the case where prohibition measurably backfired.
- But the banned items are **discrete, recognizable tokens** — the shape
  of the case where prohibition measurably held.
- **The list is load-bearing elsewhere:** the skill's Self-Review section
  references it ("Placeholder scan: search your plan for red flags — any
  of the patterns from the 'No Placeholders' section above"). The tokens
  double as the review-time scan inventory, and review-time recognition is
  the category that works. A naive swap to a positive checklist breaks
  that reference and discards good tripwire tokens.

### Variants to test

- **V0 (current):** positive sentence + banned list at composition time;
  Self-Review references the list.
- **V1 (auditor's checklist):** composition-time positive recipe only —
  "Before finalizing a step, confirm it has: the literal code to write, a
  runnable command with expected output, types and method names defined
  within this plan, error handling shown explicitly. A step is complete
  when an engineer could implement it without asking any follow-up
  questions." Self-Review keeps a generic placeholder scan.
- **V2 (restructure by mechanism — predicted winner):** composition time
  gets only V1's positive recipe; the named patterns move wholesale into
  the Self-Review placeholder-scan step, reframed as recognition ("when
  you scan, look for: 'TBD', 'TODO', 'Similar to Task N', …"). Same
  tokens, relocated from the category that primes to the category that
  detects.
- **V3 (control):** positive sentence only, no list anywhere.

### Micro-test design

- **Task:** opus writes a 2-3 task implementation plan from a deliberately
  under-specified spec (under-specification is what tempts placeholders).
  Use a fixture spec with: one well-specified task, one task whose error
  handling the spec hand-waves, one task similar to the first (tempting
  "Similar to Task 1").
- **Sampling:** 5+ reps per variant, default temperature, model
  `claude-opus-4-8` (the model that writes plans in practice).
- **Programmatic scoring** (lower is better unless noted):
  - banned-token count: `TBD|TODO|implement later|fill in details|appropriate error handling|handle edge cases|Similar to Task|Write tests for the above`
  - steps lacking a fenced code block where the step changes code
  - references to types/functions not defined anywhere in the plan output
  - (higher is better) runnable commands with expected output per task
- **Two-stage scoring for V2:** also test the Self-Review half — feed each
  generated plan back with the variant's Self-Review section and measure
  whether the scan actually catches seeded placeholders (insert 2 known
  placeholders into a fixture plan; detection rate is the metric).
- **Acceptance:** adopt a variant only if it beats V0 on banned-token count
  without losing code-block coverage or self-review detection rate.
  Expected cost: ~$6-10 total.

### PR scoping

Separate PR (writing-plans is a different skill; its "No Placeholders"
list is tuned content where the contributor guidelines demand eval
evidence). The PR must include: the micro-test harness + results table,
before/after text, and the V2 relocation rationale.

## The micro-test harness (method, so it isn't lost)

`/tmp/sdd-exp/micro/run-micro.py` and `/tmp/sdd-exp/micro2/run-micro2.py`
(2026-06-10; to be committed to superpowers-evals as
`docs/superpowers/skills/micro-testing-prompt-guidance.md` + scripts):

- One API call per sample: system prompt = the skill-guidance variant in
  realistic surrounding context; user = a realistic mid-workflow scenario;
  output = the composed artifact (dispatch prompt, plan, report).
- Programmatic scoring with greps for unambiguous markers; **manually
  inspect every match before trusting a verdict** — one of tonight's
  "violations" was the controller correctly quoting the prohibition, and
  automated negation detection mislabeled another.
- ~$0.15-0.30/sample, seconds per iteration vs $12/50-min full eval runs.
  Iterate phrasings here; confirm winners in full runs only when the
  change is structural.
- Always include a no-guidance control — tonight it revealed both a
  backfire (restating: prohibition worse than nothing) and a working
  prohibition (test-reruns: 3/5 control failures vs 0/5 with either
  phrasing).

## Result: writing-plans micro-test (run 2026-06-10, after this spec was written)

**Resolved — no change needed.** Stage 1 (3-task spec, no pressure): 0
placeholders in all 20 plans across all four variants including the
no-guidance control. Stage 1b (10-task spec, five near-identical commands
tempting "Similar to Task N", explicit ~2,500-word economy target): 40/40
clean — the single regex hit was a V2 self-review *attesting* "no
TBD/TODO ✓". Current-generation opus does not produce plan placeholders
even under deliberate pressure, with or without the banned-patterns list.
Disposition: leave the No Placeholders section exactly as it is (it costs
little and the counterfactual is unmeasurable); do NOT open the follow-up
PR. The V2 relocation design remains on file here should a future model
generation regress.

## Also explicitly not-dropped (tested-and-declined, with data)

Recorded so nobody re-proposes them without new evidence — full numbers in
the 2026-06-09 SDD design spec's Cost-iterations section:

- **Controller turn batching / parallel tool calls in one message:** the
  controller emits exactly one tool call per message (0 multi-tool
  messages across every measured run, with and without guidance). 46% of
  controller turns are thinking/narration with no tool call — a
  prompt-immune floor.
- **Pipelined reviews via parallel calls:** dead for the same reason.
- **Pipelined reviews via `run_in_background`:** mechanism adopted when
  offered (7/28 dispatches) but benefit below the run-to-run noise floor
  on 45-min scenarios (reviews are only ~30-60s each); adds dual
  result-stream coordination. Worth revisiting only for plans whose
  reviews are individually long.
- **Nuance clauses appended to winning recipes:** measurably degrade them
  (C2: 3.8 noisy vs C: 3.0 consistent). Iterate by re-deriving the recipe,
  not by appending caveats.
