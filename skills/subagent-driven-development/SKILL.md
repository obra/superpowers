---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session
allowed-tools: Bash, Read, Grep, Glob, Task, TodoWrite, AskUserQuestion
---

# Subagent-Driven Development

Execute plan by dispatching fresh subagent per task, with two-stage review after each: spec compliance review first, then code quality review.

**Core principle:** Fresh subagent per task + two-stage review (spec then quality) = high quality, fast iteration

<requirements>
## Requirements

1. Dispatch fresh subagent per task. Context reuse causes pollution.
2. Two-stage review: spec compliance first, then code quality.
3. Curate minimal context for each subagent. Full plan is not needed.
</requirements>

## When to Use

- Have implementation plan with mostly independent tasks
- Same session (no context switch needed)
- Want faster iteration (no human-in-loop between tasks)

## The Process

```
Read plan → Extract all tasks → Create TodoWrite
    ↓
Per Task:
    Dispatch implementer → Answer questions if any → Implement + test + commit
        ↓
    Spec reviewer (haiku) → Fix gaps if any → Re-review until approved
        ↓
    Code quality reviewer (haiku) → Fix issues if any → Re-review until approved
        ↓
    Mark complete in TodoWrite
    ↓
More tasks? → Loop back
    ↓
Final code reviewer → Cleanup transient files → Use finishing-a-development-branch
```

## Prompt Templates

- `./implementer-prompt.md` - Dispatch implementer subagent
- `./spec-reviewer-prompt.md` - Dispatch spec compliance reviewer subagent
- `./code-quality-reviewer-prompt.md` - Dispatch code quality reviewer subagent

## Model Selection

| Subagent Type | Model | Rationale |
|---------------|-------|-----------|
| Implementer | `sonnet/opus` | Requires coding intelligence |
| Spec Reviewer | `haiku` | Validation task, pattern matching |
| Code Quality Reviewer | `haiku` | Validation task, checklist-based |

Using opus/sonnet for validation tasks wastes tokens without improving quality.

## Pre-Implementation Setup

<verification>
### Pre-Implementation Checklist

Before starting task loop, present these offers via AskUserQuestion:

1. **Branch creation** (if on main/master/develop):
   - Check: `git branch --show-current`
   - If on base branch, dispatch issue-tracking agent to get branch convention
   - Present offer with Yes/Modify/Skip options

2. **Status update** (if primary issue exists):
   - If primary issue identified from plan header or branch name
   - Present offer to update status to in-progress

Skipping offer presentation (not execution) leaves setup incomplete.
User can decline any offer - the requirement is presentation.
</verification>

**AskUserQuestion format for offers:**
```
AskUserQuestion(
  questions: [{
    question: "Create this branch?",
    header: "Branch",
    options: [
      {label: "Yes", description: "Create branch: feature/PROJ-123-add-user-auth"},
      {label: "Modify", description: "Let me specify a different branch name"},
      {label: "Skip", description: "Don't create a branch"}
    ],
    multiSelect: false
  }]
)
```

### Discovered Work Tracking

During execution, append discovered work to `docs/current-progress.md`:

```markdown
## Discovered Work
- [ ] "Need to add rate limiting to API" (discovered in Task 3)
```

Discovered work is batched for presentation at verification checkpoint.

## Context Curation

Before dispatching a subagent, curate exactly what it needs.

**Always include:**
- Full task text from plan (subagent should not read plan file)
- Relevant file paths
- Decisions from previous tasks affecting this one
- Original Issue context (if present in plan)

**Never include:**
- Full plan (only current task)
- Unrelated completed task details
- General project background (subagent reads CLAUDE.md)

**Structured Handoff Format:**
```
Task: [exact task from plan]
Files: [specific paths]
Context: [only relevant prior decisions]
Constraints: [any limitations]
```

**If unsure whether to include something:** provide file path instead. Let subagent decide.

## Task Loop

<verification>
### Context Curation Gate

Before each task dispatch:
- [ ] Full task text extracted (not file path)
- [ ] Relevant file paths included
- [ ] Prior decisions noted
- [ ] Structured handoff format used

If subagent needs to read plan file, context curation failed. Provide full text.
</verification>

<verification>
### Handoff Consumption Gate

Verify implementer acknowledges handoff:
- [ ] Implementer states: "Received context for: [task name]"
- [ ] Implementer references specific files before modifying

If implementer proceeds without acknowledgment, reject and re-dispatch.
</verification>

<verification>
### Review Sequence Gate

After implementer completes:
1. [ ] Spec Compliance Review completed FIRST
2. [ ] Spec issues fixed (if any)
3. [ ] THEN Code Quality Review
4. [ ] Quality issues fixed (if any)
5. [ ] Both reviews approved

Attempting Code Quality before Spec Compliance approved breaks the sequence.
Moving to next task with open review issues blocks completion.
</verification>

<verification>
### Task Completion Gate

Before marking complete:
- [ ] Both reviews approved
- [ ] TodoWrite updated
- [ ] Progress file updated
</verification>

## Example Workflow

```
Orchestrator: Executing plan with Subagent-Driven Development.
[Read plan, extract 5 tasks, create TodoWrite]

Task 1: Hook installation script
[Dispatch implementer with full task text + context]

Implementer: "Before I begin - should hook be installed at user or system level?"
Orchestrator: "User level (~/.config/hyperpowers/hooks/)"
Implementer: Implementing...
  - Implemented install-hook command
  - Tests: 5/5 passing
  - Self-review: Added missing --force flag
  - Committed

[Dispatch spec reviewer (haiku)]
Spec reviewer: Spec compliant - all requirements met

[Dispatch code quality reviewer (haiku)]
Code reviewer: Approved - good coverage, clean code

[Mark Task 1 complete, proceed to Task 2...]
```

## Displaying Fix Summaries

After implementer fixes issues, before re-review:

1. Read `docs/handoffs/task-N-impl.md` for `## Fixes Applied` section
2. Display inline:

```
Fixed: [title]
- Why: [reason]
- Before:
    [old code]
- After:
    [new code]

[Re-reviewing spec/code quality...]
```

If no Fixes Applied section: display "[Implementer reported no fixes to display]"

## Progress Tracking

Create `docs/current-progress.md` (gitignored):

```markdown
# Current Progress
## Active Task
Task 3: Add retry logic to API client
## Status
IN_PROGRESS
## Completed Tasks
- [x] Task 1: Setup project structure
- [x] Task 2: Add base API client
```

Status flags: `PENDING`, `IN_PROGRESS`, `READY_FOR_SPEC_REVIEW`, `READY_FOR_CODE_REVIEW`, `BLOCKED`, `DONE`

## Context Pollution Warning

Signs of pollution:
- Subagent asks about unrelated tasks
- Subagent references old, irrelevant context
- Token usage growing unexpectedly

Prevention:
- Fresh subagent per task (no reuse)
- Explicit context curation before dispatch
- Don't forward full conversation history

## Red Flags

**Never:**
- Use plain text questions instead of AskUserQuestion
- Skip reviews (spec compliance OR code quality)
- Skip presenting branch/status offers at session start
- Proceed with unfixed issues
- Make subagent read plan file
- Skip review loops (issues found = fix = review again)
- Start code quality review before spec compliance approved

**If subagent asks questions:** Answer completely before they proceed.

**If reviewer finds issues:** Implementer fixes, reviewer reviews again, repeat until approved.

## Integration

**Required workflow skills:**
- **hyperpowers:writing-plans** - Creates the plan this skill executes
- **hyperpowers:finishing-a-development-branch** - Complete development after all tasks

**Subagents should use:**
- **hyperpowers:test-driven-development** - Subagents follow TDD for each task

## Cleanup

After final review passes, before using `hyperpowers:finishing-a-development-branch`:

```bash
rm -rf docs/handoffs/
rm -f docs/current-progress.md
```

These files are gitignored and only needed during execution.

<requirements>
## Requirements Reminder

1. Dispatch fresh subagent per task. Context reuse causes pollution.
2. Two-stage review: spec compliance first, then code quality.
3. Curate minimal context for each subagent. Full plan is not needed.
</requirements>
