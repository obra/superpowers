# SDD Fix-Loop Redesign — Design Spec

**Status:** Approved design (brainstormed with Jesse 2026-07-15); implementation
plan to follow.
**Objective:** make the subagent-driven-development skill's review-fix loop
convergent and autonomous, and make the document readable, without rewriting
its eval-tuned language.
**Hard invariant:** existing eval-tuned sentences move; they do not get
reworded. New machinery ships with drill evidence.

## Problems

Four, all observed in real sessions:

1. **Pathological review loops.** The loop is literally "Repeat until
   approved" — no round cap. Each re-review is a fresh full review of the
   whole diff, so a nondeterministic frontier reviewer surfaces new findings
   every round instead of verifying fixes. Result: implement, review, fix,
   review, review, fix, review, fix — with no circuit breaker. The
   strict-cost spec (2026-06-10) independently measured review-loop count as
   the biggest run-to-run cost variance.
2. **Contradictory fix policy.** The process diagram and "Constructing
   Reviewer Prompts" dispatch dedicated fix subagents; Red Flags says
   "Implementer (same subagent) fixes them"; implementer-prompt.md's "After
   Review Findings" section assumes the implementer will be re-engaged. Three
   answers to "who fixes?" in one skill.
3. **Accreted structure.** Thirteen top-level sections; guidance for one
   activity is scattered across four of them. "Constructing Reviewer Prompts"
   is a grab-bag holding reviewer guidance, fix policy, final-review policy,
   and plan-conflict adjudication.
4. **Red Flags format.** Seven sibling skills use the `| Excuse | Reality |`
   rationalization table; SDD carries a 17-bullet "Never" list plus three
   "If X" mini-blocks.

## Design Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | The original implementer fixes its own review findings — resume it in place. | It already holds the task context; ownership beats a drive-by patcher. Fresh "fix subagents" rebuild context per finding and lack the task frame. |
| 2 | Re-reviews are scoped to the findings. | Fresh full reviews each round are the churn engine. Scoped re-reviews make the loop structurally convergent; the final whole-branch review remains the broad safety net. |
| 3 | Circuit breaker at five fix rounds: three resumes, then two fresh dispatches on a more capable model. | Jesse's call. A loop that survives three resumes usually means the implementer cannot see its own problem — the fresh capable dispatch de-anchors and capability-bumps in one move. |
| 4 | At trip, the controller adjudicates and routes. No new human checkpoint — structural failures reach the existing BLOCKED stop. | SDD's point is autonomous execution. The controller holds the plan and cross-task context the reviewer lacks; the existing text already sanctions it ("adjudicate it in the review loop") without ever specifying the mechanism. |
| 5 | Reorganize SKILL.md by lifecycle, preserving tuned sentences. | Fixes "hard to follow" at the root. Content moves to its point of use, matching the house direction (recent commits fold recap sections into points of use). |
| 6 | Convert Red Flags to a `| Excuse | Reality |` rationalization table; relocate hard rules to their points of use. | Matches the other seven skills. Excuses get rebuttals; rules get enforced where the reader acts. |

## The Fix Loop

Trigger: a task review returns spec ❌ or any Critical/Important finding.

**Rounds 1–3 — resume the original implementer.** Send the findings verbatim
(Critical/Important plus spec gaps). The implementer fixes, re-runs the
covering tests, appends the fix report to its existing report file, and
returns the short contract. On a harness without agent resume, a "resume" is
a fresh dispatch carrying the brief, the report file, and the findings — the
report file is the persistent memory either way.

**Rounds 4–5 — fresh implementer, more capable model.** Full task context:
brief, report file, open findings, and the framing "a prior implementer
attempted this N times; you own the task now."

**Every round's re-review is scoped.** The re-reviewer receives the brief,
the updated report, the original findings list, and a fix-scoped diff package
(`review-package FIX_BASE HEAD`, where FIX_BASE is the head the reviewer
last reviewed; the script already takes arbitrary ranges).
It verdicts each finding addressed / not addressed and flags new breakage in
the fix diff only. Novel findings on code the fix did not touch are reported
as non-blocking; the controller ledgers them for the final review.

**Fix-report completeness gate (existing rule, kept):** before dispatching a
re-review, confirm the fix report names the covering tests, the command run,
and the output.

**No early exit.** The controller never adjudicates before the cap — an early
exit reopens the "pre-judge findings to spare yourself a review loop" hole
the current content deliberately closed. One exception, unchanged from
today: a finding that conflicts with what the plan's text mandates goes to
the human immediately (plan authority, not loop churn).

**Minor findings** never enter the loop: ledger them as they arrive (existing
rule, kept).

### Adjudication at Trip

After round five fails, the controller stops dispatching and judges each open
finding against the brief, the plan, and cross-task context:

- **Contested or wrong** → ledger with a one-line adjudication ("controller:
  reviewer wrong because X"), continue. The final review sees both sides.
- **Real, not load-bearing** → ledger as known-open, continue. Later
  dispatches touching that area carry a pointer to the entry.
- **Real and load-bearing** (later tasks build on it, or it reveals a plan
  defect) → the existing BLOCKED stop. Park-and-continue defers a structural
  failure to the most expensive point and lets dependents build on it, so
  structural failures stop the run — through the stop condition that already
  exists, not a new checkpoint.

Every adjudication is a ledger entry. Silent discards stay forbidden.

## Document Restructure

New skeleton, in execution order:

1. Intro — why subagents, core principle, narration, continuous execution
2. When to Use — unchanged, including the decision graph
3. The Process — diagram updated for the new loop
4. Setup — worktree, ledger check/resume, pre-flight plan review, todos
5. Model Selection — stays one cross-cutting section; every dispatch
   consults it, so folding it into points of use would repeat it five times
6. The Task Loop — five numbered steps:
   1. Dispatch the implementer (task-brief script, five-part dispatch
      composition, model line required)
   2. Handle the report (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED)
   3. Review the task (review-package script, reviewer dispatch composition,
      constraints lens, no pre-judging, ⚠️ handling)
   4. Fix loop (the machinery above)
   5. Complete the task (ledger append, todo update)
7. Final Review — package, model pin, one fix wave, one scoped re-review,
   adjudication
8. Finish — finishing-a-development-branch
9. Common Rationalizations — the table
10. Example Workflow — updated to show a resume-based fix round and the
    breaker not tripping

"Constructing Reviewer Prompts," "File Handoffs," and "Durable Progress"
dissolve into the steps where each rule applies. Every eval-tuned sentence
lands in exactly one new location; a move map in the implementation plan
tracks source → destination so review can verify nothing was dropped or
reworded.

## Rationalization Table

Excuse-shaped Never items convert to rows; new rows cover the loop
pathology. Draft rows (final wording at implementation):

| Excuse | Reality |
|--------|---------|
| "Close enough on spec compliance" | Reviewer found gaps = not done. |
| "I'll fix it myself, dispatching is overhead" | Controller fixes pollute your context and skip review. Resume the implementer. |
| "One more round will converge" | Past the cap, rounds don't converge. Adjudicate. |
| "The reviewer will just find something new anyway" | Scoped re-reviews check fixes, not taste. New findings on untouched code go to the ledger, not the loop. |
| "This finding is obviously wrong, I'll drop it" | You adjudicate only at the cap, and every adjudication is a ledger entry. Silent discards are forbidden. |
| "The fix was small, skip the re-review" | Unreviewed fixes are how regressions land. |

Hard rules that are not excuses (never parallel implementers, never dispatch
a reviewer without a diff file, model line required, never re-dispatch
ledger-complete tasks) move to their points of use.

## Prompt Templates

- **implementer-prompt.md** — "After Review Findings" rewritten for resume
  semantics: you will be resumed with findings; fix, re-run covering tests,
  append to your report file, return the short contract.
- **task-reviewer-prompt.md** — initial review only; the trailing re-review
  sentence moves out.
- **re-review-prompt.md (new)** — the scoped re-review contract: inputs are
  brief, updated report, original findings, fix-scoped diff package; output
  is a per-finding verdict (addressed / not addressed), new breakage in the
  fix diff, and non-blocking observations outside it. A separate template
  because it is a different contract — overloading the full-review template
  produced the current ambiguity.
- **Takeover dispatch (rounds 4–5)** — composed from implementer-prompt.md
  plus SKILL.md guidance (brief, report path, open findings, takeover
  framing); no new template file.

## Final Review Loop

Unchanged: merge-base package, most capable model, ONE fixer with the
complete findings list. New: exactly one scoped re-review of the fix wave,
then controller adjudication. Residual load-bearing findings surface at
finishing-a-development-branch, where the human already is. The end of the
branch gets a bounded loop too.

## Evals

Three new drill scenarios in `evals/`:

1. **Resume, don't re-dispatch:** a task review returns findings; the
   controller must resume the same implementer rather than dispatch a fix
   subagent.
2. **Breaker trips:** a seeded never-satisfied reviewer; the controller must
   stop dispatching after the fifth round fails, adjudicate, ledger, and
   continue — not loop.
3. **Structural finding stops:** a load-bearing finding (later tasks depend
   on it); the controller must stop via BLOCKED rather than park.

Plus before/after runs of the existing SDD scenarios to catch regressions
from the reorganization.

## Non-Goals

- Ledger session-scoping — PR #1943 owns it. This work touches the same
  sections, so the implementation plan notes the collision risk.
- Script changes — task-brief and review-package already do what the new
  loop needs.
- Changes to executing-plans or requesting-code-review beyond the final-
  review pointer continuing to resolve.
