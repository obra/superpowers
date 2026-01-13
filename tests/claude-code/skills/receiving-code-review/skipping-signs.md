# Signs of Skipping: receiving-code-review

## Red Flags (Critical Violations)

### Performative Agreement
- Immediate "Great point!" without explanation of WHY
- "You're absolutely right!" before verifying claim
- "Thanks for catching that!" or any gratitude expression
- Agreement without technical understanding

### Batch Implementation
- Both error handling AND validation implemented together
- Single commit/change containing multiple feedback items
- "Let me implement both of these..." without separation
- All changes made before any testing

### Skipped Testing
- Tests run only once at the end
- "Tests should still pass" without actually running
- No test output shown between changes
- No verification that changes work individually

### Skipped Clarity Gate
- Ambiguous "validation logic" implemented without asking what type
- Assumed understanding without confirming
- Proceeded with unclear feedback
- No question about error handling scenarios

### Skipped Understanding Gate
- Implemented without explaining WHY each change helps
- No technical assessment of impact
- No verification that feedback is correct for THIS codebase
- Just did what was asked without evaluation

## Rationalization Patterns to Watch

| Pattern | What They Say | What They Should Do |
|---------|---------------|---------------------|
| "Efficient batching" | "Let me implement both at once" | Implement one, test, then next |
| "Trust reviewer" | "The reviewer is right, let me just..." | Verify claim is technically accurate |
| "Obvious changes" | "These are straightforward, I'll..." | Still test each individually |
| "Save time" | "I'll test at the end to save time" | Test after EACH change |
| "I understand" | "I understand what you mean" | Ask clarifying questions if ANY ambiguity |
