# Team-Based Plan Execution Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Claude Code agent team support to the three execution skills, with detection, user choice, and cross-platform fallback.

**Architecture:** Each execution skill gets a "Team Mode" section that activates only when Claude Code teams are detected and the user opts in. The existing sequential subagent pattern remains the default. A shared detection-and-choice pattern is documented once and referenced by all three skills.

**Tech Stack:** Markdown skill files (SKILL.md), Claude Code built-in tools for team creation and messaging (TeamCreate, SendMessage, TeamDelete) and task management (TaskCreate, TaskUpdate, TaskList), plus the existing Task tool

**Design doc:** `docs/plans/2026-02-13-team-based-plan-execution-design.md`

---

## Implementation Tasks

### Task 1: Add team detection and choice pattern to `writing-plans`

The entry point for execution mode selection is `writing-plans/SKILL.md`, which currently offers two choices (subagent-driven or parallel session). Add a third option for team-based execution and document the detection pattern.

**Files:**
- Modify: `skills/writing-plans/SKILL.md` (Execution Handoff section, ~line 99-117)

**Step 1: Add team detection instructions to the Execution Handoff section**

After the current two options, add a third option and a detection preamble. Replace the Execution Handoff section with:

```markdown
## Execution Handoff

After saving the plan, check for team support and offer execution choice:

**Detection:** Before presenting options, check if the `TeamCreate` tool is available in this environment.
If it is, include Option 3 below. If not, only show Options 1 and 2.

**"Plan complete and saved to `docs/plans/<filename>.md`. Execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**3. Team-Based (parallel, this session)** *(only if TeamCreate is available)* - Spawn an agent team with parallel implementers and reviewers, coordinated via shared task list

**Which approach?"**

**If Subagent-Driven chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development
- Stay in this session
- Fresh subagent per task + code review

**If Parallel Session chosen:**
- Guide them to open new session in worktree
- **REQUIRED SUB-SKILL:** New session uses superpowers:executing-plans

**If Team-Based chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development (team mode)
- Stay in this session
- TeamCreate to spawn parallel implementers
- Shared TaskList for coordination
```

**Step 2: Commit**

```bash
git add skills/writing-plans/SKILL.md
git commit -m "feat(writing-plans): add team-based execution as third handoff option"
```

---

### Task 2: Add team mode to `subagent-driven-development` - When to Use decision tree

Add team mode branching to the decision tree at the top of the skill.

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md` (When to Use section)

**Step 1: Update the decision tree**

Add a new decision node after "Stay in this session?" that checks for team availability. The updated flow:

```markdown
## When to Use

\`\`\`dot
digraph when_to_use {
    "Have implementation plan?" [shape=diamond];
    "Tasks mostly independent?" [shape=diamond];
    "Stay in this session?" [shape=diamond];
    "TeamCreate available and user opted in?" [shape=diamond];
    "subagent-driven-development (team mode)" [shape=box];
    "subagent-driven-development (standard)" [shape=box];
    "executing-plans" [shape=box];
    "Manual execution or brainstorm first" [shape=box];

    "Have implementation plan?" -> "Tasks mostly independent?" [label="yes"];
    "Have implementation plan?" -> "Manual execution or brainstorm first" [label="no"];
    "Tasks mostly independent?" -> "Stay in this session?" [label="yes"];
    "Tasks mostly independent?" -> "Manual execution or brainstorm first" [label="no - tightly coupled"];
    "Stay in this session?" -> "TeamCreate available and user opted in?" [label="yes"];
    "Stay in this session?" -> "executing-plans" [label="no - parallel session"];
    "TeamCreate available and user opted in?" -> "subagent-driven-development (team mode)" [label="yes"];
    "TeamCreate available and user opted in?" -> "subagent-driven-development (standard)" [label="no"];
}
\`\`\`
```

**Step 2: Commit**

```bash
git add skills/subagent-driven-development/SKILL.md
git commit -m "feat(subagent-driven-dev): add team mode to When to Use decision tree"
```

---

### Task 3: Add team mode process flow to `subagent-driven-development`

Add a "Team Mode" section describing the parallel execution flow using Claude Code teams.

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md` (add new section after The Process)

**Step 1: Add Team Mode section after the existing Process section**

Insert after the current process flow and before the Prompt Templates section:

```markdown
## Team Mode (Claude Code Only)

When the user opts into team mode and `TeamCreate` is available, use this alternative flow instead of the standard sequential process above.

**Core difference:** Independent tasks run in parallel via team members. Review gates remain sequential per task.

### Team Composition

- **Team Lead (you):** Orchestrates work, assigns tasks, reviews results
- **Implementer agents:** One per independent task, spawned as team members
- **Reviewer agents:** Dispatched per task after implementation completes (spec then quality)

### Team Mode Process

\`\`\`dot
digraph team_process {
    rankdir=TB;

    "Read plan, extract tasks, identify independent groups" [shape=box];
    "TeamCreate with implementer agents" [shape=box];
    "Assign independent tasks to implementers via TaskCreate" [shape=box];
    "Implementers work in parallel" [shape=box];
    "As each implementer completes:" [shape=box];

    subgraph cluster_per_task {
        label="Per Completed Task (sequential)";
        "Dispatch spec reviewer for task" [shape=box];
        "Spec passes?" [shape=diamond];
        "Send fix instructions to implementer" [shape=box];
        "Dispatch code quality reviewer" [shape=box];
        "Quality passes?" [shape=diamond];
        "Send quality fix instructions" [shape=box];
        "Mark task complete" [shape=box];
    }

    "More tasks to assign?" [shape=diamond];
    "Assign next batch to idle implementers" [shape=box];
    "All tasks complete" [shape=box];
    "Shutdown team" [shape=box];
    "Final code review + finishing-a-development-branch" [shape=box];

    "Read plan, extract tasks, identify independent groups" -> "TeamCreate with implementer agents";
    "TeamCreate with implementer agents" -> "Assign independent tasks to implementers via TaskCreate";
    "Assign independent tasks to implementers via TaskCreate" -> "Implementers work in parallel";
    "Implementers work in parallel" -> "As each implementer completes:";
    "As each implementer completes:" -> "Dispatch spec reviewer for task";
    "Dispatch spec reviewer for task" -> "Spec passes?";
    "Spec passes?" -> "Send fix instructions to implementer" [label="no"];
    "Send fix instructions to implementer" -> "Dispatch spec reviewer for task";
    "Spec passes?" -> "Dispatch code quality reviewer" [label="yes"];
    "Dispatch code quality reviewer" -> "Quality passes?";
    "Quality passes?" -> "Send quality fix instructions" [label="no"];
    "Send quality fix instructions" -> "Dispatch code quality reviewer";
    "Quality passes?" -> "Mark task complete" [label="yes"];
    "Mark task complete" -> "More tasks to assign?";
    "More tasks to assign?" -> "Assign next batch to idle implementers" [label="yes"];
    "Assign next batch to idle implementers" -> "Implementers work in parallel";
    "More tasks to assign?" -> "All tasks complete" [label="no"];
    "All tasks complete" -> "Shutdown team";
    "Shutdown team" -> "Final code review + finishing-a-development-branch";
}
\`\`\`

### Key Constraints in Team Mode

- **Review gates are still sequential per task:** spec review must pass before code quality review
- **Dependent tasks must wait:** only dispatch tasks whose dependencies are complete
- **Implementers on different tasks in parallel is OK:** they work on separate files
- **Implementers on the same task is NOT OK:** one implementer per task
- **Team lead handles review dispatch:** don't delegate review scheduling to implementers
- **Use SendMessage for fix instructions:** when a reviewer finds issues, message the implementer with specific fixes needed
- **Use shared TaskList for tracking:** all task state lives in the team's task list

### Team Lifecycle

1. **Create:** `TeamCreate` at start of execution
2. **Staff:** Spawn implementer agents as team members via `Task` with `team_name`
3. **Assign:** Create tasks via `TaskCreate`, assign via `TaskUpdate` with `owner`
4. **Coordinate:** Use `SendMessage` for review feedback, fix instructions
5. **Shutdown:** Send `shutdown_request` to all team members when complete
6. **Cleanup:** `TeamDelete` after all members shut down
```

**Step 2: Commit**

```bash
git add skills/subagent-driven-development/SKILL.md
git commit -m "feat(subagent-driven-dev): add team mode process flow and constraints"
```

---

### Task 4: Add team mode to `dispatching-parallel-agents`

Add a team-based alternative to the current parallel Task dispatch.

**Files:**
- Modify: `skills/dispatching-parallel-agents/SKILL.md` (add Team Mode section after The Pattern)

**Step 1: Add Team Mode section**

Insert after "The Pattern" section (after Step 4: Review and Integrate):

```markdown
## Team Mode (Claude Code Only)

If `TeamCreate` is available and the user opts in, use a coordinated team instead of individual `Task` calls.

### Standard Mode vs Team Mode

| Aspect | Standard (Task calls) | Team Mode |
|--------|----------------------|-----------|
| Dispatch | Individual `Task` tool calls | `TeamCreate` + team members |
| Communication | None between agents | `SendMessage` for sharing findings |
| Progress tracking | Wait for Task return | Shared `TaskList` with live status |
| Result collection | Read each Task result | Agents report via messages + TaskUpdate |
| Best for | Quick independent investigations | Longer investigations needing coordination |

### When to Prefer Team Mode

- Investigations may need to share context mid-flight (e.g., "I found the root cause is in module X, check if it affects your area too")
- More than 3 parallel agents (better lifecycle management)
- Agents may discover dependencies during investigation

### Team Mode Pattern

1. **Create team:** `TeamCreate` with descriptive name
2. **Spawn investigators:** One team member per independent domain
3. **Let them work:** Agents investigate, can message each other if relevant findings
4. **Collect results:** Team lead monitors `TaskList`, reads agent messages
5. **Integrate:** Same as standard - verify fixes don't conflict, run full suite
6. **Shutdown:** `shutdown_request` to all members, then `TeamDelete`
```

**Step 2: Commit**

```bash
git add skills/dispatching-parallel-agents/SKILL.md
git commit -m "feat(dispatching-parallel): add team mode as alternative to Task dispatch"
```

---

### Task 5: Add team mode to `executing-plans`

Add within-batch parallelism via teams.

**Files:**
- Modify: `skills/executing-plans/SKILL.md` (add Team Mode section after Step 5)

**Step 1: Add Team Mode section**

Insert before "When to Stop and Ask for Help":

```markdown
### Team Mode (Claude Code Only)

If `TeamCreate` is available and the user opted in during the writing-plans handoff, parallelize tasks within each batch.

**What changes:**
- Step 2 (Execute Batch): Instead of executing 3 tasks sequentially, spawn a team and assign batch tasks to team members working in parallel
- Step 3 (Report): Wait for all batch members to complete, then report combined results
- Steps 1, 4, 5: Unchanged (plan review, feedback loop, and completion stay the same)

**What doesn't change:**
- Batch boundaries and human review checkpoints remain
- Default batch size is still 3 tasks
- "Ready for feedback" checkpoint after each batch
- The human-in-the-loop approval between batches is preserved

**Team lifecycle per batch:**
1. `TeamCreate` for the batch
2. Assign batch tasks to team members
3. Wait for all to complete
4. Report results, wait for feedback
5. `TeamDelete` (or reuse for next batch)
```

**Step 2: Commit**

```bash
git add skills/executing-plans/SKILL.md
git commit -m "feat(executing-plans): add team mode for within-batch parallelism"
```

---

### Task 6: Update Red Flags and cross-platform notes

Add team-specific red flags and ensure cross-platform safety is documented.

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md` (Red Flags section)
- Modify: `skills/dispatching-parallel-agents/SKILL.md` (When NOT to Use section)

**Step 1: Add team-specific red flags to subagent-driven-development**

Add to the existing "Never:" list:

```markdown
**Team mode specific - Never:**
- Use team mode when `TeamCreate` is not available (fall back to standard mode)
- Assume team mode works on non-Claude-Code environments (Codex, OpenCode)
- Skip the user choice - always ask before spawning a team
- Let implementers self-assign tasks (team lead assigns via TaskUpdate)
- Forget to shutdown the team (always send shutdown_request + TeamDelete)
```

**Step 2: Add cross-platform note to dispatching-parallel-agents**

Add a note in the "When NOT to Use" section:

```markdown
**Cross-platform note:** Team mode requires Claude Code with teams enabled (beta).
On Codex, OpenCode, or Claude Code without teams, use the standard parallel Task dispatch.
Always detect capability before offering team mode.
```

**Step 3: Commit**

```bash
git add skills/subagent-driven-development/SKILL.md skills/dispatching-parallel-agents/SKILL.md
git commit -m "feat: add team-specific red flags and cross-platform safety notes"
```

---

### Task 7: Final review and integration test

Verify all changes are consistent and the skills work together.

**Step 1: Read all modified files end-to-end**

Verify:
- `writing-plans` offers 3 execution options (with detection)
- `subagent-driven-development` has both standard and team mode paths
- `dispatching-parallel-agents` has team mode alternative
- `executing-plans` has within-batch parallelism option
- All team features are gated behind detection
- No skill breaks when `TeamCreate` is unavailable
- Cross-platform notes are present

**Step 2: Verify decision tree consistency**

Trace the full flow:
1. `writing-plans` → user chooses team-based → routes to `subagent-driven-development (team mode)`
2. `subagent-driven-development` → detects TeamCreate → offers team mode → spawns team
3. `dispatching-parallel-agents` → detects TeamCreate → offers team mode → spawns team
4. `executing-plans` → detects TeamCreate → parallelizes within batch

**Step 3: Commit any fixes found during review**

```bash
git add -A
git commit -m "fix: address integration issues found during final review"
```
