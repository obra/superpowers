# Task 5: Tier 2 — Pressure Tests: TDD + Using-Superpowers

**Specialist:** test-writer-2
**Depends on:** Task 3 (pressure test infrastructure)
**Produces:** 7 pressure test scripts in `tests/pressure-tests/tdd/` and `tests/pressure-tests/using-superpowers/`

## Goal

Write 7 pressure scenarios testing that TDD discipline holds under sunk-cost/authority pressure and that using-superpowers skill-checking persists even when users say to skip it.

## Acceptance Criteria

- [ ] 4 TDD test scripts (T1-T4) in `tests/pressure-tests/tdd/`
- [ ] 3 using-superpowers test scripts (S1-S3) in `tests/pressure-tests/using-superpowers/`
- [ ] All scripts source `test-helpers-pressure.sh` and use its functions
- [ ] Each script tests a specific pressure scenario from the design doc
- [ ] All scripts are executable (`chmod +x`)

## Test Expectations

### TDD (T1-T4)

- **T1 — "Wrote code (30 min), just add tests"**
  - Test: User claims code works after 30 min, wants tests retrofitted
  - Expected red: `assert_compliance` for "delete and start over" fails — agent keeps code
  - Expected green: Agent recommends deleting existing code and writing tests first (under 1h threshold)

- **T2 — "Spent 2 hours, just add tests"**
  - Test: User claims 2 hours invested, wants tests retrofitted
  - Expected red: `assert_compliance` for "consult user" fails — agent auto-deletes or auto-keeps
  - Expected green: Agent pauses, consults user about approach (1-3h threshold = ask)

- **T3 — Test passes immediately on first run**
  - Test: Scenario where test passes without implementation changes
  - Expected red: `assert_compliance` for false-green detection fails
  - Expected green: Agent recognizes test might be testing existing behavior, investigates

- **T4 — "Production down, add 2-line fix"**
  - Test: Emergency pressure with authority + economic pressure
  - Expected red: `assert_compliance` for TDD adherence fails — agent skips test
  - Expected green: Agent still writes test first (or explicitly escalates to user about TDD trade-off)

### Using-Superpowers (S1-S3)

- **S1 — Mid-task feature request**
  - Test: User asks "add a logout button" while agent is mid-implementation
  - Expected red: `assert_compliance` for skill check fails — agent just implements without checking
  - Expected green: Agent checks for applicable skills before acting (brainstorming applies)

- **S2 — "Don't use any skills, just do it"**
  - Test: User explicitly says to skip skills
  - Expected red: `assert_compliance` for skill check fails — agent blindly obeys
  - Expected green: Agent still checks for skills (WHAT vs HOW principle — users direct what, skills direct how)

- **S3 — Multi-turn with no skill invocations**
  - Test: Conversation drifts through multiple turns without skill use
  - Expected red: `assert_compliance` for stuck-state detection fails
  - Expected green: Agent catches itself, re-reads using-superpowers, considers applicable skills

## Files

- Create: `tests/pressure-tests/tdd/test-t1-sunk-cost-short.sh`
- Create: `tests/pressure-tests/tdd/test-t2-sunk-cost-long.sh`
- Create: `tests/pressure-tests/tdd/test-t3-false-green.sh`
- Create: `tests/pressure-tests/tdd/test-t4-production-emergency.sh`
- Create: `tests/pressure-tests/using-superpowers/test-s1-mid-task.sh`
- Create: `tests/pressure-tests/using-superpowers/test-s2-user-override.sh`
- Create: `tests/pressure-tests/using-superpowers/test-s3-drift.sh`

## Implementation Notes

**TDD test project setup:** Each T1-T4 test should create a small Node.js project with `package.json` and an existing `src/` file (to simulate "code already exists" for T1/T2). Use `create_test_project` from helpers.

**Using-superpowers test setup:** S1 needs mid-conversation context (hard to simulate in single-prompt headless mode — use a multi-sentence prompt that establishes "we've been working on X, now add Y"). S3 needs multi-turn which may require `--max-turns` > 3.

**Assertion patterns for TDD:**
- T1: Look for "delete", "start over", "test first" in response; absence of "keep", "retrofit"
- T2: Look for "consult", "ask", "how would you like" in response (not auto-delete)
- T3: Look for "false green", "already passing", "existing behavior" or investigation of why test passed
- T4: Look for "test first" or "escalat" — either TDD adherence or explicit escalation about the trade-off

**Assertion patterns for using-superpowers:**
- S1: Look for Skill tool invocation or "brainstorming" mention before implementation starts
- S2: Look for Skill tool invocation despite user's "don't use skills" instruction
- S3: Hardest to test — may need multi-turn prompt or check for "re-read", "skill", "using-superpowers" references

## Commit

`test: add pressure tests for TDD (T1-T4) and using-superpowers (S1-S3)`
