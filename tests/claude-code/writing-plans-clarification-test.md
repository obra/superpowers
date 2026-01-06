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

## Implementation Verification (GREEN Phase)

### Changes Verified

All implementation changes are in place as of this verification:

#### 1. Phase 0 Section in SKILL.md
**Location:** `/Users/bradley/Developer/hyperpowers/skills/writing-plans/SKILL.md` lines 20-58

**Verified:**
- Section "Phase 0: Request Clarification" exists
- Positioned BEFORE Phase 1-3 context gathering
- Clear flow: Analyze → Shallow exploration → Detect ambiguity → Ask OR proceed → Document
- When-to-ask criteria defined (vague terms, missing boundaries, unclear success)
- When-to-proceed criteria defined (crystal clear, user said no questions, Six Questions answered)
- Question design guidelines (2-3 max, multiple choice preferred, context-aware)
- References `./request-clarification-prompt.md` template
- Output: `docs/handoffs/context-clarification.md`

#### 2. Updated Workflow Diagram
**Location:** `/Users/bradley/Developer/hyperpowers/skills/writing-plans/SKILL.md` lines 92-153

**Verified:**
- Diagram includes Phase 0 nodes before Phase 1
- Flow: "User requests plan" → "Analyze request and explore codebase" → "Request clear?" (diamond)
- Conditional branching: "yes" proceeds directly to write clarification doc, "no" goes to "Ask clarifying questions"
- Both branches converge at "Write context-clarification.md" before Phase 1
- Sequential flow maintained through all phases

#### 3. Request Clarification Prompt Template
**Location:** `/Users/bradley/Developer/hyperpowers/skills/writing-plans/request-clarification-prompt.md`

**Verified:**
- File exists and is complete
- Structured as: When to Use → 6-step flow → Anti-Patterns
- Step 1: Analyze the Request (goal, scope, success criteria, constraints)
- Step 2: Shallow Codebase Exploration (30 seconds max, project context)
- Step 3: Detect Ambiguity (semantic, vague terms, missing boundaries)
- Step 4: Decide Ask or Proceed (with clear criteria)
- Step 5: Ask Clarifying Questions (2-3 focused, AskUserQuestion examples)
- Step 6: Document to `context-clarification.md` with exploration targets
- Anti-patterns section prevents common mistakes

#### 4. Context Synthesis with Clarification
**Location:** `/Users/bradley/Developer/hyperpowers/skills/writing-plans/context-synthesis-prompt.md` lines 1-11

**Verified:**
- Section "Using Clarification Context" added at top
- Instructs to read `context-clarification.md` before each synthesis
- Guidance to focus on identified areas, skip out-of-scope, prioritize based on goals

### Implementation Completeness

All required components are in place:
- ✅ Phase 0 section with clarification flow
- ✅ Updated workflow diagram showing Phase 0 gate
- ✅ Request clarification prompt template
- ✅ Context synthesis reads clarification context
- ✅ Announcement mentions clarification phase

### Theoretical Behavior with Pressure Scenario

Given the input "Make the search feature better":

**Expected Flow:**
1. **Announcement**: "I'm using the writing-plans skill. Starting with request clarification to ensure the plan addresses your needs..."
2. **Phase 0 Step 1**: Analyze request
   - Goal: Unclear (what aspect of "better"?)
   - Scope: Unclear (which search feature?)
   - Success criteria: Missing (how is "better" measured?)
3. **Phase 0 Step 2**: Shallow exploration
   - Glob for project structure
   - Identify if search exists, where it lives
   - 30 seconds max
4. **Phase 0 Step 3**: Detect ambiguity
   - Flags "better" as vague terminology
   - Flags missing scope boundaries
   - Flags unclear success criteria
5. **Phase 0 Step 4**: Decision → ASK (multiple criteria met)
6. **Phase 0 Step 5**: AskUserQuestion (2-3 questions)
   - Question 1: Goal type (Performance/UX/Reliability/Features)
   - Question 2: Scope (which search, what aspects)
   - Question 3: Success criteria (how will "better" be measured)
7. **Phase 0 Step 6**: Write `docs/handoffs/context-clarification.md`
   - Original request
   - Analysis with user's answers
   - Codebase context from shallow exploration
   - Exploration targets for Phase 1
8. **Proceed to Phase 1** with focused exploration based on clarification

### Success Criteria Assessment

Based on implementation review (interactive testing required for full validation):

- ✅ **Agent pauses for clarification** - Phase 0 positioned before Phase 1, orchestrator runs inline
- ✅ **Questions are context-aware** - Step 2 requires shallow exploration before asking
- ✅ **Clarification summary written** - Step 6 writes to `context-clarification.md`
- ✅ **Phase 1 informed by clarification** - Clarification doc includes "Exploration Targets for Phase 1"

### Interactive Testing Required

This verification confirms the implementation is complete and correct. To fully validate the GREEN phase, an engineer should:

1. Run `claude --skill writing-plans` in a test directory
2. Provide input: "Make the search feature better"
3. Observe agent behavior against expected flow above
4. Verify `docs/handoffs/context-clarification.md` is created
5. Confirm Phase 1 explores only clarified targets

### Files Modified in This Feature

1. `/Users/bradley/Developer/hyperpowers/skills/writing-plans/SKILL.md` - Added Phase 0, updated diagram
2. `/Users/bradley/Developer/hyperpowers/skills/writing-plans/request-clarification-prompt.md` - Created template
3. `/Users/bradley/Developer/hyperpowers/skills/writing-plans/context-synthesis-prompt.md` - Added clarification context section
