---
name: persistent-planning
description: Use during plan writing, plan execution, or session recovery to maintain shared file-based memory across tasks and sessions via findings, progress, and error tracking
---

# Persistent Planning

## Overview

Give the orchestrator and subagents a shared, file-based memory so later tasks benefit from earlier discoveries, progress survives `/clear`, and errors aren't repeated.

**Core principle:** Orchestrator-mediated — only the orchestrator reads/writes planning files; subagents receive findings via prompt injection and report back in their output.

**Announce at start:** "I'm using the persistent-planning skill to maintain shared context across tasks."

## When It Applies

- During plan writing (companion file generation)
- During plan execution (progress tracking, findings accumulation)
- On session recovery after `/clear` (detecting and resuming active plans)

## The 3-File Pattern

Every plan has three companion files in `docs/plans/`:

| File | Purpose | Who Writes |
|------|---------|------------|
| `YYYY-MM-DD-<feature>.md` | The implementation plan | writing-plans skill |
| `YYYY-MM-DD-<feature>-findings.md` | Shared discoveries, decisions, errors | Orchestrator (from subagent reports) |
| `YYYY-MM-DD-<feature>-progress.md` | Task status, session log, review results | Orchestrator |

## Orchestrator Rules

### Before Each Subagent Dispatch

1. Read `*-findings.md` for the active plan
2. If findings > ~200 lines, use only the Summary section
3. Include findings content in subagent prompt under `## Context from Previous Tasks`
4. Check Error Log for failures relevant to this task's domain

### After Each Task Completion

1. Update `*-progress.md`: check off task with timestamp
2. Append any new findings from implementer's report to `*-findings.md`
3. Record review results in progress.md Review Results table

### The 2-Action Rule

Every 2 completed tasks, the orchestrator asks itself:

> "Did these subagents discover something future tasks need?"

If yes:
- Append to findings under appropriate section
- If findings is growing large, update the Summary section

If no:
- Continue to next task

### Plan Deviation Protocol

When the implementation needs to deviate from the plan:

1. **Do NOT edit the plan file** — it's the original spec
2. Record the decision in findings.md Decisions Log with rationale and task number
3. Future spec reviewers will check Decisions Log before flagging deviations

### 3-Strike Error Protocol

When a task or approach fails:

| Strike | Action |
|--------|--------|
| 1st failure | Diagnose root cause, fix, log in findings Error Log |
| 2nd failure | Try alternative approach, log both attempts in Error Log |
| 3rd failure | **STOP.** Escalate to user. Do not attempt again without guidance. |

The Error Log ensures future subagents don't repeat the same failed approaches.

## Findings Growth Management

When `*-findings.md` exceeds ~200 lines:

1. Orchestrator maintains a **Summary** section at the top (10-20 lines)
2. Summary contains: key decisions, critical gotchas, important patterns
3. When injecting findings into subagent prompts, use **only the Summary**
4. Full findings remain in the file for human reference

## Templates

- `./findings-template.md` — Template for new findings files
- `./progress-template.md` — Template for new progress files
- `./session-recovery.md` — Instructions for recovering from `/clear`

## Integration

**Used by:**
- **superpowers:writing-plans** — Generates companion files after plan creation
- **superpowers:subagent-driven-development** — Reads/writes findings and progress per task
- **superpowers:executing-plans** — Updates progress between batches
- **hooks/session-start.sh** — Detects active plans for recovery

**Pairs with:**
- **superpowers:brainstorming** — Discoveries from brainstorming can seed initial findings
