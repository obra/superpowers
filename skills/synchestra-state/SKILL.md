---
name: synchestra-state
description: Use when Synchestra is available to persist task state across sessions and coordinate multi-agent work
---

# Synchestra State Integration

## Overview

Synchestra provides persistent, git-backed task state management. When available, it replaces ephemeral TodoWrite tracking with durable state that survives across sessions and enables multi-agent coordination.

**This skill is opt-in.** All superpowers skills work without Synchestra. When Synchestra is available, skills gain:
- Cross-session task continuity
- Multi-agent claiming (no two agents work on the same task)
- Plan-vs-actual deviation tracking
- Persistent task board visible to all collaborators

## Detection

Check if Synchestra is available:

```bash
command -v synchestra >/dev/null 2>&1 && echo "available" || echo "unavailable"
```

If unavailable, fall back to standard superpowers behavior (TodoWrite, markdown checkboxes).

## Project Setup

If Synchestra CLI is available but the project is not initialized:

```bash
# Check if project is initialized
ls synchestra.yaml 2>/dev/null || ls .synchestra/ 2>/dev/null
```

If not initialized, suggest to the user:
> "Synchestra CLI is available but this project hasn't been initialized. Run `synchestra project init` to enable persistent task state. This creates an orphan branch for state — zero impact on your code."

Do not initialize automatically — let the user decide.

## Core Operations

### Creating Tasks from a Plan

After writing a plan, generate Synchestra tasks for each plan task:

```bash
# Create a parent task for the plan
synchestra task new --title "Plan: <feature-name>" --type plan

# Create child tasks for each plan task
synchestra task new --title "Task 1: <component>" --parent <plan-task-id>
synchestra task new --title "Task 2: <component>" --parent <plan-task-id>
```

### Task Lifecycle

```
queued → claimed → in_progress → completed
                              → blocked → in_progress
                              → failed
```

Commands:
```bash
synchestra task claim <id>          # Reserve a task
synchestra task start <id>          # Begin work
synchestra task complete <id>       # Mark done
synchestra task block <id> "reason" # Mark blocked
synchestra task fail <id> "reason"  # Mark failed
synchestra task release <id>        # Release back to queue
```

### Checking State

```bash
synchestra task list                # All tasks
synchestra task list --status queued  # Available work
synchestra task info <id>           # Full task details
```

## Integration Points

### With writing-plans

After saving the plan file, also create Synchestra tasks. Map each `### Task N:` section to a Synchestra task. The plan file path becomes an artifact reference on the parent task.

### With executing-plans / subagent-driven-development

Replace or supplement TodoWrite:
1. At start: read Synchestra tasks instead of (or in addition to) extracting from plan
2. Before each task: `synchestra task claim <id>` then `synchestra task start <id>`
3. After completion: `synchestra task complete <id>`
4. On blocker: `synchestra task block <id> "reason"`
5. On failure: `synchestra task fail <id> "reason"`

### With session-start

At session start, if Synchestra is available and initialized:
- Show current task state (what's in progress, what's blocked, what's next)
- If a task was in_progress when the last session ended, highlight it for resumption

### With dispatching-parallel-agents

Use Synchestra's claiming protocol for parallel agent coordination:
- Each agent claims its task atomically via `synchestra task claim`
- Git-backed optimistic locking prevents conflicts
- Task board shows real-time view of agent assignments

## Graceful Degradation

Every Synchestra operation must be wrapped in availability checks. If Synchestra is unavailable or the project is not initialized, the skill is a no-op and the calling skill falls back to its standard behavior.

Pattern:
```
if synchestra CLI available AND project initialized:
    use synchestra task commands
else:
    use TodoWrite / markdown checkboxes as normal
```

## Task-Plan Mapping

When creating Synchestra tasks from a plan, preserve the mapping:

| Plan Element | Synchestra Field |
|---|---|
| Plan file path | Parent task artifact |
| `### Task N: Name` | Task title |
| Task steps (`- [ ]`) | Task description |
| `**Files:**` section | Task metadata |
| Task dependencies | Synchestra `depends_on` |

This mapping enables deviation reports: comparing what was planned vs what was actually executed.
