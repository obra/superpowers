---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from the current workspace or before executing implementation plans - detects existing isolation first, prefers native worktree tools, and falls back to git worktree only when needed. 中文触发场景：当用户说'创建新的开发分支'、'需要隔离的开发环境'、'用 worktree 开发'、'创建独立工作区'等需要 Git worktree 隔离时使用此技能。
---

# Using Git Worktrees

## Overview

Ensure work happens in an isolated workspace when isolation is useful, but do not create extra worktrees blindly.

**Core principle:** Detect existing isolation first. Reuse it when present. If isolation is needed, prefer the platform's native worktree tools. Use manual `git worktree` commands only as a fallback.

**Announce at start:** "I'm using the using-git-worktrees skill to make sure we have an isolated workspace when needed."

## Step 0: Detect Existing Isolation

**Before creating anything, check whether the current workspace is already isolated.**

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

**Submodule guard:** `GIT_DIR != GIT_COMMON` is also true inside git submodules. Before concluding "already isolated," verify that you are not in a submodule:

```bash
git rev-parse --show-superproject-working-tree 2>/dev/null
```

If that command returns a path, you are in a submodule, not a linked worktree. Treat it like a normal repo checkout for this skill.

### Outcome A: Already isolated

If `GIT_DIR != GIT_COMMON` and you are **not** in a submodule, you are already in a linked worktree or another isolated git workspace.

- Reuse the current workspace.
- Do **not** create another worktree.
- Skip directly to Step 2 (Project Setup).

Report the state:

- On a branch: `Already in isolated workspace at <path> on branch <name>. Reusing it.`
- Detached HEAD: `Already in isolated workspace at <path> (detached HEAD, externally managed). Reusing it.`

### Outcome B: Not isolated yet

If `GIT_DIR == GIT_COMMON`, or the submodule guard says you are inside a submodule, you are not yet in a reusable isolated workspace for this skill.

If the user has already clearly asked for work in place or a plain branch in the current directory, honor that and skip to Step 2.

Otherwise, ask for or use existing consent before creating isolation:

> "Would you like me to set up an isolated workspace? It keeps changes off the current checkout."

If the user declines, work in place and skip to Step 2.

## Step 1: Create Isolation Only When Needed

Only run this step when Step 0 found no reusable isolated workspace and the user wants isolation.

### Step 1a: Native worktree tools first

Check whether your platform already provides a native way to enter or create an isolated workspace. Typical examples include `EnterWorktree`, `WorktreeCreate`, a `/worktree` command, or a `--worktree` flag.

If a native tool exists:

- Use it.
- Treat the user's consent to create an isolated workspace as authorization to use that tool.
- Do not jump to manual `git worktree` commands.
- After the native tool succeeds, continue with Step 2.

**Reason:** Native tools manage placement, branch setup, cleanup, and harness-visible state. Creating a separate manual worktree when the platform already manages isolation causes duplicate or phantom workspaces.

### Step 1b: Git worktree fallback only

Use this only when Step 1a does not apply because no native worktree tool is available.

#### Directory selection

Prefer stable defaults over interactive menus. Explicit user preference always wins.

1. If the user explicitly named a worktree location, use it.
2. If `.worktrees/` exists, use it.
3. Otherwise, if `worktrees/` exists, use it.
4. Otherwise, if the project's instruction files (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursorrules`, or equivalent) declare a worktree directory preference, use that.
5. Otherwise, if `~/.config/superpowers/worktrees/<project>/` already exists, use it for backward compatibility.
6. Otherwise, default to `.worktrees/` at the project root.

This keeps Horspowers' local preference for `.worktrees/` over `worktrees/` while remaining compatible with older or externally declared conventions.

#### Safety verification for project-local directories

If the chosen location is project-local (`.worktrees/` or `worktrees/`), verify that it is ignored before creating anything.

```bash
git check-ignore -q .worktrees 2>/dev/null
git check-ignore -q worktrees 2>/dev/null
```

For the directory you plan to use:

- If it is ignored, continue.
- If it is not ignored, add the needed ignore rule to `.gitignore`, commit that fix, then continue.

**Why this matters:** worktree contents must not pollute the main repository status.

Global legacy directories under `~/.config/superpowers/worktrees/` do not need `.gitignore` verification.

#### Create the fallback worktree

```bash
project=$(basename "$(git rev-parse --show-toplevel)")

# For project-local directories:
# path="$LOCATION/$BRANCH_NAME"
#
# For legacy global directories:
# path="$HOME/.config/superpowers/worktrees/$project/$BRANCH_NAME"

git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

If manual worktree creation is blocked by the environment or fails for permission reasons, report that the isolated workspace could not be created and continue in the current directory instead.

## Step 2: Project Setup

After reusing or creating the workspace, run project setup as needed.

```bash
# Node.js
if [ -f package.json ]; then npm install; fi

# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Python
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

## Step 3: Verify Clean Baseline

Run the appropriate baseline tests so the workspace starts from a known state.

```bash
# Use the project-appropriate command
npm test
cargo test
pytest
go test ./...
```

If tests fail, report the failures and ask whether to proceed or investigate first.

If tests pass, report the workspace as ready.

### Report

```text
Workspace ready at <full-path>
Tests passing (<N> tests, 0 failures)
Ready to implement <feature-name>
```

## Compatibility Notes

- If the user explicitly wants a plain branch or current-directory workflow, honor that request instead of pushing worktree creation.
- If a project already has a non-default directory convention, preserve it.
- Do not make interactive directory-picking or simple-vs-worktree strategy prompts the default path. Use them only when the user explicitly asks for that kind of choice.

## Quick Reference

| Situation | Action |
|-----------|--------|
| `GIT_DIR != GIT_COMMON` and not a submodule | Reuse current isolated workspace |
| `GIT_DIR != GIT_COMMON` but in a submodule | Treat as normal repo checkout |
| User declines isolation | Work in place |
| Native worktree tool available | Use it |
| No native worktree tool | Use git worktree fallback |
| `.worktrees/` exists | Prefer it |
| `worktrees/` exists and `.worktrees/` does not | Use it |
| Instruction file declares a directory | Use that preference |
| Legacy global path exists | Use it for backward compatibility |
| No prior location exists | Default to `.worktrees/` |
| Project-local directory not ignored | Fix `.gitignore`, commit, then continue |
| Baseline tests fail | Report failures and ask before proceeding |

## Common Mistakes

### Creating another worktree inside an already isolated workspace

- **Problem:** Duplicates or conflicts with the existing environment
- **Fix:** Always run Step 0 first and reuse the current isolated workspace

### Using manual git worktree commands when native tools exist

- **Problem:** Creates state the platform may not manage or even see
- **Fix:** Step 1a is the default creation path; Step 1b exists only as fallback

### Skipping the submodule guard

- **Problem:** Misclassifies a submodule as a linked worktree
- **Fix:** Check `git rev-parse --show-superproject-working-tree` before deciding

### Skipping ignore verification

- **Problem:** Project-local worktree files can leak into repository status
- **Fix:** Verify `.worktrees/` or `worktrees/` with `git check-ignore` before creation

### Falling back to interactive prompts too early

- **Problem:** Adds friction and bypasses stable conventions
- **Fix:** Prefer existing directories, declared preferences, and the `.worktrees/` default

## Red Flags

**Never:**

- Create a new worktree when Step 0 already found an isolated workspace
- Jump straight to `git worktree add` when native worktree tools are available
- Treat submodule detection as proof of an isolated worktree
- Create a project-local worktree without `git check-ignore` verification
- Skip baseline setup and test verification

**Always:**

- Detect isolation before creating anything
- Reuse existing isolated workspaces
- Ask for or honor consent before creating a new isolated workspace
- Prefer native worktree tools over manual git fallback
- Prefer `.worktrees/` over `worktrees/` when both are viable
- Keep the baseline setup and test check in place

## Integration

**Called by:**

- **subagent-driven-development** - Ensures isolated workspace exists or is reused
- **executing-plans** - Ensures isolated workspace exists or is reused
- Any skill that needs isolated workspace safety

**Pairs with:**

- **finishing-a-development-branch** - Cleans up worktrees created through the fallback path when work is complete
