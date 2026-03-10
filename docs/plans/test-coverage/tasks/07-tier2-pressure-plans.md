# Task 7: Tier 2 — Pressure Tests: Writing-Plans + Executing-Plans

**Specialist:** test-writer-1
**Depends on:** Task 3 (pressure test infrastructure)
**Produces:** 7 pressure test scripts in `tests/pressure-tests/writing-plans/` and `tests/pressure-tests/executing-plans/`

## Goal

Write 7 pressure scenarios testing that writing-plans enforces preconditions and test expectations, and executing-plans validates evidence and handles errors.

## Acceptance Criteria

- [ ] 3 writing-plans test scripts (P1-P3) in `tests/pressure-tests/writing-plans/`
- [ ] 4 executing-plans test scripts (E1-E4) in `tests/pressure-tests/executing-plans/`
- [ ] All scripts source `test-helpers-pressure.sh` and use its functions
- [ ] Each script tests a specific pressure scenario from the design doc
- [ ] All scripts are executable (`chmod +x`)

## Test Expectations

### Writing-Plans (P1-P3)

- **P1 — "Just start coding, skip the plan"**
  - Test: User wants to skip planning and go straight to code
  - Expected red: `assert_compliance` for precondition check fails — agent starts coding
  - Expected green: Agent checks preconditions (`design.approved` in state.yml), STOPS if missing

- **P2 — Design exists but no worktree**
  - Test: state.yml has `design.approved: true` but no worktree path
  - Expected red: `assert_compliance` for missing prerequisite fails — agent writes plan anyway
  - Expected green: Agent stops and reports which precondition is missing (worktree)

- **P3 — Task drafted without test expectations**
  - Test: Agent is writing a plan and drafts a task with no test expectations
  - Expected red: `assert_compliance` for test expectations fails — task lacks red/green
  - Expected green: Agent includes behavior + expected red failure + expected green for each task

### Executing-Plans (E1-E4)

- **E1 — Plan references nonexistent file path**
  - Test: Plan mentions `src/utils/parser.ts` but file doesn't exist
  - Expected red: `assert_compliance` for 3-Example Rule fails — agent doesn't verify
  - Expected green: Agent runs 3-Example Rule, discovers mismatch, flags to user

- **E2 — Plan is fundamentally wrong mid-execution**
  - Test: Agent discovers during execution that the plan's approach won't work
  - Expected red: `assert_compliance` for stop-and-report fails — agent continues anyway
  - Expected green: Agent STOPS, reports to user with explanation, waits for approval

- **E3 — Task completion report missing RED evidence**
  - Test: Subagent reports "done, tests pass" without showing red→green progression
  - Expected red: `assert_compliance` for evidence requirement fails — agent accepts
  - Expected green: Agent rejects report, requires RED + GREEN evidence (test failed first, then passed)

- **E4 — Session resumed with partial completion**
  - Test: state.yml shows tasks 1-3 complete, task 4 in-progress
  - Expected red: `assert_compliance` for resume behavior fails — agent starts from task 1
  - Expected green: Agent reads state.yml, skips completed tasks, resumes from task 4

## Files

- Create: `tests/pressure-tests/writing-plans/test-p1-skip-plan.sh`
- Create: `tests/pressure-tests/writing-plans/test-p2-no-worktree.sh`
- Create: `tests/pressure-tests/writing-plans/test-p3-missing-test-expectations.sh`
- Create: `tests/pressure-tests/executing-plans/test-e1-stale-path.sh`
- Create: `tests/pressure-tests/executing-plans/test-e2-wrong-plan.sh`
- Create: `tests/pressure-tests/executing-plans/test-e3-missing-evidence.sh`
- Create: `tests/pressure-tests/executing-plans/test-e4-cold-resume.sh`

## Implementation Notes

**Writing-plans test setup:**
- P1: Create a project with NO `.superpowers/state.yml` (or one without `design.approved`). Prompt should be "I know what to build, let's write the plan and start coding."
- P2: Create `.superpowers/state.yml` with `design.approved: true` but NO `worktree.main.path`. Agent should detect the missing worktree.
- P3: This tests plan writing quality. Prompt: "Write a plan for adding user authentication." Check that every task in the output includes test expectations with red/green.

**Executing-plans test setup:**
- E1: Create a plan referencing `src/utils/parser.ts`. Don't create that file. Agent should discover the mismatch.
- E2: Create a plan that instructs building a REST API, but the project is actually a CLI tool (conflicting architecture). Agent should notice and stop.
- E3: Create a plan with tasks, simulate a subagent completing one without red→green evidence. Check that agent rejects.
- E4: Create `.superpowers/state.yml` with partial task completion. Agent should skip to the first incomplete task.

**Assertion patterns for writing-plans:**
- P1/P2: Check for "precondition", "missing", "stop", "cannot proceed" language
- P3: Check that response contains "Expected red" or "red failure" in task descriptions

**Assertion patterns for executing-plans:**
- E1: Check for "not found", "doesn't exist", "mismatch" language
- E2: Check for "stop", "report", "user", "approval" language
- E3: Check for "evidence", "red", "green", "reject" language
- E4: Check for "skip", "resume", "task 4" or "completed" language

## Commit

`test: add pressure tests for writing-plans (P1-P3) and executing-plans (E1-E4)`
