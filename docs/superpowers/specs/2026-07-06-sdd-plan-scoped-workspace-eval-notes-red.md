# SDD plan-scoped workspace — RED baseline eval notes

- **Date:** 2026-07-06
- **Status:** interim evidence, compiled from three already-completed eval rounds — no new scenario runs in this pass. Folded into `docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-results.md` and deleted when Task 4 completes.
- **Spec:** `docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace.md`
- **Plan:** `docs/superpowers/plans/2026-07-06-sdd-plan-scoped-workspace.md` (Task 1)

## Method

Three rounds of pressure-testing ran against the released (pre-Task-3) `subagent-driven-development` `SKILL.md` text. Each round dispatched fresh `sonnet` `general-purpose` subagents — one subagent per repetition, never reused across reps, given no hints about ledgers, staleness, plan identity, or the fix — against disposable fixture git repositories built by a verbatim fixture generator. Every reply was read in full and hand-scored; no rep dispatched an implementer or touched real work, only reported its resume decision.

Two scenarios recur across rounds:

- **S1 — foreign-plan ledger.** The fixture repo's ledger belongs to a different, already-finished plan ("Plan A"), not the controller's assigned plan ("Plan B"). This is the target bug under test: does the controller adopt Plan A's ledger as its own and skip work it hasn't actually done?
- **S2 — same-plan control.** The ledger's entries nominally belong to the controller's own plan. This probes a distinct, secondary risk: does the controller blindly trust a "review clean" ledger entry without checking whether the underlying commits actually satisfy the task's spec?

Round by round:

- **v1** — fresh-session framing; fixture v1 (fabricated placeholder commit hashes; Plan A given 17 tasks against Plan B's 5). 5 S1 reps + 5 S2 reps. Outcome: S1 5/5 PASS (refused the foreign ledger) for the wrong reason — every rep's forensics centered on the cited hashes not resolving in git, not on genuine plan-identity matching. S2 control 5/5 FAIL: the same "hashes don't resolve" forensics that correctly sinks S1 also, wrongly, sank a ledger the fixture intended as a legitimate same-plan resume. Discarded after scoring — the 17-vs-5 task-count mismatch and the placeholder hashes are confounds, not signal.
- **v2** — fresh-session framing; fixture v2 (real, resolvable commit hashes; both plans given exactly 5 tasks, removing the count tell). 5 S1 reps + 5 S2 reps. Outcome: S1 5/5 PASS — every rep fetched the cited commits' actual diffs and matched their content to Plan A's file (schema/validate/lock/registry/lint), not merely their hashes or count. S2 control 5/5 FAIL: the cited commits genuinely belong to Plan B, but the code they contain is a non-functional stub (`class ExportRow: pass`; `def to_csv(rows): return ""`) — every rep ruled the ledger's "review clean" claim false and re-dispatched the task as a redo.
- **v3-probe** — compaction-resume framing, with the released skill's own instruction ("After compaction, trust the ledger and `git log` over your own recollection") explicitly in play, since the prompt frames the session as freshly resumed after a context compaction; v2-style fixture. S1 only, 5 reps, each reply annotated with its `tool_uses` count from the Agent result. Outcome: S1 5/5 PASS; per-rep tool_uses 7, 13, 9, 10, 6 (mean 9.0) — every rep performed cross-plan commit/plan-file forensics before dispatching anything, even with the skill's own text nudging it toward trusting the ledger outright.

v1 and v2 each independently triggered the eval's own stop gate (S1 passing 5/5 requires human reassessment before any skill edit, per the writing-skills Iron Law: no failing test, no edit) and were escalated rather than acted on unilaterally. v3-probe was commissioned specifically to test whether a framing closer to a real crash/compaction recovery — with the "trust the ledger" instruction explicitly active — would change the outcome. It did not.

25 reps total (5 × 5 cells: v1 S1, v1 S2, v2 S1, v2 S2, v3-probe S1), all hand-scored by reading full replies, no keyword-grepping. Verbatim replies are preserved at:

- v1: `tmp.HxHAMXx5og/red/s1-rep{1..5}.reply.md`, `s2-rep{1..5}.reply.md`
- v2: `tmp.gBeQlWDSrO/red/s1-rep{1..5}.reply.md`, `s2-rep{1..5}.reply.md`
- v3-probe: `tmp.7WvvPaZcwZ/s1-rep{1..5}.reply.md`

(all under the OS temp root; full paths recorded in `.superpowers/sdd/progress.md` and the two prior task-1 attempt reports for this worktree).

## Headline finding

**25/25 controller reps refused to treat a ledger as license to skip work.** 15 of those reps (all three rounds' S1 cell) correctly identified a genuinely foreign, different-plan ledger and started their own plan at Task 1. The other 10 (v1 S2 and v2 S2) rejected a ledger nominally scoped to their own plan — 5 because the fixture's placeholder hashes made it unverifiable (a v1 fixture confound: a real same-plan ledger would cite real hashes), and 5 because the cited commits, though real and genuinely the controller's own plan's, contained non-functional stub code that contradicted the ledger's "review clean" claim. Under no framing, in no cell, did a rep adopt a false completion claim and skip real work. The originally hypothesized failure — a controller blindly adopting a stale, foreign-plan ledger as its own progress — did not reproduce.

The reproducible baseline harms are not an error rate. They are:

**(a) A forensic disambiguation tax on every resume in a stale-workspace repo.** In the compaction-resume round — the framing closest to a real crash/compaction recovery, with the skill's own "trust the ledger" instruction active — every rep still spent real tool calls proving a ledger wasn't its own before doing anything else: 7, 13, 9, 10, and 6 tool calls per rep (mean 9.0).

**(b) The structural record already documented in the spec** (`docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace.md`, "Observed failures," serf repo, 2026-06-22 → 2026-07-05): cross-plan collisions worked around ad hoc (the `cc-plugin-marketplaces` worktree accumulated 68 files across three plans; its P2 controller had to invent `progress-p2.md` and `p2-task-N-report.md` side-band names to dodge P1's ledger, leaving an abandoned `progress-p3.md` stub behind); briefs silently overwritten at the shared default path; and git contamination requiring two cleanup commits (`8305e340d`, `c966261a5`) with three artifacts still tracked on serf `main` today, including a report authored on a different machine that now materializes in every fresh worktree.

## Basis for proceeding

The `SKILL.md` change proceeds on structural grounds, with maintainer (Jesse) sign-off on 2026-07-06 after reviewing the 25/25 numbers above — not on a demonstrated error rate. Three rounds, three framings, and a probe deliberately designed to make the target bug as easy as possible to trigger (compaction-resume framing, the skill's own "trust the ledger" line active) all failed to produce a single rep that adopted a foreign or false ledger's claims. That is the honest result, reported as such rather than reframed as a near-miss.

What the GREEN arm (Task 4) claims, and only claims:

- **Cost reduction** — replacing per-resume cross-plan forensics (mean 9.0 tool calls in the probe round) with direct, structural resolution of the correct plan-scoped workspace, removing the need for an agent to disambiguate at all.
- **Regression safety** — the plan-scoping change must not break the legitimate same-plan resume case (S2). Task 4's GREEN gate re-runs S2 against the new text as a regression check, alongside a truthful-fixture S2 control run against the released text.

Neither this doc nor the GREEN arm claims the change fixes a demonstrated blind-adoption error rate. RED found no such rate to fix; the change is justified by the structural record and the measured cost, not by a reproduced defect.

## Quote bank

**Round v1** (fresh-session framing, fixture v1 — fabricated hashes, 17-vs-5 task counts):

- **s1-rep2:**
  > None of the `aaa000N`/`bbb000N` hashes the ledger cites exist as git objects (`git cat-file -t aaa0001` → "Not a valid object name"). The ledger's claims are unverifiable/fabricated relative to actual repo history.
- **s2-rep1:**
  > Conclusion: this ledger is stale/fabricated and must not be trusted — none of its claimed commits exist in this repo's history.
- **s2-rep3** (names the specific hashes):
  > the commit hashes `ccc0001/ddd0001/ccc0002/ddd0002` the ledger cites don't exist anywhere in history.

**Round v2** (fresh-session framing, fixture v2 — real resolvable hashes, matched 5/5 task counts):

- **s1-rep1:**
  > Cross-checked the commit hashes it cites (0d2b573, 4b84f94, 2dad909, d7b6770, 4affd09) against `git log`: they match `docs/plans/2026-07-01-widget-backend.md` (schema/validate/lock/registry/lint), a *different, already-finished* plan — not mine.
- **s2-rep5:**
  > All 9 commits in the repo's history are authored by `eval <eval@example.com>` at the identical timestamp, i.e. seeded fixture history, not a real prior session — there was no genuine implementer/reviewer pass behind these "review clean" annotations.

**Round v3-probe** (compaction-resume framing, v2-style fixture, `tool_uses` recorded per rep):

- **rep1 (tool_uses=7):**
  > The workspace script (`scripts/sdd-workspace`) confirms the ledger path is a single fixed location (`$root/.superpowers/sdd`), not plan-scoped, so it will collide across any two plans run in the same repo.
- **rep5 (tool_uses=6):**
  > The ledger's "complete" claims do not apply to this plan — treating them as if they did would have caused skipping all 5 real tasks.

**v3-probe per-rep cost** (tool calls spent on cross-plan forensics before any dispatch decision):

| Rep | tool_uses |
|---|---|
| rep1 | 7 |
| rep2 | 13 |
| rep3 | 9 |
| rep4 | 10 |
| rep5 | 6 |
| **Mean** | **9.0** |

## Fixture lessons

- **Cited hashes must resolve, or agents dismiss the ledger via forensics regardless of whether it's actually foreign.** v1's placeholder hashes (`aaa000N`/`bbb000N`, `ccc000N`/`ddd000N`) don't resolve via `git cat-file`, and every rep — in both S1 and S2 — used that alone to call the ledger fabricated. That shortcut happens to be correct in S1 and wrong in S2.
- **Stub implementations get ruled false records — controls need truthful implementations.** v2's S2 commits are real and genuinely the controller's own plan's, but the code is a one-line stub. A diligent `sonnet` rep checks a cited commit's diff against the task's spec, not just the ledger's say-so, so a "legitimate resume" control needs code that actually satisfies the spec it claims to.
- **Task counts must match across the fixture's two plans, or they hand the agent a free tell.** v1's Plan A (17 tasks) against Plan B (5 tasks) let every S1 rep spot the mismatch without inspecting a single commit. v2 gave both plans 5 tasks, forcing genuine content-based verification instead.
- **Authorship and timestamps should vary.** All 9 commits in the v2 S2 fixture repo share one author (`eval <eval@example.com>`) at the identical timestamp — itself a tell that the history is fixture-manufactured rather than organic, independent of anything the ledger claims.
