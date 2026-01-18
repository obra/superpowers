# Test: Absolute Path Enforcement

**Pressure Type:** Wrong working directory (subdirectory of repo)

**Objective:** Verify skill enforces absolute path usage to prevent worktrees being created at wrong locations when current directory is not repo root.

## Setup

```bash
# Create test repository with directory structure
mkdir test-repo && cd test-repo
git init
mkdir -p src/components
echo "test" > src/components/Button.tsx
git add -A && git commit -m "initial commit"

# Navigate to subdirectory (this is where agent starts)
cd src/components
```

## Scenario

**Starting Location:** `/path/to/test-repo/src/components` (subdirectory, NOT repo root)

**User Request:** "Create worktree for bugfix"

**Pressure:** Agent is in subdirectory. Without absolute path resolution, relative paths like `../../.worktrees/bugfix` can be error-prone or create worktree at wrong location.

## Without Skill (Baseline Behavior)

**Expected Failure Modes:**

1. **Relative Path Error:**
```bash
# Agent might try:
git worktree add ../../.worktrees/bugfix -b bugfix
# Creates at /path/to/test-repo/.worktrees/bugfix (might work but fragile)
```

2. **Wrong Location:**
```bash
# Or worse, agent might try:
git worktree add .worktrees/bugfix -b bugfix
# Creates at /path/to/test-repo/src/components/.worktrees/bugfix (WRONG!)
```

**Why This Fails:**
- Relative path calculation from wrong starting point
- Brittle - breaks if directory structure changes
- May create worktree in subdirectory instead of repo root

## With Skill (Expected Success)

**Expected Behavior:**

1. **Pre-Flight Check:** Worktree detection works from subdirectory using git-dir vs git-common-dir comparison (doesn't rely on `.git` file presence)

2. **Agent Uses Absolute Path Resolution:**
```bash
main_repo=$(git rev-parse --show-toplevel)
# Returns: /path/to/test-repo

worktree_path="$main_repo/.worktrees/bugfix"
# Constructs: /path/to/test-repo/.worktrees/bugfix
```

3. **Agent Creates Worktree:**
```bash
git worktree add "$worktree_path" -b bugfix
```

4. **Result:** Worktree created at `/path/to/test-repo/.worktrees/bugfix` (correct location)

## Verification

```bash
# From subdirectory, verify worktree created at repo root
git worktree list

# Expected output:
# /path/to/test-repo                    [main]
# /path/to/test-repo/.worktrees/bugfix  [bugfix]

# Verify no worktree in subdirectory
ls -la /path/to/test-repo/src/components/
# Should NOT show .worktrees/ directory

# Verify worktree at correct location
ls -la /path/to/test-repo/.worktrees/
# Should show bugfix/ directory
```

## Success Criteria

- ✅ Agent uses `git rev-parse --show-toplevel` to get absolute repo path
- ✅ Agent constructs absolute worktree path: `$main_repo/.worktrees/bugfix`
- ✅ Agent does NOT use relative paths like `../../.worktrees/`
- ✅ Worktree created at correct location relative to repo root
- ✅ No worktree created in subdirectory

## Cleanup

```bash
# Remove worktree
git worktree remove /path/to/test-repo/.worktrees/bugfix

# Remove branch
git branch -D bugfix

# Remove test repo
cd /path/to && rm -rf test-repo
```

## Related Post-Mortem

This test addresses real production failure where relative path `../.worktrees/` was used from within a worktree, causing creation at wrong location.
