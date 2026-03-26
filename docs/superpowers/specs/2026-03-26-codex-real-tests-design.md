# Codex Real Tests Equivalence

Bring Codex test coverage to the same practical level as `tests/claude-code/`, including real end-to-end integration tests for the superpowers workflow.

## Motivation

The repository already has two testing layers for Claude Code:

- cheap, always-on skill checks in `tests/claude-code/`
- slow, opt-in integration tests that run real agent sessions and verify actual behavior

Codex does not yet have an equivalent suite. That leaves three gaps:

- we do not regularly verify that Codex still loads and follows superpowers skills
- we do not have a Codex-native integration test for `subagent-driven-development`
- we do not have a Codex-native integration test for document review behavior

The goal is not to compare agents or to build a shared benchmark harness. The goal is to give Codex the same style of confidence that Claude Code already has.

## Empirical Findings

The design is based on the current Codex CLI behavior, not assumptions:

- `codex exec` supports non-interactive execution with `--json`, `-C`, `--add-dir`, `--skip-git-repo-check`, and configurable sandbox mode
- `codex exec --json` emits structured JSONL events such as:
  - `thread.started`
  - `turn.started`
  - `item.completed`
  - `turn.completed`
- Codex's exec event model already exposes the structured signals we need for robust assertions:
  - `todo_list` items for `update_plan`
  - `collab_tool_call` items for `spawn_agent`, `wait`, and `close_agent`
  - `agent_message`, `command_execution`, and `file_change` items for user-visible outcomes
- `turn.completed` includes token usage, which gives a reliable proof that the test ran a real agent turn
- Codex persists rollout/session files under `$CODEX_HOME/sessions` and supports a fully isolated test home via `CODEX_HOME`
- Codex discovers user-installed skills from both deprecated `$CODEX_HOME/skills` and the current `$HOME/.agents/skills`
- For this repository's Codex install path, symlinking the repo's `skills/` directory into `$HOME/.agents/skills/superpowers` is the most direct equivalent to a real user installation

These findings make it possible to write tests that assert structured behavior instead of relying only on brittle text matching.

## Architecture

Create a dedicated `tests/codex/` suite that mirrors the Claude Code testing philosophy while staying native to Codex CLI behavior.

### Test Layout

New directory:

- `tests/codex/README.md`
- `tests/codex/test-helpers.sh`
- `tests/codex/run-skill-tests.sh`
- `tests/codex/test-subagent-driven-development.sh`
- `tests/codex/test-subagent-driven-development-integration.sh`
- `tests/codex/test-document-review-system.sh`

This is intentionally parallel to `tests/claude-code/`, not mixed into it.

### Isolation Model

Each Codex test runs in its own isolated environment:

- temporary `HOME`
- temporary `CODEX_HOME`
- temporary working project directory

Within that isolated home:

- create `$HOME/.agents/skills`
- symlink the repository's `skills/` directory to `$HOME/.agents/skills/superpowers`

This keeps the tests hermetic:

- no dependency on the developer's real `~/.codex`
- no dependency on already-installed skills
- no accidental reuse of prior session files
- no contamination of the user's real Codex history or state databases

### Evidence Model

Each integration test captures two kinds of evidence:

1. **Live exec output** from `codex exec --json`
2. **Persisted rollout file** from `$CODEX_HOME/sessions/...jsonl`

The design prefers structured assertions when available:

- `todo_list` item present -> agent used `update_plan`
- `collab_tool_call` with `spawn_agent` -> agent used subagents
- `turn.completed.usage` present -> real turn completed
- `file_change` and on-disk files -> the agent actually changed the project

Plain text assertions are still allowed where the behavior being tested is inherently linguistic, such as document review findings.

## Runner Behavior

`tests/codex/run-skill-tests.sh` should match the Claude Code runner's contract:

- default: run only fast tests
- `--integration`: include slow real-session tests
- `--verbose`: stream full output
- `--test NAME`: run one test file
- `--timeout N`: override timeout

The intent is familiarity. A contributor who understands `tests/claude-code/run-skill-tests.sh` should immediately understand the Codex runner.

## Test Design

### 1. Fast Skill Test

`tests/codex/test-subagent-driven-development.sh`

Purpose:

- verify that Codex can load and explain the `subagent-driven-development` skill
- cheaply catch regressions in skill discovery or in how Codex interprets the skill

Approach:

- run `codex exec` against small verification prompts, similar in spirit to the Claude test
- assert for the same high-value behavioral requirements already checked in `tests/claude-code/test-subagent-driven-development.sh`

Coverage should include:

- review order: spec compliance before code quality
- required self-review by implementers
- controller provides full task context rather than telling subagents to read files
- prerequisite workflow skills
- branch/worktree expectations when applicable

This test remains intentionally cheap and text-oriented.

### 2. Real `subagent-driven-development` Integration Test

`tests/codex/test-subagent-driven-development-integration.sh`

Purpose:

- execute a real implementation plan with Codex and verify the workflow end-to-end

Test project:

- temporary Node.js project
- simple `package.json`
- `src/`, `test/`, and `docs/superpowers/plans/`
- initialized git repository with test identity

Plan:

- same minimal two-task math plan currently used in the Claude integration test
- task 1 creates `add`
- task 2 creates `multiply`

Assertions:

- Codex session completes successfully
- `todo_list` appears in exec output and/or session file
- `collab_tool_call` appears with `spawn_agent`
- implementation files are created
- tests pass via `npm test`
- resulting source contains the expected functions
- session file contains `turn.completed` usage

Optional assertion:

- multiple commits created if the workflow produces them consistently in Codex

The design should not require exact prompt text or exact reasoning text. It should verify outcomes and structured workflow signals.

### 3. Real Document Review Integration Test

`tests/codex/test-document-review-system.sh`

Purpose:

- verify that Codex can use the existing review prompt template and catch intentionally bad spec content

Test project:

- temporary git repo
- `docs/superpowers/specs/test-feature-design.md` containing known flaws

Prompt strategy:

- tell Codex to read `skills/brainstorming/spec-document-reviewer-prompt.md`
- review the spec using that format

Assertions:

- output identifies the explicit `TODO`
- output identifies deferred or incomplete content such as "specified later"
- output includes an issues section or equivalent review structure
- output does not incorrectly approve the flawed spec

Unlike the subagent integration test, this one is primarily semantic. Text assertions are appropriate here because the product behavior is the review itself.

## Helper Responsibilities

`tests/codex/test-helpers.sh` should provide:

- isolated temp environment setup
- Codex skill installation into `$HOME/.agents/skills/superpowers`
- `run_codex` helper for non-interactive prompts
- `create_test_project` and cleanup helpers
- session file discovery helpers using `$CODEX_HOME/sessions`
- simple assertion helpers reused by fast and integration tests

The helper layer should also normalize common Codex flags so each test file stays readable.

## Documentation Changes

### `tests/codex/README.md`

Document:

- prerequisites (`codex` installed and authenticated)
- fast vs integration behavior
- isolated `CODEX_HOME` behavior
- where sessions are stored during tests
- troubleshooting for auth, timeouts, and skill discovery failures

### `docs/testing.md`

Extend the existing testing guide with a new Codex section:

- how to run fast Codex tests
- how to run integration Codex tests
- how Codex evidence differs from Claude Code evidence
- why `codex exec --json` and `$CODEX_HOME/sessions` are both used

## What Does Not Change

- `tests/claude-code/` stays as-is
- no shared multi-agent benchmark harness is introduced
- no `codex-server-app` or app-server testing is required for this work
- no changes to superpowers skill content are required to add the initial Codex suite

`codex-server-app` can be a future extension if we later want UI- or app-server-specific validation. It is not part of the first equivalence milestone because the Claude comparison point is `claude -p`, not a GUI runtime.

## Scope Summary

Files added:

- `tests/codex/README.md`
- `tests/codex/test-helpers.sh`
- `tests/codex/run-skill-tests.sh`
- `tests/codex/test-subagent-driven-development.sh`
- `tests/codex/test-subagent-driven-development-integration.sh`
- `tests/codex/test-document-review-system.sh`

Files modified:

- `docs/testing.md`

No existing Claude Code tests are rewritten or removed.

## Risks and Mitigations

### Risk: brittle natural-language assertions

Mitigation:

- prefer structured exec/session signals for workflow assertions
- reserve text assertions for review output and fast skill-description checks

### Risk: tests accidentally use the developer's real Codex installation state

Mitigation:

- isolate both `HOME` and `CODEX_HOME`
- install repo skills into the test home explicitly

### Risk: integration tests become too slow or flaky

Mitigation:

- keep them opt-in behind `--integration`
- use small projects and short plans
- verify outcomes with simple commands (`npm test`) and structural event checks

### Risk: overfitting to `codex-server-app`

Mitigation:

- target `codex exec` first, because it is the true CLI analogue of Claude's headless tests
- leave app-server-specific coverage as future work

## Test Plan

### Fast

- run `tests/codex/run-skill-tests.sh`
- expect the `subagent-driven-development` skill test to pass without integration mode

### Integration

- run `tests/codex/run-skill-tests.sh --integration`
- expect:
  - the real `subagent-driven-development` workflow test to create working code and pass `npm test`
  - the document review test to reject a flawed spec

### Regression Check

- rerun existing `tests/claude-code/` workflows unchanged to confirm Codex additions do not break Claude infrastructure

## Future Work

After this equivalence milestone is in place, we can optionally add:

- more fast Codex tests for other skills already covered in Claude
- a Codex-native transcript/token analysis tool similar to `tests/claude-code/analyze-token-usage.py`
- app-server-specific tests if `codex-server-app` becomes a supported target for superpowers validation
