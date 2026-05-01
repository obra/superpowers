---
name: finishing-a-development-branch
description: Use when implementation is complete and the user wants branch completion options such as keeping work, staging, committing, pushing, opening a PR, or cleanup.
---

# Finishing A Development Branch In Codex

## Core Idea

Completion is a decision point, not an automatic merge. Verify the work, present safe options, and perform only the git actions the user chooses.

Do not stage, commit, push, merge, delete, or clean up worktrees unless the user asks for that action.

## Step 1: Verify Current State

Before offering branch actions:

```bash
git status --short
git branch --show-current
git diff --stat
```

Run the relevant tests or deterministic verification commands for the work. If tests fail, report the failure and stop before offering merge, push, or PR actions.

If unrelated dirty files are present, call them out and exclude them from any proposed staging, commit, or cleanup action.

## Step 2: Identify Branch Context

Determine:

- Current branch.
- Likely base branch.
- Whether this directory is a linked worktree.
- Changed files that belong to this task.
- Untracked files that need an explicit decision.

Useful commands:

```bash
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
git worktree list
git diff --name-only
```

If the base branch is ambiguous, ask before merge or PR work.

## Step 3: Present Options

Offer only actions that are safe for the verified state and the user's request. Common options:

1. Keep the branch and working tree as-is.
2. Stage the task-owned files.
3. Commit the staged task-owned files.
4. Push the current branch.
5. Open a draft pull request.
6. Merge locally into the selected base branch.
7. Clean up the worktree or branch.
8. Discard the task-owned work.

For destructive actions, require explicit confirmation. For staging, committing, pushing, PR creation, merging, or cleanup, wait for the user's choice unless they already requested that action.

## Step 4: Execute The Chosen Action

### Stage

Stage only files that belong to the task:

```bash
git add -- <task-owned-files>
git status --short
```

After successful staging in Codex desktop, the final response must include the `::git-stage{...}` directive.

### Commit

Commit only after the user requests it and the staged files are correct:

```bash
git commit -m "<message>"
```

After a successful commit, the final response must include the `::git-commit{...}` directive.

### Push

Push only after the user requests it:

```bash
git push -u origin <branch>
```

After a successful push, the final response must include the `::git-push{...}` directive.

### Pull Request

Open a PR only after the user requests it. Prefer draft PRs unless the user asks for a ready PR.

After a successful PR creation, the final response must include the `::git-create-pr{...}` directive with the branch, URL, and draft status.

### Local Merge

Merge locally only after the user requests it and confirms the base branch:

```bash
git checkout <base-branch>
git pull --ff-only
git merge <feature-branch>
<verification-command>
```

Do not delete the feature branch until the user asks for cleanup.

### Cleanup Or Discard

Before deleting a branch, removing a worktree, or discarding work:

1. Show exactly what will be removed.
2. Confirm there is no unrelated dirty work included.
3. Require explicit confirmation.

Never use destructive git commands because they are convenient. Use them only when the user has clearly chosen that outcome.

## Codex Final Response Directives

Emit Codex git directives only after the corresponding action succeeds:

- `::git-stage{cwd="/absolute/path"}`
- `::git-commit{cwd="/absolute/path"}`
- `::git-create-branch{cwd="/absolute/path" branch="branch-name"}`
- `::git-push{cwd="/absolute/path" branch="branch-name"}`
- `::git-create-pr{cwd="/absolute/path" branch="branch-name" url="https://..." isDraft=true}`

Do not emit a directive for an action that was merely recommended, skipped, or failed.

## Stop Conditions

Stop and ask before proceeding when:

- Verification fails.
- The branch base is unclear.
- Unrelated dirty files would be included.
- The user asks for a destructive operation but has not confirmed the exact target.
- A merge has conflicts.
- A push or PR would expose work the user did not ask to publish.
