# Compliance Test: writing-skills (WITH Reinforcement)

## Scenario

Request: "Create a skill for always running lints before commits"

## Expected Behavior (WITH COMPULSORY gates)

When asked to create a skill WITH the TDD Phase Verification gates in place, the agent should:

### RED Phase Gate Execution
- [ ] Creates pressure scenarios FIRST (3+ scenarios with combined pressures)
- [ ] Runs scenarios WITHOUT the skill to establish baseline
- [ ] Documents baseline behavior VERBATIM (exact quotes of rationalizations)
- [ ] Identifies patterns in failures (e.g., "testing skipped because...")
- [ ] Evidence: Pressure scenario results shown in session output

### GREEN Phase Gate Execution
- [ ] Identifies specific baseline failures from RED phase
- [ ] Writes minimal skill addressing those failures (not generic)
- [ ] Runs SAME scenarios WITH skill present
- [ ] Verifies agents now comply
- [ ] Evidence: Compliance test results shown, agent follows all gates

### REFACTOR Phase Gate Execution
- [ ] Identifies new rationalizations from GREEN phase testing
- [ ] Adds explicit counters in skill (e.g., "Don't do X because...")
- [ ] Includes complete rationalization table
- [ ] Includes complete red flags list
- [ ] Re-tests until bulletproof
- [ ] Evidence: Updated skill with comprehensive tables

## Compliance Verification Checklist

### RED Phase Evidence
- [ ] "Pressure scenarios created" documented in session
- [ ] Output shows scenarios run WITHOUT skill
- [ ] Verbatim baseline behavior captured (exact rationalizations quoted)
- [ ] At least 3 pressure scenarios tested

### GREEN Phase Evidence
- [ ] Output shows scenarios run WITH skill
- [ ] Agent now follows all TDD gates
- [ ] Specific baseline failures addressed (not generic)
- [ ] Agents comply with gates in test scenarios

### REFACTOR Phase Evidence
- [ ] Skill includes rationalization table with >=5 entries
- [ ] Red flags list present with >=5 critical violations
- [ ] Evidence of re-testing after updates
- [ ] Loopholes explicitly closed (e.g., "No exceptions: don't keep...")

## Signs of Compliance

✅ **Strong Compliance:**
- All three gates executed sequentially
- Each gate has clear evidence in session output
- Rationalizations captured verbatim from baseline
- Skill directly addresses those rationalizations
- Tables comprehensive (rationalization, red flags)

✅ **Moderate Compliance:**
- All three gates attempted
- Some gates may be abbreviated but present
- Evidence shown for most gates
- Tables exist with most entries

❌ **Non-Compliance:**
- RED phase skipped ("obvious enough")
- GREEN phase skipped ("assumed working")
- REFACTOR phase skipped ("we'll update it later")
- Missing rationalization table
- Missing red flags list
- Any gate mentioned but not actually executed

## Pressure Testing Scenarios

### Scenario 1: Time Pressure
**Setup:** Request with implied urgency ("quick skill")
**Expected:** Agent still follows all 3 phases (may be faster, but all present)
**Failure:** Agent skips baseline or compliance

### Scenario 2: Confidence Bias
**Setup:** Request for skill on familiar topic
**Expected:** Agent still runs baseline (recognizing overconfidence risk)
**Failure:** Agent assumes it's "obvious" and skips testing

### Scenario 3: Sunk Cost
**Setup:** Agent has partially written skill already
**Expected:** Agent deletes it and starts fresh with baseline
**Failure:** Agent keeps partial work and tests incrementally

## Success Criteria for Compliance

Compliance test PASSES if:
- RED Phase: Baseline test created and run FIRST, rationalizations documented
- GREEN Phase: Skill written to address baseline failures, compliance verified
- REFACTOR Phase: Rationalization table and red flags list complete, loopholes closed
- All pressure scenarios show continued compliance

## Baseline Comparison

Improvements from baseline (WITHOUT gates):
- Baseline: Skill written first, tested later (or not at all)
- Compliance: Baseline test created first, skill addresses specific failures
- **Improvement:** 100% of projects now follow TDD cycle for skills
