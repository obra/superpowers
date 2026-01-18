# Test: Bare Repository Handling

**Pressure Type:** Structural (bare repository with no working tree)

**Objective:** Verify skill properly detects bare repositories and provides appropriate guidance about workspace location and operations.

## Setup

```bash
# Create bare repository
mkdir bare-repo && cd bare-repo
git init --bare

# Create primary workspace worktree
git worktree add .worktrees/main -b main

# Create initial commit from primary workspace
cd .worktrees/main
echo "test" > README.md
git add -A && git commit -m "initial commit"

# Return to bare repo root (this is where agent starts)
cd ../..
pwd  # Should be in bare-repo/ root
```

## Scenario

**Starting Location:** `/path/to/bare-repo` (bare repository root - no working tree)

**Repository State:** `core.bare = true`

**User Request:** "Create worktree for feature-b"

**Pressure:** Bare repository context can be confusing. Without guidance, agent might:
- Try to run `git pull` in root (will fail - no working tree)
- Be unclear about where primary workspace is
- Not understand that ALL work must happen in worktrees

## Without Skill (Baseline Behavior)

**Expected Confusion:**

1. **Attempted Operations in Root:**
```bash
git pull  # FAILS: "fatal: this operation must be run in a work tree"
git status  # Shows nothing useful in bare repo
```

2. **Unclear About Structure:**
- Agent doesn't know `.worktrees/main/` is the primary workspace
- May create feature branch incorrectly
- Doesn't understand bare repo workflow

**Why This Fails:**
- Bare repositories have no working tree in root directory
- All operations must happen in worktrees
- Without detection, agent treats it like normal repo

## With Skill (Expected Success)

**Expected Behavior:**

1. **Pre-Flight Check Detects Bare Repo:**
```bash
is_bare=$(git config --get core.bare 2>/dev/null)
if [[ "$is_bare" == "true" ]]; then
    echo "Note: This is a bare repository. All work must happen in worktrees."
    echo "Primary workspace should be: .worktrees/main"
fi
```

2. **Agent Understands Context:**
- Recognizes this is a bare repository
- Notes that `.worktrees/main/` is primary workspace
- Understands all operations must be in worktrees

3. **Agent Creates Worktree Correctly:**
```bash
main_repo=$(git rev-parse --show-toplevel)  # Returns bare repo root
worktree_path="$main_repo/.worktrees/feature-b"
git worktree add "$worktree_path" -b feature-b
```

4. **Agent Avoids Errors:**
- Does NOT attempt `git pull` in bare repo root
- Does NOT try to create files in bare repo root
- Creates worktree in correct location

## Verification

```bash
# List all worktrees
git worktree list

# Expected output:
# /path/to/bare-repo (bare)
# /path/to/bare-repo/.worktrees/main      [main]
# /path/to/bare-repo/.worktrees/feature-b [feature-b]

# Verify bare repo structure
ls -la /path/to/bare-repo/
# Should show: HEAD, branches/, config, description, hooks/, info/, objects/, refs/, .worktrees/

# Verify new worktree created
ls -la /path/to/bare-repo/.worktrees/
# Should show: main/, feature-b/

# Verify bare config
git config --get core.bare
# Should output: true
```

## Success Criteria

- ✅ Agent runs pre-flight check
- ✅ Agent detects `core.bare = true`
- ✅ Agent notes this is a bare repository
- ✅ Agent identifies primary workspace location (`.worktrees/main/`)
- ✅ Agent does NOT attempt `git pull` in bare repo root
- ✅ Agent creates worktree at correct location
- ✅ Agent understands all work must happen in worktrees

## Cleanup

```bash
# Remove worktrees
git worktree remove .worktrees/feature-b
git worktree remove .worktrees/main

# Remove branches
git branch -D feature-b main

# Remove test repo
cd .. && rm -rf bare-repo
```

## Related Post-Mortem

This test addresses real production confusion where agent attempted `git pull` in bare repository root (fails) and was unclear about primary workspace location.

## Why Bare Repositories Matter

Bare repositories are common in certain workflows:
- Some advanced workflows use bare repos with `.worktrees/main/` as primary workspace
- Git servers often use bare repos
- Some deployment workflows use bare repos with worktrees

Agents need to understand this pattern and not treat bare repos like normal repos with working trees.
