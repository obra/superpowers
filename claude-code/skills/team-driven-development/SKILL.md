---
name: team-driven-development
description: Use when composing an agent team for parallel work, executing plans with 2+ independent tasks, or when user requests parallel execution with agent teams
---

# Team-Driven Development

Execute plan by creating an agent team with dedicated roles, **dynamic on-demand worker spawning**, API/EDR documentation via `docs/api/`, and audit verification after each task.

**Core principle:** Team Lead runs an orchestration loop — spawning workers when tasks are ready, shutting them down when done. Workers are ephemeral: spawn per task, terminate after audit approval. The Audit Agent persists throughout as the quality gate.

**Announce at start:** "I'm using the team-driven-development skill to execute this plan with an agent team."

<HARD-GATE>
You (Team Lead) MUST NOT write any code directly.

**Delegate Mode — Allowed tools:**
- Task (spawn workers), SendMessage, TaskCreate, TaskUpdate, TaskList, TaskGet
- Read, Glob, Grep (for investigation and orchestration decisions)

**Delegate Mode — Forbidden tools (NEVER use these):**
- Edit, Write, NotebookEdit — these are code-writing tools, reserved for Workers ONLY

Your ONLY job is the ORCHESTRATION LOOP:
- Check TaskList for ready tasks (unblocked, no owner)
- Spawn a worker ON DEMAND for each ready task
- Route messages between agents (worker ↔ audit-agent)
- Shutdown completed workers via SendMessage type: "shutdown_request"
- Resolve blockers by coordinating agents
- Make architectural decisions when asked by your human partner or workers

"Let me just write this one small thing" is NEVER acceptable.
"It's faster if I do it myself" is NEVER acceptable.
"Let me spawn all workers before checking readiness" is NEVER acceptable — always verify file conflicts + dependencies first, THEN spawn all verified-ready tasks (up to 12).
"I'll wait for the worker" and then do other work is NEVER acceptable — stay in the loop.
If no worker is available, spawn a new worker. Never code yourself.

After spawning the Audit Agent, you enter the loop and NEVER leave it until all tasks are complete. Every turn you take MUST be one of:
1. Checking TaskList for ready tasks
2. Verifying file conflicts and dependencies before spawning
3. Spawning a worker for a verified-safe task
4. Routing a message between agents
5. Shutting down a completed worker
6. Resolving a blocker (including spin detection escalation to human partner)

If you find yourself doing ANYTHING else, STOP. You have left the loop.
</HARD-GATE>

## When to Use

```dot
digraph when_to_use {
    "Have implementation plan?" [shape=diamond];
    "Tasks mostly independent?" [shape=diamond];
    "Want parallel execution?" [shape=diamond];
    "team-driven-development" [shape=box style=filled fillcolor=lightgreen];
    "executing-plans" [shape=box];
    "Manual execution or brainstorm first" [shape=box];

    "Have implementation plan?" -> "Tasks mostly independent?" [label="yes"];
    "Have implementation plan?" -> "Manual execution or brainstorm first" [label="no"];
    "Tasks mostly independent?" -> "Want parallel execution?" [label="yes"];
    "Tasks mostly independent?" -> "Manual execution or brainstorm first" [label="no - tightly coupled"];
    "Want parallel execution?" -> "team-driven-development" [label="yes"];
    "Want parallel execution?" -> "executing-plans" [label="no - sequential"];
}
```

## Mandatory Team Roles

| Role | Model | Responsibility | Writes Code? |
|------|-------|----------------|:---:|
| **Team Lead (You)** | Opus | Orchestration ONLY — assign tasks, route messages, resolve blockers | **NO — NEVER** |
| **Audit Agent** | Opus (mandatory) | Verify task completion against spec, block non-compliant work | NO |
| **Worker(s)** | Opus (hard) / Sonnet (easy) | Implement tasks following TDD | **YES — only role that writes code** |

<HARD-GATE>
You MUST NOT skip the Audit Agent role when creating the team.
Every team MUST include the Audit Agent regardless of project size or perceived simplicity.
"This project doesn't need audit" is NEVER a valid reason to skip.
</HARD-GATE>

## Worker Lifecycle: Spawn → Work → Audit → Shutdown

Workers are **ephemeral** — one worker per task, terminated after audit approval.

```
Worker lifecycle:
  SPAWN  →  Worker created for specific task
  WORK   →  Check docs/api/ for contracts → Implement with TDD
  AUDIT  →  Send to audit-agent → Pass/Fail loop
  SHUTDOWN → SendMessage type: "shutdown_request" → Worker exits
```

**Why ephemeral workers?**
- Prevents resource waste from idle agents
- Each worker gets clean context for its task
- Team Lead maintains control of execution flow
- Failed workers can be replaced without side effects

## The Process

```dot
digraph process {
    rankdir=TB;

    "Extract tasks, assess difficulty" [shape=box];
    "Create team + TaskCreate all tasks" [shape=box];
    "Spawn Audit Agent" [shape=box style=filled fillcolor=orange];
    "Check docs/api/ directory" [shape=box];

    subgraph cluster_orchestration_loop {
        label="ORCHESTRATION LOOP (Team Lead's core job)";
        style=bold;
        color=blue;
        "TaskList: find ready tasks" [shape=box style=filled fillcolor=lightyellow];
        "Ready tasks exist?" [shape=diamond];
        "File conflict check" [shape=diamond style=filled fillcolor=orange];
        "Dependency verified?" [shape=diamond style=filled fillcolor=orange];
        "Defer task (log reason)" [shape=box];
        "Spawn worker (up to 12)" [shape=box style=filled fillcolor=lightblue];
        "Wait for worker messages" [shape=box];
        "Message type?" [shape=diamond];
        "Answer API question (refer to docs/api/)" [shape=box];
        "Route to audit-agent" [shape=box];
        "Resolve blocker" [shape=box];
        "Audit passes?" [shape=diamond];
        "Send fix feedback to worker" [shape=box];
        "Shutdown worker" [shape=box style=filled fillcolor=salmon];
        "TaskUpdate: mark complete" [shape=box style=filled fillcolor=lightgreen];
    }

    "All tasks complete?" [shape=diamond];
    "Final audit verification" [shape=box];
    "Dispatch worker for full test suite" [shape=box];
    "finishing-a-development-branch" [shape=doublecircle];

    "Extract tasks, assess difficulty" -> "Create team + TaskCreate all tasks";
    "Create team + TaskCreate all tasks" -> "Spawn Audit Agent";
    "Spawn Audit Agent" -> "Check docs/api/ directory";
    "Check docs/api/ directory" -> "TaskList: find ready tasks";

    "TaskList: find ready tasks" -> "Ready tasks exist?";
    "Ready tasks exist?" -> "File conflict check" [label="yes"];
    "Ready tasks exist?" -> "All tasks complete?" [label="no ready tasks"];
    "File conflict check" -> "Dependency verified?" [label="no overlap"];
    "File conflict check" -> "Defer task (log reason)" [label="overlap with active worker"];
    "Dependency verified?" -> "Spawn worker (up to 12)" [label="all deps completed"];
    "Dependency verified?" -> "Defer task (log reason)" [label="dep not truly complete"];
    "Defer task (log reason)" -> "TaskList: find ready tasks" [label="check next task"];
    "Spawn worker (up to 12)" -> "Wait for worker messages";
    "Wait for worker messages" -> "Message type?";
    "Message type?" -> "Answer API question (refer to docs/api/)" [label="API query"];
    "Message type?" -> "Route to audit-agent" [label="task complete"];
    "Message type?" -> "Resolve blocker" [label="blocker/question"];
    "Answer API question (refer to docs/api/)" -> "Wait for worker messages";
    "Resolve blocker" -> "Wait for worker messages";
    "Route to audit-agent" -> "Audit passes?";
    "Audit passes?" -> "Send fix feedback to worker" [label="no"];
    "Send fix feedback to worker" -> "Wait for worker messages";
    "Audit passes?" -> "Shutdown worker" [label="yes"];
    "Shutdown worker" -> "TaskUpdate: mark complete";
    "TaskUpdate: mark complete" -> "TaskList: find ready tasks";

    "All tasks complete?" -> "Final audit verification" [label="yes"];
    "All tasks complete?" -> "TaskList: find ready tasks" [label="no - blocked tasks remain"];
    "Final audit verification" -> "Dispatch worker for full test suite";
    "Dispatch worker for full test suite" -> "finishing-a-development-branch";
}
```

## Step-by-Step Execution

**Steps 1-4 (Setup):** See `setup-guide.md` — team creation, task registration, Audit Agent spawning, API doc check, difficulty assessment.

**Step 5 (Orchestration Loop):** See `orchestration-loop.md` — the full 8-step loop with file conflict checks, dependency verification, spawn/route/audit/shutdown cycle, spin detection.

**Worker spawn template:** See `worker-spawn-template.md`.

### Step 6: Final Gates

After all tasks (use TaskList to confirm all tasks are marked complete):
1. Send message to `audit-agent`: "All tasks complete. Perform final comprehensive verification including API consistency check against docs/api/."
2. Spawn a NEW worker to run the full test suite (you MUST NOT run tests yourself)
3. After test suite passes, shutdown audit-agent
4. Use superpowers:finishing-a-development-branch

## Quick Reference

| Situation | Action |
|-----------|--------|
| Task ready (unblocked, no owner) | File conflict check → dependency check → spawn worker |
| Worker asks about API contracts | Direct them to check `docs/api/` directory, or read it yourself and relay |
| Worker reports task complete | Forward summary to audit-agent |
| Audit passes | Shutdown worker → mark task complete → check TaskList |
| Audit rejects | Forward feedback to worker → wait for fix |
| Worker reports blocker | Resolve and respond, or escalate to human |
| Worker requests out-of-scope file | Update target_files, check conflicts, then approve |
| DEFER_STREAK = 3 | Deadlock — escalate to human partner immediately |
| All tasks complete | Final gates: audit verification → full test suite → finish branch |

## Red Flags - STOP and Correct

**Never:**
- **Team Lead writes code directly** — spawn a worker instead, always
- **Team Lead uses Edit, Write, or NotebookEdit** — delegate mode is enforced
- **Spawn all workers upfront** — spawn on demand, one per ready task
- **Leave completed workers running** — shutdown immediately after audit approval
- **Leave the orchestration loop** — every turn must be a loop action
- **Do "quick work" while waiting** — your job is routing and spawning, nothing else
- **Spawn workers with overlapping target files** — file conflict check is mandatory before every spawn
- **Skip dependency verification** — always confirm blockedBy tasks are truly completed
- **Let workers modify files outside their scope** — reject and reassign if worker requests out-of-scope files
- **Ignore spin detection** — if all tasks are deferred 3 cycles, escalate to human immediately
- Create team without Audit Agent
- Let workers skip checking `docs/api/` for API contracts
- Mark tasks complete without audit-agent approval
- Use Sonnet for Audit Agent
- Let workers assume API contracts without checking documentation
- Skip the final audit verification
- Proceed when audit-agent reports failures
- Register tasks without target_files metadata

**Rationalization table:**

| Excuse | Reality |
|--------|---------|
| "Let me spawn all workers now for speed" | Wastes resources. Spawn when task is ready. |
| "I'll do this one thing while waiting" | You are NOT waiting. You are routing messages. |
| "The worker is idle, no need to shut down" | Idle workers consume context. Shutdown after audit. |
| "I'll batch the shutdowns later" | Shutdown immediately. Each completed worker frees resources. |
| "It's more efficient to keep workers alive" | Workers have task-specific context. Fresh workers are cleaner. |
| "These tasks probably don't touch the same files" | Probably ≠ verified. Always check target_files overlap. |
| "The dependency is obvious, no need to verify" | Obvious ≠ confirmed. TaskGet the blockedBy task to verify status. |
| "The worker needs just one more file outside scope" | Update target_files, check conflicts, THEN approve. Never skip. |
| "It'll resolve itself eventually" | 3 cycles with no progress = deadlock. Escalate now. |
| "I already know the API shape" | Memory ≠ documentation. Check docs/api/ every time. |
| "docs/api/ doesn't exist yet, I'll create it later" | Create BEFORE implementing. Documentation-first, not documentation-after. |
| "My task doesn't touch APIs, skip docs/api/" | Verify this explicitly. Many tasks have hidden API dependencies. |

**If worker exceeds 160k tokens:**
- **REQUIRED:** Use superpowers:context-window-management
- Complete current unit of work, do interim cleanup, compress context, then continue

## Integration

**Called by:**
- **writing-plans** (Execution Handoff) - REQUIRED when team-driven execution chosen
- Your human partner requesting parallel team execution

**Pairs with:**
- **using-git-worktrees** - REQUIRED: Set up isolated workspace before starting
- **api-edr-validation** - REQUIRED: Workers follow this skill to check `docs/api/` before implementing API-related code
- **audit-verification** - REQUIRED: All task completions go through audit
- **model-assignment** - REQUIRED: Determines worker model assignment
- **context-window-management** - REQUIRED: All agents follow context rules
- **test-driven-development** - Workers follow TDD for each task
- **finishing-a-development-branch** - Complete development after all tasks

**Replaces:**
- **subagent-driven-development** - DEPRECATED: Team-driven is the preferred approach
