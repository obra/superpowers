---
name: using-git-worktrees
description: Use after design approval to create isolated workspace for feature development
inclusion: always
---

# Using Git Worktrees

## Overview

Create isolated workspaces for feature development using git worktrees. Each feature gets its own directory and branch, preventing conflicts and enabling parallel development.

## When to Use

- After design approval, before implementation
- Starting new feature development
- Need to work on multiple features simultaneously
- Want to isolate experimental changes

## The Process

### 1. Create Worktree

```bash
# Create new branch and worktree
git worktree add ../project-feature-name -b feature/feature-name

# Navigate to new workspace
cd ../project-feature-name
```

### 2. Verify Clean State

```bash
# Check git status
git status

# Run existing tests to ensure clean baseline
npm test
# or
pytest
# or whatever test command your project uses
```

### 3. Set Up Development Environment

```bash
# Install dependencies if needed
npm install
# or
pip install -r requirements.txt

# Run any setup scripts
npm run setup
```

### 4. Verify Everything Works

- All tests pass
- Application starts without errors
- Development tools work (linting, formatting, etc.)

## Benefits

**Isolation:**
- Changes don't affect main codebase
- Can experiment freely
- Easy to abandon if needed

**Parallel Development:**
- Work on multiple features simultaneously
- Switch between features instantly
- No stashing/unstashing required

**Clean History:**
- Each feature has its own commit history
- Easy to review changes
- Simple to rebase or squash

## Best Practices

**Naming Convention:**
- Branch: `feature/descriptive-name`
- Worktree directory: `../project-descriptive-name`

**Regular Maintenance:**
- Keep worktrees up to date with main branch
- Remove completed worktrees promptly
- Don't let worktrees accumulate

**Integration:**
- Regularly rebase on main branch
- Run full test suite before merging
- Clean up worktree after merge

## Cleanup After Feature Complete

```bash
# Navigate back to main workspace
cd ../main-project

# Remove worktree (after feature is merged)
git worktree remove ../project-feature-name

# Delete branch if no longer needed
git branch -d feature/feature-name
```

## Common Commands

```bash
# List all worktrees
git worktree list

# Remove worktree
git worktree remove <path>

# Prune deleted worktrees
git worktree prune
```

## Integration with Other Skills

**Workflow integration:**
- **brainstorming** → creates design → **using-git-worktrees** → **writing-plans**
- Use after design approval, before implementation planning
- Provides clean workspace for **test-driven-development**
- Enables **finishing-a-development-branch** workflow