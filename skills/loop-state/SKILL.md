---
name: loop-state
description: Use when ending or resuming cross-session agent loops that must remember facts about PRs, issues, branches, worktrees, external events, decisions, or verification without turning notes into a task plan
---

# Loop State

## Overview

State is facts, not plans. Use loop state to leave durable, human-readable facts that let a later session compare saved observations with the current source of truth and derive a new scoped loop.

State is not chat history, a queue, or instructions to your future self.

## When to Use

Use this skill when:

- Ending a loop that may need later review, follow-up, or reconciliation.
- Resuming work on a PR, issue, incident, branch, or ticket across sessions.
- Handling new external events such as PR comments, reviews, CI failures, issue updates, or Linear activity.
- Recording which worktree, branch, commit, and verification evidence belonged to a loop.

Do not use this for temporary in-session task tracking. Use the platform's todo tool for that.

## Storage Layout

Store project-local state under `.superpowers/state/`, usually gitignored:

```text
.superpowers/state/
  index.json
  entities/
    github-owner-repo-pr-123.json
  loops/
    2026-06-11-pr-123-implementation.md
  worktrees/
    wt-2026-06-11-pr-123-feature-foo.json
```

`entities/` records durable external objects. `loops/` records one finished loop at a time. `worktrees/` records execution environment provenance by `worktree_id`. `index.json` links them for discovery.

## Entity State

Entity state identifies an external object and the last observed position in that source of truth. Keep it compact.

```json
{
  "version": 1,
  "entity_id": "github:owner/repo:pull/123",
  "kind": "github_pull_request",
  "repo": "owner/repo",
  "pr_number": 123,
  "pr_url": "https://github.com/owner/repo/pull/123",
  "branch": "feature/foo",
  "base": "main",
  "active_worktree_id": "wt-2026-06-11-pr-123-feature-foo",
  "associated_worktrees": [
    "wt-2026-06-11-pr-123-feature-foo"
  ],
  "associated_loops": [
    "2026-06-11-pr-123-implementation"
  ],
  "last_observed": {
    "observed_at": "2026-06-11T14:20:00-07:00",
    "state": "open",
    "head_sha": "def456",
    "timeline_cursor": "cursor-or-last-event-id",
    "check_run_id": "ci-run-789"
  }
}
```

`last_observed` is a cursor and compact snapshot. It is not a waiting condition.

## Loop Summary

Write one loop summary when a loop ends:

```markdown
# Loop Summary: PR #123 Implementation

## Identity
Loop ID: 2026-06-11-pr-123-implementation
Entity: github:owner/repo:pull/123
Type: pr_implementation

## Goal
Implement feature X and open PR for review.

## Outcome
Status: submitted
PR: #123
Branch: feature/foo
Final commit: def456
Completed at: 2026-06-11T14:20:00-07:00

## Execution Context
Worktree ID: wt-2026-06-11-pr-123-feature-foo
Worktree path at completion: /path/to/repo/.worktrees/feature-foo
Branch: feature/foo
Final commit: def456

## Work Completed
- Added X behavior.
- Updated Y tests.
- Opened PR #123.

## Verification
- `npm test` passed at 2026-06-11T14:15:00-07:00.

## Decisions
- Kept behavior scoped to the API layer.

## External Observations
- PR was open at completion.
- Last observed review/comment event: comment-456.
- Last observed CI run: ci-run-789.

## Notes
No known unresolved issues at submission time.
```

The summary explains what happened. It does not tell a future agent what to do.

## Worktree State

Record worktree provenance separately so later sessions can resume or clean up safely:

```json
{
  "version": 1,
  "worktree_id": "wt-2026-06-11-pr-123-feature-foo",
  "repo": "owner/repo",
  "main_repo_path": "/path/to/repo",
  "worktree_path": "/path/to/repo/.worktrees/feature-foo",
  "branch": "feature/foo",
  "base_ref": "origin/main",
  "head_sha": "def456",
  "created_at": "2026-06-11T13:00:00-07:00",
  "created_by_loop": "2026-06-11-pr-123-implementation",
  "associated_entity": "github:owner/repo:pull/123",
  "provenance": "superpowers_git_worktree",
  "cleanup_policy": "owned_by_superpowers",
  "status": "preserved"
}
```

`cleanup_policy` records ownership. It is not permission to delete without running the appropriate finishing workflow.

## Resume and Reconcile

When resuming, do this:

1. Identify the external object from the user request, branch, PR URL, issue URL, or index.
2. Read the entity state and associated loop summaries.
3. Check whether the recorded worktree exists and whether its branch/head still match the external object.
4. Fetch current external state from the source of truth.
5. Compare current events, comments, checks, commits, and reviews against `last_observed`.
6. Derive the current scoped loop from the delta.
7. After acting, write a new loop summary and update the entity/worktree facts.

Example: a PR review comment after submission does not reopen the old implementation loop. Reconcile detects a new event and creates a new review-response loop scoped to that delta.

## Quick Reference

| Need | Record |
|---|---|
| Find related state later | `index.json` |
| Remember an external object | `entities/<entity>.json` |
| Remember a completed loop | `loops/<loop-id>.md` |
| Track execution environment | `worktrees/<worktree-id>.json` |
| Avoid duplicate comment handling | `last_observed.timeline_cursor` |
| Resume branch work safely | `worktree_id`, branch, path, head SHA, provenance |

## Do not store

- `next_step`, `next_trigger`, "waiting for", or equivalent planner fields.
- full chat transcripts, full logs, or verbose command output.
- Secrets, tokens, credentials, cookies, or private keys.
- Complete copies of GitHub, Linear, CI, incident, or database records.
- Unverified claims about tests, builds, reviews, or deployment status.
- Local instructions that conflict with the external source of truth.

## Common Mistakes

**Turning state into a plan**

Problem: A future session follows stale `next_step` notes instead of reconciling with current external events.

Fix: Store facts and cursors only. Derive work during resume.

**Copying external systems locally**

Problem: Local state becomes stale and competes with GitHub, Linear, CI, or the incident system.

Fix: Store IDs, URLs, cursors, compact observations, and evidence references.

**Losing worktree provenance**

Problem: A later session cannot tell whether it may resume, preserve, or clean up a worktree.

Fix: Always write a `worktree_id` record with path, branch, head SHA, provenance, and cleanup policy.

**Using todo state as memory**

Problem: Todo tools are ephemeral and session-scoped.

Fix: On loop close, summarize durable facts into `.superpowers/state/`.
