---
name: install-synchestra
description: Use when the user wants to set up Synchestra for persistent task state management in their project
---

# Install Synchestra

## Overview

Synchestra adds persistent, git-backed task state to superpowers. Tasks survive across sessions, multiple agents can coordinate without conflicts, and you get deviation reports comparing plans vs actual execution.

**Announce at start:** "I'm using the install-synchestra skill to set up persistent task state for this project."

## Prerequisites Check

Run these checks in order:

### 1. Check if Synchestra CLI is installed

```bash
command -v synchestra >/dev/null 2>&1 && synchestra --version
```

If not installed, help the user install it:

**Go install (requires Go 1.22+):**
```bash
go install github.com/synchestra-io/synchestra@latest
```

**From source:**
```bash
git clone https://github.com/synchestra-io/synchestra.git
cd synchestra
go install ./cmd/synchestra
```

Verify installation:
```bash
synchestra --version
```

### 2. Check if project is already initialized

```bash
ls synchestra.yaml 2>/dev/null && echo "Already initialized"
```

If already initialized, report status and stop:
```bash
synchestra task list
```

### 3. Verify git repository

Synchestra requires a git repository with at least one commit and a remote.

```bash
git rev-parse --is-inside-work-tree && git remote -v
```

## Initialize

Run `synchestra project init`:

```bash
synchestra project init
```

This creates:
- An orphan branch (`synchestra-state`) for state storage
- A git worktree at `.synchestra/` (already in `.gitignore`)
- A `synchestra.yaml` marker file on your main branch
- Pushes the state branch to your remote

**For local-only setup (no remote push):**
```bash
synchestra project init --no-push
```

**With a custom title:**
```bash
synchestra project init --title "My Project"
```

## Verify

After initialization:

```bash
# Check state branch exists
git branch | grep synchestra-state

# Check worktree is set up
ls .synchestra/synchestra-state.yaml

# Check marker file
cat synchestra.yaml

# List tasks (should be empty)
synchestra task list
```

## What Changes

| What | Where | Impact |
|---|---|---|
| State branch | `synchestra-state` (orphan) | No shared history with your code |
| Worktree | `.synchestra/` | Auto-added to `.gitignore` |
| Marker | `synchestra.yaml` | 3-line YAML on main branch |
| Your code | Unchanged | Zero impact |

## Next Steps

After installation, Synchestra integrates automatically with superpowers:

- **writing-plans** creates persistent tasks from your plans
- **subagent-driven-development** tracks task state across sessions
- **executing-plans** can resume from where a previous session stopped
- Use `superpowers:task-board` to view current task state
- Use `superpowers:deviation-report` to compare plan vs actual

## Uninstall

If the user wants to remove Synchestra:

```bash
# Remove worktree
git worktree remove .synchestra

# Delete state branch locally
git branch -D synchestra-state

# Delete remote branch (optional)
git push origin --delete synchestra-state

# Remove marker file
rm synchestra.yaml

# Remove .gitignore entry
# (edit .gitignore manually to remove the .synchestra line)
```

State is just a git branch — fully reversible.
