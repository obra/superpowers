---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session - dispatches fresh subagent for each task with code review between tasks, enabling fast iteration with quality gates
---

# Subagent-Driven Development

Execute plan by dispatching fresh subagent per task, with code review after each.

**Core principle:** Fresh subagent per task + review between tasks = high quality, fast iteration

## Overview

**vs. Executing Plans (parallel session):**
- Same session (no context switch)
- Fresh subagent per task (no context pollution)
- Code review after each task (catch issues early)
- Faster iteration (no human-in-loop between tasks)

**When to use:**
- Staying in this session
- Tasks are mostly independent
- Want continuous progress with quality gates

**When NOT to use:**
- Need to review plan first (use executing-plans)
- Tasks are tightly coupled (manual execution better)
- Plan needs revision (brainstorm first)

## The Process

### 1. Load Plan

Read plan file, create TodoWrite with all tasks.

### 2. Execute Task with Subagent

For each task:

**Dispatch fresh subagent:**
```
Task tool (general-purpose):
  description: "Implement Task N: [task name]"
  prompt: |
    REQUIRED: First, use the Skill tool to read <insert relevant skills here>.
    [See Propagating Skill Context section - list the specific skills you're following]

    You are implementing Task N from [plan-file].

    Read that task carefully. Your job is to:
    1. Implement exactly what the task specifies
    2. Follow the skills specified above
    3. Write tests (following TDD if task says to)
    4. Verify implementation works
    5. Commit your work
    6. Report back

    Work from: [directory]

    Report: What you implemented, what you tested, test results, files changed, any issues
```

**Subagent reports back** with summary of work.

### 3. Review Subagent's Work

**Dispatch code-reviewer subagent:**
```
Task tool (superpowers:code-reviewer):
  Use template at requesting-code-review/code-reviewer.md

  WHAT_WAS_IMPLEMENTED: [from subagent's report]
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
  DESCRIPTION: [task summary]
```

**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment

### 4. Apply Review Feedback

**If issues found:**
- Fix Critical issues immediately
- Fix Important issues before next task
- Note Minor issues

**Dispatch follow-up subagent if needed:**
```
"Fix issues from code review: [list issues]"
```

### 5. Mark Complete, Next Task

- Mark task as completed in TodoWrite
- Move to next task
- Repeat steps 2-5

### 6. Final Review

After all tasks complete, dispatch final code-reviewer:
- Reviews entire implementation
- Checks all plan requirements met
- Validates overall architecture

### 7. Complete Development

After final review passes:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice

## Propagating Skill Context

**Critical rule:** Subagents don't inherit skill context - they start fresh.

**When dispatching subagents, you MUST include instructions to read any skills you are currently using.**

### The Iron Law of Skill Propagation

```
If you're using a skill, your subagents MUST read that same skill.
```

**Not:** Describe the skill's process inline
**Not:** Give "context" about the methodology
**Not:** Mention what skill you're using
**MUST:** Tell subagent to use Skill tool to READ the skill file

### Why This Matters

Skills don't propagate automatically. If you're following a skill but don't tell your subagent to use it, the subagent won't follow it. Whatever process you're using needs to be explicitly passed to subagents.

**Common failure modes:**
- ❌ "Follow RED-GREEN-REFACTOR cycle" (describes TDD but doesn't load the skill)
- ❌ "Use systematic-debugging approach" (mentions skill but doesn't load it)
- ❌ "This is exploration for brainstorming" (context but no skill loaded)
- ✅ "REQUIRED: First, use the Skill tool to read superpowers:test-driven-development"

### How to Propagate Skills

**The pattern:** Look at what skills YOU are currently using, then explicitly instruct subagent to READ those same skills with the Skill tool.

**Exact format - copy this:**
```
Task tool:
  prompt: |
    REQUIRED: First, use the Skill tool to read these skills:
    - superpowers:<skill-you-are-using>
    - superpowers:<another-skill-if-applicable>

    [rest of your task prompt]
```

**This is non-negotiable.** The subagent must read the skill file, not receive a summary of it.

### Examples

**If you're using test-driven-development:**
```
REQUIRED: First, use the Skill tool to read superpowers:test-driven-development.

You are implementing [feature]...
```

**If you're using systematic-debugging:**
```
REQUIRED: First, use the Skill tool to read superpowers:systematic-debugging.

You are investigating [bug]...
```

**If you're using multiple skills (e.g., TDD + debugging):**
```
REQUIRED: First, use the Skill tool to read these skills:
- superpowers:test-driven-development
- superpowers:systematic-debugging

You are fixing [issue]...
```

**If you're using brainstorming:**
```
REQUIRED: First, use the Skill tool to read superpowers:brainstorming.

You are exploring design options for [feature]...
```

### Common Patterns

- **Implementation work** - Propagate your development methodology (TDD, etc.)
- **Debugging work** - Propagate systematic-debugging if you're using it
- **Completion work** - Propagate verification-before-completion if you're using it
- **Design work** - Propagate brainstorming if you're using it
- **Multiple skills** - List all skills you're currently following

**Key principle:** Mirror your own skill usage to your subagents.

## Example Workflow

```
You: I'm using Subagent-Driven Development to execute this plan.

[Load plan, create TodoWrite]

Task 1: Hook installation script

[Dispatch implementation subagent]
Subagent: Implemented install-hook with tests, 5/5 passing

[Get git SHAs, dispatch code-reviewer]
Reviewer: Strengths: Good test coverage. Issues: None. Ready.

[Mark Task 1 complete]

Task 2: Recovery modes

[Dispatch implementation subagent]
Subagent: Added verify/repair, 8/8 tests passing

[Dispatch code-reviewer]
Reviewer: Strengths: Solid. Issues (Important): Missing progress reporting

[Dispatch fix subagent]
Fix subagent: Added progress every 100 conversations

[Verify fix, mark Task 2 complete]

...

[After all tasks]
[Dispatch final code-reviewer]
Final reviewer: All requirements met, ready to merge

Done!
```

## Advantages

**vs. Manual execution:**
- Subagents follow your skills consistently (when propagated)
- Fresh context per task (no confusion)
- Parallel-safe (subagents don't interfere)

**vs. Executing Plans:**
- Same session (no handoff)
- Continuous progress (no waiting)
- Review checkpoints automatic

**Cost:**
- More subagent invocations
- But catches issues early (cheaper than debugging later)

## Red Flags

**Never:**
- Skip code review between tasks
- Proceed with unfixed Critical issues
- Dispatch multiple implementation subagents in parallel (conflicts)
- Implement without reading plan task
- **Dispatch subagents without propagating skill context** (see Propagating Skill Context section)

**If subagent fails task:**
- Dispatch fix subagent with specific instructions
- Don't try to fix manually (context pollution)

**Common mistake - Forgetting skill propagation:**
- You're using a skill but subagent isn't following it
- Subagent behaves differently than you because they don't have your skill context
- You described the skill process inline instead of telling subagent to read the skill
- Solution: Always include "REQUIRED: First, use the Skill tool to read superpowers:<skill-name>" in subagent prompts

**Red flags you're about to fail skill propagation:**
- "I'll explain TDD to the subagent" → WRONG. Make them read the skill.
- "The prompt has enough context" → WRONG. Skills have nuance that summaries miss.
- "Reading skills is overhead" → WRONG. Not reading skills causes failures.

## Integration

**Required workflow skills:**
- **writing-plans** - REQUIRED: Creates the plan that this skill executes
- **requesting-code-review** - REQUIRED: Review after each task (see Step 3)
- **finishing-a-development-branch** - REQUIRED: Complete development after all tasks (see Step 7)

**Propagate your skills to subagents:**
- Whatever skills you are using should be propagated to subagents (see Propagating Skill Context)
- Common examples: test-driven-development, systematic-debugging, brainstorming, verification-before-completion

**Alternative workflow:**
- **executing-plans** - Use for parallel session instead of same-session execution

See code-reviewer template: requesting-code-review/code-reviewer.md
