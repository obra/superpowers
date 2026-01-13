# Guardrails

## Limits

- Max iterations: 40
- Max time: 8 hours
- Model: Haiku only (cost control)

## Quality Gates

- Tests must pass before commit
- Lints/type checks must pass before commit
- Code review must approve before marking task complete

## Git Rules

- Commit after each completed task
- No force push
- No commits to main/master directly (work in worktree branch)
- No uncommitted changes before iteration

## Behavior

- One task per iteration
- Exit on failure (fresh context next iteration)
- Update progress.txt before exiting
- If stuck for 3 consecutive iterations, stop and report

## Failure Recovery (Phase 2)

- If a skill fails validation, retry up to 5 times
- Each retry: analyze failure, modify gates, re-test
- After 5 retries: mark as ESCALATED, report to human
- Cleanup blocked until all skills PASS or ESCALATED

## Forbidden Actions

- Modifying GUARDRAILS.md during loop
- Skipping tests for "quick fixes"
- Accumulating context across iterations
- Retrying within same iteration

## Project-Specific Rules

- All skill modifications must follow the pattern in specs/skill-reinforcement.md
- Each skill modification requires commit with Co-Authored-By trailer
- Baseline tests must exist before compliance tests (TDD)
- Work happens in `.worktrees/hyperpowers-dvi` worktree

## Exit Conditions

- Plan exhausted (all tasks checked off)
- All tests passing + all skills reinforced
- 3+ consecutive stuck iterations
- 40 iterations reached
- 8 hours elapsed
