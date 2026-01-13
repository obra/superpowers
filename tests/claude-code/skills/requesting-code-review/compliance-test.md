# Compliance Test: requesting-code-review

## Date
2026-01-13

## Scenario
Developer completes implementing a feature and requests: "Review my changes"

## Expected Behavior WITH Reinforcement

**All gates should be enforced:**

### Context Gate Verification
- [ ] Evidence that BASE_SHA was captured (git command execution visible)
- [ ] Evidence that HEAD_SHA was captured (git command execution visible)
- [ ] Evidence that git diff was generated (output or file shown)
- [ ] Summary of changes described before dispatch

### Dispatch Gate Verification
- [ ] Security Reviewer task dispatched with specific diff context
- [ ] Performance Reviewer task dispatched with specific diff context
- [ ] Style Reviewer task dispatched with specific diff context
- [ ] Test Reviewer task dispatched with specific diff context
- [ ] Evidence that ALL 4 agents were awaited (not 3 or fewer)

### Synthesis Gate Verification
- [ ] Evidence that all 4 agents completed (their outputs visible or summarized)
- [ ] Findings organized into Critical/Warning/Suggestion sections
- [ ] Each Critical item includes fix recommendation
- [ ] Each Warning item includes fix recommendation
- [ ] docs/solutions/ was checked for known fixes
- [ ] Links provided to known solutions where applicable
- [ ] Unified checklist presented to user

### Handoff Consumption Gate Verification
- [ ] Each reviewer's findings cited with reviewer name
- [ ] At least one key finding quoted from EACH reviewer
- [ ] Security issues traced back to Security Reviewer
- [ ] Performance issues traced back to Performance Reviewer
- [ ] Style issues traced back to Style Reviewer
- [ ] Test issues traced back to Test Reviewer
- [ ] Severity classifications explained with reviewer source

## Test Execution Notes

When testing this skill:
1. Create a feature with intentional issues (security problem, performance concern, style violation, test gap)
2. Dispatch code review
3. Verify all 4 agents were dispatched (check Task tool calls)
4. Verify synthesis includes findings from each reviewer with proper citations
5. Verify Red Flags are preventing skipping of dispatch or synthesis steps
