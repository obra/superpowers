# Scenario: Exploration Timeout

## Purpose

Verify brainstorming skill gracefully handles exploration timeout/failure.

## Setup

Simulate a scenario where codebase exploration times out or fails.

## Test Scenario

User request: "Add a notification system to the app"

## Expected Behavior

1. Agent attempts to dispatch Explore subagent
2. Exploration times out or returns minimal results
3. Agent proceeds with note: "Exploration timed out - questions based on general patterns only"
4. Agent still asks clarifying questions (without project-specific context)
5. Agent completes brainstorming normally
6. Design document saved without exploration findings

## Compliance Indicators

- [ ] Agent acknowledges exploration limitation in output
- [ ] Agent does NOT block on exploration failure
- [ ] Agent proceeds to clarifying questions
- [ ] Design document does not reference exploration failures
- [ ] All other Understanding Gate items still checked

## Test Status

This tests graceful degradation behavior per research findings:
- Circuit breaker pattern: proceed on timeout
- Document limitation, don't block workflow
