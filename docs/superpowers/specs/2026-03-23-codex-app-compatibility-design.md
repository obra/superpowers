# Codex App Compatibility: Worktree and Finishing Skill Adaptation

Make superpowers skills work in the Codex App's sandboxed worktree environment without breaking existing Claude Code or Codex CLI behavior.

**Ticket:** PRI-823

## Motivation

The Codex App runs agents inside git worktrees it manages — detached HEAD, located under `$CODEX_HOME/worktrees/`, with a Seatbelt sandbox that blocks `git checkout -b`, `git push`, and network access. Three superpowers skills assume unrestricted git access: `using-git-worktrees` creates manual worktrees with named branches, `finishing-a-development-branch` merges/pushes/PRs by branch name, and `subagent-driven-development` requires both.

The Codex CLI (open source terminal tool) does NOT have this conflict — it has no built-in worktree management. Our manual worktree approach fills an isolation gap there. The problem is specifically with the Codex App.

## Empirical Findings

Tested in the Codex App on 2026-03-23:

| Operation | workspace-write sandbox | Full access sandbox |
|---|---|---|
| `git add` | Works | Works |
| `git commit` | Works | Works |
| `git checkout -b` | **Blocked** (can't write `.git/refs/heads/`) | Works |
| `git push` | **Blocked** (network + `.git/refs/remotes/`) | Works |
| `gh pr create` | **Blocked** (network) | Works |
| `git status/diff/log` | Works | Works |

Additional findings:
- `spawn_agent` subagents **share** the parent thread's filesystem (confirmed via marker file test)
- "Create branch" button appears in the App header regardless of which branch the worktree was started from
- The App's native finishing flow: Create branch → Commit modal → Commit and push / Commit and create PR
- `network_access = true` config is silently broken on macOS (issue #10390)

## Design: Read-Only Environment Detection

Three read-only git commands detect the environment without side effects:

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

Two signals derived:

- **IN_LINKED_WORKTREE:** `GIT_DIR != GIT_COMMON` — the agent is in a worktree created by something else (Codex App, Claude Code Agent tool, previous skill run, or the user)
- **ON_DETACHED_HEAD:** `BRANCH` is empty — no named branch exists

Why `git-dir != git-common-dir` instead of checking `show-toplevel`:
- In a normal repo, both resolve to the same `.git` directory
- In a linked worktree, `git-dir` is `.git/worktrees/<name>` while `git-common-dir` is `.git`
- In a submodule, both are equal — avoiding a false positive that `show-toplevel` would produce
- Resolving via `cd && pwd -P` handles the relative-path problem (`git-common-dir` returns `.git` relative in normal repos but absolute in worktrees) and symlinks (macOS `/tmp` → `/private/tmp`)

### Decision Matrix

| Linked Worktree? | Detached HEAD? | Environment | Action |
|---|---|---|---|
| No | No | Claude Code / Codex CLI / normal git | Full skill behavior (unchanged) |
| Yes | Yes | Codex App worktree (workspace-write) | Skip worktree creation; handoff payload at finish |
| Yes | No | Codex App (Full access) or manual worktree | Skip worktree creation; full finishing flow |
| No | Yes | Unusual (manual detached HEAD) | Create worktree normally; warn at finish |

## Changes

### 1. `using-git-worktrees/SKILL.md` — Add Step 0 (~12 lines)

New section between "Overview" and "Directory Selection Process":

**Step 0: Check if Already in an Isolated Workspace**

Run the detection commands. If `GIT_DIR != GIT_COMMON`, skip worktree creation entirely. Instead:
1. Skip to "Run Project Setup" subsection under Creation Steps — `npm install` etc. is idempotent, worth running for safety
2. Then "Verify Clean Baseline" — run tests
3. Report with branch state:
   - On a branch: "Already in an isolated workspace at `<path>` on branch `<name>`. Tests passing. Ready to implement."
   - Detached HEAD: "Already in an isolated workspace at `<path>` (detached HEAD, externally managed). Tests passing. Note: branch creation needed at finish time. Ready to implement."

If `GIT_DIR == GIT_COMMON`, proceed with the full worktree creation flow (unchanged).

Safety verification (.gitignore check) is skipped when Step 0 fires — irrelevant for externally-created worktrees.

Update the Integration section's "Called by" entries. Change the description on each from context-specific text to: "Ensures isolated workspace (creates one or verifies existing)". For example, the `subagent-driven-development` entry changes from "REQUIRED: Set up isolated workspace before starting" to "REQUIRED: Ensures isolated workspace (creates one or verifies existing)".

**Sandbox fallback:** If `GIT_DIR == GIT_COMMON` and the skill proceeds to Creation Steps, but `git worktree add -b` fails with a permission error (e.g., Seatbelt sandbox denial), treat this as a late-detected restricted environment. Fall back to the Step 0 "already in workspace" behavior — skip creation, run setup and baseline tests in the current directory, report accordingly.

After reporting in Step 0, STOP. Do not continue to Directory Selection or Creation Steps.

**Everything else unchanged:** Directory Selection, Safety Verification, Creation Steps, Project Setup, Baseline Tests, Quick Reference, Common Mistakes, Red Flags.

### 2. `finishing-a-development-branch/SKILL.md` — Add Step 1.5 + cleanup guard (~20 lines)

**Step 1.5: Detect Environment** (after Step 1 "Verify Tests", before Step 2 "Determine Base Branch")

Run the detection commands. Three paths:

- **Path A** skips Steps 2 and 3 entirely (no base branch or options needed).
- **Paths B and C** proceed through Step 2 (Determine Base Branch) and Step 3 (Present Options) as normal.

**Path A — Externally managed worktree + detached HEAD** (`GIT_DIR != GIT_COMMON` AND `BRANCH` empty):

First, ensure all work is staged and committed (`git add` + `git commit`). The Codex App's finishing controls operate on committed work.

Then present this to the user (do NOT present the 4-option menu):

```
Implementation complete. All tests passing.
Current HEAD: <full-commit-sha>

This workspace is externally managed (detached HEAD).
I cannot create branches, push, or open PRs from here.

⚠ These commits are on a detached HEAD. If you do not create a branch,
they may be lost when this workspace is cleaned up.

If your host application provides these controls:
- "Create branch" — to name a branch, then commit/push/PR
- "Hand off to local" — to move changes to your local checkout

Suggested branch name: <ticket-id/short-description>
Suggested commit message: <summary-of-work>
```

Branch name derivation: use the ticket ID if available (e.g., `pri-823/codex-compat`), otherwise slugify the first 5 words of the plan title, otherwise omit the suggestion. Avoid including sensitive content (vulnerability descriptions, customer names) in branch names.

Skip to Step 5 (cleanup is a no-op for externally managed worktrees).

**Path B — Externally managed worktree + named branch** (`GIT_DIR != GIT_COMMON` AND `BRANCH` exists):

Present the 4-option menu as normal. (The Step 5 cleanup guard will re-detect the externally managed state independently.)

**Path C — Normal environment** (`GIT_DIR == GIT_COMMON`):

Present the 4-option menu as today (unchanged).

**Step 5 cleanup guard:**

Re-run the `GIT_DIR` vs `GIT_COMMON` detection at cleanup time (do not rely on earlier skill output — the finishing skill may run in a different session). If `GIT_DIR != GIT_COMMON`, skip `git worktree remove` — the host environment owns this workspace.

Otherwise, check and remove as today. Note: the existing Step 5 text says "For Options 1, 2, 4" but the Quick Reference table and Common Mistakes section say "Options 1 & 4 only." The new guard is added before this existing logic and does not change which options trigger cleanup.

**Everything else unchanged:** Options 1-4 logic, Quick Reference, Common Mistakes, Red Flags.

### 3. `subagent-driven-development/SKILL.md` and `executing-plans/SKILL.md` — 1 line edit each

Both skills have an identical Integration section line. Change from:
```
- superpowers:using-git-worktrees - REQUIRED: Set up isolated workspace before starting
```
To:
```
- superpowers:using-git-worktrees - REQUIRED: Ensures isolated workspace (creates one or verifies existing)
```

**Everything else unchanged:** Dispatch/review loop, prompt templates, model selection, status handling, red flags.

### 4. `codex-tools.md` — Add environment detection docs (~15 lines)

Two new sections at the end:

**Environment Detection:**

```markdown
## Environment Detection

Skills that create worktrees or finish branches should detect their
environment with read-only git commands before proceeding:

\```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
\```

- `GIT_DIR != GIT_COMMON` → already in a linked worktree (skip creation)
- `BRANCH` empty → detached HEAD (cannot branch/push/PR from sandbox)

See `using-git-worktrees` Step 0 and `finishing-a-development-branch`
Step 1.5 for how each skill uses these signals.
```

**Codex App Finishing:**

```markdown
## Codex App Finishing

When the sandbox blocks branch/push operations (detached HEAD in an
externally managed worktree), the agent commits all work and informs
the user to use the App's native controls:

- **"Create branch"** — names the branch, then commit/push/PR via App UI
- **"Hand off to local"** — transfers work to the user's local checkout

The agent can still run tests, stage files, and output suggested branch
names, commit messages, and PR descriptions for the user to copy.
```

## What Does NOT Change

- `implementer-prompt.md`, `spec-reviewer-prompt.md`, `code-quality-reviewer-prompt.md` — subagent prompts untouched
- `executing-plans/SKILL.md` — only the 1-line Integration description changes (same as `subagent-driven-development`); all runtime behavior is unchanged
- `dispatching-parallel-agents/SKILL.md` — no worktree or finishing operations
- `.codex/INSTALL.md` — installation process unchanged
- The 4-option finishing menu — preserved exactly for Claude Code and Codex CLI
- The full worktree creation flow — preserved exactly for non-worktree environments
- Subagent dispatch/review/iterate loop — unchanged (filesystem sharing confirmed)

## Scope Summary

| File | Change |
|---|---|
| `skills/using-git-worktrees/SKILL.md` | +12 lines (Step 0) |
| `skills/finishing-a-development-branch/SKILL.md` | +20 lines (Step 1.5 + cleanup guard) |
| `skills/subagent-driven-development/SKILL.md` | 1 line edit |
| `skills/executing-plans/SKILL.md` | 1 line edit |
| `skills/using-superpowers/references/codex-tools.md` | +15 lines |

~50 lines added/changed across 5 files. Zero new files. Zero breaking changes.

## Future Considerations

If a third skill needs the same detection pattern, extract it into a shared `references/environment-detection.md` file (Approach B). Not needed now — only 2 skills use it.

## Test Plan

### Automated (run in Claude Code after implementation)

1. Normal repo detection — assert IN_LINKED_WORKTREE=false
2. Linked worktree detection — `git worktree add` test worktree, assert IN_LINKED_WORKTREE=true
3. Detached HEAD detection — `git checkout --detach`, assert ON_DETACHED_HEAD=true
4. Finishing skill handoff output — verify handoff message (not 4-option menu) in restricted environment
5. **Step 5 cleanup guard** — create a linked worktree (`git worktree add /tmp/test-cleanup -b test-cleanup`), `cd` into it, run the Step 5 cleanup detection (`GIT_DIR` vs `GIT_COMMON`), assert it would NOT call `git worktree remove`. Then `cd` back to main repo, run the same detection, assert it WOULD call `git worktree remove`. Clean up test worktree afterward.

### Manual Codex App Tests (5 tests)

1. Detection in Worktree thread (workspace-write) — verify GIT_DIR != GIT_COMMON, empty branch
2. Detection in Worktree thread (Full access) — same detection, different sandbox behavior
3. Finishing skill handoff format — verify agent emits handoff payload, not 4-option menu
4. Full lifecycle — detection → commit → finishing detection → correct behavior → cleanup
5. **Sandbox fallback in Local thread** — Start a Codex App **Local thread** (workspace-write sandbox). Prompt: "Use the superpowers skill `using-git-worktrees` to set up an isolated workspace for implementing a small change." Pre-check: `git checkout -b test-sandbox-check` should fail with `Operation not permitted`. Expected: the skill detects `GIT_DIR == GIT_COMMON` (normal repo), attempts `git worktree add -b`, hits Seatbelt denial, falls back to Step 0 "already in workspace" behavior — runs setup, baseline tests, reports ready from current directory. Pass: agent recovers gracefully without cryptic error messages. Fail: agent prints raw Seatbelt error, retries, or gives up with confusing output.

### Regression

- Existing Claude Code skill-triggering tests still pass
- Existing subagent-driven-development integration tests still pass
- Normal Claude Code session: full worktree creation + 4-option finishing still works
