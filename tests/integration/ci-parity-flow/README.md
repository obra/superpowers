# Integration test: CI-parity flow

End-to-end test of the new CI-parity skills. Exercises:
- `committing-work` catching multiple gate failure types in one commit attempt
- `committing-work` auto-fixing safe categories (formatters, lockfile)
- `pushing-to-remote` re-verifying after a rebase
- `finishing-a-development-branch` chaining the two new skills

## How to run

```bash
# 1. Set up the test scratch repo
./setup.sh

# 2. Open a fresh agent session in /tmp/superpowers-integration-test/
#    Do NOT carry context from a previous session.

# 3. Walk through the scenarios in expected-outcomes.md, noting the agent's behavior.
```

## What "pass" means

See `expected-outcomes.md` for per-scenario success criteria.

## Files

- `setup.sh` — creates a scratch Node/TypeScript project at `/tmp/superpowers-integration-test/` with deliberate failure cases
- `expected-outcomes.md` — 6 scenarios (A through F) with expected agent behavior
- `RESULTS-2026-04-29.md` — first run results (deferred; see "Run requirements" below)

## Run requirements

This integration test requires a fresh agent session in the scratch repo with the
superpowers plugin active. Running it from within the agent that just built the
skills (current OpenCode session) would not be a valid test — context contamination.

For a real run:
1. Open Claude Code in a new terminal at `/tmp/superpowers-integration-test/`
2. Ensure the superpowers plugin is installed and active
3. Run the prompts in `expected-outcomes.md` one at a time
4. Capture results
