# Claude Code Test Runners

`tests/claude-code/` now uses layered suites so routine checks do not automatically trigger every long-running `claude -p` script.

## Runner Summary

### `run-skill-tests.sh`

Batch runner for CI and quick local checks.

Examples:

```bash
./tests/claude-code/run-skill-tests.sh
./tests/claude-code/run-skill-tests.sh --suite full
./tests/claude-code/run-skill-tests.sh --suite integration
./tests/claude-code/run-skill-tests.sh --list
./tests/claude-code/run-skill-tests.sh --test test-tdd.sh
```

Behavior:

- defaults to `smoke`
- supports `smoke`, `full`, and `integration`
- supports `--list` to preview without running Claude
- does not automatically include targeted direct-run probes such as `test-worktree-native-preference.sh` or `test-document-review-system.sh`

### `run-skill-tests-interactive.sh`

Interactive queue runner with progress estimates.

Examples:

```bash
./tests/claude-code/run-skill-tests-interactive.sh
./tests/claude-code/run-skill-tests-interactive.sh --suite full
./tests/claude-code/run-skill-tests-interactive.sh --test test-tdd.sh
```

### `run-skill-tests-stepwise.sh`

Stepwise runner that pauses between tests.

Examples:

```bash
./tests/claude-code/run-skill-tests-stepwise.sh
./tests/claude-code/run-skill-tests-stepwise.sh --suite full
./tests/claude-code/run-skill-tests-stepwise.sh --test test-tdd.sh
CONFIRM_EACH=false ./tests/claude-code/run-skill-tests-stepwise.sh --suite smoke
```

## Suite Guidance

### `smoke`

Use for routine development checks. This is the default.

- short prompts
- fast feedback
- validates that core skills still load and answer the most important questions

### `full`

Use before broader merges or when touching skill content.

- multi-question semantic checks
- slower than smoke
- better coverage of behavior and instruction content

### `integration`

Use only when you need end-to-end evidence.

- expensive
- real project setup
- workflow execution validation

## Recommended Workflow

1. Run `./tests/claude-code/run-skill-tests.sh`
2. If skill content changed, run `./tests/claude-code/run-skill-tests.sh --suite full`
3. If `skills/using-git-worktrees/SKILL.md` changed, run `bash ./tests/claude-code/test-worktree-native-preference.sh green`
4. If `skills/brainstorming/SKILL.md`, `skills/brainstorming/spec-document-reviewer-prompt.md`, `skills/writing-plans/SKILL.md`, or `skills/writing-plans/plan-document-reviewer-prompt.md` changed, run `bash ./tests/claude-code/test-document-review-system.sh green`
5. Run integration only when workflow behavior was touched

## Direct-Run Targeted Tests

### `test-worktree-native-preference.sh`

Use this when validating `using-git-worktrees` prompt wording around native tool preference.

```bash
bash ./tests/claude-code/test-worktree-native-preference.sh green
```

What it verifies:

- native worktree tools are named and preferred when available
- user consent to create an isolated workspace authorizes direct native tool usage
- `git worktree add` remains fallback-only, not the default answer when native tools exist

What it does not verify:

- actual worktree creation
- real tool invocation success
- suite membership or end-to-end isolation setup

### `test-document-review-system.sh`

Use this when validating the document reviewer flow for brainstorming and writing-plans.

```bash
bash ./tests/claude-code/test-document-review-system.sh green
```

What it verifies:

- prompts explicitly reference current-workspace reviewer files instead of trusting an installed skill copy
- brainstorming routes `docs/plans/` design docs through structured spec review before the user review gate
- writing-plans routes `docs/plans/` plan docs through plan review against the related design/spec before execution handoff
- both reviewer prompts preserve blocking-vs-advisory calibration

What it does not verify:

- actual subagent dispatch
- creation of real design or plan documents
- suite membership or full workflow execution

## Queue Preview

Preview a suite without running Claude:

```bash
./tests/claude-code/test-queue-preview.sh
./tests/claude-code/test-queue-preview.sh full
```

## Why This Exists

The old default runner lumped together many high-cost semantic tests. That made local iteration noisy and increased the chance of runaway or stacked `claude -p` subprocesses. The layered model keeps default feedback cheap while preserving deeper suites for explicit use.
