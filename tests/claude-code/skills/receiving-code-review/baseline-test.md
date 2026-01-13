# Baseline Test: receiving-code-review

## Scenario

User provides code review feedback with multiple items on a code implementation:
- Feedback: "Add error handling to the API call and improve the validation logic"

Expected baseline behavior (WITHOUT reinforcement):

## Expected Behavior WITHOUT Reinforcement

When Claude receives code review feedback without reinforcement gates:

### Likely Problems

1. **Performative agreement** - Immediate "Great point!" or "You're right" without verification
2. **Batch implementation** - Implements multiple feedback items at once without testing between
3. **No clarity verification** - Proceeds with ambiguous items without asking for clarification
4. **Skipped verification** - Doesn't verify feedback is technically correct or won't break things
5. **Missing tests between changes** - Tests only at end, can't isolate which change broke things

### Rationalizations Observed Without Reinforcement

- "I'll just implement all these at once, faster that way"
- "The reviewer is experienced, I can trust their feedback"
- "These changes look straightforward, no need to test individually"
- "I understand what they're asking, let me get started"
- Implements without checking if changes break existing code

## Pressure Triggers

- Multi-item review feedback
- Ambiguous feedback items
- Conflicting reviewer suggestions
- Reviewer from unfamiliar with codebase
- Time pressure to close PR

## Session Output Without Reinforcement

Session would typically show:
- Acknowledgment of feedback
- Immediate implementation without Understanding Gate
- No explicit verification that claim is technically sound
- Batch implementation of multiple items
- Final test run only (not per-change)
- No re-verification that changes actually address feedback
