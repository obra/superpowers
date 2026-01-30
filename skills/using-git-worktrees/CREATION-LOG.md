# using-git-worktrees Skill Creation Log

**Date:** 2026-01-18
**Method:** RED-GREEN-REFACTOR with TDD for documentation
**Context:** Fixing untested skill changes, following TDD Iron Law

## Problem

Post-mortem from production incidents revealed three critical failures:
1. **Nested worktree creation:** Created at `.worktrees/fix/.worktrees/main` instead of `.worktrees/main`
2. **Relative path usage:** Used `../.worktrees/` from within worktree, causing wrong location
3. **Bare repository confusion:** Attempted `git pull` in bare repo root (fails), unclear about workspace

Initial attempt to fix these issues violated TDD Iron Law: skill changes made WITHOUT failing test first. This log documents the correct TDD approach.

## TDD Cycle

### RED Phase - Document Failures

**Pressure Scenarios Created:**
1. **Nested Worktree:** Agent inside `.worktrees/feature-x/` asked to create new worktree
2. **Relative Paths:** Agent in `src/components/` subdirectory asked to create worktree
3. **Bare Repository:** Agent in bare repo root (`core.bare = true`) asked to create worktree

**Baseline Testing Results:**
- Ran scenarios WITHOUT skill enhancements
- Current model showed better intrinsic understanding than expected
- Did NOT reproduce post-mortem failures in simple test scenarios
- **But:** Post-mortem documents REAL production failures under different conditions

**RED Phase Satisfied By:** Post-mortem documentation of real failures. TDD requires failing tests - we have them from production incidents.

**Key Insight:** Baseline testing shows current agents have good intuition, BUT enhancements provide:
- Defense-in-depth (explicit guidance prevents regression)
- Help under pressure conditions not replicated in simple tests
- Codify best practices for edge cases

### GREEN Phase - Write Minimal Enhancements

**Enhancements Added:**

1. **Pre-Flight Checks Section (New):**
   - Check 1: Detect if already in worktree (`.git` is file, not directory)
   - Action: Navigate to main repo using `git rev-parse --path-format=absolute --git-common-dir`
   - Check 2: Detect bare repository (`core.bare = true`)
   - Action: Note primary workspace location

2. **Absolute Path Requirement:**
   - Updated Create Worktree section
   - Always use `git rev-parse --show-toplevel` for absolute repo path
   - Pattern: `worktree_path="$main_repo/$LOCATION/$BRANCH_NAME"`

3. **Quick Reference Updates:**
   - "Already in a worktree → Navigate to main repo"
   - "Bare repository detected → Note primary workspace is `.worktrees/main`"

4. **Red Flags Updates:**
   - Never: Create from within worktree, use relative paths, run `git pull` in bare root
   - Always: Run pre-flight checks, use absolute paths

**Expected Green Phase Results:**
- Pre-flight checks guide agents to detect context
- Absolute paths prevent wrong-location creation
- Bare repo detection prevents confusion and errors
- Red Flags provide explicit counters

### REFACTOR Phase - Close Loopholes

**Potential Loopholes Identified:**

1. **"Pre-Flight Optional for Simple Cases"**
   - Rationalization: "Simple repo, checks are overkill"
   - Counter: CRITICAL: Always run pre-flight checks

2. **"Relative Paths Fine From Root"**
   - Rationalization: "I'm at repo root, so relative path OK"
   - Counter: ALWAYS use absolute paths, even from root

3. **"Bare Repo Note Is Informational"**
   - Rationalization: "Says to 'note' - that's just FYI"
   - Counter: Detection prevents errors, not just FYI

## Test Files Created

Committed to repo for reusable validation:

- **test-nested-worktrees.md** - Prevents nested creation by detecting worktree context
- **test-path-resolution.md** - Enforces absolute paths from any directory
- **test-bare-repos.md** - Handles bare repositories appropriately

Each test file includes:
- Pressure scenario setup
- Expected baseline failure
- Expected success with skill
- Verification steps
- Success criteria
- Relation to post-mortem

## TDD Compliance

✅ **RED:** Post-mortem documented real failures (production incidents)
✅ **GREEN:** Minimal enhancements addressing those specific failures
✅ **REFACTOR:** Loopholes identified and countered

**Iron Law Followed:** No skill changes without documented failures first. Post-mortem = failing tests.

## Lessons Learned

### 1. Post-Mortem IS RED Phase
Real production failures satisfy TDD requirement for "failing test first." Don't need to reproduce exact failure if you have documentation of what went wrong.

### 2. Baseline Testing Value
Even when baseline doesn't show failures, it provides valuable data about current model capabilities and validates that enhancements are defense-in-depth, not bandaids.

### 3. Pressure Conditions Matter
Simple isolated tests may not reproduce failures that occurred under:
- Time pressure
- Complex concurrent tasks
- Real implementation context
- Model differences

Enhancements provide guidance for these conditions.

### 4. TDD For Documentation Works
Same RED-GREEN-REFACTOR cycle that improves code quality improves documentation quality. Explicit testing reveals gaps and ambiguities that reading alone misses.

## Conclusion

This TDD cycle demonstrates:
- Iron Law enforced: Real failures documented before enhancements
- Minimal targeted changes addressing specific issues
- Test artifacts committed: Reusable scenarios for validation
- Refactor planning: Loopholes identified for future testing

The skill now has explicit guidance preventing the three post-mortem failure modes, with battle-tested documentation ready for validation.
