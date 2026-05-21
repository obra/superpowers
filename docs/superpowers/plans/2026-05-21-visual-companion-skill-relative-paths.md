# Visual Companion Skill-Relative Script Paths Plan

## Goal

Fix #1134 by making visual companion script paths explicitly relative to `skills/brainstorming/visual-companion.md`, without using the rejected `CLAUDE_PLUGIN_ROOT` approach from #1264.

## Scope

Files expected to change:

- `skills/brainstorming/visual-companion.md`
- `tests/brainstorm-server/test-visual-companion-paths.sh`
- `docs/superpowers/specs/2026-05-21-visual-companion-skill-relative-paths-design.md`
- `docs/superpowers/plans/2026-05-21-visual-companion-skill-relative-paths.md`

## Tasks

### Task 1: Add RED Static Regression Test

Create `tests/brainstorm-server/test-visual-companion-paths.sh`.

Assertions:

- `visual-companion.md` defines `SKILL_DIR=<directory containing this visual-companion.md file>`.
- examples use `"$SKILL_DIR/scripts/start-server.sh"`.
- cleanup uses `"$SKILL_DIR/scripts/stop-server.sh"`.
- examples do not use `${CLAUDE_PLUGIN_ROOT}`.
- examples do not contain bare `scripts/start-server.sh --project-dir` or `scripts/stop-server.sh $SESSION_DIR`.

Run it before changing the guide and confirm RED.

### Task 2: Update Visual Companion Guide

In `skills/brainstorming/visual-companion.md`:

- Add a short path note under "Starting a Session".
- Add the `SKILL_DIR` setup line.
- Rewrite every command block that launches or stops the visual companion to use `"$SKILL_DIR/scripts/..."`.
- Update reference bullets for `frame-template.html` and `helper.js`.

### Task 3: Verify

Run:

```bash
bash tests/brainstorm-server/test-visual-companion-paths.sh
bash tests/brainstorm-server/windows-lifecycle.test.sh
npm test --prefix tests/brainstorm-server
git diff --check
```

Also run direct Claude Code pressure prompts against the updated guide:

- Ask where `scripts/start-server.sh` is relative to.
- Ask for a command when the current directory is the plugin root.
- Ask whether `CLAUDE_PLUGIN_ROOT` should be used.

## Completion Criteria

- RED test fails before the guide change and passes after.
- Existing brainstorm server tests continue to pass.
- Pressure prompts produce skill-directory-relative commands, not plugin-root `scripts/` or `CLAUDE_PLUGIN_ROOT`.
