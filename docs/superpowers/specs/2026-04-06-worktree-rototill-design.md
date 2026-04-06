# Worktree Rototill: Detect-and-Defer

**Date:** 2026-04-06
**Status:** Draft
**Ticket:** PRI-974
**Subsumes:** PRI-823 (Codex App compatibility)

## Problem

Superpowers is opinionated about worktree management — specific paths (`.worktrees/<branch>`), specific commands (`git worktree add`), specific cleanup (`git worktree remove`). Meanwhile, Claude Code, Codex App, Gemini CLI, and Cursor all provide native worktree support with their own paths, lifecycle management, and cleanup.

This creates three failure modes:

1. **Duplication** — on Claude Code, the skill does what `EnterWorktree`/`ExitWorktree` already does
2. **Conflict** — on Codex App, the skill tries to create worktrees inside an already-managed worktree
3. **Phantom state** — skill-created worktrees at `.worktrees/` are invisible to the harness; harness-created worktrees at `.claude/worktrees/` are invisible to the skill

For harnesses without native support (Codex CLI, OpenCode, Copilot standalone), superpowers fills a real gap. The skill shouldn't go away — it should get out of the way when native support exists.

## Goals

1. Defer to native harness worktree systems when they exist
2. Continue providing worktree support for harnesses that lack it
3. Fix three known bugs in finishing-a-development-branch (#940, #999, #238)
4. Make worktree creation opt-in rather than mandatory (#991)
5. Replace hardcoded `CLAUDE.md` references with platform-neutral language (#1049)

## Non-Goals

- Per-worktree environment conventions (`.worktree-env.sh`, port offsetting) — Phase 4
- PreToolUse hooks for path enforcement — Phase 4
- Multi-repo worktree documentation — Phase 4
- Brainstorming checklist changes for worktrees — Phase 4
- `.superpowers-session.json` metadata tracking (interesting PR #997 idea, not needed for v1)
- Hooks symlinking into worktrees (PR #965 idea, separate concern)

## Design Principles

### Detect state, not platform

Use `GIT_DIR != GIT_COMMON` to determine "am I already in a worktree?" rather than sniffing environment variables to identify the harness. This is a stable git primitive (since git 2.5, 2015), works universally across all harnesses, and requires zero maintenance as new harnesses appear.

### Declarative intent, prescriptive fallback

The skill describes the goal ("ensure work happens in an isolated workspace") and defers to native tools when available. It prescribes specific git commands only as a fallback for harnesses without native worktree support. Structurally, the native-tool path (Step 1a) comes first and is short; the git fallback (Step 1b) comes second and is long. This prevents agents from anchoring on the detailed fallback and skipping the preferred path.

### Provenance-based ownership

Whoever creates the worktree owns its cleanup. If the harness created it, superpowers doesn't touch it. If superpowers created it (via git fallback), superpowers cleans it up. The heuristic: if the worktree lives under `.worktrees/`, superpowers owns it. Anything else (`.claude/worktrees/`, `~/.codex/worktrees/`, `.gemini/worktrees/`) belongs to the harness.

## Design

### 1. `using-git-worktrees` SKILL.md Rewrite

The skill gains three new steps before creation and simplifies the creation flow.

#### Step 0: Detect Existing Isolation

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

Three outcomes:

| Condition | Meaning | Action |
|-----------|---------|--------|
| `GIT_DIR == GIT_COMMON` | Normal repo checkout | Proceed to Step 0.5 |
| `GIT_DIR != GIT_COMMON`, named branch | Already in a linked worktree | Skip to Step 3 (project setup). Report: "Already in isolated workspace at `<path>` on branch `<name>`." |
| `GIT_DIR != GIT_COMMON`, detached HEAD | Externally managed worktree (e.g., Codex App sandbox) | Skip to Step 3. Report: "Already in isolated workspace at `<path>` (detached HEAD, externally managed)." |

Step 0 does not care who created the worktree or which harness is running. A worktree is a worktree regardless of origin.

#### Step 0.5: Consent

When Step 0 finds no existing isolation (`GIT_DIR == GIT_COMMON`), ask before creating:

> "Would you like me to set up an isolated worktree? This protects your current branch from changes. (y/n)"

If yes, proceed to Step 1. If no, work in place — skip to Step 3 with no worktree.

This step is skipped entirely when Step 0 detects existing isolation (no point asking about what already exists).

#### Step 1a: Native Tools (preferred)

> If your platform provides a worktree or workspace-isolation tool, use it. You know your own toolkit — the skill does not need to name specific tools. Native tools handle directory placement, branch creation, and cleanup automatically.

After using a native tool, skip to Step 3 (project setup).

This section is deliberately short (3 lines). Agents already know their available tools. Listing examples would risk agents attempting tools that don't exist on their platform.

#### Step 1b: Git Worktree Fallback

When no native tool is available, create a worktree manually.

**Directory selection** (priority order):
1. Check for existing `.worktrees/` or `worktrees/` directory — if found, use it. If both exist, `.worktrees/` wins.
2. Check the project's agent instruction file (CLAUDE.md, GEMINI.md, AGENTS.md, .cursorrules, or equivalent) for a worktree directory preference.
3. Default to `.worktrees/`.

No interactive directory selection prompt. No global path option (`~/.config/superpowers/worktrees/` is dropped — no demonstrated user demand, adds cleanup and cross-device complexity).

**Safety verification** (project-local directories only):

```bash
git check-ignore -q .worktrees 2>/dev/null
```

If not ignored, add to `.gitignore` and commit before proceeding.

**Create:**

```bash
git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

**Sandbox fallback:** If `git worktree add` fails with a permission error, treat as a restricted environment. Skip creation, work in current directory, proceed to Step 3.

#### Steps 3-4: Project Setup and Baseline Tests (unchanged)

Regardless of which path created the workspace (Step 0 detected existing, Step 1a native tool, Step 1b git fallback, or no worktree at all), execution converges:

- **Step 3:** Auto-detect and run project setup (`npm install`, `cargo build`, `pip install`, `go mod download`, etc.)
- **Step 4:** Run the test suite. If tests fail, report failures and ask whether to proceed.

### 2. `finishing-a-development-branch` SKILL.md Rewrite

The finishing skill gains environment detection and fixes three bugs.

#### Step 1: Verify Tests (unchanged)

Run the project's test suite. If tests fail, stop. Don't offer completion options.

#### Step 1.5: Detect Environment (new)

Re-run the same detection as Step 0 in creation:

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
```

Three paths:

| State | Menu | Cleanup |
|-------|------|---------|
| `GIT_DIR == GIT_COMMON` (normal repo) | Standard 4 options | No worktree to clean up |
| `GIT_DIR != GIT_COMMON`, named branch | Standard 4 options | Provenance-based (see Step 5) |
| `GIT_DIR != GIT_COMMON`, detached HEAD | Reduced menu: push as new branch + PR, keep as-is, discard | No merge options (can't merge from detached HEAD) |

#### Step 2: Determine Base Branch (unchanged)

#### Step 3: Present Options

**Normal repo and named-branch worktree:**

1. Merge back to `<base-branch>` locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

**Detached HEAD:**

1. Push as new branch and create a Pull Request
2. Keep as-is (I'll handle it later)
3. Discard this work

#### Step 4: Execute Choice

**Option 1 (Merge locally):**

```bash
# Get main repo root for CWD safety (Bug #238 fix)
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)

# Remove worktree BEFORE deleting branch (Bug #999 fix)
cd "$MAIN_ROOT"
git worktree remove "$WORKTREE_PATH"  # only if superpowers owns it

# Now safe to work with branches
git checkout <base-branch>
git pull
git merge <feature-branch>
<run tests>
git branch -d <feature-branch>
```

**Option 2 (Create PR):**

Push branch, create PR. Do NOT clean up worktree — user needs it for PR iteration. (Bug #940 fix: remove contradictory "Then: Cleanup worktree" prose.)

**Option 3 (Keep as-is):** No action.

**Option 4 (Discard):** Require typed "discard" confirmation. Then remove worktree (if superpowers owns it), force-delete branch.

#### Step 5: Cleanup (updated)

```
if GIT_DIR == GIT_COMMON:
    # Normal repo, no worktree to clean up
    done

if worktree path is under .worktrees/:
    # Superpowers created it — we own cleanup
    cd to main repo root       # Bug #238 fix
    git worktree remove <path>

else:
    # Harness created it — hands off
    # If platform provides a workspace-exit tool, use it
    # Otherwise, leave the worktree in place
```

Cleanup only runs for Options 1 and 4. Options 2 and 3 always preserve the worktree. (Bug #940 fix.)

### 3. Integration Updates

#### `subagent-driven-development` and `executing-plans`

Both currently list `using-git-worktrees` as REQUIRED in their integration sections. Change to:

> `using-git-worktrees` — Ensures isolated workspace (creates one or verifies existing)

The skill itself now handles consent (Step 0.5) and detection (Step 0), so calling skills don't need to gate or prompt.

#### `writing-plans`

Remove the stale claim "should be run in a dedicated worktree (created by brainstorming skill)." Brainstorming is a design skill and does not create worktrees. The worktree prompt happens at execution time via `using-git-worktrees`.

### 4. Platform-Neutral Instruction File References

All instances of hardcoded `CLAUDE.md` in worktree-related skills are replaced with:

> "your project's agent instruction file (CLAUDE.md, GEMINI.md, AGENTS.md, .cursorrules, or equivalent)"

This applies to directory preference checks in Step 1b.

## Bug Fixes (bundled)

| Bug | Problem | Fix | Location |
|-----|---------|-----|----------|
| #940 | Option 2 prose says "Then: Cleanup worktree (Step 5)" but quick reference says keep it. Step 5 says "For Options 1, 2, 4" but Common Mistakes says "Options 1 and 4 only." | Remove cleanup from Option 2. Step 5 applies to Options 1 and 4 only. | finishing SKILL.md |
| #999 | Option 1 deletes branch before removing worktree. `git branch -d` can fail because worktree still references the branch. | Reorder: remove worktree first, then delete branch. | finishing SKILL.md |
| #238 | `git worktree remove` fails silently if CWD is inside the worktree being removed. | Add CWD guard: `cd` to main repo root before `git worktree remove`. | finishing SKILL.md |

## Issues Resolved

| Issue | Resolution |
|-------|-----------|
| #940 | Direct fix (Bug #940) |
| #991 | Opt-in consent in Step 0.5 |
| #918 | Step 0 detection + Step 1.5 finishing detection |
| #1009 | Step 0 detects harness-created worktrees and defers |
| #999 | Direct fix (Bug #999) |
| #238 | Direct fix (Bug #238) |
| #1049 | Platform-neutral instruction file references |
| #279 | Solved by detect-and-defer — native paths respected because we don't override them |
| #574 | Partially addressed: consent prompt replaces the implicit handoff gap. Full fix (brainstorming checklist step) deferred to Phase 4 |

## Risks

### Step 1a agent anchoring

The highest-risk element. Step 1a is deliberately short (3 lines) to prevent agents from anchoring on it over the detailed Step 1b fallback. However, the inverse risk exists: agents may skip the short Step 1a and go straight to the detailed Step 1b. Mitigation: TDD validation using Claude Code's native worktree support (the richest available), with RED/GREEN tests confirming agents use native tools when available.

### Provenance heuristic

The `.worktrees/ = ours, anything else = hands off` heuristic works for every current harness. If a future harness adopts `.worktrees/` as its convention, we'd have a false positive (superpowers tries to clean up a harness-owned worktree). Low risk — every harness uses branded paths — but worth noting.

### Detached HEAD finishing

The reduced menu for detached HEAD worktrees (no merge option) is correct for Codex App's sandbox model. If a user is in detached HEAD for another reason, the reduced menu still makes sense — you genuinely can't merge from detached HEAD without creating a branch first.

## Future Work (not in this spec)

- **Phase 3 remainder:** `$TMPDIR` directory option (#666), setup docs for caching and env inheritance (#299)
- **Phase 4:** PreToolUse hooks for path enforcement (#1040), per-worktree env conventions (#597), brainstorming checklist worktree step (#574), multi-repo documentation (#710)
