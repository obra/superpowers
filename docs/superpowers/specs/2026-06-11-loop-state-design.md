# Loop State Skill Design

## Overview

Add a `loop-state` skill that teaches agents how to write and resume cross-session workflow memory without turning state into a planner.

The core model is:

```text
loop summary + entity state + current external state -> reconcile -> scoped new loop
```

State records facts that survived the previous session. It does not record what the agent should do next. The next action is always derived later by comparing saved external cursors against the current external system.

## Problem

Superpowers can guide a development session from brainstorming through implementation, review, and finishing. It does not currently define how an agent should leave durable facts behind when one loop ends and a later session needs to respond to new external events such as PR comments, review updates, CI failures, or issue changes.

Without a state convention, later sessions either re-read too much context, repeat work already handled, or treat stale notes as a plan. The missing piece is a small, human-readable state discipline that records what happened and where external observation stopped.

## Goals

1. Define `loop-state` as a reusable skill for closing and resuming cross-session loops.
2. Make state factual: loop summaries, entity identity, external cursors, worktree provenance, decisions, verification, and compact observations.
3. Explicitly forbid state fields that claim the next step, next trigger, or waiting condition.
4. Include `worktree_id` so loops, PRs, branches, and cleanup ownership can be correlated safely.
5. Keep the first implementation to Markdown/JSON guidance inside one skill. Do not build automation, MCP connectors, or a state engine.

## Non-Goals

1. Do not implement scheduled automation or webhook processing.
2. Do not make local state the source of truth for GitHub, Linear, CI, or other external systems.
3. Do not store full chat transcripts, logs, secrets, or large external payloads.
4. Do not create a database or runtime state machine.
5. Do not add a PR watcher, issue watcher, or MCP integration in this change.

## Storage Model

The skill recommends project-local state under `.superpowers/state/`, typically gitignored:

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

`loops/` contains human-readable summaries of individual loops.

`entities/` contains compact JSON records for durable external objects such as PRs, issues, incidents, or Linear tickets.

`worktrees/` contains worktree provenance records keyed by stable `worktree_id`.

`index.json` links local context, entities, loop summaries, and worktrees so a later session can find the relevant records quickly.

## Entity State

Entity state represents an external object and the last observed facts about it. For a GitHub PR, the minimum useful fields are:

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

The `last_observed` block is a cursor and compact snapshot. It is not a to-do list.

## Loop Summary

A loop summary records what a single loop did and what facts it established:

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

## Worktree State

Worktree state records provenance and cleanup ownership:

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

Cleanup policy is factual ownership metadata. A later skill may decide whether to clean up, but state itself does not prescribe that action.

## Resume and Reconcile

When a later session handles the same PR or issue, the agent should:

1. Locate the entity state through `index.json` or by matching the external object.
2. Read the associated loop summaries for compact context.
3. Fetch the current external state from the source of truth.
4. Compare current external events against `last_observed`.
5. Derive the current scoped loop from the delta.
6. Write a new loop summary when that scoped loop finishes.
7. Update the entity's cursor and worktree state facts.

For example, a PR comment after submission creates a new review-response loop only because reconcile found a new external event. The old implementation loop remains a completed summary.

## Red Lines

State must not contain:

1. `next_step`, `next_trigger`, or equivalent planner fields.
2. Full chat transcripts or large logs.
3. Secrets or credentials.
4. Complete copies of external systems.
5. Unverified claims about test/build/review status.
6. Instructions that override the source of truth.

## Validation

Add a static test that verifies the new skill:

1. Exists at `skills/loop-state/SKILL.md`.
2. Has valid frontmatter with `name: loop-state`.
3. Describes cross-session loop state triggers.
4. Includes the storage layout, entity state, loop summary, worktree state, resume/reconcile workflow, and red lines.
5. Forbids planner fields such as `next_step` and `next_trigger`.
