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

## Baseline Results (RED Phase)

**Note:** This is a retrospective baseline documented after implementation, based on the skill's behavior before clarification phase was added (commit e284a86 and earlier).

### Original Skill Behavior (Without Clarification Phase)

**Announcement:**
```
I'm using the writing-plans skill. Starting with extensive context gathering across three phases: codebase exploration, documentation review, and best practices research.
```

**Behavior with "Make the search feature better" request:**

1. **No clarification phase** - Agent would proceed directly from announcement to Phase 1
2. **No AskUserQuestion calls** - Agent would make assumptions about what "better" means
3. **Immediate context gathering** - Would dispatch codebase exploration subagents without clarifying scope
4. **Assumption-based approach** - Would likely explore all aspects of search (performance, UX, reliability) without knowing user's priority
5. **No clarification handoff** - No `docs/handoffs/context-clarification.md` file created

### Problems Identified

- Agent proceeds on ambiguous requirements without validation
- Risk of comprehensive but unfocused exploration
- Wasted effort exploring aspects user doesn't care about
- Plan may address wrong goals or miss critical requirements
- No opportunity for user to correct misunderstandings early

### Expected Improvement After Changes

After adding Phase 0 (Request Clarification), agent should:
1. Pause after announcement to analyze request clarity
2. Perform shallow codebase exploration to ground questions
3. Ask specific questions about goals, scope, and success criteria
4. Document clarification before proceeding to deep exploration
5. Focus Phase 1-3 on clarified requirements

## Baseline Comparison

Run this test BEFORE adding clarification phase to establish baseline behavior. The current skill likely proceeds directly to context gathering.

## Success Criteria

- [ ] Agent pauses for clarification on ambiguous request
- [ ] Questions are specific and context-aware
- [ ] Clarification summary written before Phase 1
- [ ] Phase 1 exploration targets informed by clarification
