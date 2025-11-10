# Superpowers Core Workflows (Free Mode)

> **Note:** This is a condensed version for Claude Desktop free users. Pro users should use the full skills library in Projects. [Learn more](../README.md)

## Quick Reference

- **Implementing features/bugfixes** → Test-Driven Development (Section 1)
- **Debugging issues** → Systematic Debugging (Section 2)
- **Designing features** → Brainstorming (Section 3)

---

## 1. Test-Driven Development (TDD)

### The Iron Law
**NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST**

### RED-GREEN-REFACTOR Cycle

1. **RED** - Write one minimal test
   - Test ONE behavior
   - Clear name describing what should happen
   - Use real code, not mocks

2. **Verify RED** - Watch it fail
   - Run test, confirm it fails correctly
   - Failure because feature missing, not typos
   - **MANDATORY:** Never skip this step

3. **GREEN** - Write minimal code
   - Simplest code to pass the test
   - No extra features
   - No "while I'm here" improvements

4. **Verify GREEN** - Watch it pass
   - Run test, confirm it passes
   - All other tests still pass
   - **MANDATORY:** Never skip this step

5. **REFACTOR** - Clean up
   - Remove duplication
   - Improve names
   - Keep tests green

6. **Repeat** - Next test for next feature

### Red Flags (DELETE CODE AND START OVER)

- Code before test
- Test passes immediately
- "I'll test after"
- "Already manually tested"
- "Tests after achieve same goals"
- "Keep as reference"
- "This is simple"

### Example

```typescript
// RED: Write failing test
test('retries failed operations 3 times', async () => {
  let attempts = 0;
  const operation = () => {
    attempts++;
    if (attempts < 3) throw new Error('fail');
    return 'success';
  };

  const result = await retryOperation(operation);

  expect(result).toBe('success');
  expect(attempts).toBe(3);
});

// Verify RED: Run test → FAIL

// GREEN: Write minimal implementation
async function retryOperation<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; i < 3; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === 2) throw e;
    }
  }
  throw new Error('unreachable');
}

// Verify GREEN: Run test → PASS
```

---

## 2. Systematic Debugging

### The Iron Law
**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST**

### 4-Phase Process (Complete Each Before Next)

#### Phase 1: Root Cause Investigation

1. **Read Error Messages Carefully**
   - Don't skip past errors
   - Read complete stack traces
   - Note line numbers, file paths

2. **Reproduce Consistently**
   - Can you trigger it reliably?
   - Exact steps to reproduce?
   - If not reproducible → gather more data

3. **Check Recent Changes**
   - What changed that could cause this?
   - Git diff, recent commits
   - New dependencies, config changes

4. **Gather Evidence** (Multi-component systems)
   - Add logging at each component boundary
   - Log what enters, what exits
   - Run once to see WHERE it breaks

5. **Trace Data Flow**
   - Where does bad value originate?
   - What called this with bad value?
   - Trace backward to source
   - Fix at source, not symptom

#### Phase 2: Pattern Analysis

1. **Find Working Examples**
   - Locate similar working code
   - What works that's similar?

2. **Compare Against References**
   - Read reference implementation COMPLETELY
   - Don't skim - understand fully

3. **Identify Differences**
   - What's different between working and broken?
   - List every difference

4. **Understand Dependencies**
   - What does this need?
   - Settings, config, environment?

#### Phase 3: Hypothesis and Testing

1. **Form Single Hypothesis**
   - "I think X is the root cause because Y"
   - Be specific, write it down

2. **Test Minimally**
   - SMALLEST possible change
   - One variable at a time

3. **Verify Before Continuing**
   - Worked? → Phase 4
   - Didn't work? → New hypothesis
   - Don't add more fixes on top

#### Phase 4: Implementation

1. **Create Failing Test Case**
   - Simplest possible reproduction
   - MUST have before fixing
   - Use TDD cycle above

2. **Implement Single Fix**
   - Address root cause
   - ONE change at a time

3. **Verify Fix**
   - Test passes?
   - No other tests broken?

4. **If 3+ Fixes Failed**
   - STOP
   - Question the architecture
   - Discuss with team before continuing

### Red Flags (STOP, RETURN TO PHASE 1)

- "Quick fix for now"
- "Just try changing X"
- "Add multiple changes"
- "Skip the test"
- "It's probably X"
- "I don't fully understand"
- "One more fix" (after 2+ failures)

---

## 3. Brainstorming

### Overview
Turn rough ideas into fully-formed designs through collaborative questioning.

### Process

**Understanding the Idea:**
1. Check current project state (files, docs, commits)
2. Ask questions ONE at a time
3. Prefer multiple choice when possible
4. Focus on: purpose, constraints, success criteria

**Exploring Approaches:**
1. Propose 2-3 different approaches with trade-offs
2. Lead with your recommended option and why

**Presenting Design:**
1. Once you understand, present the design
2. Break into sections of 200-300 words
3. Ask after each section: "Does this look right so far?"
4. Cover: architecture, components, data flow, error handling, testing

**After Design:**
1. Write to `docs/plans/YYYY-MM-DD-<topic>-design.md`
2. Commit to git
3. If continuing: Create implementation plan

### Key Principles

- **One question at a time** - Don't overwhelm
- **YAGNI ruthlessly** - Remove unnecessary features
- **Explore alternatives** - 2-3 approaches before settling
- **Incremental validation** - Present sections, validate each

---

## Workflow Integration

### Starting Any Task

1. **Check for relevant workflow above**
2. **Announce you're using it**
   - "I'm using TDD to implement this feature"
   - "I'm using systematic debugging to find this bug"
3. **Follow it exactly**
4. **Track checklist items explicitly**

### Common Violations

| Excuse | Reality |
|--------|---------|
| "Too simple for process" | Process is fast for simple cases |
| "No time for process" | Systematic is FASTER than thrashing |
| "I'll follow spirit not letter" | Letter IS spirit - no shortcuts |
| "This is different because..." | It's not. Follow the process. |

### Checklists

**Before marking work complete:**
- [ ] All tests pass (ran them, saw green)
- [ ] No errors or warnings in output
- [ ] Followed TDD (wrote tests first, watched them fail)
- [ ] If debugging: Found root cause (not symptom fix)
- [ ] If feature: Design discussed first (brainstormed)
- [ ] Code is minimal (no YAGNI violations)
- [ ] Ready for review (would pass code review)

---

## How to Use This Document

**Every conversation:**
1. Upload this file to conversation
2. Say: "Follow the core workflows in core-workflows.md"
3. Reference specific sections as needed
4. Track checklist items explicitly

**For specific tasks:**
- "Use TDD from core-workflows.md to implement X"
- "Use systematic debugging from core-workflows.md for this bug"
- "Use brainstorming from core-workflows.md to design Y"

---

## Limitations (Free Mode)

- Must upload this file each conversation
- No automatic workflow activation
- No persistent project knowledge
- Manual checklist tracking
- No enforcement mechanism

**Want automatic activation?** [Upgrade to Pro and use the full skills library](../pro-setup/SETUP.md)

---

## Summary

**Three core workflows:**
1. **TDD**: Write test first, watch fail, implement, watch pass
2. **Systematic Debugging**: Root Cause → Pattern → Hypothesis → Fix
3. **Brainstorming**: Question → Explore → Present → Validate

**All workflows share:**
- Mandatory steps (no skipping)
- Systematic process (no ad-hoc)
- Evidence-based (no guessing)
- Verification required (no assumptions)

**Remember:** If you catch yourself rationalizing ("just this once", "too simple", "spirit not letter"), STOP. That means you're about to violate the workflow.
