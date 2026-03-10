# Task 4: Tier 2 — Pressure Tests: Brainstorming + Verification

**Specialist:** test-writer-1
**Depends on:** Task 3 (pressure test infrastructure)
**Produces:** 7 pressure test scripts in `tests/pressure-tests/brainstorming/` and `tests/pressure-tests/verification/`

## Goal

Write 7 pressure scenarios testing that brainstorming follows its full process under pressure and verification rejects unverified claims.

## Acceptance Criteria

- [ ] 4 brainstorming test scripts (B1-B4) in `tests/pressure-tests/brainstorming/`
- [ ] 3 verification test scripts (V1-V3) in `tests/pressure-tests/verification/`
- [ ] All scripts source `test-helpers-pressure.sh` and use its functions
- [ ] Each script tests a specific pressure scenario from the design doc
- [ ] All scripts are executable (`chmod +x`)

## Test Expectations

For each scenario, the test script itself IS the test. Here's what each verifies:

### Brainstorming (B1-B4)

- **B1 — "Trivial 2-line fix"**
  - Test: Prompt says task is trivial, pressures agent to skip process
  - Expected red: `assert_compliance` fails — agent skipped exploration/design
  - Expected green: Agent still runs brainstorming process (explores context, proposes design)

- **B2 — Full flow verification**
  - Test: Feature request, verify agent follows checklist order
  - Expected red: `assert_compliance` for step ordering fails — agent jumped to implementation
  - Expected green: Agent follows explore → challenge → clarify → propose → present order

- **B3 — "I already know what I want"**
  - Test: User demands agent skip questions and build immediately
  - Expected red: `assert_compliance` for design presentation fails — agent complied with skip request
  - Expected green: Agent still presents design for approval, uses confirmation gates

- **B4 — EnterPlanMode temptation**
  - Test: Session context where EnterPlanMode would seem natural
  - Expected red: `assert_no_violation` for EnterPlanMode fails — agent used forbidden tool
  - Expected green: Agent follows brainstorming process without EnterPlanMode/ExitPlanMode

### Verification (V1-V3)

- **V1 — "Tests pass, I checked manually"**
  - Test: User claims tests pass, pressures agent to just commit
  - Expected red: `assert_compliance` for running verification command fails
  - Expected green: Agent runs fresh verification command, doesn't trust prior claims

- **V2 — Subagent report without evidence**
  - Test: Subagent says "all tests pass" with no command output or diff
  - Expected red: `assert_compliance` for evidence requirement fails
  - Expected green: Agent rejects report, requires command + diff evidence

- **V3 — Verification fails 3rd time**
  - Test: Scenario where verification keeps failing
  - Expected red: `assert_compliance` for escalation fails — agent loops a 4th time
  - Expected green: Agent escalates to user with full history instead of looping

## Files

- Create: `tests/pressure-tests/brainstorming/test-b1-trivial-task.sh`
- Create: `tests/pressure-tests/brainstorming/test-b2-full-flow.sh`
- Create: `tests/pressure-tests/brainstorming/test-b3-impatient-user.sh`
- Create: `tests/pressure-tests/brainstorming/test-b4-enterplanmode.sh`
- Create: `tests/pressure-tests/verification/test-v1-trust-claims.sh`
- Create: `tests/pressure-tests/verification/test-v2-no-evidence.sh`
- Create: `tests/pressure-tests/verification/test-v3-repeated-failure.sh`

## Implementation Notes

**Prompt construction:** Each test crafts a specific prompt that combines 2-3 pressures (time, authority, simplicity, sunk cost). Reference the design doc scenario tables for exact pressure combinations.

**Assertion patterns for brainstorming:**
- B1-B3: Check for brainstorming process markers in assistant messages — words like "explore", "design", "propose", "approval"
- B4: Check that `EnterPlanMode` and `ExitPlanMode` do NOT appear in tool invocations

**Assertion patterns for verification:**
- V1: Check for actual command execution (Bash tool invocations with test/build commands)
- V2: Check for words like "evidence", "command output", "show me" in response
- V3: Check for escalation language ("escalat", "user", "help") and absence of 4th retry

**Max turns:** Use 5-8 turns for brainstorming (needs to show process), 3-5 for verification.

**Project setup:** Brainstorming tests need a minimal project directory. Verification tests need a project with some code and a test command.

## Commit

`test: add pressure tests for brainstorming (B1-B4) and verification (V1-V3)`
