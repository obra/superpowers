# Junie Integration Design

**Date:** 2026-05-05
**Status:** Approved

## Problem

Junie (JetBrains' AI coding agent) has no SessionStart hook mechanism. All existing superpowers harness integrations rely on a SessionStart hook to inject the `using-superpowers` bootstrap into the session context automatically. Without an equivalent mechanism, skills are present on disk but never auto-triggered.

## Solution

Junie always loads `~/.junie/guidelines.md` into every session's context. Injecting the `using-superpowers` bootstrap into this file achieves the same effect as a SessionStart hook: the agent sees the bootstrap on every session start, without any user action.

## Architecture

### What the install does (on the user's machine)

```
~/.junie/
  skills/
    superpowers/
      brainstorming/     → symlink to <repo>/skills/brainstorming/
      writing-plans/     → symlink to <repo>/skills/writing-plans/
      ...                (one symlink per skill)
  guidelines.md          ← bootstrap block injected/replaced here
```

The bootstrap block is wrapped in HTML comment sentinels so the install script can find and replace it on re-runs:

```
<!-- BEGIN SUPERPOWERS -->
<content of using-superpowers/SKILL.md>

<content of using-superpowers/references/junie-tools.md>
<!-- END SUPERPOWERS -->
```

### What lives in the repo

```
scripts/
  install-junie.sh          install script
  uninstall-junie.sh        cleanup script

skills/using-superpowers/references/
  junie-tools.md            tool name mapping (same pattern as gemini-tools.md)

tests/junie/
  setup.sh                  isolated test environment helpers
  test-install.sh           verifies install creates correct directory/symlink structure
  test-bootstrap.sh         verifies guidelines.md content and sentinel idempotency

docs/
  README.junie.md           Junie-specific install + usage guide

README.md                   add Junie section alongside existing harnesses
```

## Install Script Behaviour

- Creates `~/.junie/skills/superpowers/` if absent
- Symlinks each skill directory from the repo (one symlink per skill, named by skill directory name)
- Creates `~/.junie/guidelines.md` if absent
- If guidelines.md exists and contains the sentinel block, replaces the block in-place
- If guidelines.md exists without the block, appends the block
- Idempotent: running twice produces identical state

## Uninstall Script Behaviour

- Removes symlinks from `~/.junie/skills/superpowers/`
- Removes the sentinel block from `~/.junie/guidelines.md`
- Leaves any pre-existing guidelines.md content intact
- Does not remove `~/.junie/` itself

## Tool Mapping

`junie-tools.md` maps Claude Code tool names used in skills to Junie equivalents. Pattern follows `gemini-tools.md`. The exact Junie skill tool name must be confirmed during testing with a live Junie session; if Junie has no explicit skill invocation tool, the mapping will instruct the agent to read skill files directly from `~/.junie/skills/superpowers/<name>/SKILL.md`.

## Tests

Tests run without requiring a live Junie session — they verify filesystem state:

- **test-install.sh**: runs the install script against a temp `~/.junie`-equivalent directory, asserts symlinks exist for every skill, asserts guidelines.md contains sentinel markers and bootstrap content
- **test-bootstrap.sh**: asserts sentinel idempotency (running install twice produces one block, not two), asserts uninstall removes the block and leaves surrounding content intact

## Documentation

- `docs/README.junie.md`: installation steps, how to verify bootstrap loaded, how to test locally, known differences from hook-based harnesses
- `README.md`: one entry in the Quickstart list and Installation section, same style as OpenCode/Gemini entries

## Acceptance Criteria

Before the PR is submitted, a human must run the acceptance test in a live Junie session:

1. Run `scripts/install-junie.sh`
2. Open a fresh Junie session
3. Send: "Let's make a react todo list"
4. Confirm `brainstorming` skill auto-triggers before any code is written
5. Paste complete session transcript in the PR
