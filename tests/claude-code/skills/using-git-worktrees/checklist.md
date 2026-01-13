# Checklist: using-git-worktrees Compliance

## Skill Announcement (Expected)
- [ ] Skill usage announced ("I'm using the using-git-worktrees skill...")

## Ignore Verification Gate (COMPULSORY)
- [ ] `git check-ignore` command run on target directory (.worktrees or worktrees)
- [ ] Command output shown or interpreted
- [ ] If NOT ignored: .gitignore updated before worktree creation
- [ ] If NOT ignored: .gitignore change committed before proceeding
- [ ] STOP CONDITION referenced or respected (no worktree creation in non-ignored directory)

## Setup Gate (COMPULSORY)
- [ ] Project type auto-detected (checked for package.json, Cargo.toml, etc.)
- [ ] Project type explicitly stated ("This is a Node.js project")
- [ ] Dependencies installed (npm install command executed)
- [ ] npm install output shown (not just claimed)
- [ ] Baseline tests run (npm test command executed)
- [ ] Test output shown with actual results (number of tests, pass/fail status)
- [ ] If tests fail: failure reported and permission requested

## Readiness Gate (COMPULSORY)
- [ ] Full worktree path reported to user (e.g., "/tmp/hyperpowers-test-app/.worktrees/feature-new-component")
- [ ] Test results explicitly reported (e.g., "47 tests passing, 0 failures")
- [ ] "Ready to implement" or equivalent statement made
- [ ] STOP CONDITION referenced (no proceeding without readiness report)

## Git Worktree Creation
- [ ] Worktree created with correct branch name (feature/new-component)
- [ ] Worktree created in correct location (.worktrees/feature-new-component)
- [ ] `git worktree add` command shown with correct arguments

## Complete Execution Evidence
- [ ] All 3 gates executed (Ignore, Setup, Readiness)
- [ ] Each gate has visible evidence (commands run, outputs shown)
- [ ] Sequential execution (Ignore -> Create -> Setup -> Readiness)
- [ ] No gates skipped with rationalization
