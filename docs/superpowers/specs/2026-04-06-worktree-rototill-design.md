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

The skill describes the goal ("ensure work happens in an isolated workspace") and defers to native tools when available. It prescribes specific git commands only as a fallback for harnesses without native worktree support. Step 1a comes first and names native tools explicitly (`EnterWorktree`, `WorktreeCreate`, `/worktree`, `--worktree`); Step 1b comes second with the git fallback. The original spec kept Step 1a abstract ("you know your own toolkit"), but TDD proved that agents anchor on Step 1b's concrete commands when Step 1a is too vague. Explicit tool naming and a consent-authorization bridge were required to make the preference reliable.

### Provenance-based ownership

Whoever creates the worktree owns its cleanup. If the harness created it, superpowers doesn't touch it. If superpowers created it (via git fallback), superpowers cleans it up. The heuristic: if the worktree lives under `.worktrees/` or `~/.config/superpowers/worktrees/`, superpowers owns it. Anything else (`.claude/worktrees/`, `~/.codex/worktrees/`, `.gemini/worktrees/`) belongs to the harness.

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

**Submodule guard:** `GIT_DIR != GIT_COMMON` is also true inside git submodules. Before concluding "already in a worktree," check that we're not in a submodule:

```bash
# If this returns a path, we're in a submodule, not a worktree
git rev-parse --show-superproject-working-tree 2>/dev/null
```

If in a submodule, treat as `GIT_DIR == GIT_COMMON` (proceed to Step 0.5).

#### Step 0.5: Consent

When Step 0 finds no existing isolation (`GIT_DIR == GIT_COMMON`), ask before creating:

> "Would you like me to set up an isolated worktree? This protects your current branch from changes. (y/n)"

If yes, proceed to Step 1. If no, work in place — skip to Step 3 with no worktree.

This step is skipped entirely when Step 0 detects existing isolation (no point asking about what already exists).

#### Step 1a: Native Tools (preferred)

> The user has asked for an isolated workspace (Step 0 consent). Check your available tools — do you have `EnterWorktree`, `WorktreeCreate`, a `/worktree` command, or a `--worktree` flag? If YES: the user's consent to create a worktree is your authorization to use it. Use it now and skip to Step 3.

After using a native tool, skip to Step 3 (project setup).

**Design note — TDD revision:** The original spec used a deliberately short, abstract Step 1a ("You know your own toolkit — the skill does not need to name specific tools"). TDD validation disproved this: agents anchored on Step 1b's concrete git commands and ignored the abstract guidance (2/6 pass rate). Three changes fixed it (50/50 pass rate across GREEN and PRESSURE tests):

1. **Explicit tool naming** — listing `EnterWorktree`, `WorktreeCreate`, `/worktree`, `--worktree` by name transforms the decision from interpretation ("do I have a native tool?") into factual lookup ("is `EnterWorktree` in my tool list?"). Agents on platforms without these tools simply check, find nothing, and fall through to Step 1b. No false positives observed.
2. **Consent bridge** — "the user's consent to create a worktree is your authorization to use it" directly addresses `EnterWorktree`'s tool-level guardrail ("ONLY when user explicitly asks"). Tool descriptions override skill instructions (Claude Code #29950), so the skill must frame user consent as the authorization the tool requires.
3. **Red Flag entry** — naming the specific anti-pattern ("Use `git worktree add` when you have a native worktree tool — this is the #1 mistake") in the Red Flags section.

File splitting (Step 1b in a separate skill) was tested and proven unnecessary. The anchoring problem is solved by the quality of Step 1a's text, not by physical separation of git commands. Control tests with the full 240-line skill (all git commands visible) passed 20/20.

#### Step 1b: Git Worktree Fallback

When no native tool is available, create a worktree manually.

**Directory selection** (priority order):
1. Check for existing `.worktrees/` or `worktrees/` directory — if found, use it. If both exist, `.worktrees/` wins.
2. Check for existing `~/.config/superpowers/worktrees/<project>/` directory — if found, use it (backward compatibility with legacy global path).
3. Check the project's agent instruction file (CLAUDE.md, GEMINI.md, AGENTS.md, .cursorrules, or equivalent) for a worktree directory preference.
4. Default to `.worktrees/`.

No interactive directory selection prompt. The global path (`~/.config/superpowers/worktrees/`) is no longer offered as a choice to new users, but existing worktrees at that location are detected and used for backward compatibility.

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

**Hooks awareness:** Git worktrees do not inherit the parent repo's hooks directory. After creating a worktree via 1b, symlink the hooks directory from the main repo if one exists:

```bash
if [ -d "$MAIN_ROOT/.git/hooks" ]; then
    ln -sf "$MAIN_ROOT/.git/hooks" "$path/.git/hooks"
fi
```

This prevents pre-commit checks, linters, and other hooks from silently stopping when work moves to a worktree. (Idea from PR #965.)

**Sandbox fallback:** If `git worktree add` fails with a permission error, treat as a restricted environment. Skip creation, work in current directory, proceed to Step 3.

**Step numbering note:** The current skill has Steps 1-4 as a flat list. This redesign uses 0, 0.5, 1a, 1b, 3, 4. There is no Step 2 — it was the old monolithic "Create Isolated Workspace" which is now split into the 1a/1b structure. The implementation should renumber cleanly (e.g., 0 → "Step 0: Detect", 0.5 → within Step 0's flow, 1a/1b → "Step 1", 3 → "Step 2", 4 → "Step 3") or keep the current numbering with a note. Implementer's choice.

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
cd "$MAIN_ROOT"

# Merge first, verify success before removing anything
git checkout <base-branch>
git pull
git merge <feature-branch>
<run tests>

# Only after merge succeeds: remove worktree, then delete branch (Bug #999 fix)
git worktree remove "$WORKTREE_PATH"  # only if superpowers owns it
git branch -d <feature-branch>
```

The order is critical: merge → verify → remove worktree → delete branch. The old skill deleted the branch before removing the worktree (which fails because the worktree still references the branch). The naive fix of removing the worktree first is also wrong — if the merge then fails, the working directory is gone and changes are lost.

**Option 2 (Create PR):**

Push branch, create PR. Do NOT clean up worktree — user needs it for PR iteration. (Bug #940 fix: remove contradictory "Then: Cleanup worktree" prose.)

**Option 3 (Keep as-is):** No action.

**Option 4 (Discard):** Require typed "discard" confirmation. Then remove worktree (if superpowers owns it), force-delete branch.

#### Step 5: Cleanup (updated)

```
if GIT_DIR == GIT_COMMON:
    # Normal repo, no worktree to clean up
    done

if worktree path is under .worktrees/ or ~/.config/superpowers/worktrees/:
    # Superpowers created it — we own cleanup
    cd to main repo root       # Bug #238 fix
    git worktree remove <path>

else:
    # Harness created it — hands off
    # If platform provides a workspace-exit tool, use it
    # Otherwise, leave the worktree in place
```

Cleanup only runs for Options 1 and 4. Options 2 and 3 always preserve the worktree. (Bug #940 fix.)

**Stale worktree pruning:** After any `git worktree remove`, run `git worktree prune` as a self-healing step. Worktree directories can get deleted out-of-band (e.g., by harness cleanup, manual `rm`, or `.claude/` cleanup), leaving stale registrations that cause confusing errors. One line, prevents silent rot. (Idea from PR #1072.)

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
| #999 | Option 1 deletes branch before removing worktree. `git branch -d` can fail because worktree still references the branch. | Reorder to: merge → verify tests → remove worktree → delete branch. Merge must succeed before anything is removed. | finishing SKILL.md |
| #238 | `git worktree remove` fails silently if CWD is inside the worktree being removed. | Add CWD guard: `cd` to main repo root before `git worktree remove`. | finishing SKILL.md |

## Issues Resolved

| Issue | Resolution |
|-------|-----------|
| #940 | Direct fix (Bug #940) |
| #991 | Opt-in consent in Step 0.5 |
| #918 | Step 0 detection + Step 1.5 finishing detection |
| #1009 | Resolved by Step 1a — agents use native tools (e.g., `EnterWorktree`) which create at harness-native paths. Depends on Step 1a working; see Risks. |
| #999 | Direct fix (Bug #999) |
| #238 | Direct fix (Bug #238) |
| #1049 | Platform-neutral instruction file references |
| #279 | Solved by detect-and-defer — native paths respected because we don't override them |
| #574 | **Deferred.** Nothing in this spec touches the brainstorming skill where the bug lives. Full fix (adding a worktree step to brainstorming's checklist) is Phase 4. |

## Risks

### Step 1a is the load-bearing assumption — RESOLVED

Step 1a — agents preferring native worktree tools over the git fallback — is the foundation the entire design rests on. If agents ignore Step 1a and fall through to Step 1b on harnesses with native support, detect-and-defer fails entirely.

**Status:** This risk materialized during implementation. The original abstract Step 1a ("You know your own toolkit") failed at 2/6 on Claude Code. The TDD gate worked as designed — it caught the failure before any skill files were modified, preventing a broken release. Three REFACTOR iterations identified the root causes (agent anchoring on concrete commands, tool-description guardrail overriding skill instructions) and produced a fix validated at 50/50 across GREEN and PRESSURE tests. See Step 1a design note above for details.

**Cross-platform validation:**

As of 2026-04-06, Claude Code is the only harness with an agent-callable mid-session worktree tool (`EnterWorktree`). All others either create worktrees before the agent starts (Codex App, Gemini CLI, Cursor) or have no native worktree support (Codex CLI, OpenCode). Step 1a is forward-compatible: when other harnesses add agent-callable worktree tools, agents will match them against the named examples and use them without skill changes.

| Harness | Current worktree model | Skill mechanism | Tested |
|---------|----------------------|-----------------|--------|
| Claude Code | Agent-callable `EnterWorktree` | Step 1a | 50/50 (GREEN + PRESSURE) |
| Codex CLI | No native tool (shell only) | Step 1b git fallback | 6/6 (`codex exec`) |
| Gemini CLI | Launch-time `--worktree` flag, no agent tool | Step 0 if launched with flag, Step 1b if not | Step 0: 1/1, Step 1b: 1/1 (`gemini -p`) |
| Cursor Agent | User-facing `/worktree`, no agent tool | Step 0 if user activated, Step 1b if not | Step 0: 1/1, Step 1b: 1/1 (`cursor-agent -p`) |
| Codex App | Platform-managed, detached HEAD, no agent tool | Step 0 detects existing | 1/1 simulated |
| OpenCode | Detection only (`ctx.worktree`), no agent tool | Step 1b git fallback | Untested (no CLI access) |

**Residual risks:**
1. If Anthropic changes `EnterWorktree`'s tool description to be more restrictive (e.g., "Do not use based on skill instructions"), the consent bridge breaks. Worth filing an issue requesting that the tool description accommodate skill-driven invocation.
2. When other harnesses add agent-callable worktree tools, they may use names not in Step 1a's list. The list should be updated as new tools appear. The generic phrasing ("a worktree or workspace-isolation tool") provides some forward coverage.

### Provenance heuristic

The `.worktrees/` or `~/.config/superpowers/worktrees/` = ours, anything else = hands off` heuristic works for every current harness. If a future harness adopts `.worktrees/` as its convention, we'd have a false positive (superpowers tries to clean up a harness-owned worktree). Similarly, if a user manually runs `git worktree add .worktrees/experiment` without superpowers, we'd incorrectly claim ownership. Both are low risk — every harness uses branded paths, and manual `.worktrees/` creation is unlikely — but worth noting.

### Detached HEAD finishing

The reduced menu for detached HEAD worktrees (no merge option) is correct for Codex App's sandbox model. If a user is in detached HEAD for another reason, the reduced menu still makes sense — you genuinely can't merge from detached HEAD without creating a branch first.

## Implementation Notes

Both skill files contain sections beyond the core steps that need updating during implementation:

- **Frontmatter** (`name`, `description`): Update to reflect detect-and-defer behavior
- **Quick Reference tables**: Rewrite to match new step structure and bug fixes
- **Common Mistakes sections**: Update or remove items that reference old behavior (e.g., "Skip CLAUDE.md check" is now wrong)
- **Red Flags sections**: Update to reflect new priorities (e.g., "Never create a worktree when Step 0 detects existing isolation")
- **Integration sections**: Update cross-references between skills

The spec describes *what changes*; the implementation plan will specify exact edits to these secondary sections.

## Future Work (not in this spec)

- **Phase 3 remainder:** `$TMPDIR` directory option (#666), setup docs for caching and env inheritance (#299)
- **Phase 4:** PreToolUse hooks for path enforcement (#1040), per-worktree env conventions (#597), brainstorming checklist worktree step (#574), multi-repo documentation (#710)
