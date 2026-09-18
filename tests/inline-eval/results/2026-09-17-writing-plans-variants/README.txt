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
