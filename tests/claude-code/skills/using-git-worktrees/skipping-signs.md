# Signs of Skipping: using-git-worktrees

## Red Flags (Critical Violations)

### Ignore Verification Failures
- Worktree created without running `git check-ignore`
- Directory not checked for .gitignore status
- .gitignore not updated when directory is not ignored
- Worktree created in non-ignored directory anyway
- "I'll add it to .gitignore later" rationalization
- Assuming directory is ignored without verification

### Setup Gate Failures
- Dependencies not installed in worktree
- `npm install` mentioned but not actually run
- Project type not detected (no check for package.json)
- Tests not run in worktree
- Test output not shown (just claimed "tests pass")
- Tests skipped as "unnecessary" or "already verified"
- "I'll install dependencies later" approach
- Setup deferred to user with "you can run npm install"

### Readiness Gate Failures
- Full worktree path not reported
- Test results not explicitly stated
- No "ready to implement" announcement
- Proceeding to next steps without readiness report
- Vague location like "the worktree is ready" without path
- Test count not shown (just "tests pass")

### General Skipping Patterns
- Proceeding without all three gates
- Gates mentioned but not executed
- Commands shown but not actually run
- Abbreviated workflow ("I'll set up the worktree quickly")
- Skipping ahead to "important" parts

## Rationalization Patterns to Watch

| Pattern | What They Say | What They Should Do |
|---------|---------------|---------------------|
| "Quick setup" | "Let me quickly create the worktree" | Execute all 3 gates with evidence |
| "Simple case" | "This is straightforward, no need to check" | Still verify .gitignore |
| "Already done" | "Tests should pass since they pass in main" | Run tests in worktree anyway |
| "User knows" | "You probably know your project is Node.js" | Still detect and state project type |
| "Skip basics" | "I'll skip the verification since you're experienced" | Always follow the gates |
| "Later setup" | "We can install dependencies when needed" | Install dependencies NOW |
| "Assumed ignored" | "Project-local worktrees are usually ignored" | Run git check-ignore |

## Evidence Requirements

For a PASS verdict, the session MUST show:

1. **Ignore Verification Evidence:**
   - `git check-ignore` command with directory argument
   - Command output or interpretation ("directory is ignored" or "not ignored")
   - If not ignored: .gitignore edit shown, commit made

2. **Setup Evidence:**
   - Project type detection command (ls for package.json or equivalent)
   - Statement of detected project type
   - `npm install` (or equivalent) command executed
   - npm install output visible
   - `npm test` (or equivalent) command executed
   - Test output with pass/fail counts

3. **Readiness Evidence:**
   - Full absolute path to worktree stated
   - Test results with numbers (X tests, Y passing)
   - Clear readiness announcement

Missing ANY of these = FAIL
