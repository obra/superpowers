# EnterWorktree Parent `core.bare` Guard Plan

## Goal

Close #1546 with a narrow skill-doc fix: keep native worktree preference, but teach agents to detect and repair the known Claude Code `EnterWorktree` parent-checkout `core.bare=true` failure.

## Scope

Files expected to change:

- `skills/using-git-worktrees/SKILL.md`
- `tests/claude-code/test-enterworktree-core-bare-guard.sh`
- `tests/claude-code/run-skill-tests.sh`
- `tests/claude-code/README.md`
- `docs/superpowers/specs/2026-05-21-enterworktree-core-bare-guard-design.md`
- `docs/superpowers/plans/2026-05-21-enterworktree-core-bare-guard.md`

## Prior Art

- #1121 introduced the native-tool-first Step 1a behavior and validated that agents should prefer `EnterWorktree` over `git worktree add`.
- #1167 attempted to restore stronger auto-worktree triggering but was closed and bundled many unrelated changes. This plan does not alter trigger/consent behavior.
- #1546 specifically asks for documentation and optionally a detector for the `EnterWorktree` `core.bare` upstream bug.

## Tasks

### Task 1: Add Regression Test

Create `tests/claude-code/test-enterworktree-core-bare-guard.sh`.

Assertions:

- `skills/using-git-worktrees/SKILL.md` contains `Known issue (Claude Code)`.
- It names `EnterWorktree`.
- It names `core.bare`.
- It records `PARENT_REPO_ROOT=$(git rev-parse --show-toplevel)`.
- It checks `git -C "$PARENT_REPO_ROOT" config --get core.bare`.
- It repairs with `git -C "$PARENT_REPO_ROOT" config --unset core.bare`.
- It preserves native preference text.
- It does not tell agents to avoid native tools.

Run it before changing the skill and confirm RED.

### Task 2: Update Skill

Modify Step 1a in `skills/using-git-worktrees/SKILL.md` with a short callout.

Keep the behavior order:

1. Detect existing isolation.
2. Prefer native worktree tools.
3. Use git fallback only when no native tool exists.

Add only the parent-checkout guard around native tool use.

### Task 3: Register and Document Test

Add the new fast test to `tests/claude-code/run-skill-tests.sh` and `tests/claude-code/README.md`.

### Task 4: Verify

Run:

```bash
bash tests/claude-code/test-enterworktree-core-bare-guard.sh
bash tests/claude-code/test-worktree-path-policy.sh
bash tests/hooks/test-session-start.sh
bash tests/opencode/run-tests.sh
git diff --check
```

Also run direct Claude Code pressure prompts that do not use the `timeout` wrapper:

- Ask how to detect and repair parent `core.bare=true` after `EnterWorktree`.
- Ask for the exact command when parent `git status` fails with `this operation must be run in a work tree`.
- Ask whether Superpowers fixed the upstream Claude Code bug.

## Completion Criteria

- New test fails before the skill change and passes after it.
- Existing static/hook/opencode tests pass.
- Direct pressure prompts produce the parent-checkout repair command and preserve the upstream-bug distinction.
- Complete diff is shown to the human before opening a PR.
