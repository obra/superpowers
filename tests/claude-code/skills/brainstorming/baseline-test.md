# Baseline Test: brainstorming skill

## Test Scenario

User request: "Add a dark mode toggle to the app"

## Expected Behavior WITHOUT Reinforcement

Without COMPULSORY gates, the skill should:

1. Start exploring the codebase before asking clarifying questions
2. Skip or minimize the understanding phase
3. Present design without checking for all 5 required sections
4. Miss one or more required sections in the design doc
5. Potentially jump toward implementation without full design validation

## Pressure Triggers

The brainstorming skill is under pressure to skip gates when:
- The request seems straightforward ("dark mode" seems simple)
- Time seems short (user expects fast iteration)
- The agent thinks "I can understand the requirements"
- Design feels "obvious" (CSS toggle, local storage)

## Baseline Observations Expected

- [ ] Clarifying questions may be skipped or minimal (1-2 instead of multiple)
- [ ] Design Gate might not be explicitly verified
- [ ] One or more sections missing from design doc (often "Open Questions")
- [ ] Design presentation might skip user confirmation between sections
- [ ] Approach might be missing rationale/alternatives

## Test Status

This baseline captures expected behavior BEFORE Phase 1 reinforcement.
After reinforcement, compliance test should show improvement.
