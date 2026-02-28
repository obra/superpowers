---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session
---

# Subagent-Driven Development

Execute plan by dispatching fresh subagent per task. Standard Mode: sequential two-pass review after each task — spec compliance first, then code quality. Team Mode: persistent validator agents run combined spec+quality review in a single pass, eliminating per-review startup overhead and enabling cross-task gap detection.

**Why subagents:** You delegate tasks to specialized agents with isolated context. By precisely crafting their instructions and context, you ensure they stay focused and succeed at their task. They should never inherit your session's context or history — you construct exactly what they need. This also preserves your own context for coordination work.

**Core principle:** Fresh subagent per task + evidence-cited review = high quality, fast iteration. Team mode adds persistent validators for speed and cross-task memory.

## When to Use

```dot
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
```

**vs. Executing Plans (parallel session):**
- Same session (no context switch)
- Fresh subagent per task (no context pollution)
- Evidence-cited review after each task (mandatory file:line citations)
- Faster iteration (no human-in-loop between tasks)

**Team mode vs. Standard mode:**
- True parallelism (multiple implementers working simultaneously on independent tasks)
- Persistent validators: no per-review startup overhead, cross-task gap detection
- Combined spec+quality review in a single pass (one agent call per task instead of two)
- Requires Claude Code with teams feature enabled

## The Process

```dot
digraph process {
    rankdir=TB;

    subgraph cluster_per_task {
        label="Per Task";
        "Dispatch implementer subagent (./implementer-prompt.md)" [shape=box];
        "Implementer subagent asks questions?" [shape=diamond];
        "Answer questions, provide context" [shape=box];
        "Implementer subagent implements, tests, commits, self-reviews" [shape=box];
        "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" [shape=box];
        "Spec reviewer subagent confirms code matches spec?" [shape=diamond];
        "Implementer subagent fixes spec gaps" [shape=box];
        "Dispatch code quality reviewer subagent (superpowers:requesting-code-review)" [shape=box];
        "Code quality reviewer subagent approves?" [shape=diamond];
        "Implementer subagent fixes quality issues" [shape=box];
        "Mark task complete in TodoWrite" [shape=box];
    }

    "Read plan, extract all tasks with full text, note context, create TodoWrite" [shape=box];
    "More tasks remain?" [shape=diamond];
    "Dispatch final code reviewer subagent for entire implementation" [shape=box];
    "Use superpowers:finishing-a-development-branch" [shape=box style=filled fillcolor=lightgreen];

    "Read plan, extract all tasks with full text, note context, create TodoWrite" -> "Dispatch implementer subagent (./implementer-prompt.md)";
    "Dispatch implementer subagent (./implementer-prompt.md)" -> "Implementer subagent asks questions?";
    "Implementer subagent asks questions?" -> "Answer questions, provide context" [label="yes"];
    "Answer questions, provide context" -> "Dispatch implementer subagent (./implementer-prompt.md)";
    "Implementer subagent asks questions?" -> "Implementer subagent implements, tests, commits, self-reviews" [label="no"];
    "Implementer subagent implements, tests, commits, self-reviews" -> "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)";
    "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" -> "Spec reviewer subagent confirms code matches spec?";
    "Spec reviewer subagent confirms code matches spec?" -> "Implementer subagent fixes spec gaps" [label="no"];
    "Implementer subagent fixes spec gaps" -> "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" [label="re-review"];
    "Spec reviewer subagent confirms code matches spec?" -> "Dispatch code quality reviewer subagent (superpowers:requesting-code-review)" [label="yes"];
    "Dispatch code quality reviewer subagent (superpowers:requesting-code-review)" -> "Code quality reviewer subagent approves?";
    "Code quality reviewer subagent approves?" -> "Implementer subagent fixes quality issues" [label="no"];
    "Implementer subagent fixes quality issues" -> "Dispatch code quality reviewer subagent (superpowers:requesting-code-review)" [label="re-review"];
    "Code quality reviewer subagent approves?" -> "Mark task complete in TodoWrite" [label="yes"];
    "Mark task complete in TodoWrite" -> "More tasks remain?";
    "More tasks remain?" -> "Dispatch implementer subagent (./implementer-prompt.md)" [label="yes"];
    "More tasks remain?" -> "Dispatch final code reviewer subagent for entire implementation" [label="no"];
    "Dispatch final code reviewer subagent for entire implementation" -> "Use superpowers:finishing-a-development-branch";
}
```

## Model Selection

Use the least powerful model that can handle each role to conserve cost and increase speed.

**Mechanical implementation tasks** (isolated functions, clear specs, 1-2 files): use a fast, cheap model. Most implementation tasks are mechanical when the plan is well-specified.

**Integration and judgment tasks** (multi-file coordination, pattern matching, debugging): use a standard model.

**Architecture, design, and review tasks**: use the most capable available model.

**Task complexity signals:**
- Touches 1-2 files with a complete spec → cheap model
- Touches multiple files with integration concerns → standard model
- Requires design judgment or broad codebase understanding → most capable model

## Handling Implementer Status

Implementer subagents report one of four statuses. Handle each appropriately:

**DONE:** Proceed to spec compliance review.

**DONE_WITH_CONCERNS:** The implementer completed the work but flagged doubts. Read the concerns before proceeding. If the concerns are about correctness or scope, address them before review. If they're observations (e.g., "this file is getting large"), note them and proceed to review.

**NEEDS_CONTEXT:** The implementer needs information that wasn't provided. Provide the missing context and re-dispatch.

**BLOCKED:** The implementer cannot complete the task. Assess the blocker:
1. If it's a context problem, provide more context and re-dispatch with the same model
2. If the task requires more reasoning, re-dispatch with a more capable model
3. If the task is too large, break it into smaller pieces
4. If the plan itself is wrong, escalate to the human

**Never** ignore an escalation or force the same model to retry without changes. If the implementer said it's stuck, something needs to change.

## Prompt Templates

**Standard mode:**
- `./implementer-prompt.md` - Implementer subagent
- `./spec-reviewer-prompt.md` - Spec compliance reviewer (standard mode only)
- `superpowers:requesting-code-review` — Code quality reviewer (standard mode only, dispatched after spec passes)

**Team mode:**
- `./implementer-prompt.md` - Implementer subagent (same template)
- `./validator-prompt.md` - Persistent validator (combined spec+quality, used by validator team members)

## Team Mode (Claude Code Only)

When `TeamCreate` is available and the user opts in, use this flow instead of standard sequential execution.

**Pre-Flight (required — do this before `TeamCreate`):** The team lead is this session. As the plan executes, this session's context fills with task reports, verdicts, and coordination messages. Once it fills, orchestration stops mid-plan. Implementer and validator agents start fresh regardless, so compacting only benefits the lead.

Before spawning the team, you MUST check context state and prompt the user:

> "Before I create the team: this session will act as team lead for the full plan. Its context fills as tasks complete — if it runs out mid-plan, orchestration stops. **How much context do you have left?** If you're below ~50% or have had a long conversation already, run `/compact` now before I proceed."

Wait for their answer. If they're context-constrained or unsure, tell them to run `/compact` and wait for confirmation before calling `TeamCreate`. Do not skip this check.

**Prerequisite:** Run the SDK memory validation test (see design doc) before first use. Confirm team members retain conversation context between `SendMessage` calls.

**Core difference:** Persistent validator agents replace fresh-subagent-per-review. Validators accumulate codebase context across tasks and run combined spec+quality review in a single pass.

### Team Composition

- **Team Lead (you):** Orchestrates work, assigns tasks, routes reviews, handles escalations
- **Implementer agents:** One per independent task group, spawned as team members, work in parallel
- **Validator agents (2):** Persistent team members, each handles combined spec+quality review. Declared idle/busy via TaskUpdate.

```
Team:
  - team-lead (you)
  - implementer-1, implementer-2, implementer-3   ← parallel, one per task group
  - validator-1, validator-2                       ← persistent, combined spec+quality
```

### Team Mode Process

```dot
digraph team_process {
    rankdir=TB;

    "Read plan, extract tasks, identify independent groups" [shape=box];
    "TeamCreate: spawn implementers + 2 validators" [shape=box];
    "Assign independent tasks to implementers via TaskCreate + TaskUpdate" [shape=box];
    "Implementers work in parallel" [shape=box];
    "Implementer N finishes, sends report to team lead" [shape=box];

    subgraph cluster_per_task {
        label="Per Completed Task (team lead orchestrates)";
        "Find idle validator (awaiting verdict from last review?)" [shape=box];
        "Send review request to idle validator via SendMessage" [shape=box];
        "Validator runs combined spec+quality review" [shape=box];
        "Verdict: APPROVED?" [shape=diamond];
        "Send fix instructions to implementer N" [shape=box];
        "Cycle count < 3?" [shape=diamond];
        "Escalate to human: sticking point" [shape=box];
        "Mark task complete" [shape=box];
    }

    "More tasks to assign?" [shape=diamond];
    "Assign next batch to idle implementers" [shape=box];
    "All tasks complete" [shape=box];
    "Shutdown team (shutdown_request to all members, TeamDelete)" [shape=box];
    "Final code review + finishing-a-development-branch" [shape=box style=filled fillcolor=lightgreen];

    "Read plan, extract tasks, identify independent groups" -> "TeamCreate: spawn implementers + 2 validators";
    "TeamCreate: spawn implementers + 2 validators" -> "Assign independent tasks to implementers via TaskCreate + TaskUpdate";
    "Assign independent tasks to implementers via TaskCreate + TaskUpdate" -> "Implementers work in parallel";
    "Implementers work in parallel" -> "Implementer N finishes, sends report to team lead";
    "Implementer N finishes, sends report to team lead" -> "Find idle validator (awaiting verdict from last review?)";
    "Find idle validator (awaiting verdict from last review?)" -> "Send review request to idle validator via SendMessage";
    "Send review request to idle validator via SendMessage" -> "Validator runs combined spec+quality review";
    "Validator runs combined spec+quality review" -> "Verdict: APPROVED?";
    "Verdict: APPROVED?" -> "Send fix instructions to implementer N" [label="no"];
    "Send fix instructions to implementer N" -> "Cycle count < 3?";
    "Cycle count < 3?" -> "Send review request to idle validator via SendMessage" [label="yes, re-review"];
    "Cycle count < 3?" -> "Escalate to human: sticking point" [label="no, escalate"];
    "Verdict: APPROVED?" -> "Mark task complete" [label="yes"];
    "Mark task complete" -> "More tasks to assign?";
    "More tasks to assign?" -> "Assign next batch to idle implementers" [label="yes"];
    "Assign next batch to idle implementers" -> "Implementers work in parallel";
    "More tasks to assign?" -> "All tasks complete" [label="no"];
    "All tasks complete" -> "Shutdown team (shutdown_request to all members, TeamDelete)";
    "Shutdown team (shutdown_request to all members, TeamDelete)" -> "Final code review + finishing-a-development-branch";
}
```

### Routing a Review Request

When sending a review request to a validator via `SendMessage`, include:

```
Task spec: [FULL TEXT of task requirements]
Implementer report: [full report including test output, diff stat, files changed]
BASE_SHA: [commit before this task]
HEAD_SHA: [current HEAD after implementer's commit]
SHA map (for dependency re-reads): [dict of prior task → their HEAD_SHA, e.g. {"task-1": "abc123", "task-2": "def456"}]
```

The SHA map lets the validator re-read prior task diffs when it infers dependencies from the task spec. Team lead maintains this map as tasks complete.

### Validator Idle State Tracking

Validator agents (2) declare their state via TaskUpdate: `in_progress` when they receive a review request, `completed` when they return a verdict. Team lead relies on this TaskUpdate state as the authoritative availability signal. Team lead also observes message flow as a secondary activity indicator — a validator is treated as busy from the moment they receive a review request until their verdict arrives. Team lead does not send a second review to a validator before receiving their verdict for the first.

Validators notify the team lead when their verdict is ready via `SendMessage` and update their TaskUpdate state to `completed`. The team lead checks TaskUpdate state before routing any new review request.

### Re-Review Loop Bound

Maximum **3 review cycles per task.** After 3 rejections, team lead pauses plan execution, reports the sticking point (with full rejection history) to the human, and waits for guidance. Do not continue to other tasks while a task is stuck.

### Context Poisoning Mitigations

**Proactive (re-read rule):** When reviewing task N, validators must re-read the git diff of any prior task they infer as a dependency (from the task spec text). They use the SHA map from the review request. Memory of prior approvals is not substituted for reading source.

**Reactive (bounded re-open):** If a downstream task's review reveals an upstream approval was wrong, team lead may flag the upstream task for one re-review. Cap: one re-open per task.

**Re-open cascade:** When task N is re-opened:
- Downstream tasks in-progress: pause them (send hold instruction to implementer) until task N fix is confirmed
- Downstream tasks completed: flag them for re-review after task N fix is confirmed

**Validator rotation (large plans):** For plans with more than 8 tasks, replace a validator with a fresh one after every 5 tasks that validator has reviewed. Note: this partially resets cross-task memory for exactly the plans most likely to have cross-task gaps. The re-read rule still protects dependencies that are stated explicitly in the task spec; undeclared implicit dependencies may not be caught post-rotation. This tradeoff (bounded context cost vs. full cross-task coverage) is intentional.

**Rotation handoff:** Before retiring the outgoing validator, ask it to send you a brief dependency summary of any cross-task relationships it observed (e.g., "task 3 uses the auth helper from task 1; task 5 extends the schema from task 2"). Include this summary in the first review request to the incoming validator. This preserves the most critical cross-task knowledge across the rotation boundary.

### Validator Failure Recovery

If a validator does not respond within 60 seconds of receiving a review request:
1. Team lead sends one follow-up ping
2. If no response within 30 more seconds: treat validator as failed
3. Fall back to a fresh subagent review for that task using `validator-prompt.md`
4. Mark the failed validator's slot unavailable; do not reuse it

### Key Constraints in Team Mode

- **One implementer per task** — never assign two implementers to the same task (conflicts)
- **One validator per active review** — don't send a review to a validator before receiving their verdict for the prior one
- **Cycle cap is 3** — after 3 rejections, escalate to human, do not continue looping
- **SHA map is required** — team lead maintains it; validators cannot re-read dependencies without it
- **Team lead assigns via TaskUpdate** — implementers do not self-assign tasks
- **Shutdown protocol required** — always send `shutdown_request` to all members before `TeamDelete`
- **Never dispatch a fresh review subagent when a validator is available** — use the persistent validator
- **Validator approval of a re-opened task is required before re-reviewing its dependents**
- **Never skip the pre-flight context check** — ask the user about context state before `TeamCreate`; if they're below ~50% remaining, wait for `/compact` before proceeding

### Team Lifecycle

1. Ask user about context state; wait for `/compact` if below ~50% remaining, then `TeamCreate`
2. Spawn implementers and 2 validators via Agent tool with `team_name`
3. Assign initial independent tasks via TaskCreate + TaskUpdate
4. As tasks complete: route to idle validator, handle verdict, assign next tasks
5. When all tasks complete: send `shutdown_request` to all, `TeamDelete`
6. Final code review + `finishing-a-development-branch`

## Example Workflow

```
You: I'm using Subagent-Driven Development to execute this plan.

[Read plan file once: docs/superpowers/plans/feature-plan.md]
[Extract all 5 tasks with full text and context]
[Create TodoWrite with all tasks]

Task 1: Hook installation script

[Get Task 1 text and context (already extracted)]
[Dispatch implementation subagent with full task text + context]

Implementer: "Before I begin - should the hook be installed at user or system level?"

You: "User level (~/.config/superpowers/hooks/)"

Implementer: "Got it. Implementing now..."
[Later] Implementer:
  - Implemented install-hook command
  - Added tests, 5/5 passing
  - Self-review: Found I missed --force flag, added it
  - Committed

[Dispatch spec compliance reviewer]
Spec reviewer: ✅ Spec compliant
  - [requirement 1] → `file:line` — [excerpt]
  - [requirement 2] → `file:line` — [excerpt]

[Get git SHAs, dispatch code quality reviewer via superpowers:requesting-code-review]
Code reviewer: Strengths: Good test coverage, clean. Issues: None. ✅ Approved.

[Mark Task 1 complete]

Task 2: Recovery modes

[Get Task 2 text and context (already extracted)]
[Dispatch implementation subagent with full task text + context]

Implementer: [No questions, proceeds]
Implementer:
  - Added verify/repair modes
  - 8/8 tests passing
  - Self-review: All good
  - Committed

[Dispatch spec compliance reviewer]
Spec reviewer: ❌ Issues:
  - Missing: Progress reporting (spec says "report every 100 items") → no `file:line` found
  - Extra: Added --json flag (not requested)

[Implementer fixes issues]
Implementer: Removed --json flag, added progress reporting

[Spec reviewer reviews again]
Spec reviewer: ✅ Spec compliant now
  - Requirement "report every 100 items" → `src/recovery.py:58` — `if count % 100 == 0: report(count)`

[Dispatch code quality reviewer via superpowers:requesting-code-review]
Code reviewer: Strengths: Solid. Issues (Important): Magic number (100) → extract constant

[Implementer fixes]
Implementer: Extracted PROGRESS_INTERVAL constant

[Code reviewer reviews again]
Code reviewer: ✅ Approved

[Mark Task 2 complete]

...

[After all tasks]
[Dispatch final code-reviewer]
Final reviewer: All requirements met, ready to merge

Done!
```

### Team Mode Example Workflow

```
You: I'm using Subagent-Driven Development (team mode) for this plan.

[Pre-flight: "How much context do you have left? If below ~50%, run /compact before I proceed."]
[Wait for user confirmation before continuing]

[Read plan, extract 5 tasks, identify 3 independent groups]
[TeamCreate team "impl-plan"]
[Spawn: implementer-1, implementer-2, implementer-3, validator-1, validator-2]
[SHA map: {}  <- empty at start, grows as tasks complete]

[Assign Task 1 to implementer-1, Task 2 to implementer-2, Task 4 to implementer-3]
[Implementers work in parallel]

implementer-2 (Task 2 finishes first):
  - Added feature X
  - 8/8 tests passing, test output: [...]
  - git diff --stat: 3 files, +120/-5 lines
  - Committed (HEAD: abc1234)

[Check TaskList - validator-1 is idle]
[SendMessage to validator-1: Task 2 spec + report + BASE=..., HEAD=abc1234, SHA map={}]
[TaskUpdate validator-1 task: in_progress]

implementer-1 (Task 1 finishes):
  - Implemented hook installer
  - 5/5 tests passing
  - Committed (HEAD: def5678)

[Check TaskList - validator-2 is idle, validator-1 still reviewing Task 2]
[SendMessage to validator-2: Task 1 spec + report + BASE=..., HEAD=def5678, SHA map={}]

validator-1 (Task 2 verdict):
  Spec Compliance:
    Requirement "does X" -> `src/feature.py:42` - `def do_x(input): ...`  ✅
    Requirement "handles Y" -> MISSING - no implementation found
  Code Quality: Strengths: clean. Issues: none.
  Verdict: NEEDS FIXES - implement Y handling

[SHA map: {task-2: abc1234}]
[SendMessage to implementer-2: fix Y handling as specified in requirement 3]

validator-2 (Task 1 verdict):
  Spec Compliance:
    Requirement "installs hook" -> `scripts/install.sh:15` - `cp hook.sh ~/.config/...`  ✅
    Requirement "supports --force" -> `scripts/install.sh:28` - `if [[ "$1" == "--force" ]]`  ✅
  Code Quality: Strengths: good tests. Issues (Minor): no error on missing dir.
  Verdict: APPROVED (minor noted, not blocking)

[Mark Task 1 complete. SHA map: {task-1: def5678, task-2: abc1234}]
[Assign Task 3 to implementer-1 (now idle)]

implementer-2 (Task 2 fix):
  - Added Y handling, 10/10 tests passing
  - Committed (HEAD: ghi9012)

[SendMessage to validator-1: Task 2 re-review, HEAD=ghi9012, SHA map={task-1: def5678}]

validator-1 (Task 2 re-review):
  Requirement "handles Y" -> `src/feature.py:67` - `def handle_y(input): ...`  ✅
  Verdict: APPROVED

[Mark Task 2 complete. SHA map updated.]
...
```

## Advantages

**vs. Manual execution:**
- Subagents follow TDD naturally
- Fresh context per task (no confusion)
- Parallel-safe (subagents don't interfere)
- Subagent can ask questions (before AND during work)

**vs. Executing Plans:**
- Same session (no handoff)
- Continuous progress (no waiting)
- Review checkpoints automatic

**Team mode adds:**
- No per-review startup overhead (validators are already running)
- Combined spec+quality in one pass (one validator call per task)
- Cross-task gap detection (validators re-read dependencies from VCS, not memory)
- Reviews run concurrently with ongoing implementation
- Lean team lead context (compact before spawning keeps orchestration turns fast)

**Efficiency gains:**
- No file reading overhead (controller provides full text)
- Controller curates exactly what context is needed
- Subagent gets complete information upfront
- Questions surfaced before work begins (not after)

**Quality gates:**
- Self-review catches issues before handoff
- Standard mode: two-stage review (spec compliance, then code quality)
- Team mode: single-pass validator (combined spec+quality, one call per task)
- Review loops ensure fixes actually work
- Spec compliance prevents over/under-building
- Code quality ensures implementation is well-built

**Cost:**
- Team mode: implementer invocations + 1 validator call per task (down from 2 in standard mode)
- Standard mode: implementer + 2 reviewer invocations per task
- Controller does more prep work (extracting all tasks upfront)
- Review loops add iterations
- Team lead context grows across tasks — pre-flight check prompts user to compact if below ~50% remaining; a full team lead context stops orchestration mid-plan
- But catches issues early (cheaper than debugging later)

## Red Flags

**Never:**
- Start implementation on main/master branch without explicit user consent
- Skip reviews (in standard mode: spec compliance AND quality; in team mode: the validator pass)
- Proceed with unfixed issues
- Dispatch multiple implementation subagents in parallel on the same task (conflicts)
- Make subagent read plan file (provide full text instead)
- Skip scene-setting context (subagent needs to understand where task fits)
- Ignore subagent questions (answer before letting them proceed)
- Accept "close enough" on spec compliance (citation missing = not done)
- Skip review loops (reviewer found issues = implementer fixes = review again)
- Let implementer self-review replace actual review (both are needed)
- **Standard mode only:** Start code quality review before spec compliance is ✅ (wrong order)
- Move to next task while any review has open issues
- **Team mode only:** Send a review to a validator before receiving their verdict for the previous review
- **Team mode only:** Dispatch a fresh review subagent when a validator is available (use the validator)
- **Team mode only:** Exceed 3 review cycles without escalating to human
- **Team mode only:** Skip the SHA map in review requests (validators cannot re-read dependencies without it)
- Accept a ✅ verdict that has no per-requirement file:line citations (invalid — request re-review)
- **Team mode only:** Skip the pre-flight context check — always ask the user about remaining context before `TeamCreate`; proceeding with a near-full context will cause orchestration to fail mid-plan

**If subagent asks questions:**
- Answer clearly and completely
- Provide additional context if needed
- Don't rush them into implementation

**If reviewer finds issues:**
- Standard mode: Implementer (same subagent) fixes them, re-dispatch reviewer
- Team mode: `SendMessage` to the implementer with specific fix instructions, route back to idle validator
- Repeat until approved (max 3 cycles in team mode — escalate to human after 3 rejections)
- Don't skip the re-review

**If subagent fails task:**
- Dispatch fix subagent with specific instructions
- Don't try to fix manually (context pollution)

## Integration

**Required workflow skills:**
- **superpowers:using-git-worktrees** - REQUIRED: Set up isolated workspace before starting
- **superpowers:writing-plans** - Creates the plan this skill executes
- **superpowers:requesting-code-review** - Code review template for reviewer subagents
- **superpowers:finishing-a-development-branch** - Complete development after all tasks

**Subagents should use:**
- **superpowers:test-driven-development** - Subagents follow TDD for each task

**Alternative workflow:**
- **superpowers:executing-plans** - Use for parallel session instead of same-session execution
