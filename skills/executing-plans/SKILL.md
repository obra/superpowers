---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Overview

Load plan, review critically, execute tasks in batches, report for review between batches.

**Core principle:** Batch execution with checkpoints for architect review.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

## The Process

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically - identify any questions or concerns about the plan
3. If concerns: Raise them with your human partner before starting
4. If no concerns: Create TodoWrite and proceed

### Step 2: Execute Batch
**Default: First 3 tasks**

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed

### Step 3: Report
When batch complete:
- Show what was implemented
- Show verification output
- Say: "Ready for feedback."

### Step 4: Continue
Based on feedback:
- Apply changes if needed
- Execute next batch
- Repeat until complete

### Step 5: Complete Development

After all tasks complete and verified:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker mid-batch (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Failure Handling

Long-running plan executions encounter failures. This section defines how to detect, classify, and respond to them without silently swallowing errors or spinning forever.

### Signal Protocol

Use structured signals at the end of each task response. Inspired by the Ralph Loop V2 pattern in `cinder/scripts/ralph/ralph.sh`:

| Signal | When to emit | Effect |
|--------|-------------|--------|
| `<promise>COMPLETE</promise>` | All tasks done, all verifications pass | Terminates the loop |
| `<promise>PASSED:TASK-N</promise>` | Task succeeded — tests pass, changes committed | Moves to next task |
| `<promise>FAILED:TASK-N:brief reason</promise>` | Task failed after reasonable attempts | Logs failure, continues to next task |

**Emit exactly one signal per task response. Never emit FAILED and continue working on the same task.**

### Max Iterations

Default batch size: 3 tasks per cycle. Maximum retry attempts per task: **2**.

If the same task fails twice:
- Emit `<promise>FAILED:TASK-N:exceeded retry limit</promise>`
- Move to the next task
- Log what was tried in the failure report
- Do NOT attempt a third time without explicit human direction

### Non-Zero Exits

If a verification command exits non-zero:

1. **Capture full output** — don't discard stderr
2. **Classify the failure:**
   - Flaky test / environment issue → retry once, then escalate
   - Missing dependency → escalate immediately (don't guess at installs)
   - Logic error in new code → fix and re-verify once
   - Pre-existing failure (unrelated to your change) → document and continue
3. **Emit the appropriate signal** — never swallow a non-zero exit silently

### Partial Success Reporting

When a batch contains mixed results, report exactly:

```
Batch N complete:
✅ Task A — [brief description]
✅ Task B — [brief description]
❌ Task C — FAILED: [reason]

Partial success. 2/3 tasks complete.
Tasks still pending: [list]
Ready for feedback.
```

Never report "Done" when failures exist. Never report partial completion as full completion.

### Retry vs Escalate Decision Tree

```
Task fails
   │
   ├─ Is this the first attempt?
   │     YES → Diagnose root cause, change approach, retry once
   │     NO  → Move to escalate branch
   │
   └─ Escalate when:
         - Missing dependency or infra issue
         - Ambiguous spec (two valid interpretations)
         - Pre-existing failures in unrelated code
         - Second attempt also fails
         - You don't understand WHY it's failing
```

**Do not retry the same approach twice.** If the first retry fails, the approach is wrong — escalate.

### Prompt Rewriting on Retry (Ralph Loop V2)

When an orchestrator respawns a failed task, the failure mode determines how the prompt should change. From Elvis Sun's Agent Swarm article (https://x.com/elvissun/status/2025920521871716562):

> "When an agent fails, [the orchestrator] doesn't just respawn it with the same prompt. [It] looks at the failure with full business context and figures out how to unblock it."

| Failure mode | Prompt adjustment |
|-------------|------------------|
| Agent ran out of context | Narrow scope: "Focus only on these three files." |
| Agent went wrong direction | Inject business intent: "Stop. The requirement is X, not Y." |
| Agent needs clarification | Add source material: include the spec, error output, or meeting notes verbatim |
| Agent hit infra blocker | Escalate to human — don't rewrite, don't retry |

**Respawning with the same prompt after failure is an anti-pattern.** Always diagnose first, then rewrite.

### Failure Log Format

Append to your batch report when tasks fail:

```
## FAILED: Task N — [title]
- Reason: [brief]
- What was tried:
  - Attempt 1: [approach] → [outcome]
  - Attempt 2: [approach] → [outcome]
- Blocker: [missing dep / ambiguous spec / infra / logic error]
- Recommended next step: [fix X / clarify Y / skip and continue]
```

This log is the input the orchestrator uses to rewrite the prompt on retry.

## Remember
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- Between batches: just report and wait
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent

## Integration

**Required workflow skills:**
- **superpowers:using-git-worktrees** - REQUIRED: Set up isolated workspace before starting
- **superpowers:writing-plans** - Creates the plan this skill executes
- **superpowers:finishing-a-development-branch** - Complete development after all tasks
