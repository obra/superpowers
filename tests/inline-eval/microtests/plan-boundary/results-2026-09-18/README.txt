Plan-boundary micro-test, Sonnet 5 via Bedrock, single-shot sessions on a
repo where plan 1 (engine) is built with Game.Advance and plan 2 still says
Game.Tick. Each session is told plan 1 is done and asked to set up plan 2
and stop before its Task 1, under one of: no instruction (X0), the
per-ruling "plans touched" slot (X1), a prose boundary scan (X2), the
plan-boundary script (X3, run after).

Result: a ceiling. Every rep in every arm (17/17 with output; one X0 rep
produced no output) found the Tick/Advance mismatch and edited plan 2; the
two "Tick" mentions left are Bubble Tea's own tea.Tick and a test name.
A fresh session asked to "set up plan 2" checks the names on its own. The
failure this was meant to reproduce (0/2 slot, partial edits) happened
inside long sessions mid-flow, after a final review and a fix pass, which
a single-shot cannot stage. So the micro-test does not discriminate, and
the boundary-script gate is judged by the full plan-set run instead. The
interviews of the two failing sessions are the evidence for its form.
