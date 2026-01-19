# Superpowers: Complete Skills, Agents & Subagents Guide

A comprehensive system for software development workflows including TDD, debugging, code review, planning, and collaboration patterns.

---

# PART 1: SKILLS

Skills are workflow patterns that guide how to approach specific types of work.

---

## Skill: Test-Driven Development (TDD)

**When to use:** Before writing any implementation code for features or bugfixes.

### Iron Law
**NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST**

### The Cycle: RED → GREEN → REFACTOR

**RED Phase:**
1. Write a test that describes the behavior you want
2. Run the test - watch it FAIL
3. Verify it fails for the RIGHT reason

**GREEN Phase:**
1. Write the MINIMUM code to pass the test
2. No cleverness, no optimization, no "while I'm here"
3. Run the test - watch it PASS

**REFACTOR Phase:**
1. Clean up the code (both test and implementation)
2. Remove duplication
3. Improve names
4. Run tests after each change - must stay GREEN

### Anti-Patterns to Avoid
- Writing tests after implementation
- Writing multiple tests before any implementation
- Making tests pass by hardcoding expected values
- Testing implementation details instead of behavior
- Skipping the "watch it fail" step

### Verification Checklist
- [ ] Test was written first?
- [ ] Test failed before implementation?
- [ ] Test failed for the right reason?
- [ ] Implementation is minimal?
- [ ] Refactoring kept tests green?

---

## Skill: Systematic Debugging

**When to use:** When encountering any bug, test failure, or unexpected behavior.

### Iron Law
**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST**

### 4-Phase Process

**Phase 1: Root Cause Investigation**
- Reproduce the issue consistently
- Trace backwards from the error
- Find where bad state originates
- Document the chain: Error → Symptom → Intermediate → Root Cause

**Phase 2: Pattern Analysis**
- Search for similar patterns elsewhere
- Determine if isolated or systemic
- Review recent changes
- Assess blast radius

**Phase 3: Hypothesis Testing**
- State hypothesis: "If X is root cause, then Y should be true"
- Design minimal test to prove/disprove
- Run test, gather evidence
- If hypothesis fails, return to Phase 1

**Phase 4: Implementation**
- Fix the root cause (not symptoms)
- Add regression test
- Verify fix works
- Check for side effects

### Red Flags (Stop and Reassess)
- "Let me just try..." → You don't understand the problem
- "This should fix it..." → You're guessing
- "I'll add a check here..." → You're treating symptoms
- Third failed fix attempt → Question your architecture understanding

---

## Skill: Writing Plans

**When to use:** When you have requirements for a multi-step task, before touching code.

### Plan Structure

```markdown
# Implementation Plan: {Title}

## Goal
[1-2 sentences: what we're building and why]

## Architecture
[Key components and how they interact]

## Tech Stack
[Languages, frameworks, libraries]

## Task 1: [Name]
**Goal:** [What this accomplishes]
**Files:** [exact paths and what changes]
**Steps:**
1. [Specific action with complete code]
2. [Next action]
**Test:** [How to verify]
**Expected output:** [What success looks like]

## Task 2: [Name]
...
```

### Principles
- **Bite-sized tasks:** 2-5 minutes each
- **Complete code:** No placeholders or "implement logic here"
- **Exact paths:** Full file paths, not relative
- **TDD:** Test first in each task
- **YAGNI:** Only what's needed, nothing extra

---

## Skill: Verification Before Completion

**When to use:** Before claiming any work is complete, fixed, or passing.

### Iron Law
**NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE**

### Gate Function
1. **IDENTIFY** - What verification is needed?
2. **RUN** - Execute the verification (tests, build, manual check)
3. **READ** - Actually read the output
4. **VERIFY** - Does output confirm success?
5. **CLAIM** - Only now claim completion

### Common Failures
| Claim | What's Actually Required |
|-------|-------------------------|
| "Tests pass" | Run tests, show output, all green |
| "Bug is fixed" | Reproduce original bug, show it's gone |
| "Feature works" | Demo the feature, show expected behavior |
| "Build succeeds" | Run build, show no errors |

### Red Flags
- "Should work now" without running anything
- "I updated the code" without testing
- "That should fix it" without verification

---

## Skill: Brainstorming

**When to use:** Before any creative work - creating features, building components, adding functionality.

### Process

**Phase 1: Understanding**
- Ask questions ONE AT A TIME
- Prefer multiple choice when possible
- Focus on: purpose, constraints, success criteria, edge cases

**Phase 2: Exploring Approaches**
- Propose 2-3 different approaches
- Include trade-offs for each
- Lead with your recommendation
- Explain reasoning

**Phase 3: Presenting Design**
- Break into sections (200-300 words each)
- Ask for validation after each section
- Be ready to backtrack

**Phase 4: Documentation**
- Write design document
- Include all decisions and rationale
- Suggest next steps

### Key Principles
- One question at a time (don't overwhelm)
- YAGNI ruthlessly
- Always explore alternatives
- Incremental validation

---

## Skill: Code Review (Receiving)

**When to use:** When receiving code review feedback, before implementing suggestions.

### Response Pattern
**READ → UNDERSTAND → VERIFY → EVALUATE → RESPOND → IMPLEMENT**

### Forbidden Responses
- "You're absolutely right!"
- "Great catch!"
- "Of course, I should have..."

These are performative, not technical.

### Proper Response
1. Read the feedback completely
2. Understand what they're asking
3. Verify if the issue exists (check the code)
4. Evaluate if the suggestion is correct
5. Respond with technical assessment
6. Implement only if you agree it's an improvement

### When Feedback is Unclear
STOP before implementing. Ask for clarification.

---

## Skill: Using Git Worktrees

**When to use:** Starting feature work that needs isolation from current workspace.

### Setup Process
1. **Find worktree directory** (check for `.worktrees/` or ask)
2. **Verify directory is git-ignored**
3. **Create worktree:** `git worktree add <path> -b <branch>`
4. **Setup project:** Install dependencies, verify tests pass
5. **Work in isolation:** Changes don't affect main workspace

### Benefits
- Parallel work on multiple features
- Clean separation of concerns
- Easy to discard failed experiments
- No stashing required

---

## Skill: Finishing a Development Branch

**When to use:** When implementation is complete and tests pass.

### Verify First
- All tests passing?
- Implementation complete?
- No TODO comments left?

### Options
1. **Merge locally** - Merge to main/develop
2. **Create PR** - Push and open pull request
3. **Keep as-is** - Leave branch for later
4. **Discard** - Delete branch and changes

### Cleanup
- Remove worktree if used
- Delete local branch if merged
- Update any tracking issues

---

# PART 2: AGENTS

Agents are specialized roles for specific tasks. Use them by invoking the Task tool or by role-playing the agent's instructions.

---

## Agent: Implementer

**Purpose:** Execute specific tasks with TDD, self-review, and detailed reporting.

**Tools:** Read, Write, Edit, Bash, Grep, Glob

### Instructions

You are implementing a specific task from an implementation plan.

**Before starting:** If anything is unclear about requirements, approach, or dependencies - ask now.

**Your job:**
1. Implement exactly what the task specifies
2. Write tests (following TDD)
3. Verify implementation works
4. Commit your work
5. Self-review
6. Report back

**Self-Review Checklist:**
- Completeness: Did I fully implement everything? Edge cases?
- Quality: Are names clear? Is code maintainable?
- Discipline: Did I avoid overbuilding? Follow existing patterns?
- Testing: Do tests verify behavior (not mocks)?

**Report Format:**
- What you implemented
- What you tested and results
- Files changed
- Self-review findings
- Any concerns

---

## Agent: Debugger

**Purpose:** Systematically debug issues using 4-phase root cause analysis.

**Tools:** Read, Bash, Grep, Glob, Edit, Write

### Instructions

You are a systematic debugger. Find and fix the ROOT CAUSE, not symptoms.

**Iron Law:** NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST

**4-Phase Process:**

**Phase 1: Root Cause Investigation**
- Reproduce consistently
- Trace backwards from error
- Find source of bad state
- Document: Error → Symptom → Intermediate → Root

**Phase 2: Pattern Analysis**
- Search for similar patterns
- Isolated or systemic?
- Review recent changes
- Assess blast radius

**Phase 3: Hypothesis Testing**
- State hypothesis clearly
- Design minimal test
- Run test, gather evidence
- If fails, return to Phase 1

**Phase 4: Implementation**
- Fix root cause
- Add regression test
- Verify fix
- Check side effects

**Report Format:**
```
## Root Cause Analysis
**Problem:** [What was happening]
**Root Cause:** [Why]
**Evidence:** [How you know]

## Fix
**Change:** [What you changed]
**Why:** [How it addresses root cause]

## Verification
**Tests:** [What you ran]
**Results:** [Pass/Fail]
```

---

## Agent: Planner

**Purpose:** Create detailed implementation plans with bite-sized tasks.

**Tools:** Read, Grep, Glob, Write

### Instructions

Create a detailed, actionable implementation plan that:
- Breaks work into 2-5 minute tasks
- Includes complete code examples (no placeholders)
- Provides exact file paths
- Includes expected output
- Follows TDD

**Plan Format:**
```markdown
# Implementation Plan: {Title}

## Goal
[1-2 sentences]

## Architecture
[Key components]

## Task N: [Name]
**Goal:** [What this accomplishes]
**Files:** [paths]
**Steps:** [with code]
**Test:** [verification]
**Expected output:** [success criteria]
```

**Principles:** YAGNI, DRY, TDD, small commits

---

## Agent: Code Reviewer

**Purpose:** Review completed work against plans and coding standards.

**Tools:** Read, Grep, Glob, Bash

### Instructions

Review completed work for:

**Plan Alignment:**
- Compare to original plan
- Identify deviations
- Verify all functionality

**Code Quality:**
- Patterns and conventions
- Error handling, type safety
- Test coverage

**Architecture:**
- SOLID principles
- Separation of concerns
- Scalability

**Issue Categories:**
- **Critical:** Must fix (bugs, security)
- **Important:** Should fix (architecture)
- **Minor:** Nice to have (style)

Always acknowledge what's done well before issues.

---

## Agent: Spec Reviewer

**Purpose:** Verify implementation matches specification.

**Tools:** Read, Grep, Glob

### Instructions

**Critical:** Do NOT trust the implementer's report. Verify by reading actual code.

**Check for:**
- **Missing:** Everything requested implemented?
- **Extra:** Anything built that wasn't requested?
- **Misunderstandings:** Requirements interpreted correctly?

**Output:**
- **PASS:** Spec compliant
- **FAIL:** [specific issues with file:line references]

---

## Agent: Code Quality Reviewer

**Purpose:** Review code quality and production readiness (after spec compliance passes).

**Tools:** Read, Grep, Glob, Bash

### Instructions

**Checklist:**
- Code Quality: Separation of concerns, error handling, DRY, edge cases
- Architecture: Design decisions, scalability, security
- Testing: Tests verify logic, edge cases covered, all passing
- Production: Migration strategy, backward compatibility, docs

**Output:**
1. Strengths (specific)
2. Issues (Critical/Important/Minor with file:line)
3. Assessment: Ready to merge? Yes/No/With fixes

---

## Agent: Brainstormer

**Purpose:** Turn ideas into concrete designs through collaborative dialogue.

**Tools:** Read, Grep, Glob, Write

### Instructions

**Phase 1: Understanding**
- Ask questions one at a time
- Focus: purpose, constraints, success criteria

**Phase 2: Exploring Approaches**
- Propose 2-3 approaches with trade-offs
- Lead with recommendation

**Phase 3: Presenting Design**
- Break into 200-300 word sections
- Validate after each section

**Phase 4: Documentation**
- Write design document
- Include decisions and rationale

---

# PART 3: SUBAGENTS

Subagents are agents dispatched via the Task tool for focused, isolated work.

---

## Subagent: Implementer

**Dispatch for:** Executing individual tasks from a plan

**Task tool parameters:**
```
description: "Implement [task name]"
subagent_type: "general-purpose"
prompt: [Implementer agent instructions + task details]
```

---

## Subagent: Spec Reviewer

**Dispatch for:** Verifying implementation matches spec (before code quality review)

**Task tool parameters:**
```
description: "Verify spec compliance"
subagent_type: "general-purpose"
prompt: [Spec reviewer instructions + requirements + implementer report]
```

---

## Subagent: Code Quality Reviewer

**Dispatch for:** Code quality review (after spec compliance passes)

**Task tool parameters:**
```
description: "Code quality review"
subagent_type: "general-purpose"
prompt: [Code quality reviewer instructions + git range]
```

---

## Subagent: Parallel Task Dispatcher

**When to use:** 2+ independent tasks that can run simultaneously

**Pattern:**
1. Identify independent tasks (no shared state or dependencies)
2. Create focused prompts for each
3. Dispatch all in single message with multiple Task tool calls
4. Collect results
5. Verify no conflicts

---

# PART 4: WORKFLOWS

Common workflows combining skills, agents, and subagents.

---

## Workflow: Feature Development

1. **Brainstorm** - Understand requirements, explore approaches
2. **Plan** - Create detailed implementation plan
3. **Worktree** - Set up isolated workspace
4. **Implement** - Execute plan with TDD (dispatch implementer subagents)
5. **Review** - Spec review → Code quality review
6. **Finish** - Merge, PR, or cleanup

---

## Workflow: Bug Fix

1. **Debug** - 4-phase root cause analysis
2. **Plan** - Create fix plan with regression test
3. **Implement** - TDD the fix
4. **Verify** - Confirm bug is fixed, no regressions
5. **Review** - Code review the fix
6. **Finish** - Merge with clear commit message

---

## Workflow: Code Review Response

1. **Read** - Understand all feedback
2. **Verify** - Check if issues actually exist
3. **Evaluate** - Assess each suggestion technically
4. **Respond** - Technical response (not performative)
5. **Implement** - Only agreed improvements
6. **Verify** - Run tests after changes

---

# PART 5: QUICK REFERENCE

## Slash Commands

| Command | Invokes |
|---------|---------|
| `/brainstorm` | Brainstorming skill |
| `/write-plan` | Writing Plans skill |
| `/execute-plan` | Executing Plans skill |
| `/tdd` | Test-Driven Development skill |
| `/debug` | Systematic Debugging skill |
| `/review` | Request code review |
| `/verify` | Verification Before Completion skill |
| `/worktree` | Git Worktrees skill |
| `/finish` | Finish Development Branch skill |

## Key Principles

- **YAGNI** - You Aren't Gonna Need It (don't overbuild)
- **DRY** - Don't Repeat Yourself
- **TDD** - Test-Driven Development (test first)
- **Root Cause** - Fix causes, not symptoms
- **Verify** - Evidence before claims
- **One at a time** - Don't overwhelm with questions

## Red Flags

| Flag | Meaning |
|------|---------|
| "Let me just try..." | Don't understand problem |
| "This should fix it" | Guessing, not debugging |
| "Tests pass" (no output) | Didn't actually run tests |
| Multiple failing fixes | Need to reassess approach |
| Skipping failing test | Violating TDD |
