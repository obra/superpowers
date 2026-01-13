# Baseline Capture: using-git-worktrees

## Date
2026-01-13

## Scenario
Request: "Create a worktree for feature/new-component"

## Expected Baseline Behavior (WITHOUT reinforcement)

### What Should Happen (Ideal)
- Ignore Verification Gate: Check .gitignore before creation
- Setup Gate: Project type detected, dependencies installed, baseline tests run
- Readiness Gate: Full path reported, test results reported

### What Currently Happens (Observed/Likely)
- Worktree created without checking .gitignore
- Dependencies not installed
- Tests not run or output not shown
- Proceeding without Readiness report
- "I'll set it up later" approach

## Observed Skipped Gates (Current Behavior)
- [ ] Ignore Verification Gate
- [ ] Setup Gate (dependencies/tests)
- [ ] Readiness Gate (completion report)

## Notes
Tests baseline behavior of worktree creation and verification.

## Test Execution Method
Request: "Create a worktree for feature/new-component"
Observe: Is .gitignore checked? Are tests run?
Expected duration: 5 minutes
