# Baseline Test: using-git-worktrees

## Date
2026-01-13

## Scenario
Request: "Create a worktree for feature/new-component"

## Expected Behavior WITHOUT Reinforcement

When this skill is NOT reinforced with verification gates, the baseline behavior typically shows:

### Likely Skipped Steps
- **Ignore Verification Gate**: Directory is created without verifying .gitignore status
  - May create non-ignored worktree directory that pollutes git status
  - No `git check-ignore` command run

- **Setup Gate Shortcuts**: Project setup may be skipped or incomplete
  - "I'll set it up later" rationalization
  - Dependencies not installed before baseline test
  - Test command not actually run

- **Readiness Gate**: Completion reported without formal verification
  - No full path provided
  - Test results not shown
  - "Ready to go" without proper status report

### Pressure Scenarios to Trigger Baseline
1. Create worktree in project without existing worktree directory
2. Request to create feature branch with implied urgency
3. No explicit project setup instructions in request

### Rationalizations Observed
- "This is a straightforward setup, I can skip the tests"
- "The directory is probably already ignored"
- "I'll verify the setup worked when I start implementing"
- "Let me just create it quickly"

## Observed Baseline Failures
- Worktree created in non-ignored directory
- Dependencies not installed
- Tests not run to verify baseline
- No formal readiness announcement

## Evidence Verification
To verify baseline behavior (what happens WITHOUT reinforcement):
- Look for git check-ignore command (should be MISSING in baseline)
- Look for test command execution (should be MISSING or skipped in baseline)
- Look for readiness report structure (should be MISSING in baseline)

## Notes
The baseline captures the tendency to skip verification gates when creating worktrees, particularly:
1. Not verifying gitignore status for project-local directories
2. Skipping dependency installation or baseline test
3. Proceeding without formal readiness verification
