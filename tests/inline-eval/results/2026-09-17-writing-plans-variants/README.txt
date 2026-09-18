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
