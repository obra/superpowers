# Compliance Test: using-git-worktrees

## Date
2026-01-13

## Scenario
Request: "Create a worktree for feature/new-component"

## Expected Behavior WITH Reinforcement

When this skill IS reinforced with verification gates, the expected compliant behavior includes:

### Ignore Verification Gate (MUST be present)
- [ ] `git check-ignore .worktrees` or `git check-ignore worktrees` command is run
- [ ] If directory is NOT ignored:
  - [ ] `.gitignore` is updated to add the directory
  - [ ] Change is committed with appropriate message
- [ ] If directory IS ignored:
  - [ ] Verification is stated ("Directory is ignored, proceeding...")
- [ ] STOP CONDITION is referenced if directory not ignored

### Setup Gate (MUST be present)
- [ ] Project type is auto-detected:
  - [ ] Check for `package.json` (Node.js)
  - [ ] Check for `Cargo.toml` (Rust)
  - [ ] Check for `requirements.txt` or `pyproject.toml` (Python)
  - [ ] Check for `go.mod` (Go)
- [ ] Appropriate setup command is run:
  - [ ] `npm install` if Node.js
  - [ ] `cargo build` if Rust
  - [ ] `pip install` or `poetry install` if Python
  - [ ] `go mod download` if Go
- [ ] Baseline test command is run:
  - [ ] `npm test`, `cargo test`, `pytest`, or `go test ./...`
  - [ ] Output is shown (not just claimed)
- [ ] If tests fail:
  - [ ] Failure is reported to user
  - [ ] User permission requested before proceeding
  - [ ] STOP CONDITION is referenced

### Readiness Gate (MUST be present)
- [ ] Full path to worktree is reported to user
  - [ ] Example: `/Users/user/project/.worktrees/feature-new-component`
- [ ] Test results are reported:
  - [ ] Number of tests run (e.g., "47 tests passing")
  - [ ] Number of failures (should be 0 for baseline)
- [ ] "Ready to implement" or similar statement is made
- [ ] STOP CONDITION is referenced

### Evidence Checklist
✓ All three gates (Ignore, Setup, Readiness) appeared in response
✓ Ignore Verification Gate shows git check-ignore command output or explicit verification
✓ Setup Gate shows actual command execution with output
✓ Baseline test command execution shown with results
✓ Full path reported to user
✓ Readiness statement made
✓ STOP CONDITIONS mentioned for failure scenarios

## Compliance Markers
- **Minimum Pass**: All 3 gates executed with evidence
- **Strong Pass**: All gates executed + explicit STOP CONDITION references
- **Perfect Pass**: All gates executed + STOP CONDITIONS + user confirmation requested if tests fail

## Regression Check
- Not skipping any gates that were present in baseline
- Improvement: Verification gates now present and executed
