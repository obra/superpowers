# Writing-Plans Clarification Phase Test

## Purpose

Verify that the writing-plans skill asks clarifying questions when given an ambiguous request, rather than proceeding directly to context gathering.

## Pressure Scenario

### Input (Ambiguous Request)

```
/write-plan

Make the search feature better.
```

### Expected Behavior WITH Clarification Phase

1. Agent announces: "I'm using the writing-plans skill. Starting with request clarification..."
2. Agent does shallow codebase exploration (glob for project structure)
3. Agent detects ambiguity: "better" is vague, no scope defined, no success criteria
4. Agent uses AskUserQuestion to ask about:
   - Goal type (performance? UX? reliability?)
   - Scope (which search feature? what aspects?)
5. After user answers, agent writes `docs/handoffs/context-clarification.md`
6. Agent proceeds to Phase 1 with clarified focus

### Failure Indicators

- Agent skips directly to "Starting context gathering..."
- Agent dispatches codebase exploration subagents without asking questions
- Agent asks generic questions not grounded in codebase context
- Agent proceeds with assumptions instead of asking

## Baseline Comparison

Run this test BEFORE adding clarification phase to establish baseline behavior. The current skill likely proceeds directly to context gathering.

## Success Criteria

- [ ] Agent pauses for clarification on ambiguous request
- [ ] Questions are specific and context-aware
- [ ] Clarification summary written before Phase 1
- [ ] Phase 1 exploration targets informed by clarification
