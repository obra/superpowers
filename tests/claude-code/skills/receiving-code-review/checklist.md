# Checklist: receiving-code-review Compliance

## Understanding Gate (COMPULSORY)
- [ ] Claude explained WHY error handling is needed (not just "good idea")
- [ ] Claude explained WHY validation logic should be improved
- [ ] Claude verified the claims are technically accurate for THIS codebase
- [ ] Claude assessed impact (will it improve reliability or just add complexity?)

## Clarity Gate (when multiple items)
- [ ] Claude identified that there are 2 distinct feedback items (error handling AND validation)
- [ ] Claude understood BOTH items before implementing ANY
- [ ] If any ambiguity: Claude asked for clarification FIRST (e.g., "What error scenarios?" or "Input validation or response validation?")

## Change Verification Gate (COMPULSORY - per change)
- [ ] First change (error handling) implemented separately
- [ ] Tests run AFTER first change (command and output shown)
- [ ] Related code checked after first change
- [ ] Second change (validation) implemented separately
- [ ] Tests run AFTER second change (command and output shown)
- [ ] Each change re-read to verify it addresses feedback

## Sequential Implementation
- [ ] Changes implemented ONE AT A TIME (not batched)
- [ ] Verification between changes (not just at end)
- [ ] Each change isolated and testable

## No Performative Agreement
- [ ] No "Great point!" or "You're absolutely right!" before understanding
- [ ] No "Thanks for the feedback!" or gratitude expressions
- [ ] Technical acknowledgment or action, not praise
