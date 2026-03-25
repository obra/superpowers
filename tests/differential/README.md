# Runtime Differential Harness

This directory hosts the checked-in workflow-status snapshot versus canonical runtime smoke harness for workflow routing.

- The harness compares a checked-in workflow-status snapshot with canonical `featureforge workflow status --refresh`.
- Any mismatch is a triage event, not a silent auto-fix.
- The expected normalized result lives in `tests/fixtures/differential/workflow-status.json`.

Use `tests/differential/run_legacy_vs_rust.sh` to run the comparison.
