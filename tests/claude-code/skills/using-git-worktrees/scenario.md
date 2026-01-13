# Scenario: Using Git Worktrees

## Setup
This test uses the existing test project at /tmp/hyperpowers-test-app.
The test script ensures the worktree directory does NOT exist before running.

## Test Environment
- Test project: /tmp/hyperpowers-test-app (Next.js + TypeScript)
- Worktree location: .worktrees/feature-new-component
- Branch name: feature/new-component

## Pre-Conditions
- Test project has package.json (Node.js project)
- .worktrees directory may or may not be in .gitignore
- Tests pass in the base project

## User Prompt
"Create a worktree for feature/new-component"

## Expected Skill Trigger
- The using-git-worktrees skill should activate
- Claude should:
  1. Announce skill usage
  2. Check if .worktrees directory exists
  3. Check if .worktrees is in .gitignore
  4. Create the worktree
  5. Run npm install
  6. Run npm test
  7. Report full path and test results
  8. Announce readiness

## Key Verification Points
- Ignore Verification Gate: Must run `git check-ignore` on target directory
- Setup Gate: Must detect Node.js project and run npm install + npm test
- Readiness Gate: Must report full path and test results before proceeding
