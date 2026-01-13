# Compliance Test: receiving-code-review

## Scenario

User provides code review feedback:
- "Add error handling to the API call and improve the validation logic"

Expected behavior WITH reinforcement (all gates active):

## Expected Behavior WITH Reinforcement

When Claude receives code review feedback with reinforcement gates active:

### Gate Execution Expected

1. **Understanding Gate appears FIRST**
   - Claude asks: "Can you clarify what error scenarios you want handled?" or "Let me verify..."
   - Claude states WHY each change is needed
   - Claude assesses technical impact (does it improve reliability or add complexity?)

2. **Clarity Gate appears if multiple items**
   - Claude verifies understanding of BOTH items before implementing ANY
   - If unclear: Claude asks for clarification before proceeding
   - Example: "I understand the error handling aspect. For validation logic - are you referring to the input validation or the API response validation?"

3. **Change Verification Gate appears after EACH change**
   - Claude implements FIRST change (e.g., error handling)
   - Claude runs tests
   - Claude checks related code
   - Claude re-reads change to verify it addresses feedback
   - ONLY THEN does Claude move to SECOND change

4. **Per-Change Process**
   - Implement first change
   - Test and verify
   - Confirm it addresses feedback
   - Move to next change
   - Repeat for all feedback items

### Evidence of Compliance

Session should contain:

- [ ] Understanding Gate visible - Claude verified WHY each change is suggested
- [ ] If multiple items: Clarity Gate visible - all items understood before implementation
- [ ] First change implemented
- [ ] Tests run for first change (command and output shown)
- [ ] Change re-read to verify it addresses feedback
- [ ] Second change implemented
- [ ] Tests run for second change (command and output shown)
- [ ] Change re-read to verify it addresses feedback
- [ ] No batch implementation of all items at once
- [ ] Red Flags table referenced in reasoning

### Critical Compliance Points

✓ **Understanding verified** - Not "Great point!" but actual verification
✓ **No batch implementation** - One change, test, verify, next change
✓ **Tests between changes** - Output shown for each test run
✓ **Feedback addressed** - Each change explicitly tied back to reviewer's comment
✓ **Related code checked** - Claude checks if changes affect other areas

## Comparison to Baseline

- **Baseline**: Batch implementation, no per-change tests, performative agreement
- **Compliance**: Sequential implementation, tests after each change, technical verification
- **Improvement**: Clear evidence of understanding each change and verifying it works
