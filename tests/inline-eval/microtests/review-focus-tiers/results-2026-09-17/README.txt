Review Focus wording micro-test, Opus 5 via Bedrock (claude -p, fresh config
dir), given design.md + a complete plan.md, output the section only. 6 reps
per arm x fixture (wordstat 3 tasks, ledgerlite 6 tasks). summary.txt has the
counts; override-read.txt is a subagent's line-by-line read against the spec
(its OVERRIDE class is too strict: it counts reasonable-person extensions
such as directory -> exit 1; the real contradictions are ~3 reps, all on
ledgerlite's blank-line-before-closing-balance sentence).

Baseline failure: under the current wording (T0) Opus writes 11-20 lines
and earmarks nearly every one for a test; in full plans that is 68-87 tests
for the six-task design.

T0 current (list, then a test per line)         11-13 / 13-20 items, ~all tests
T1 per-line ruling with a cost criterion        12-18 / 19-26 items  (worse)
T2 per-line ruling, planner's free choice       13-20 / 19-26 items  (worse)
T3 one line per input the program takes        11-18 / 12-27 items  (worse: sub-cases per input)
T4 "the five most likely to bite"               5-6 / 5-10 items     (respected 11/12)

Recall of the undecodable-input case: named in every rep of T0-T3 on both
fixtures; under T4 6/6 on wordstat, 0/6 on ledgerlite, where the five slots
went to the malformed-row exit path, amount precision, unreadable --rules,
header-only CSV, and --opening: the planted defects and the spec's stated
but untested paths, which is a defensible ranking for a bank-CSV tool.

Reading: a ruling slot or a cost field is an invitation to enumerate; a
recipe keyed to inputs multiplies by sub-cases. Only a stated count moved
the volume. The form that survives is a count, and the number is a
judgment call (fixed, or scaled to the plan) — see the next micro-test.
