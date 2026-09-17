Planner-side micro-test on Opus 5 via Bedrock (claude -p, fresh config
dir), given design.md and the wordstat plan, 6 reps each.
P1: write the Review Focus section (list of implied cases)   decode named 6/6
P2: implied cases become explicit tests in the owning task   decode test 4/6
    (14-24 tests generated per rep; the two misses spent the budget on
    other cases: whitespace, blank lines, chars-not-bytes)
The plan is where implied becomes explicit, and the list has better
recall than jumping straight to tests. Two steps (list, then a test per
line) is the shape to try next.
