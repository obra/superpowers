# EnterWorktree Parent `core.bare` Guard Design

## Problem

`using-git-worktrees` Step 1a correctly prefers native harness worktree tools over manual `git worktree add`. In Claude Code, the native tool is `EnterWorktree`.

Issue #1546 reports an upstream Claude Code bug: `EnterWorktree` can write `core.bare = true` into the parent checkout's shared git config. The parent repo then appears to lose its working tree; commands like `git pull` fail with `fatal: this operation must be run in a work tree`.

The upstream bug is not in Superpowers. The risk for Superpowers is that Step 1a steers agents toward `EnterWorktree`, so the skill should also tell agents how to detect and repair this known parent-checkout failure mode.

## Goals

- Preserve native-tool-first behavior from #1121.
- Add a concrete pre/post guard around Step 1a for native worktree tools.
- Give the agent an exact recovery command when the parent checkout has `core.bare=true`.
- Clearly state that this is an upstream Claude Code issue, not something Superpowers itself fixes.

## Non-Goals

- Do not disable `EnterWorktree`.
- Do not replace Step 1a with manual `git worktree add`.
- Do not add new dependencies or runtime hooks.
- Do not change finishing or cleanup behavior.
- Do not add support for a new harness.

## Root Cause

The failing state is in the parent checkout's shared git config, not in the linked worktree's files. A guard must therefore record the parent checkout before calling the native tool and inspect that same checkout afterward.

The load-bearing details are:

```bash
PARENT_REPO_ROOT=$(git rev-parse --show-toplevel)
```

After the native tool returns:

```bash
if [ "$(git -C "$PARENT_REPO_ROOT" config --get core.bare 2>/dev/null)" = "true" ]; then
  git -C "$PARENT_REPO_ROOT" config --unset core.bare
fi
```

## Proposed Skill Change

Insert a short Claude Code known-issue callout in `skills/using-git-worktrees/SKILL.md` Step 1a, before the native tool is used.

The callout should instruct agents to:

1. Record `PARENT_REPO_ROOT` before invoking a native tool.
2. Use the native tool when available.
3. After the tool returns, verify the parent checkout's `core.bare`.
4. If `core.bare=true`, run `git -C "$PARENT_REPO_ROOT" config --unset core.bare`.
5. Report that the parent checkout was repaired and link the cause to the upstream Claude Code `EnterWorktree` issue.

## Test Strategy

Add `tests/claude-code/test-enterworktree-core-bare-guard.sh`, a fast static regression test for the exact skill content that prevents regression:

- Step 1a mentions the known Claude Code `EnterWorktree` `core.bare` issue.
- The skill records `PARENT_REPO_ROOT=$(git rev-parse --show-toplevel)` before native tool use.
- The skill inspects `git -C "$PARENT_REPO_ROOT" config --get core.bare`.
- The skill includes `git -C "$PARENT_REPO_ROOT" config --unset core.bare`.
- The skill preserves native worktree preference and does not tell agents to avoid native tools.

Manual pressure prompts should verify the agent answers with the exact parent-checkout recovery command and does not claim Superpowers fixes the upstream bug.
