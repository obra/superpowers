# Codex Skills Tests

Automated tests for superpowers skills using the Codex CLI.

## Overview

This suite mirrors the Claude Code testing strategy:

- fast tests run by default
- slow, real integration tests run only with `--integration`
- fast skill assertions use rubric-based semantic evaluation against the skill source text instead of brittle wording regexes

The tests run Codex in an isolated environment with temporary `HOME` and
`CODEX_HOME`, copy `auth.json` from the original Codex home when present, then
install:

- the repository's `skills/` directory into `$HOME/.agents/skills/superpowers`
- the repository's `.codex/agents/*.toml` files into `$CODEX_HOME/agents/`

## Requirements

- Codex CLI installed and authenticated
- `jq` installed for JSON event parsing
- Node.js available for the integration fixture project
- `timeout` command available
- Run from the repository root or from `tests/codex/`

## Running Tests

### Run fast tests

```bash
./tests/codex/run-skill-tests.sh
```

### Run integration tests

```bash
./tests/codex/run-skill-tests.sh --integration
```

### Run one test

```bash
./tests/codex/run-skill-tests.sh --test test-document-review-system.sh --integration
```

## Evidence Sources

Codex integration tests use two evidence sources:

1. `codex exec --json` output captured during the test
2. Session rollout files written to `$CODEX_HOME/sessions`

Structured JSON events are preferred for workflow assertions:

- `todo_list` indicates `update_plan`
- `collab_tool_call` indicates subagent activity
- subagent session files can expose `agent_role` values such as `superpowers_spec_reviewer`
- `turn.completed` indicates a real completed agent turn

Fast semantic tests use a second Codex run as an evaluator. The evaluator receives:

1. the relevant skill source text
2. the question asked
3. the answer under review
4. a rubric of required meanings

This keeps the fast suite anchored to the checked-in skill docs while allowing equivalent wording.

## Using Failures as Signals

These tests are meant to reveal mismatches, not hide them.

If a Codex test fails because behavior differs from the current docs,
skills, or supporting scripts:

- inspect the JSON output and session rollout first
- decide whether the test is wrong or the repository assumptions are stale
- use the failure as evidence for a targeted follow-up change

Do not weaken assertions without evidence from the trace.

## Troubleshooting

### Codex not found

Verify:

```bash
codex --version
```

### Authentication issues

Verify:

```bash
codex exec --skip-git-repo-check -C /tmp "Reply with exactly OK."
```

### Session file not found

Because each test uses an isolated `CODEX_HOME`, look under the temporary
`$CODEX_HOME/sessions` created during that test run rather than your real
`~/.codex/sessions`. Authentication still works because the helper copies the
original `auth.json` into the temporary Codex home when available.

### Agents not loaded in tests

Verify:

```bash
find "$CODEX_HOME/agents" -maxdepth 1 -name 'superpowers_*.toml' | sort
```

The isolated test environment should include the native Superpowers Codex role catalog as direct TOML files.
