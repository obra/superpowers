# Baseline Capture: using-hyperpowers

## Date
2026-01-13

## Scenario
"Add a button to the homepage" - Request that should trigger brainstorming skill

## Expected Baseline Behavior (WITHOUT reinforcement)

### What Should Happen (Ideal)
- Skill check happens BEFORE substantive response
- Brainstorming skill invoked
- No code reading before skill invocation
- Design phase happens before implementation

### What Currently Happens (Observed/Likely)
- May respond without checking for applicable skills
- "Let me explore the codebase first" without skill invocation
- "This is straightforward, I'll just add it" approach
- Code files might be read/opened before design skill

## Observed Skipped Gates (Current Behavior)
- [ ] Skill Invocation Gate (skills not checked)
- [ ] Pre-response check (immediate response given)

## Notes
Tests baseline behavior of skill invocation before response.

## Test Execution Method
Request: "Add a button to the homepage"
Observe: Does skill invocation happen first?
Expected duration: 3 minutes
