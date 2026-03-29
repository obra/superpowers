# Worktree-First Isolation with Delta Analysis

**Issue:** [#989 — Skill chain assumes frozen codebase — parallel sessions cause spec/plan staleness](https://github.com/obra/superpowers/issues/989)

**Date:** 2026-03-29

## Problem

The brainstorming → writing-plans → execution skill chain assumes the codebase doesn't change between initial analysis and execution completion. This assumption breaks when users run multiple AI coding agent sessions in parallel against the same repository — a natural workflow where one session brainstorms while another implements and merges a different feature.

### The timeline

```
Point A: brainstorming skill analyzes codebase for context
         ↓ (clarifying questions, approach selection, design review)
         spec is written against code state at point A
         ↓
Point B: writing-plans skill reads code to generate implementation plan
         ↓ (user reviews plan)
Point C: execution begins (subagent-driven-development or executing-plans)
         subagents follow the plan step by step
```

When another session merges to the base branch between A and C:
1. **Spec becomes stale** — describes a solution for code that may no longer exist
2. **Plan becomes stale** — contains file paths, line numbers, and code snippets that may no longer match
3. **Execution subagents can't adapt** — they follow the plan mechanically

This affects all platforms superpowers integrates with (Claude Code, OpenCode, Cursor, Codex, Gemini CLI), since the issue is in the skill chain's design, not in any platform-specific tooling.

## Solution Overview

Two parts:
1. **Isolate at the start** — create a git worktree at the beginning of brainstorming, so all analysis, spec writing, planning, and implementation happen against a consistent snapshot
2. **Validate before merging** — rebase onto the original branch + delta analysis with 3-level escalation before merge

## Scope

**In scope:**
- Worktree creation at brainstorming start (Claude Code)
- Session metadata tracking (all platforms)
- Uniform entry logic for writing-plans, executing-plans, subagent-driven-development
- Delta analysis with 3-level escalation in finishing-a-development-branch
- No-worktree fallback mode for platforms without worktree support

**Out of scope (separate spec):**
- Orphaned worktree detection and cleanup — see `2026-03-29-orphaned-worktree-detection-design.md`

## 1. Worktree Lifecycle Model

**Core principle: the worktree is disposable, the branch is not.**

Every skill in the chain commits its artifacts (spec, plan, code). If a session is interrupted, the branch and its commits are safe in git. The worktree is just a working directory.

### Lifecycle

```
User's current branch (e.g. main, feature-x, whatever)
    │
    ├── brainstorming creates worktree + new branch from HEAD
    │       │
    │       ├── spec committed to branch
    │       ├── plan committed to branch
    │       ├── implementation committed to branch
    │       │
    │       └── finishing-a-development-branch:
    │               1. rebase onto original branch (fetch latest)
    │               2. delta analysis (3-level escalation)
    │               3. user confirms escalation level
    │               4. if level 1-3: route to appropriate skill, loop back
    │               5. if clean: present merge options
    │               6. cleanup worktree (for merge/PR/discard)
    │
    └── (original branch may advance via other sessions)
```

### Session Metadata

The brainstorming skill writes `.superpowers-session.json` in the worktree root (or project root in fallback mode):

```json
{
  "base_branch": "main",
  "base_commit": "abc123",
  "created_at": "2026-03-29T14:00:00Z",
  "stage": "brainstorming"
}
```

Each skill updates `stage` as it progresses: `brainstorming` → `planning` → `executing` → `finishing`.

### Platform Fallback

On platforms without worktree support, the skill chain works in the current directory. The metadata file is still written (to the project root), and the delta analysis at finish still runs — it compares against the recorded `base_commit` rather than rebasing a branch. This provides weaker guarantees (no isolation during execution) but still catches drift that would otherwise go unnoticed.

## 2. Changes to Brainstorming Skill

### Current flow

1. Explore project context
2. Offer visual companion
3. Ask clarifying questions
4. ...

### New flow

1. **Create worktree** (new step)
2. Explore project context (now happens inside worktree)
3. Offer visual companion
4. Ask clarifying questions
5. ... (rest unchanged)

### Step 1 details

- Record the current branch name and HEAD commit
- Invoke `using-git-worktrees` to create the worktree with a new branch
- Write `.superpowers-session.json` with `base_branch`, `base_commit`, `created_at`, `stage: "brainstorming"`
- All subsequent code exploration happens inside the worktree

### Platform fallback

If worktree creation fails (no git, permission denied, platform limitation), log a warning and continue in the current directory. Write `.superpowers-session.json` to the project root anyway — this enables delta analysis at finish time even without isolation. The brainstorming process itself is unchanged; the user shouldn't notice a difference.

### Branch naming

`superpowers/<topic>-<short-hash>` where `<topic>` is derived from the user's initial request (slugified, first few words) and `<short-hash>` is 6 chars of the base commit. Example: `superpowers/add-auth-middleware-a1b2c3`. The user's first message typically contains enough context to generate a meaningful slug (e.g., "add auth middleware" → `add-auth-middleware`). If the initial message is too vague to derive a topic (e.g., "let's brainstorm"), use `session-<short-hash>` as a fallback and let the branch name be generic.

## 3. Changes to Writing-Plans, Executing-Plans, and Subagent-Driven-Development

All three skills get the same entry logic:

1. Check for `.superpowers-session.json`
   - **Exists + in worktree** → skip creation, update `stage`
   - **Exists + no worktree** (fallback mode) → continue in current directory, update `stage`
   - **Doesn't exist** (standalone invocation) → create worktree via `using-git-worktrees`, write `.superpowers-session.json`, set `stage`

This is uniform across all three skills. Coming through the chain? Worktree already exists. Invoked standalone? Create one. Platform doesn't support worktrees? Work in place with metadata tracking.

### Stage values

- `writing-plans` sets `"planning"`
- `executing-plans` and `subagent-driven-development` set `"executing"`

### Other changes

- `writing-plans`: Remove the "should be run in a dedicated worktree (created by brainstorming skill)" comment — replaced by the metadata-based approach
- `executing-plans` and `subagent-driven-development`: Keep the worktree requirement, but it is now satisfied by the entry logic above (check metadata first, create if missing)

## 4. Changes to Finishing-a-Development-Branch

This skill gains a new phase between "verify tests pass" and "present merge options": **rebase + delta analysis**.

### Updated flow

1. **Verify tests pass** (unchanged — stop if fail)
2. **Read `.superpowers-session.json`** — get `base_branch` and `base_commit`
3. **Rebase onto original branch:**
   - Fetch latest from the base branch
   - Attempt `git rebase <base_branch>`
   - If merge conflicts occur → escalate to at least level 2 (spec drift). Present conflicts to user, let them resolve, then continue delta analysis
4. **Delta analysis** (new — see Section 5)
5. **Present merge options** (unchanged 4 options, but only reached if delta analysis passes)
6. **Cleanup worktree** (unchanged)

### Base branch handling

The base branch is read from `.superpowers-session.json`, not hardcoded to main/master. The worktree was branched from wherever the user was at session start, and it merges back to that same branch.

### Without worktree (fallback mode)

- No rebase needed (we're on the same branch)
- Delta analysis still runs: diff what changed on the base branch since `base_commit`, then evaluate those changes against our work
- This is weaker than the worktree path (our changes are already on the branch, so there's no clean separation) but still catches the most important drift

## 5. Delta Analysis and 3-Level Escalation

After rebase succeeds (or after conflict resolution), the delta analysis runs.

### Input

- `git diff <base_commit>..<base_branch>` — what changed on the base branch since we branched
- The spec document (committed to our branch)
- The implementation plan (committed to our branch)
- The implementation itself (committed to our branch)

### Escalation levels

The model analyzes the diff against our work and classifies into one of three levels:

**Level 1 — Implementation drift:** The spec is still correct, but the base branch changes affect how our work should be implemented. Examples: a file we extend was refactored, an interface we use changed its signature, a utility we depend on was moved.

→ **Action:** Route to `writing-plans` to create a delta plan addressing the implementation gaps. Then re-execute, then return to finishing.

**Level 2 — Spec drift:** The spec's assumptions are partially invalidated, but the original problem statement still holds. Examples: new instances of something the spec enumerates, a module boundary the spec assumes was reorganized, a dependency the spec relies on was replaced.

→ **Action:** Route to brainstorming's "present design" phase to update the spec (not full brainstorming — no need to re-ask clarifying questions since the original intent is clear). Then re-plan, re-execute, return to finishing.

**Level 3 — Fundamental drift:** The changes undermine the original problem statement or approach. Examples: another session already implemented what we were building, the architecture was fundamentally restructured, the feature we're extending was removed.

→ **Action:** Route to brainstorming from scratch — full process including full re-analysis of the codebase, clarifying questions, approach selection, and design review. The existing worktree and branch are preserved as context.

### Escalation principle

When in doubt, escalate to the higher level. If the model is uncertain whether it's level 1 or 2, propose level 2.

### Model selection

Recommend Opus (highest-capacity model) for delta analysis but don't enforce it — the skill notes the recommendation, the user/platform decides.

### User confirmation

The model proposes an escalation level with its reasoning. The user confirms or overrides before the system routes to the appropriate skill.

### Clean result

If the delta analysis finds no meaningful conflicts between the base branch changes and our work, proceed directly to the merge options.

## 6. No-Worktree Mode (Platform Fallback)

On platforms that can't create worktrees (OpenCode, Cursor, some Codex configurations), the entire flow still works, just without isolation:

- **Brainstorming:** Works in the current directory. Writes `.superpowers-session.json` recording `base_commit` at session start.
- **Planning/Execution:** Works in the current directory. Each skill checks for the metadata file, updates `stage`.
- **Finishing:** No rebase (we're on the same branch). Delta analysis compares `base_commit` to current HEAD of the recorded base branch, evaluating whether changes that landed since session start conflict with our work.
- **Cleanup:** No worktree to clean up. Remove `.superpowers-session.json`.

The staleness check is the minimum viable protection. Worktree isolation is the premium path.

## 7. Summary of Skill Changes

| Skill | Change |
|-------|--------|
| **brainstorming** | New step 1: create worktree + write session metadata. All exploration happens in worktree. |
| **using-git-worktrees** | Add session metadata awareness. Unchanged creation logic. |
| **writing-plans** | Remove "should be run in worktree" comment. Add entry logic: check metadata → skip/create/fallback. Update stage. |
| **executing-plans** | Keep worktree requirement but add entry logic: check metadata → skip/create/fallback. Update stage. |
| **subagent-driven-development** | Same as executing-plans. |
| **finishing-a-development-branch** | New phase between test verification and merge options: rebase + delta analysis + 3-level escalation. Read base branch from metadata (not hardcoded main). Merge back to recorded base branch. |
| **verification-before-completion** | No changes. |

## Testing Strategy

### Unit-level checks
- Metadata file is written correctly at each stage
- Entry logic correctly detects: existing worktree, fallback mode, standalone invocation
- Delta analysis correctly classifies sample diffs into levels 1, 2, 3

### Integration scenarios
1. **Happy path:** brainstorm → plan → execute → finish with no drift on base branch → clean merge
2. **Level 1 drift:** base branch changes implementation details (file rename) after branching → delta plan created → re-execute → merge
3. **Level 2 drift:** base branch changes something the spec enumerates → spec update → re-plan → re-execute → merge
4. **Level 3 drift:** base branch implements the same feature → full restart
5. **Merge conflicts:** base branch changes conflict with our changes → escalate to level 2+ → user resolves → delta analysis continues
6. **No-worktree fallback:** platform without worktree support → metadata-only tracking → delta analysis at finish
7. **Standalone invocation:** user invokes writing-plans directly with a hand-written spec → worktree created at that point
8. **Interrupted session:** session crashes at each stage → branch preserved → worktree left behind (cleanup out of scope, see orphan spec)
