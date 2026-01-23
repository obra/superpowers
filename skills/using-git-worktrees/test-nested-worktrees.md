# Test: Nested Worktree Creation Prevention

**Pressure Type:** Structural (already inside worktree)

**Objective:** Verify skill prevents nested worktree creation by detecting when already in a worktree and navigating to main repository first.

## Setup

```bash
# Create test repository
mkdir test-repo && cd test-repo
git init
git add -A && git commit -m "initial commit"

# Create first worktree
git worktree add .worktrees/feature-x -b feature-x

# Enter the worktree (this is where agent starts)
cd .worktrees/feature-x
```

## Scenario

**Starting Location:** `/path/to/test-repo/.worktrees/feature-x` (inside a worktree)

**User Request:** "Create a new worktree for feature-y"

**Pressure:** Agent is already nested inside `.worktrees/feature-x/` directory. Without pre-flight checks, natural tendency is to run commands from current location.

## Without Skill (Baseline Behavior)

**Expected Failure:**
- Agent may create worktree using relative path: `git worktree add ../.worktrees/feature-y`
- Results in nested structure: `.worktrees/feature-x/.worktrees/feature-y/`
- OR Agent may navigate to parent dir but still use relative path, creating at wrong location

**Why This Fails:**
- No detection that current directory IS a worktree
- Relative path resolution from wrong starting point
- Nested worktree structure corrupts repository

## With Skill (Expected Success)

**Expected Behavior:**

1. **Pre-Flight Check Executes:**
```bash
if [ -f .git ]; then
    echo "⚠️  Already in a worktree. Navigating to main repository..."
    main_repo=$(git rev-parse --path-format=absolute --git-common-dir | sed 's|/.git$||')
    cd "$main_repo"
    echo "Now in: $(pwd)"
fi
```

2. **Agent Detects:** `.git` is a file (not directory) → in a worktree

3. **Agent Navigates:** To main repository at `/path/to/test-repo`

4. **Agent Uses Absolute Path:**
```bash
main_repo=$(git rev-parse --show-toplevel)
worktree_path="$main_repo/.worktrees/feature-y"
git worktree add "$worktree_path" -b feature-y
```

5. **Result:** Worktree created at `/path/to/test-repo/.worktrees/feature-y` (correct location, not nested)

## Verification

```bash
# List all worktrees
git worktree list

# Expected output:
# /path/to/test-repo                        [main]
# /path/to/test-repo/.worktrees/feature-x   [feature-x]
# /path/to/test-repo/.worktrees/feature-y   [feature-y]

# Check directory structure
ls -la /path/to/test-repo/.worktrees/

# Expected: feature-x/ and feature-y/ directories (no nested .worktrees/)
```

## Success Criteria

- ✅ Agent runs pre-flight check before creating worktree
- ✅ Agent detects already in worktree (`.git` is file)
- ✅ Agent navigates to main repository root
- ✅ Agent uses absolute path from `git rev-parse --show-toplevel`
- ✅ Worktree created at correct location: `.worktrees/feature-y/`
- ✅ NO nested worktree structure created

## Cleanup

```bash
# Remove worktrees
git worktree remove .worktrees/feature-x
git worktree remove .worktrees/feature-y

# Remove branches
git branch -D feature-x feature-y

# Remove test repo
cd .. && rm -rf test-repo
```

## Related Post-Mortem

This test addresses real production failure where worktree was created at `.worktrees/fix/.worktrees/main` due to being inside a worktree when creating another.
