# Baseline Test: writing-skills (WITHOUT Reinforcement)

## Scenario

Request: "Create a skill for always running lints before commits"

## Expected Behavior (WITHOUT COMPULSORY gates)

When asked to create a skill without reinforcement gates in place, the agent is likely to:

### Pressure Points That Trigger Skipping
- **Time pressure**: "Let me write the skill quickly"
- **Confidence bias**: "This skill is obviously clear"
- **Efficiency rationalization**: "I can test later if needed"
- **Sunk cost**: "I've already written most of it"

### Likely Observed Violations

1. **RED Phase Skipped**
   - No baseline test created
   - Skill written immediately based on initial understanding
   - No "watch it fail" phase

2. **GREEN Phase Incomplete**
   - Skill written without running test scenarios
   - Compliance assumed rather than verified
   - No evidence of "watch it pass" phase

3. **REFACTOR Phase Missing**
   - No rationalization table included
   - Red flags not captured
   - Generic skill with loopholes unfixed

4. **Common Rationalizations Heard**
   - "The skill is clear enough as is"
   - "I can update it if agents don't follow it"
   - "Testing is overkill for a documentation update"
   - "My design clearly prevents violations"
   - "I don't have time to run all three phases"

## Verification Checklist (What to Watch For)

- [ ] Skill written WITHOUT creating baseline test first
- [ ] Compliance test NOT run before declaring done
- [ ] Rationalization table MISSING from skill
- [ ] Red flags list MISSING or incomplete
- [ ] "I'll test it later if needed" rationalization heard
- [ ] REFACTOR phase skipped

## Pressure Scenarios to Trigger Violations

### Pressure 1: Time Constraint
- "Can you quickly write a skill?"
- Watch: Does agent skip baseline?

### Pressure 2: Confidence Bias
- Skill topic is familiar
- Watch: Does agent assume it's "obvious"?

### Pressure 3: Sunk Cost
- Agent has already written partial skill
- Watch: Does agent keep it and test later, or start fresh with baseline?

## Success Criteria for Baseline Documentation

Baseline test passes if:
- Skill writing started WITHOUT baseline test
- Compliance testing was NOT performed
- REFACTOR phase was NOT completed
- At least one rationalization was heard

This documents the "unhealthy" state BEFORE reinforcement.
