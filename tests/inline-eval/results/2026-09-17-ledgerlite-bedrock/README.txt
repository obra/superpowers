ledgerlite fixture (hardened: three planted defects), Bedrock backend
(us.anthropic.claude-opus-5 via SigV4), 3 reps per arm.

                         spike (inline v3)      barerev (bare + one Opus review)
USD median               $5.65                  $3.15
probes handled           3/3 reps x 3 probes    3/3 reps x 3 probes
rulings list             3/3                    n/a
suite green, 6+ commits  3/3                    3/3

None of the three planted defects discriminated. Every implementer in
both arms, six of six, enforced the amount-precision rule in its Task 2
commit ("Add CSV parsing"), before any review: with design.md open, Opus 5
implements the spec's stated malformed-row list in full even where the
plan's tests stop short. Same for the exit-2 path and the Interfaces
mismatch. Lesson for fixture design: a defect the final review can be
credited with must be IMPLIED by the spec (the wordstat encoding case:
"cannot be read" with no mention of decoding), not stated in it.

On a six-task plan with no implied defects, bare + one Opus review is the
cheaper floor (56% of inline v3) with equal outcomes; inline's extra
spend bought the ledger, scan, and rulings/deferred lists, which this
fixture gives no way to value.
