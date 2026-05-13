# Execution Lane Fixture

This fixture isolates `executing-plans` and `subagent-driven-development` from the real repository state used in the main baseline.

Purpose:

- provide one unfinished implementation plan
- avoid completed checkpoint history from the main repo
- keep documentation context minimal and deterministic
- allow Claude-only regression runs for execution-oriented skills

Expected usage:

- run from `tests/skill-trigger/scripts/run_execution_lane.sh`
- use `tests/skill-trigger/corpus-execution-lane.yaml`
- store artifacts separately from the main baseline queue

Contents:

- `.horspowers-config.yaml`
- `docs/plans/2026-05-13-execution-lane-sample-plan.md`

