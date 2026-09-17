ledgerlite fixture reruns after commit f60779d (reviewer standard + Declined
slot, plan list-then-tests, executor rules on declined lines). Opus 5 via
Bedrock, 3 reps per arm.

spike 21-23   inline v3, six-task plan: 3/3 reps x 3 probes handled (as
              before; all three defects are spec-stated), rulings list 3/3,
              USD median $5.45 vs $5.65 before the change. The reviewer's
              Declined slot did not raise the cost.
wpplan 11-13  writing-plans from design.md alone (fixtures/ledgerlite-design-only):
              Review Focus 12-15 lines, plans 1215-1365 lines, 68-87 tests,
              USD $1.19-$1.49. Undecodable input named 3/3; header row 2/3.
              Over the top in two ways: every line becomes a test, and some
              lines change what the spec states (wpplan-13 #12 drops the
              spec's blank line before `closing balance` on a header-only
              CSV; wpplan-12 makes an empty CSV exit 2). The baseline for
              microtests/review-focus-tiers.
