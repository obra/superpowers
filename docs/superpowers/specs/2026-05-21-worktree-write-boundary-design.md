# Worktree Write Boundary Design

## Problem

Superpowers tells agents to create or use an isolated worktree before implementation, but the current instructions do not preserve that boundary after the worktree exists. In issue #1040, exploration or research agents can return absolute paths from the parent repository, and the controller or implementer can pass those paths directly to write/edit/git commands. Changes then land in the main checkout or another worktree instead of the active implementation worktree.

This breaks the core promise of `superpowers:using-git-worktrees`: protecting the user's current branch from implementation changes.

## Goals

- Establish a durable "active workspace root" after worktree detection or creation.
- Require all later file operations, git operations, and subagent prompts to use that root.
- Require path translation when another agent returns an absolute path outside the active root.
- Make `subagent-driven-development` pass the active root to implementer and reviewer subagents.
- Add regression coverage that fails if the boundary guidance disappears.

## Non-Goals

- Do not add hook-based hard enforcement in this PR.
- Do not solve the Claude Code `EnterWorktree` `core.bare` upstream bug from #1546.
- Do not change worktree directory selection policy.
- Do not add dependencies.

## Design

`using-git-worktrees` will add a new workspace boundary step after worktree detection or creation and before project setup. The step captures:

```bash
WORKTREE_ROOT=$(git rev-parse --show-toplevel)
```

The skill will treat `WORKTREE_ROOT` as the only writable project root for the rest of the implementation. If an explorer, subagent, grep result, or plan references a path outside that root but inside the original repository layout, the agent must translate it by preserving the relative path under `WORKTREE_ROOT`. If a path cannot be translated safely, the agent must stop and ask before writing.

`subagent-driven-development` will instruct the controller to capture the active root once, include it in every implementer/reviewer prompt, and reject or translate stale paths before dispatch. The implementer prompt will make `Work from: [directory]` a hard boundary rather than an advisory note.

Reviewer prompts will also receive the active workspace root so they inspect the code that was actually changed in the active worktree, not a sibling checkout.

## Testing

Add a static regression test under `tests/claude-code/` that checks for the load-bearing phrases:

- `WORKTREE_ROOT=$(git rev-parse --show-toplevel)` in `using-git-worktrees`
- "active workspace root" in the worktree and SDD skills
- "translate" stale paths into `WORKTREE_ROOT`
- implementer and reviewer prompts include workspace-boundary language

This does not replace full agent evals, but it prevents accidental removal of the safety contract and fits the existing static skill-policy test style.

## Risks

This is still instruction-level enforcement. A future hook-based guard would be stronger, but adding hooks would broaden the PR into platform-specific behavior. This PR intentionally keeps the fix small, general, and reviewable.
