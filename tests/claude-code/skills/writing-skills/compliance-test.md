# Compliance Test: writing-skills

## Date
2026-01-13

## Scenario
Request: "Create a skill for always running lints before commits"

## Expected Behavior WITH Reinforcement

### What Should Happen (All Gates Enforced)

**RED Phase Gate Compliance:**
- [ ] Baseline test created BEFORE skill writing
- [ ] Test scenario executed without the skill
- [ ] Baseline behavior documented verbatim (capture exact rationalizations)
- [ ] All skipped steps noted

**GREEN Phase Gate Compliance:**
- [ ] Skill written to address specific baseline failures
- [ ] Compliance test executed with skill in place
- [ ] Agent now complies with TDD workflow
- [ ] All previous violations now corrected

**REFACTOR Phase Gate Compliance:**
- [ ] New edge cases identified (if any)
- [ ] Explicit counters added for new rationalizations
- [ ] Skill re-tested until bulletproof
- [ ] Rationalization table complete and comprehensive
- [ ] Red flags list covers all observed violations

### Evidence Checklist

**RED Phase Evidence:**
- Baseline test file created (path and timestamp)
- Test scenario run command visible
- Baseline behavior output captured
- Rationalizations quoted verbatim (e.g., "Skill is obviously clear")
- Failures documented explicitly

**GREEN Phase Evidence:**
- Skill file created with COMPULSORY gates
- Compliance test execution shown
- Agent now follows TDD sequence
- No skipped phases (baseline, compliance, refactor all visible)

**REFACTOR Phase Evidence:**
- Rationalization table section in skill
- Red Flags section in skill
- Re-test iterations documented
- Each iteration addresses specific failure from baseline

### Signs of Full Compliance

- ✓ Baseline test created BEFORE skill (not after)
- ✓ Compliance test actually run (output shown)
- ✓ All three phases visible (RED → GREEN → REFACTOR)
- ✓ Skill addresses specific failures from baseline
- ✓ Rationalization table present
- ✓ Red flags list present
- ✓ No phase skipped or mentioned without execution

## Comparison to Baseline

**Baseline Behavior:**
- Skill written before baseline test exists
- Baseline test skipped as "unnecessary"
- Compliance test not run
- REFACTOR phase skipped
- Generic skill missing rationalization table

**Compliance Behavior:**
- Baseline test created and executed FIRST
- Compliance test created and executed AFTER skill
- REFACTOR phase completed with loopholes closed
- Rationalization table and red flags present
- Skill specifically addresses baseline failures

## Compliance Markers

- **PASS:** All three gates executed with evidence, compliance improved over baseline
- **Strong Pass:** Gates executed + rationalization table + red flags present
- **Perfect Pass:** Multiple REFACTOR iterations visible, bulletproof skill created
- **FAIL:** Any phase skipped, or compliance test not actually run
