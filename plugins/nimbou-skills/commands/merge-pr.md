---
description: Merge a single PR after validating status, showing the effective state, and getting explicit confirmation.
argument-hint: PR number
---

# Merge Pull Request

Use this command when the user wants the AI to merge one PR.

This command is merge-focused. It does not perform code review. If the user wants review first, that is a separate workflow.

## Core Rules

- Never merge without showing the effective PR state first
- Never merge a draft PR
- If immediate merge is blocked but the PR is otherwise eligible, offer auto-merge
- Prefer remote PR state over local branch assumptions

## Phase 1: Resolve Target

1. Resolve the target PR number from `$ARGUMENTS`.
2. Fetch PR metadata.
3. Confirm the repo, base branch, head branch, title, and current state.

If `$ARGUMENTS` does not provide a PR number, ask the user for it before proceeding.

## Phase 2: Validate Eligibility

Verify:

- PR is open
- PR is not draft
- merge conflicts are not reported
- required checks are complete or passing
- required approvals or review gates are satisfied when that status is available

Classify the PR as:

- `ready now`
- `auto-merge candidate`
- `blocked`

## Phase 3: Show Effective State

Before any merge action, show:

- PR number and title
- base and head branches
- checks summary
- review or approval summary
- mergeability status
- changed files summary

## Phase 4: Confirm Action

Ask:

```text
PR #<number> is <ready now | auto-merge candidate | blocked>.
Action:
1. Merge now
2. Enable auto-merge
3. Cancel
```

## Phase 5: Execute

### Immediate merge

Use the GitHub CLI when immediate merge is available:

```bash
gh pr merge <number> --merge --delete-branch=false
```

Use `--squash` or `--rebase` only if the user explicitly requests a different strategy.

### Auto-merge

If immediate merge is blocked but the PR is otherwise eligible, enable auto-merge through the GitHub integration when supported.

## Phase 6: Report Result

Report one of:

- `merged`
- `auto-merge enabled`
- `skipped`
- `failed`

Always include:

- PR number
- final action
- short reason when not merged immediately

## Safety Rules

- Do not guess mergeability from local git state alone
- Do not silently downgrade from merge to auto-merge
- Do not delete the branch unless the user explicitly asks for it
