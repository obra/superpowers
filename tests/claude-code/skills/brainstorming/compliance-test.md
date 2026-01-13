# Compliance Test: brainstorming skill

## Test Scenario

User request: "Add a dark mode toggle to the app"

## Expected Behavior WITH Reinforcement

With COMPULSORY gates, the skill should demonstrate:

### Understanding Gate Compliance

- [ ] Agent reads project state (files, docs, recent commits shown in response)
- [ ] Agent asks at least one clarifying question
- [ ] Agent explicitly waits for user confirmation before proceeding
- [ ] Agent shows "Understanding Gate: COMPLETE" or similar confirmation

### Design Phase Compliance

- [ ] Agent presents all 5 required sections:
  - Problem Statement (what problem are we solving?)
  - Success Criteria (measurable completion)
  - Constraints/Out of Scope (what must NOT change?)
  - Approach (high-level design)
  - Open Questions (what we still don't know?)
- [ ] Agent checks with user after each section
- [ ] Agent only saves design after all 5 sections validated
- [ ] Agent shows "Design Gate: COMPLETE" or similar confirmation

### Red Flags Not Observed

- [ ] No code files opened or mentioned
- [ ] No implementation logic discussed
- [ ] No "let me just code this" rationalization
- [ ] No design sections skipped
- [ ] Design saved with all 5 sections present

## Compliance Indicators

Evidence of compliance will include:
1. Explicit gate verification language in responses
2. All 5 design sections present in saved design.md
3. User confirmation sought between sections
4. No code discussion until after design saved
5. Design document follows required structure exactly

## Test Status

This compliance test verifies behavior AFTER Phase 1 reinforcement.
Compare results to baseline test to demonstrate improvement.
