writing-plans wording variants under test (each a worktree at the spike
tip plus one diff), from the two field reports of 2026-09-17 (an 8-hour
planning run; a 19,393-line plan set for a 1,894-line spec):

  N1-recipe          "No Placeholders" (a prohibition list) replaced by
                     "What a Step Contains" (a recipe: signature, test name
                     and assertions, spec values; a body only where those
                     do not determine it); task template and self-review
                     step 2 to match
  Q1-reader          overview describes a capable reader instead of "zero
                     context ... questionable taste ... don't know good
                     test design"
  Q2-reader-recipe   Q1 + N1
  F1-first-plan      scope check: write the first plan, then stop and hand
                     off; the next plan waits for running code
  P1-proportion      self-review item 5: proportion of plan to spec
  L1-loose           SDD: briefs carry the plan's header sections; the
                     implementer may read the spec (plan-completeness test)

Fixtures: cosmic-tetris-design-only (the report's spec, planning capped at
40 min, wpplans arm) and ledgerlite-design-only (wpplan arm). Baseline is
the current wording on both. Results land in a sibling directory.

Baseline, cosmic-tetris, current wording, Opus 5 via Bedrock, capped at
40 minutes of wall clock (both were still writing when stopped):
                 plans   lines    Go lines   steps   tests   USD    drafter dispatches
  wpplans-1      3 of 5  10,894   8,570      194     295     7.93   0
  wpplans-2      3 of 5  10,206   8,576      151     285     7.29   0
About 230 lines a minute; the full five-plan set extrapolates to roughly
17-18k lines and 75 minutes, i.e. the report's 19,393 lines reproduced at
eval scale (its 5h14m included Ruff and scratch verification the planner
here did not do). Neither planner dispatched drafter subagents: the
parallel-drafter orchestration in the first report was the parent's
invention, not something the skill induces, so "one document, one author"
is not testable here and stays a proposal.

N1-recipe ("What a Step Contains" replaces "No Placeholders"):
  cosmic-tetris (capped 40 min)
                 plans   lines   Go lines  steps  tests  USD    min
    wpplans-11   5 of 5  8,983   6,093     254    338    11.46  41.7   (finished)
    wpplans-12   3 of 5  5,985   3,666     185    214     5.34  27.6   (stopped itself)
  ledgerlite (baseline under the five-line RF wording: 1,371-1,475 lines, 66-79 tests)
    wpplan-51    707 lines   403 py   50 tests   $0.99   4.7 min
    wpplan-52    774 lines   428 py   47 tests   $1.49   6.4 min
    wpplan-53    938 lines   554 py   68 tests   $1.37   6.1 min
  Roughly halves the plan on both fixtures (ledgerlite 707-938 vs 1,371-1,475;
  cosmic 9k for all five plans vs 11k for three) with the implied cases still
  named 3/3. The recipe keeps full test code by design, and tests are now
  most of the fenced lines: the test count is the remaining volume driver.

Q1-reader (capable-reader overview, No Placeholders unchanged):
  cosmic (capped 40 min): 2 and 3 of 5 plans, 6,085 / 5,164 lines, still
    writing at the cap (about 3,000 lines per plan, same as baseline)
  ledgerlite: 1,067-1,203 lines, 57-70 tests (baseline 1,371-1,475 / 66-79)
  The framing alone trims ledgerlite by ~20% and does nothing on cosmic.

Q2-reader-recipe (Q1 + N1):
  cosmic: both reps finished on their own in 32-35 min with THREE plans that
    cover all five phases (the planner merged engine+terminal or effects+
    polish): 7,451 and 5,979 lines, 282 / 211 tests, $7.81 / $11.22.
    Recipe-alone rep 12 did the same (3 plans, 5,985 lines, 27.6 min).
  ledgerlite: 675-956 lines, 46-66 tests: the same as recipe alone.
  The reader framing adds nothing on top of the recipe. The recipe is the
  change: a complete plan set for the report's spec in 6-7.5k lines and
  about half an hour, against an extrapolated 17-18k lines and 75 minutes
  under the current wording (the report's real session: 19,393 lines,
  5h14m). Tests are ~90% of the remaining fenced code (T1 tests that).

F1-first-plan ("write the first plan, then stop and hand off"), cosmic, 2 reps:
  both wrote ONE plan (the engine phase), 3,120 / 3,256 lines, 82 / 91
  tests, 20-22 min, $4.40 / $3.95, then handed off. Works as a brake 2/2;
  the plan it writes is baseline-sized (current wording underneath).

P1-proportion (self-review item 5: plan length vs spec; bodies -> signatures
and test assertions when code blocks dominate), current wording otherwise:
  cosmic, 2 reps, both finished on their own:
    wpplans-51  3 plans covering all five phases   2,968 lines   842 Go   223 tests   16.8 min   $3.57
    wpplans-52  5 plans + a 29-line overview       3,615 lines 1,003 Go   284 tests   19.0 min   $4.62
      (498-921 lines per plan: the report's "five plans of 400 lines")
  ledgerlite: 756 / 853 / 934 lines, 49-54 tests, implied cases 8/9
  The largest effect of any single edit: a full plan set for the report's
  spec in ~3-3.6k lines and under 20 minutes, against 17-18k lines and 75
  minutes extrapolated for the current wording. Consistent with the earlier
  finding that a stated bound is the form that moves Opus's volume where
  prose principles do not. The plans keep the Interfaces blocks (the part
  the report's author found useful) and shrink code to signatures.

Execution check, Q2 (reader + recipe) ledgerlite plan from wpplan-71 (675
lines), inline on Sonnet 5, 3 reps: 9/9 probes handled, suite green,
$2.36 / $2.77 / $2.50 (hand-written terse plan: $2.89; Opus full plan:
$3.71). A skill-written terse plan executes as well as the hand-written one.
Execution check, P1 (proportion) ledgerlite plan from wpplan-81 (756 lines),
inline on Sonnet 5, 3 reps: 9/9 probes handled, suite green, $2.91 / $3.06 /
$2.67. Both skill-written terse plans execute as well as the hand-written one.

T1-test-lines (Q2 + tests as one line each: name, call, expected; the
implementer writes the test file), ledgerlite:
  wpplan-91  394 lines   64 test lines   $0.84   implied cases 3/3
  wpplan-92  384 lines   65 test lines   $0.61   2/3
  wpplan-93  352 lines   81 test lines   $0.82   3/3
  No fenced code at all in two of three. The plan is Interfaces blocks,
  a "Pinned decisions" list the planner added on its own, and one-line
  tests. Cosmic reps and the execution check (spike 101-103) follow.
  cosmic:
    wpplans-61  3 plans, all five phases   3,073 lines   26 Go lines   39 tasks   27.7 min   $6.03
    wpplans-62  died at 5.5 min (Bedrock "unexpected error", no plan); replaced by
    wpplans-63  3 plans, all five phases   2,257 lines   55 Go lines   37 tasks   17.1 min   $4.15
  Execution check, T1 ledgerlite plan from wpplan-91 (394 lines, no code),
  inline on Sonnet 5, 3 reps: 9/9 probes, suite green, the executor wrote
  66-69 tests from the one-line list, $3.36 / $3.14 / $2.89, 13 min each.
  The plan with no code executes as well as every other form; the executor
  spends about fifty cents more writing the tests itself.

C1-combined (recipe with "verification step", proportion item, capable-
reader framing, first-plan-then-stop, reviewer prompt deleted, no time
unit):
  ledgerlite: 551 / 475 / 527 lines, 44 / 36 / 39 tests, 3.5-3.7 min,
    $0.71-0.81, implied cases 3/3. Smaller than any single-change arm: the
    changes compound.
  cosmic: wpplans-71 wrote one plan (first-plan rule) covering phases 1+2,
    1,336 lines, 554 Go, 85 tests, 10.8 min, $2.54, then handed off;
    wpplans-72 died at 3.8 min on a Bedrock "unexpected error" (the second
    such loss today), not replaced because C3 supersedes C1's first-plan rule.
  Execution check, wpplan-121's plan (551 lines) inline on Sonnet 5, 3 reps:
    9/9 probes, suite green, $3.27 / $2.86 / $2.85, 11-13 min.

C3-planset (C1 without the first-plan rule; all plans up front, each with a
Plan Set section; rulings carry a plans-touched slot and edit later plans;
executors continue into the next plan) runs next: cosmic x2, then the
first plan executed on Sonnet 5 x2 with the set present.

C3-planset, cosmic, planning (all plans up front, each with a Plan Set section):
  wpplans-91  5 plans   3,436 lines total (456-787 each)   1,509 Go   255 tests   $5.15
  wpplans-92  3 plans   3,775 lines (1,079-1,562 each)     1,450 Go   264 tests   $4.91
  Plan Set section present in every plan, 8/8.
C3-planset, execution of plan 1 (engine, 10 tasks, Go) inline on Sonnet 5,
plan.md = plan 1 with the set in plans/, prompt "execute plan.md ... tell me
when the plan is complete", 2 reps: 11 commits each, go test green, Opus
final review + fix pass, $11.23 / $11.99. Closing message carried
"Remaining plans" naming plans 2-5 as not started, 2/2 ("say the word if
you'd like me to continue into Plan 2"). Neither continued: the prompt
said the plan, singular, and user instructions outrank the skill. No
ruling touched a later plan (all were local: step order, test values), so
the plans-touched slot and the plan edits were not exercised; a fixture
with a planted cross-plan conflict (cosmic-tetris-planset-trap) and a
prompt naming the set tests both next.

C3-planset, execution of the SET on Sonnet 5 (fixtures/cosmic-tetris-planset-
trap: plans 1-2 say Tick, spec and plans 3-5 say Advance; prompt names
plans/ and leaves "done" open), 2 reps, capped at 75 min, $28.18 / $25.06:
  continued into plan 2 without asking       2/2  ("continuing straight into
                                                   Plan 2 now, same method")
  closing report named remaining plans       2/2
  plan 1 finished, go test green             2/2  (19 / 17 commits; both were
                                                   mid plan 2 at the cap)
  the Tick/Advance conflict:
    spike-151 ruled to keep Tick ("despite design.md"), edited no plan;
              plans 3-5 still say Advance and would run against Tick.
    spike-152 renamed Tick -> Advance after the review (spec wins), and
              edited the Plan Set index lines in plans 1 and 2 (Consumes
              `Tick` -> `Advance`) but not plan 2's task-level mentions.
  plans-touched slot in the ruling text        0/2
  later plan edited                            1/2, and only the index line
The continuation and the closing slot work. The keep-later-plans-true
mechanism does not, as a slot on the ruling: sessions write rulings in
their own shape and the slot is not filled, and even the session that
acted edited the index rather than the consuming lines. The form to try
next is a boundary check instead of a per-ruling duty: before starting the
next plan, scan its Consumes lines against the code as built (the
pre-flight scan executing-plans already runs against the spec, pointed at
the previous plan's output), and fix the plan there.
