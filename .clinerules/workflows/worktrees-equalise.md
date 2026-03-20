# Generic Worktree Equalization Prompt

**Purpose**: Equalize all Git worktrees with a common prefix by committing feature branch changes and merging them into main, ensuring all worktrees contain the latest shared code.

**Usage**: Replace `{PREFIX}` with your desired worktree prefix (e.g., "Mar-02", "feature", "dev").

## Prompt Template

```
I am wanting to equalise all the worktrees with {PREFIX} prefix so that they all have the latest code shared amongst them - how can we achieve the correct outcome while not compromising the code?

Additional context:
- Worktrees to equalize: {LIST_OF_WORKTREES} (e.g., {PREFIX}, {PREFIX}-1, {PREFIX}-2)
- Main branch worktree: {MAIN_WORKTREE_PATH} (e.g., /Users/_General/superpowers/{PREFIX})
- Feature branch worktrees: {FEATURE_WORKTREE_PATHS} (e.g., /Users/_General/superpowers/{PREFIX}-1, /Users/_General/superpowers/{PREFIX}-2)
- Expected outcome: All worktrees should contain merged code from main branch
```

## Key Technical Concepts

- Git worktree management for multiple branch checkouts
- Feature branch merging and conflict resolution
- Code synchronization across development environments
- Workflow optimization standards
- Safe code integration without data loss

## Process Steps

1. **Pre-Equalization Submodule Audit**:
   - **CRITICAL FIRST STEP**: Check submodule status in ALL worktrees before any commits
   ```bash
   # In each worktree, check for uncommitted submodule changes
   for worktree in {PREFIX} {PREFIX}-1 {PREFIX}-2; do
     echo "=== Submodule status in $worktree ==="
     cd /Users/_General/superpowers/$worktree
     git submodule status
     # Check for uncommitted changes in each submodule
     for submodule in construct_ai_docs; do
       if [ -d "$submodule" ]; then
         echo "Checking $submodule in $worktree:"
         cd $submodule && git status --porcelain && cd ..
       fi
     done
   done
   ```
   - **STOP IMMEDIATELY** if any submodule has uncommitted changes - commit and push them first
   - Document all submodule commit hashes for each worktree

2. **Analyze current worktree states**:
   - List all worktrees with the specified prefix
   - Check status of each worktree (committed vs uncommitted changes)
   - Identify potential merge conflicts
   - **Record all branch commits**: `git log --oneline --all --graph` to see current state
   - **Record submodule states**: Note which submodules have different commits across worktrees

3. **Submodule Commit Phase** (Do this BEFORE main repo commits):
   ```bash
   # For each worktree with submodule changes:
   cd /Users/_General/superpowers/{WORKTREE}

   # Check each submodule
   for submodule in construct_ai_docs; do
     if [ -d "$submodule" ]; then
       cd $submodule
       if [ -n "$(git status --porcelain)" ]; then
         echo "Committing changes in $submodule of {WORKTREE}"
         git add .
         git commit -m "Submodule changes from {WORKTREE}"
         git push origin HEAD:main  # Push to avoid losing changes
         cd ..
       fi
     fi
   done
   ```

4. **Commit changes in feature branches**:
   - For each feature worktree, add and commit all main repository changes
   - **Update submodule references**: After pushing submodule commits, update the submodule references in the main repo
   ```bash
   cd /Users/_General/superpowers/{WORKTREE}
   git add .  # This includes updated submodule references
   git commit -m "Feature branch changes including submodule updates"
   git push origin {BRANCH_NAME}
   ```
   - **Track committed branches**: Maintain a list of branches that have been committed

5. **Merge into main** (Direct Merge Strategy - RECOMMENDED):
   - Switch to main worktree
   - **Merge each feature branch directly into main**: `git merge {BRANCH_NAME}`
   - **Handle submodule merge conflicts**: If submodule conflicts occur, resolve by choosing the correct commit hash
   ```bash
   # For submodule conflicts, choose the correct version:
   git checkout --theirs docs  # or --ours depending on which has the right changes
   git add docs
   ```
   - **CRITICAL**: Push updated main to remote immediately after each merge
   - **WARNING**: Avoid merging feature branches into other feature branches first - this can cause incomplete equalization

6. **Post-Merge Submodule Synchronization**:
   ```bash
   # In main worktree after all merges:
   git submodule sync  # Ensure URLs are correct
   git submodule update --init --recursive  # Update to correct commits

   # Push any submodule reference updates
   git add .
   git commit -m "Update submodule references after merge"
   git push origin main
   ```

7. **Update submodules across all worktrees**:
   ```bash
   # In each worktree:
   git pull origin main  # Get latest submodule references
   git submodule sync    # Ensure submodule URLs are correct
   git submodule update --init --recursive  # Checkout correct commits
   git submodule status  # Verify status
   ```

8. **Directory Structure Equalization** (CRITICAL - Added Mar-16 Incident Prevention):
   - **Problem**: Git doesn't track empty directories, so directory structures can become inconsistent across worktrees
   - **Solution**: Ensure all worktrees have identical directory hierarchies
   ```bash
   # Compare directory structures across all worktrees
   for worktree in {PREFIX} {PREFIX}-1 {PREFIX}-2; do
     echo "=== Directory structure in $worktree ==="
     find /Users/_General/superpowers/$worktree/construct_ai_docs -type d | sort > /tmp/${worktree}_dirs.txt
   done

   # Check for differences
   diff /tmp/{PREFIX}_dirs.txt /tmp/{PREFIX}-1_dirs.txt || echo "Directory structure mismatch!"
   diff /tmp/{PREFIX}_dirs.txt /tmp/{PREFIX}-2_dirs.txt || echo "Directory structure mismatch!"

   # If directories are missing, create them with .gitkeep files
   for worktree in {PREFIX}-1 {PREFIX}-2; do
     for dir in $(comm -23 /tmp/{PREFIX}_dirs.txt /tmp/${worktree}_dirs.txt); do
       mkdir -p "$dir"
       touch "$dir/.gitkeep"
       echo "Created missing directory: $dir in $worktree"
     done
   done
   ```

9. **Verify equalization** (Enhanced Verification):
   - **Check commit inclusion**: For each feature branch commit, verify: `git branch --contains {COMMIT_HASH}`
   - **Verify all branches merged**: Ensure main contains commits from ALL feature branches
   - **Verify submodule synchronization**: Check `git submodule status` in all worktrees
   - **Cross-reference submodule commits**: Ensure all worktrees have identical submodule commits
   - **Verify directory structures**: Ensure all worktrees have identical folder hierarchies
   - **Run comprehensive test**: Test merged code functionality
   - **Final verification command**:
     ```bash
     # Check that all feature branch commits are in main
     for branch in {PREFIX}-1 {PREFIX}-2 {PREFIX}-3; do
       echo "Checking $branch commits in main:"
       git log --oneline $branch ^main || echo "All $branch commits in main"
     done

     # Check submodule status across all worktrees
     for worktree in {PREFIX} {PREFIX}-1 {PREFIX}-2; do
       echo "Checking submodules in $worktree:"
       cd /Users/_General/superpowers/$worktree && git submodule status
     done

     # Verify submodule commits are identical across worktrees
     MAIN_SUBMODULES=$(cd /Users/_General/superpowers/{PREFIX} && git submodule status | awk '{print $1}')
     for worktree in {PREFIX}-1 {PREFIX}-2; do
       WT_SUBMODULES=$(cd /Users/_General/superpowers/$worktree && git submodule status | awk '{print $1}')
       if [ "$MAIN_SUBMODULES" != "$WT_SUBMODULES" ]; then
         echo "WARNING: Submodule mismatch in $worktree"
       fi
     done

     # CRITICAL: Verify directory structures are identical
     echo "=== Directory Structure Verification ==="
     for worktree in {PREFIX} {PREFIX}-1 {PREFIX}-2; do
       echo "Directories in $worktree construct_ai_docs:"
       find /Users/_General/superpowers/$worktree/construct_ai_docs -type d | wc -l
       # Save for comparison
       find /Users/_General/superpowers/$worktree/construct_ai_docs -type d | sort > /tmp/${worktree}_structure.txt
     done

     # Compare structures
     if ! diff /tmp/{PREFIX}_structure.txt /tmp/{PREFIX}-1_structure.txt >/dev/null; then
       echo "ERROR: Directory structure mismatch between {PREFIX} and {PREFIX}-1"
       exit 1
     fi
     if ! diff /tmp/{PREFIX}_structure.txt /tmp/{PREFIX}-2_structure.txt >/dev/null; then
       echo "ERROR: Directory structure mismatch between {PREFIX} and {PREFIX}-2"
       exit 1
     fi
     echo "✅ All directory structures are identical"
     ```

## Safety Considerations

- Always backup important changes before merging
- Resolve conflicts carefully to avoid losing functionality
- Test merged code before considering the task complete
- Coordinate with other developers working on the same branches
- **Never merge feature branches into other feature branches** - always merge directly to main
- **Verify commit inclusion** after each merge using `git branch --contains {COMMIT_HASH}`
- **Handle submodules with care**: Always sync and update submodules after merging to ensure consistency across worktrees
- **Backup submodule states**: Before updating submodules, note their current commits in case rollback is needed

### Enhanced Submodule Safety Protocol

**PRE-EQUALIZATION AUDIT** (Critical):
- Check `git submodule status` in ALL worktrees before starting
- Run `git status --porcelain` in each submodule directory
- STOP immediately if any submodule has uncommitted changes
- Document submodule commit hashes for all worktrees

**SUBMODULE COMMIT SEQUENCE** (Mandatory):
1. Commit submodule changes: `cd submodule && git add . && git commit -m "changes"`
2. Push submodule commits: `git push origin main` (or appropriate branch)
3. Update submodule reference: `cd .. && git add submodule && git commit -m "update submodule"`
4. Push main repo changes: `git push origin branch`

**SUBMODULE CONFLICT RESOLUTION**:
- When submodule conflicts occur, inspect both versions: `git show HEAD:submodule` vs `git show MERGE_HEAD:submodule`
- Choose the version with the most complete/correct changes
- Use `git checkout --theirs submodule` or `git checkout --ours submodule` appropriately
- Always run `git submodule update --init --recursive` after resolving conflicts

**SUBMODULE RECOVERY** (When data is lost):
- Check reflog: `git reflog` in the submodule directory
- Create recovery branches for lost commits
- Push recovery branches to remote before merging
- Update submodule references carefully

**VERIFICATION REQUIREMENTS**:
- All worktrees must show identical submodule commits: `git submodule status`
- Cross-check submodule commits across worktrees
- Test functionality after submodule updates
- Never proceed with equalization if submodule states are inconsistent

## Common Pitfalls & Prevention

### Incomplete Equalization (The Issue We Encountered)
**Problem**: Merging feature branches into intermediate branches, then only merging the intermediate branch to main, leaving some feature branches unmerged.

**Prevention**:
- Always merge each feature branch directly into main
- Use the verification command to check all commits are included
- Maintain a checklist of merged branches

**Example of the problem**:
```
Mar-09-1 (has changes) → Mar-09-2 → main  ❌ Incomplete
Mar-09-1 (has changes) → main              ✅ Complete
Mar-09-2 (has changes) → main              ✅ Complete
```

### Submodule Data Loss Prevention (Mar-16 Incident)
**Problem**: Uncommitted changes in submodules were lost during equalization cleanup.

**Root Cause**: Submodule changes existed only as local untracked files, not committed to the submodule repository.

**Prevention**:
- **ALWAYS commit submodule changes to their respective repositories first**
- Check `git status` in each submodule before equalization
- Push submodule commits to remote before updating submodule references
- Never rely on untracked files in submodules - they will be lost

**Example of the problem**:
```
Mar-16-1/docs (submodule) has untracked files:
  ?? disciplines/01900_procurement/implementation/
  ?? disciplines/01900_procurement/workflow_docs/

During equalization: git clean -fd → Files permanently lost ❌
```

**Correct process**:
```bash
# In submodule directory
cd docs/
git add .
git commit -m "Add procurement documentation"
git push origin main

# Then update submodule reference in main repo
cd ..
git add docs
git commit -m "Update docs submodule"
git push origin Mar-16-1
```

### Uncommitted Main Repository Changes Oversight (Mar-16-2 Incident)
**Problem**: Equalization process only committed submodule changes but missed uncommitted changes in the main repository, leading to incomplete merges.

**Root Cause**: The equalization script focused only on submodule status checks and commits, but failed to check for uncommitted changes in the main repository files outside of submodules.

**Prevention**:
- **ALWAYS check `git status --porcelain` in the main repository** of each worktree before equalization
- Include main repository change commits in the equalization process
- Use comprehensive status checks that cover both submodules AND main repository files
- Never assume that only submodule changes exist - check the entire working tree

**Example of the problem**:
```
Mar-16-1 has uncommitted changes:
 M client/package-lock.json
 M server/src/services/workflows/procurement-agent/index.js
?? server/src/services/workflows/procurement-agent/new-handler.js

Equalization only committed submodule changes → Main repo changes lost ❌
```

**Correct process**:
```bash
# Check ALL changes in each worktree (not just submodules)
for worktree in {PREFIX} {PREFIX}-1 {PREFIX}-2; do
  echo "=== Full status check in $worktree ==="
  cd /path/to/$worktree
  git status --porcelain  # This shows ALL changes, not just submodules
done

# If main repo changes exist, commit them along with submodule updates
cd /path/to/{WORKTREE}
git add .  # Includes both main repo and submodule reference changes
git commit -m "All changes from {WORKTREE} including submodules"
git push origin {BRANCH_NAME}
```

**Enhanced Pre-Equalization Audit** (Updated):
```bash
# CRITICAL: Check ALL changes in each worktree
for worktree in {PREFIX} {PREFIX}-1 {PREFIX}-2; do
  echo "=== Complete status audit in $worktree ==="
  cd /Users/_General/superpowers/$worktree

  # Check main repository status
  echo "Main repo changes:"
  git status --porcelain | grep -v "^?? " | head -20  # Show modified/deleted files

  # Check for untracked files (excluding common ignores)
  echo "Untracked files:"
  git status --porcelain | grep "^?? " | grep -v node_modules | grep -v ".log" | head -10

  # Check submodule status
  echo "Submodule status:"
  git submodule status

  # Check submodule internal status
  for submodule in construct_ai_docs; do
    if [ -d "$submodule" ]; then
      echo "Submodule $submodule changes:"
      cd $submodule && git status --porcelain && cd ..
    fi
  done
done
```

### Verification Checklist
Before considering equalization complete:
- [ ] All feature branches committed and pushed
- [ ] **All submodule changes committed and pushed to their repositories**
- [ ] Each feature branch merged directly into main
- [ ] `git branch --contains {COMMIT_HASH}` shows main for all feature commits
- [ ] Main branch pushed to remote
- [ ] Submodules synced and updated in all worktrees
- [ ] `git submodule status` shows clean state in all worktrees
- [ ] Test build passes
- [ ] No uncommitted changes remain

## Troubleshooting

### "Changes not appearing after rebuild"
**Symptoms**: Code changes work in feature branch but not in main after equalization
**Cause**: Feature branch not merged into main, or equalization incomplete
**Solution**:
```bash
# Check if commits are in main
git branch --contains {COMMIT_HASH}

# If not in main, merge the branch
git checkout main
git merge {FEATURE_BRANCH}
git push origin main
```

### "Merge conflicts during equalization"
**Symptoms**: Conflicts when merging multiple feature branches
**Cause**: Overlapping changes in different branches
**Solution**:
- Merge branches one at a time, resolving conflicts each time
- Communicate with other developers about overlapping work
- Consider rebasing instead of merging for cleaner history

### "Lost commits after equalization"
**Symptoms**: Commits exist in feature branches but not in main
**Cause**: Incomplete merge process or incorrect merge strategy
**Solution**:
- Use `git log --oneline --all --graph` to visualize all commits
- Manually merge missing branches: `git merge {MISSING_BRANCH}`
- Verify with `git branch --contains {COMMIT_HASH}`

### "Lost submodule data during equalization"
**Symptoms**: Submodule changes committed but not appearing in merged result
**Cause**: Submodule commits not pushed to remote before updating references, or incorrect conflict resolution
**Recovery Process**:
```bash
# 1. Check if submodule commits exist in reflog
cd /path/to/worktree/submodule
git reflog | grep "commit:" | head -10

# 2. If found, create recovery branch
git checkout -b recovery-branch <COMMIT_HASH>

# 3. Push to remote to preserve
git push origin recovery-branch

# 4. Merge recovery branch into main submodule branch
git checkout main
git merge recovery-branch
git push origin main

# 5. Update submodule reference in main repo
cd ..
git add submodule
git commit -m "Recover lost submodule data"
git push origin main

# 6. Update all worktrees
for worktree in {PREFIX} {PREFIX}-1 {PREFIX}-2; do
  cd /path/to/$worktree
  git pull origin main
  git submodule update --init --recursive
done
```

### "Submodule conflicts during merge"
**Symptoms**: Merge fails with "commits not present" or submodule conflicts
**Cause**: Different submodule commits in branches being merged
**Solution**:
```bash
# During merge conflict:
cd /path/to/main/worktree

# Check which version has the correct submodule commit
git show HEAD:docs  # Check main version
git show MERGE_HEAD:docs  # Check incoming version

# Choose the correct version (usually the one with more recent changes)
git checkout --theirs docs  # or --ours
git add docs
git commit -m "Resolve submodule conflict"

# Then update submodules
git submodule sync
git submodule update --init --recursive
```

## Recent Issue Resolution (Mar-09 Worktrees)

**Issue Encountered**: SOW formatting changes in Mar-09-1 were not appearing in main after equalization.

**Root Cause**: Mar-09-1 was merged into Mar-09-2, then Mar-09-2 was merged into main, but Mar-09-1 was never directly merged into main.

**Solution Applied**:
```bash
cd /Users/_General/Mar-09  # Switch to main worktree
git merge Mar-09-1        # Direct merge of feature branch
git push origin main      # Push to remote
```

**Prevention**: Always merge each feature branch directly into main, never rely on transitive merges through intermediate branches.

## Example Usage

For worktrees with "dev" prefix:
```
I am wanting to equalise all the worktrees with dev prefix so that they all have the latest code shared amongst them - how can we achieve the correct outcome while not compromising the code?
```

## Recent Successful Equalization (Mar-16 Worktrees)

**Date**: March 19, 2026
**Worktrees Equalized**: Mar-16, Mar-16-1, Mar-16-2
**Outcome**: All worktrees successfully synchronized with identical submodule states

### Completed Tasks:
- ✅ **Pre-equalization audit** - Checked for uncommitted changes in all worktrees
- ✅ **Submodule conflict resolution** - Resolved merge conflicts between different docs commits
- ✅ **Submodule cleanup** - Removed untracked files and reset submodule states
- ✅ **Reference updates** - Updated submodule references across all worktrees
- ✅ **Final verification** - Confirmed all worktrees are in sync

### Key Accomplishments:
1. **Resolved 68 changed files issue** - The "68 changed files" were actually untracked files in docs submodules across worktrees
2. **Submodule synchronization** - All worktrees now point to consistent submodule commits
3. **Data preservation** - No data loss occurred in docs and nanobot submodules
4. **Directory structure equalization** - All worktrees have identical directory hierarchies (336 directories in docs)

### Lessons Learned:
- Always check submodule status in addition to main repository status
- Commit and push submodule changes before updating submodule references
- Clean up untracked files in submodules to prevent false "changed files" counts
- Verify directory structures are identical across all worktrees

## Submodules

- [](https://github.com/Construct-AI-primary/construct_ai_docs.git)<https://github.com/Construct-AI-primary/construct_ai_docs.git> (as construct_ai_docs/)
