# Runtime Differential Harness

This directory hosts the legacy-vs-Rust runtime smoke harness for canonical workflow routing.

- The harness compares legacy `bin/superpowers-workflow-status` output with canonical `superpowers workflow status --refresh`.
- Any mismatch is a triage event, not a silent auto-fix.
- The expected normalized result lives in `tests/fixtures/differential/workflow-status.json`.

Use `tests/differential/run_legacy_vs_rust.sh` to run the comparison.
