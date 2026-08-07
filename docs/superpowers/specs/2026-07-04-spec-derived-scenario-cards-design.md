# Spec-Derived Scenario Cards — Design

Date: 2026-07-04
Status: approved (design review with Jesse 2026-07-04; adversarially
reviewed 2x opus, findings folded in; role boundary decided by Jesse:
flag-only)
Builds on: `2026-07-04-agentic-end-to-end-testing-design.md` (the skill this
extends; same branch)

## Problem

Scenario cards authored after implementation can drift toward what was built
instead of what was requested: a model that implemented X' will happily write
cards that pass against X'. The protection that worked in practice is locking
the **falsification contract before any code exists** — the brainstorming spec
carries a scenario table whose falsification lines are later lifted into cards
**verbatim** — plus separation of roles (card author is not the implementer and
never modifies product code). That flow exists in project history and in the
new `agentic-end-to-end-testing` skill's card format, but no skill documents
how cards derive from a spec, no spec template asks for the table, and the SDD
pipeline has no hook to run any of it.

### Evidence (2026-07-04 card-authoring experiment, 4 live runs; write-up at
`~/Documents/agentic-e2e-testing-corpus/live-runs-2026-07-04/CARDS-EXPERIMENT.md`,
raw artifacts alongside it — distinct from the same directory's RESULTS.md,
which records the earlier scenario-execution runs)

- With only a spec pointer (no table), card authors did NOT drift in the
  current environment (n=2) — but the environment was contaminated (a
  predecessor e2e skill auto-fired in all runs; operator-level honesty norms
  ambient), so this is not evidence the protection is unnecessary in general.
- With the table + a verbatim-lift instruction, compliance was 4/4 cards
  (whitespace-normalized check; a naive fixed-string grep under-counts —
  the mechanical checker below must normalize whitespace).
- Role boundary is genuinely ambiguous today: given the same failing card, one
  author fixed the product bug (disclosed, citing ambient "fix broken things
  immediately" norms) and one flagged it and declined to fix without TDD. The
  design must state the rule explicitly; prose norms do not decide it.

## Goals

- Institutionalize the spec-side half: brainstorming specs for user-facing
  work carry an "E2E scenario cards" table.
- Document the authoring half in `agentic-end-to-end-testing`: spec → cards,
  verbatim falsification lines, coverage, role boundary, dispatch snippet.
- Give subagent-driven-development an **optional**, predicate-keyed final
  step that authors and runs the cards.
- Verification is baked into the skill: a shipped checker script plus the
  skill-development RED/GREEN discipline. **No quorum scenarios** for this
  work.

## Non-goals

- No changes to `writing-plans`.
- No quorum/eval-lab scenarios (per Jesse; the checker script and in-skill
  discipline carry repeatability).
- No new plugin dependencies. Scripts use bash + POSIX tools only.
- No bulk backfill campaign adding tables across existing specs. (Per-spec
  backport during card authoring is allowed and specified in §2 — it is the
  bootstrap path, not a campaign.)

## Design

### 1. Brainstorming (core-skill edit; high bar)

`skills/brainstorming/SKILL.md` gains one conditional, keyed to an observable
predicate: **if the design includes a user-facing surface** (UI, CLI/TUI
output, rendered artifact), the spec includes an **"E2E scenario cards"**
section — a table with one row per scenario:

| Card | Covers | Falsification |

- Card: kebab-case card name (becomes `test/scenarios/<name>.md`).
- Covers: the user-visible behavior the card exercises.
- Falsification: the exact observable that makes the scenario FAIL, written
  from the *requested* behavior at spec time, before implementation. This
  line is a contract: cards must later carry it verbatim.

Two touchpoints, both small: the conditional above, plus one line added to
brainstorming's existing **Spec Self-Review** checklist — "user-facing
surface but no E2E scenario cards table? Add it." — so an omitted table is
*detected*, not merely discouraged (an unenforced prose conditional would
not deliver the "institutionalize" goal; downstream, SDD keys off the
table's presence, so silence would silently mean "no e2e"). No changes to
the question flow. Placement and exact wording are settled during
implementation under writing-skills discipline (RED baseline first:
brainstorm runs on a user-facing feature today do not produce such tables;
micro-test the wording; GREEN re-run).

### 2. agentic-end-to-end-testing: `authoring-cards-from-a-spec.md`

New supporting file, routed from SKILL.md's "The scenario card" section (one
line: cards derive from the spec when one exists) and reflected in the
"Integration" section's pipeline sentence. (SKILL.md has no numbered
sections; reference headers by name.) Contents:

- **With a scenario table:** one card per row. The row's Falsification line
  lands in the card's Expected section **verbatim**. The spec is
  authoritative wherever the app's behavior disagrees — flag the
  disagreement in the report; never adapt the card to observed behavior.
- **Without a table (bootstrap path):** mine the spec's user-visible
  requirements into behaviors; write the falsification lines; add an "E2E
  scenario cards" table to the spec carrying them (this is the sanctioned
  per-spec backport), and flag the spec edit prominently in the report for
  human review — the author must not present a self-written table as a
  pre-locked contract. On this path the checker verifies transcription
  consistency, not pre-implementation locking; the file says so plainly.
  The locked-contract guarantee only exists when the table predates
  implementation.
- **Coverage check:** every user-facing claim in the spec maps to a card or
  a stated exclusion with a reason.
- **Role boundary (decided):** the card author never modifies product code,
  test code, or existing cards' assertions. A failing card plus root cause
  is the deliverable, not a fix. Rationale: agents get one mandate, not two
  — the agent that finds an issue must not be responsible for the issue
  being solved. (The 2026-07-04 experiment shows why this must be stated:
  ambient norms split — given the same failing card, one author fixed and
  one declined.)
- **Dispatch snippet:** a short template for dispatching a fresh card-author
  subagent (seeded from the historical card-authoring dispatch in the
  corpus), naming: the spec path (authoritative), the card format, the
  verbatim rule, the role boundary, the checker-run requirement, and the
  report shape.
- **Mechanical check:** after authoring, the author runs the checker script
  (below) and includes its output in the report; the dispatching agent
  re-runs the checker independently before accepting the report —
  self-attestation is not the gate.

### 3. subagent-driven-development: optional final step (core-skill edit)

A short subsection — "Optional: spec-derived E2E verification" — after the
final whole-branch review, plus one line in Integration:

- **Trigger (observable predicate):** the spec contains an "E2E scenario
  cards" section, or the human asked for e2e verification. Otherwise the
  step does not exist. **Wiring:** SDD's entry step reads the plan, not the
  spec — so the subsection instructs the controller, at skill start when it
  reads the plan, to also open the spec the plan names and check for the
  section; if present, record the pending e2e step in the todo list and
  progress ledger so compaction cannot lose it.
- **Flow:** after the final review passes, the controller uses
  superpowers:agentic-end-to-end-testing — dispatch a card-author subagent
  (per `authoring-cards-from-a-spec.md`), run the checker independently on
  the author's output, then dispatch a runner subagent (per
  `runner-prompt.md`) against the built branch.
- **Failure handling mirrors the final-review contract:** card FAILs are
  findings — ONE fix subagent with the complete list, then re-run the failed
  cards. The card author never fixes; the fix wave does. Fix-wave commits
  land after the final whole-branch review, so they get their own focused
  review (the task-review gate over the fix diff) before finishing —
  unreviewed product changes must not ship on the strength of a green
  re-run alone.
- **Placement:** before superpowers:finishing-a-development-branch, so
  "ready to merge" includes live-scenario evidence.

The SDD flowchart is not modified; the step is prose, like SDD's other
conditional guidance. Same discipline: RED baseline (a controller given a
spec-with-table today does not author/run cards), micro-tested wording,
GREEN.

### 4. Checker script: `skills/agentic-end-to-end-testing/scripts/check-cards-against-spec`

Bash + POSIX tools (awk/grep/sed), no other dependencies. Usage:

```
check-cards-against-spec <spec.md> <cards-dir>
```

Matching semantics (normative — two implementers must not be able to build
different checkers):

- **Table location:** find the heading whose text case-insensitively equals
  "E2E scenario cards" (any heading level); use the first markdown table
  after it. No such heading or table → checks 2-3 are skipped and the
  script exits non-zero with a "no scenario table" diagnostic (callers on
  the bootstrap path run it only after the backport).
- **Columns** are identified by header name, case-insensitive (`Card`,
  `Covers`, `Falsification`), not by position.
- **Cell unescaping:** `\|` in a table cell is unescaped to `|` before any
  comparison.
- **Normalization:** collapse every run of whitespace (spaces, tabs,
  newlines) to a single space and trim the ends; no other transformation;
  comparisons are case-sensitive after normalization.
- **Matching is fixed-string** on the normalized text (no regex — the
  falsification lines contain metacharacters and backticks by design).
- **Consequence, stated in the authoring file:** falsification lines are
  prose contracts, not literal aligned output. Column-alignment assertions
  (`TOTAL      20.85` with meaningful spacing) belong in the card's Expected
  body, not in the table line, because normalization collapses runs of
  spaces.

Checks, each reported individually, exit 0 only if all pass:

1. The spec's "E2E scenario cards" table parses (>= 1 row; every row has a
   non-empty Card and Falsification cell).
2. Every table row has a corresponding `<cards-dir>/<card>.md`.
3. Every card contains its row's Falsification line verbatim under the
   semantics above.
4. Every card has the skill's required parts, matched per the card format's
   actual syntax: `**What this covers**` as bold inline text; `Pre-state`,
   `Steps`, `Expected`, `Cleanup` as `##` headings. Sharp edges is not
   required — it accretes during runs, and demanding it pre-run forces
   padding.
5. Extra cards (in dir, not in table) are reported as a warning, not a
   failure — authors may add cards beyond the spec's minimum.

Good `--help` and per-failure diagnostics (file, expected line, what was
found). Developed TDD: the script's failing tests come first, exercised
against fixture spec/card pairs that include a falsification line containing
`|` (escaped in the table) and regex metacharacters; whether those fixtures
are committed follows house precedent for skill scripts, settled in the
plan.

## As-shipped deviations (2026-07-04)

Implementation evidence drove these departures from the design above; the
shipped form governs.

- **Checker check 3** matches the Falsification line only inside the card's
  `## Expected` section, not the whole file — a whole-file match false-passed
  in review (commit c6ae16d); the §4 "verbatim" wording above predates this.
- **Brainstorming predicate** ships as "adds or changes user-visible
  behavior," not "includes a user-facing surface" — the spec'd wording failed
  the negative micro-test gate 0/4 (refactors of existing surfaces grew
  spurious tables); the re-keyed wording passed 9/9.
- **SDD trigger** also checks repo specs governing the code the plan
  touches, not the plan-named spec alone — plan-named-spec-only wiring
  skipped the step when the plan named no spec (GREEN iteration 1); the
  opt-out for spec-less repos is preserved.
- **SDD integration restructured (2026-07-05, maintainer direction):** the
  predicate-keyed at-skill-start detection in §3 is replaced by an
  unconditional offer to the human after the final whole-branch review and
  before finishing-a-development-branch — the human decides, not a spec
  predicate. The procedure (spec discovery, author/checker/runner flow,
  fix-wave rules) moved to a disclosure doc,
  `skills/subagent-driven-development/spec-derived-e2e.md`; SKILL.md keeps
  only the offer plus a reference, and the SDD flowchart now carries the
  offer node (superseding §3's "flowchart is not modified"). Spec-less
  repos surface "nothing to derive from" at offer time instead of skipping
  silently.

## Decisions

- **Timing:** table early (spec time), cards late (post-implementation),
  expansion constrained by the verbatim rule. Chosen over cards-at-spec-time
  after the 2026-07-04 experiment showed the expansion step follows a locked
  table faithfully.
- **Role boundary:** flag-only, decided. One mandate per agent; finders are
  never fixers. Fixes belong to a separately dispatched fix wave.
- **Blast radius:** brainstorming + agentic-end-to-end-testing + SDD; not
  writing-plans.
- **Repeatability:** in-skill (checker script + RED/GREEN development
  discipline); no quorum scenarios.

## Testing plan (writing-skills Iron Law)

1. **Checker script:** ordinary TDD; red tests first (including the
   pipe/metacharacter fixture case).
2. **Brainstorming edit:** RED — baseline brainstorm run(s) on a small
   user-facing feature; confirm no scenario table is produced today. GREEN —
   with the edit, the spec contains a well-formed table (the checker's table
   parser judges structure) AND a negative gate check: a brainstorm of a
   non-user-facing change must NOT emit a table (the conditional's gate is
   the failure-prone half). Table *quality* (falsification lines written
   from requested behavior, actually falsifiable) is judged by human review
   of the GREEN specs, not by the parser. Micro-test the conditional's
   wording.
3. **Card-authoring file:** the honest framing of the 2026-07-04 experiment:
   drift did not occur in the baseline (contaminated environment), so drift
   prevention is sourced from project history, not claimed as
   experimentally validated. What the experiment DID document as failures:
   (a) the role-boundary split — one of two authors modified product code
   without authorization; (b) verbatim compliance required an explicit
   instruction. So: RED = the archived Arm-B1 run (unauthorized fix) and
   Arm-A runs (no verbatim traceability without instruction). GREEN — rerun
   both arm prompts with only the new file available (no special
   instructions in the dispatch): authors must lift lines verbatim, pass
   the checker, flag the spec disagreement, and NOT touch product code.
4. **SDD edit:** RED — a scaled-down SDD run (tiny plan, spec-with-table,
   and a seeded assembly-level defect that unit tests pass but a card's
   falsification line catches) without the hook: controller does not
   author/run cards. GREEN — with the hook: controller reaches for the e2e
   skill after final review, the seeded defect produces a card FAIL, and
   the FAIL produces a fix wave plus focused re-review — not a weakened
   card. (Without the seeded defect the discriminating half of this test
   never fires.)

## Out of scope / future

- Wiring card tasks into writing-plans (revisit if the SDD option proves
  lossy in practice).
- A quorum scenario for spec-derived authoring (deliberately dropped).
- Auto-generating the runner dispatch from the checker's table parse.
