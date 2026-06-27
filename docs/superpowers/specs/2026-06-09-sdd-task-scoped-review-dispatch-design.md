# SDD Task-Scoped Review Dispatch

Make subagent-driven-development's per-task reviews cheaper and faster without weakening them, by scoping per-task review prompts to the task and stopping redundant work — while final branch review stays broad.

## Problem

Per-task code quality reviewers in SDD routinely do branch-review-scale work on single-task diffs. Evidence from two real local SDD sessions: `a1a6719a-6109-453a-9933-34ae396f5bae` (sen-core-v2) and `0cc1a12d-9984-4c35-8615-9d42dadb2c47` (serf), both under `~/.claude/projects/`:

- In the sen-core-v2 session, 7/8 quality reviewers ran repo-wide greps; the most expensive ran 50+ Bash commands over ~200 seconds. Across both sessions, quality reviewers cost 4-8× what spec reviewers cost on the same tasks.
- Spec reviewers, whose prompt contains "Only read files in this diff. Do not crawl the broader codebase," stayed tight: 6-16 tool calls, 14-65 seconds.
- No reviewer ran heavy tests autonomously. Every package-wide or repeated test run observed was explicitly requested by a controller-written prompt ("check all uses," "run tests if useful, especially race-focused ones," "does anything else read `Meta()`?").

Root causes, in order of impact:

1. **The per-task quality prompt inherits a merge-readiness review.** `code-quality-reviewer-prompt.md` delegates to `requesting-code-review/code-reviewer.md`, which asks about architecture, scalability, security, production readiness, and ends with "Ready to merge?" That frame licenses branch-level breadth on a one-task diff. The spec prompt's diff-scope guard was never carried over.
2. **The controller gets no guidance on writing reviewer prompts**, so it invents open-ended directives ("check all uses") that reviewers interpret literally.
3. **Duplicated work across the pipeline.** The quality template's "Plan alignment" dimension re-checks what the spec reviewer just verified. Reviewers re-run test suites the implementer already ran (and reported, with TDD evidence) on identical code.
4. **Per-task and final review share one template**, so there is no representation of "per-task narrow, final broad" anywhere.

A field report (`~/2026-06-09-code-quality-reviewer-scope-budget-issue.md`) first flagged this. Its cited session and headline numbers could not be verified, but its qualitative diagnosis was confirmed against two real local sessions. One correction to it: cross-cutting audits (lock ordering, changed contracts) are sometimes the *correct* review method — the fix must gate breadth behind a stated concrete risk, not forbid it.

## Goals

- Per-task reviews scoped to the task: diff-first reading, justified broadening, no redundant test runs.
- Final whole-branch review keeps its current breadth.
- No reduction in what reviews catch.

## Non-goals / explicitly preserved

- **Full re-reviews stay.** When a reviewer re-reviews after a fix, it still reviews the whole task at full reading breadth. (It does not re-run tests the implementer just ran on the amended code.) This deliberately rejects the field report's "re-review budget" remedy: the cost of its worst cited example (a re-review running `-race` and `-count=100` loops) is curbed by the test budget below, not by narrowing what re-reviewers read.
- ~~**The two review stages stay separate.** Spec compliance and code quality remain independent subagents, serially gated. No merging.~~ **Superseded by the cost iterations below**: live eval economics showed per-dispatch overhead dominating cost, and the maintainer put everything on the table. The per-task stages are now one task reviewer with two verdicts; the independent broad final review remains.
- **The coordinator keeps model judgment.** No forced model tier for reviews, in either direction.
- **`requesting-code-review/` is untouched.** It remains the broad template for final branch review and ad-hoc review.
- Verdict ordering (spec compliance reported before quality), the fix-and-re-review loops, and the requirement to fix Critical/Important findings are unchanged.

## Cost iterations (post-launch eval economics)

Live before/after runs surfaced a cost regression once the quality-hardening
prose (evidence rule, constraint carrying, pristine output) landed: go-fractals
went from 42.8 min / 14.5M tokens (first task-scoped version) to 69.9 min /
32.2M (hardened version) while reaching baseline-parity quality (blind-judged
8.5 vs 8.5). Per-subagent turn profiling attributed cost to, in order: cheap
models taking 2-3× the turns on multi-step work (678 of 1197 subagent turns
were haiku), per-dispatch overhead (3 subagent spin-ups per task, each
re-deriving the diff; controller coordination was half the dollars), and
evidence-rule narration.

- **Iteration 1:** turn-count-beats-token-price model guidance (mid-tier floor
  for multi-step work), optional inline diffs, cite-don't-narrate evidence,
  Important = cannot-trust-until-fixed, fixes dispatched only for
  Critical/Important. Result: 68.2 min / 22.9M — tokens down 29%, wall-clock
  flat; controllers pasted the diff in only 2 of 22 review dispatches when
  phrasing was optional.
- **Iteration 2:** per-task spec and quality reviews merged into one
  `task-reviewer-prompt.md` (one reviewer, one reading of the diff, two
  verdicts; one fix dispatch addresses both kinds of findings); implementers
  run the focused test while iterating, full suite once before commit.
  Result (go-fractals): 47.5 min / 15.7M / $13.55 — beat baseline on every
  axis, blind-judged 9/10 vs baseline 7/10.
- **Iteration 3:** Calibration names merge-blocking maintainability damage
  (verbatim duplication, swallowed errors, assertion-free tests) as
  Important and Minor findings must be pasted into the final review for
  triage; reviewer skepticism extended to the implementer's design
  rationales ("left it per YAGNI" is a claim, not a verdict); diff handed
  to reviewers as a file (`git diff > /tmp/sdd-task-N.diff`, redirected so
  it never enters the controller's context; one Read call for the
  reviewer) after paste-into-prompt guidance went unadopted (0-6 of 11-17
  dispatches) for locally-rational context-economics reasons.
- **Final frozen config (e355795), all five scenarios pass:** go-fractals
  44.4 min / 13.4M / $11.67 (-32% time, -37% tokens, -27% dollars vs
  baseline); svelte-todo 62.8 / 19.7M / $15.76 (-21% / -28% / -25%);
  rejects-extra-features $1.31 (vs $1.88); spec-reviewer-flaws flat; the
  planted-defect scenario (v3: open-flag transparency bar for judgment
  calls, must-fix bar for a test whose name promises verification it
  never performs) passes with the defect caught and fixed.

### Iterations 4-5 (2026-06-10): variance honesty, structural fixes, positive recipes

A same-config re-run exposed run-to-run variance (44.4→57.1 min on
identical prompts; reviewer escape-hatch appetite swung 1.0→6.3 tool
calls/review), so all subsequent claims use ranges. Five parallel
experiment variants on go-fractals plus transcript mining of real local
sessions (full log with negative results:
`evals/docs/experiments/2026-06-10-sdd-cost-experiments.md`) produced the
final config:

- **Adopted:** final-review package (final reviewer 33→6 turns at
  controller-model prices); REQUIRED `model:` line in both templates
  (prose guidance decayed mid-session once, inheriting opus for 17
  dispatches, +$5); task-brief + report files (`scripts/task-brief`;
  fidelity anchor, modest context savings); progress ledger in
  `<git-dir>/sdd/progress.md` (real sessions re-dispatched entire
  completed task sequences after compaction — 269 dispatches for ~22
  tasks); omnibus final fixer (a real session's per-finding fix wave cost
  more than all its tasks); scoped fix tests; unique SHA-range collateral
  names (worktree/submodule-safe); dispatch-composition recipe and
  reviewer named-risk budget (micro-tested: positive recipe 3.0
  transcribed values vs prohibition 4.4 vs control 3.6 — prohibitions can
  backfire; see `2026-06-10-positive-instruction-redesign-design.md`).
- **Tested and declined:** controller turn batching and parallel-call
  pipelining (controller emits exactly one tool call per message — 0
  multi-tool messages in every run; 46% of its turns are
  thinking/narration, a prompt-immune floor); background-dispatch
  pipelining (mechanism adopted 7/28 but benefit below the ±6 min noise
  floor on these scenarios).
- **Final validated config (b81f35b family), all gates pass:** go-fractals
  54.1-54.7 min / 14.4-16.6M / $12.81-14.31 (baseline 64.9 / 21.2M /
  $16.07); svelte-todo 55.0 min / 19.3M / $14.99 (baseline 79.7 / 27.3M /
  $20.98); planted-defect pass / $2.77. Across all 8 same-design fractals
  runs: 44.4-57.1 min / 13.4-20.0M / $11.67-14.84 — the worst draw beats
  baseline on every axis; typical mid-band savings ~20-25%.

## Design

### Shared principle: don't re-run tests on code that hasn't changed

The implementer's report includes test results and TDD RED/GREEN evidence for exactly the code under review. Reviewers verify by reading. A reviewer runs a test only when reading raises a specific doubt that no existing run answers — and then a focused test, not a suite. On harnesses where reviewer subagents are read-only (e.g., Antigravity maps reviewer templates to the `research` type, which has no command access), the reviewer instead names the test it would run in its report.

After a fix, the implementer re-runs the tests covering the amended code; the re-reviewer does not repeat that run. Today nothing enforces that premise: `implementer-prompt.md` describes the initial implement-test-commit flow only, with no fix-iteration instruction. This spec therefore also adds to `implementer-prompt.md`: after fixing a review finding, re-run the tests that cover the amended code and include the results in the fix report.

This principle appears in both reviewer prompts, the implementer prompt, and the controller guidance.

### 1. New file: `skills/subagent-driven-development/code-quality-reviewer-prompt.md` becomes self-contained

Stop delegating to `requesting-code-review/code-reviewer.md`. The per-task quality reviewer gets its own scoped prompt template:

- **Framing:** "You are reviewing one task's implementation for code quality." A task-scoped gate, not a merge review.
- **Spec compliance is settled:** spec review already passed; do not re-litigate requirements or plan alignment.
- **Review dimensions kept:** code quality (clarity, duplication, error handling), test quality (real behavior, not mocks), maintainability, and the existing SDD-specific checks (single responsibility, independent testability, file structure from plan, file growth contributed by this change). Dropped: plan alignment, security/scalability/production-readiness dimensions, merge verdict.
- **Scope budget:** start from `git diff BASE..HEAD`; read changed files first; inspect adjacent code only to evaluate a concrete risk you can name. Cross-cutting changes — lock ordering, changed function/API contracts, shared mutable state — are legitimate named risks that justify checking call sites. Do not crawl the codebase by default.
- **Test budget:** the shared principle above, plus: no package-wide suites, race detectors, or repeated/high-count runs unless you have first named a specific suspected flake or race. Otherwise, recommend heavy validation in the report instead of running it. Warnings or noise in the implementer's reported test output are findings — output should be pristine (the implementer's self-review checks this too).
- **Evidence rule:** reviewers answer each What-to-Check item with file:line evidence, not bare yes/no. (Added after live eval runs showed reviewers passing defects the prompt had pointed them at — an accessible-name check and a temp-dir-cleanup check both got unsupported "yes" answers while the defect sat in the reviewed diff.)
- **Read-only rule** kept in trimmed form: no mutating the working tree, index, HEAD, or branch state. The `git worktree add` how-to sentence from the current templates is NOT carried into this file — a diff-scoped review never needs a checkout of another revision (same rationale as the spec-prompt cleanup below).
- **Verdict:** Strengths / Issues (Critical/Important/Minor) / "Task quality: Approved | Needs fixes."

### 2. `skills/subagent-driven-development/spec-reviewer-prompt.md` cleanups

- Remove the `git worktree add` how-to sentence. The read-only rule stays; a diff-scoped spec review never needs a checkout of another revision.
- Resolve the tension between the diff-only guard and "verify everything independently": spec compliance is judged by reading the diff against the requirements. The implementer's TDD evidence covers "it runs" — apply the shared test principle.
- New third verdict channel: requirements that cannot be verified from the diff (live in unchanged code, span tasks) are reported as explicit "⚠️ Cannot verify from diff — controller should check X" items, instead of either crawling or silently passing. The flowchart's binary pass/fail diamond cannot route this, so the controller guidance (§3) defines the handling: ⚠️ items do not block dispatching the quality reviewer, but the controller must resolve each one itself (it holds the plan and cross-task context) before marking the task complete; an item the controller confirms is a real gap is treated as a failed spec review and goes back to the implementer.
- Replace the fabricated premise "The implementer finished suspiciously quickly" with grounded skepticism: treat the implementer's report as unverified claims about the code. Same distrust, no invented fact.

### 3. `skills/subagent-driven-development/SKILL.md` controller changes

- **Model Selection:** replace "Architecture, design, and review tasks: use the most capable available model" with judgment guidance — pick reviewer models the way implementer models are picked, scaled to the diff's size, complexity, and risk. The "Task complexity signals" list is rescoped to make clear its bullets describe implementation tasks; reviewer model choice follows the same judgment, so a narrow diff review does not automatically map to "broad codebase understanding → most capable model."
- **Reviewer prompt construction** (new guidance near Red Flags): when dispatching reviewers, do not write open-ended directives ("check all uses," "run race tests if useful") without a concrete task-specific reason; do not ask reviewers to re-run tests the implementer already ran on the same code; do not pre-judge findings for the reviewer (never instruct a reviewer to ignore or not flag a specific issue — adjudicate suspected false positives in the review loop instead); per-task reviews are task-scoped gates — the broad review happens once, at the final whole-branch review. (The pre-judging rule was added after a live eval run caught the controller fabricating a "the plan forbids a shared helper" claim and instructing the quality reviewer not to flag a planted DRY violation.) Controllers must also include the spec/design's global constraints that bind the task — version floors, naming and copy rules, platform requirements — in the requirements they paste: a live run shipped a `go 1.26.1` module floor against a "Go 1.21+" design because no reviewer ever saw the constraint. And controllers must specify a model explicitly on every dispatch — an omitted model inherits the session's (usually most expensive) model, which silently defeats model selection.
- **Handling spec-reviewer ⚠️ items** (new guidance, alongside Handling Implementer Status): the controller resolves each "cannot verify from diff" item itself before marking the task complete; confirmed gaps go back to the implementer as failed spec review.
- **Final review stays broad, explicitly:** the final whole-branch reviewer dispatch node gains an explicit pointer to `../requesting-code-review/code-reviewer.md`. (Today that template is reachable only through the per-task quality prompt's delegation; once that delegation is removed, an unreferenced final-review template would be orphaned.) The Integration section's note that `superpowers:requesting-code-review` provides "the code review template for reviewer subagents" is corrected to apply to the final review only.
- **Example workflow:** the quality-reviewer lines in the example are updated to the new verdict vocabulary ("Task quality: Approved"); the final reviewer's "ready to merge" line stays.
- Flowchart topology is unchanged; the ⚠️ channel is handled by controller guidance, not a new graph branch.

## What this does not fix (known, deferred)

The spec reviewer judges against task text the controller pasted; it cannot catch requirements dropped during the controller's extraction from the plan. That is an architectural property of "controller provides full text," not a prompt problem, and is out of scope here.

## Verification

- Plugin infrastructure tests (`tests/`) still pass.
- Run the SDD skill-behavior evals (`git submodule update --init evals`, then per `evals/README.md`) before and after the change. Specifically: `sdd-go-fractals`, `sdd-svelte-todo`, `sdd-rejects-extra-features` (end-to-end SDD including the spec reviewer's YAGNI gate), and `spec-reviewer-catches-planted-flaws`.
- Known eval gaps this change exposes: no existing scenario plants a code-quality defect inside a single SDD task and asserts the per-task quality reviewer catches it, and no scenario measures per-reviewer exploration cost (tool-call/grep counts). Add one scenario covering the first gap (planted single-task quality defect → per-task reviewer must flag it before final review). For exploration cost, compare reviewer subagent tool-call counts manually across the before/after eval transcripts.
