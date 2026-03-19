# cortx-skills — Design Spec

> Fork of [superpowers](https://github.com/obra/superpowers), deeply integrated with cortx MCP for AI-native development orchestration.

## Overview

cortx-skills replaces superpowers with a cortx-native skill set. Every skill uses cortx as its backbone: commands go through `proxy_exec`, task tracking through `planning_*`, context through `memory_*`. A new `/cortx:auto` skill adds a fully autonomous orchestration mode.

**Hard dependency:** cortx MCP server must be running. No fallback, no graceful degradation.

**Replaces superpowers entirely.** Users install cortx-skills instead of superpowers — do not install both. All internal cross-references use the `cortx:` namespace.

## Prerequisites — cortx MCP Tools

The following tools exist today in cortx:

| Tool | Status |
|------|--------|
| `proxy_exec`, `proxy_rollback`, `proxy_status` | Shipped |
| `memory_recall`, `memory_store`, `memory_status` | Shipped |
| `planning_decompose` | Shipped (needs `acceptance_criteria` field added) |
| `planning_claim_task` | Shipped (needs optional `task_id` param for DAG-ordered claiming) |
| `planning_release_task` | Shipped |
| `session_report` | Shipped |

The following tools must be added to cortx before cortx-skills can be fully functional:

| Tool | Description | Blocker for |
|------|-------------|-------------|
| `planning_validate_gates` | Run quality gates (clippy, test, build) via MCP | executing-plans, auto |
| `planning_escalate` | Escalate task with comment + label | executing-plans, auto |
| `planning_complete_task` | Mark task as done on board | finishing |
| `planning_list_tasks` | List tasks on a board (with status/deps) | writing-plans, auto |

The logic for `validate_gates` and `escalate` already exists in `orchestrator.rs` and `gates.rs` — they just need MCP tool wrappers.

Additionally, `planning_claim_task` currently claims the next available task (`board_id + agent_id`). For DAG-ordered execution, it needs an optional `task_id` parameter to claim a specific task. And `planning_decompose` needs an `acceptance_criteria` field on each task.

## Two Modes

### Architecte Mode (human-in-the-loop)

The existing superpowers workflow, adapted to use cortx:

```
/cortx:brainstorming → /cortx:writing-plans → /cortx:executing-plans → /cortx:finishing
```

The human drives each phase. cortx provides memory, safe execution, and board tracking under the hood. This is the default — every `/cortx:*` skill works in this mode.

### Auto Mode (autonomous orchestrator)

A new skill: `/cortx:auto "objective"`. An orchestrator agent takes an objective and drives it to completion autonomously, dispatching sub-agents for each task.

```
/cortx:auto "Implement task dependencies (blocked-by/blocks)"
```

The orchestrator decomposes, dispatches, reviews, fixes, and advances without human intervention — unless a configurable gate requires approval.

## Architecture

### Plugin Structure

```
cortx-skills/
├── .claude-plugin/
│   └── plugin.json
├── hooks/
│   └── session-start
├── skills/
│   ├── auto/                    # NEW — autonomous orchestrator
│   ├── brainstorming/           # adapted
│   ├── writing-plans/           # adapted
│   ├── executing-plans/         # adapted (deep)
│   ├── tdd/                     # adapted
│   ├── debugging/               # adapted
│   ├── requesting-code-review/  # adapted
│   ├── receiving-code-review/   # adapted
│   ├── subagent-dev/            # adapted (deep)
│   ├── using-cortx/             # adapted (replaces using-superpowers)
│   ├── worktrees/               # unchanged
│   ├── finishing/               # adapted
│   ├── verification/            # adapted
│   ├── parallel-agents/         # unchanged
│   └── writing-skills/          # unchanged
├── agents/
│   ├── orchestrator.md          # NEW — auto mode brain
│   ├── implementer.md           # adapted
│   ├── spec-reviewer.md         # adapted
│   └── code-reviewer.md         # adapted
└── README.md
```

### Namespace

All skills use the `cortx:` prefix: `/cortx:brainstorming`, `/cortx:tdd`, `/cortx:auto`, etc.

### Meta-Skill: `using-cortx`

Replaces superpowers' `using-superpowers`. This is the meta-skill that governs skill discovery and activation. It:

- References all skills with the `cortx:` prefix
- Explains the cortx MCP dependency
- Establishes the "check for skills before any action" rule (same as superpowers)

### Session Start Hook

The session-start hook (shell script in `hooks/`) runs at Claude Code plugin initialization, same mechanism as superpowers. It:

1. **Verifies cortx MCP** — calls `memory_status` via the MCP tool. If unreachable: outputs a warning message "cortx MCP not connected" as `additionalContext`. The `using-cortx` meta-skill instructions tell the LLM to check for this warning and inform the user.
2. **Loads project context** — calls `memory_recall` with the current working directory. Retrieved hints (past decisions, error patterns, causal chains) are injected as `additionalContext`.
3. **Injects the `using-cortx` skill content** into the session, same as superpowers injects `using-superpowers`.

Memory injection is on by default. Users can disable it by adding `cortx: skip memory on start` to their CLAUDE.md — the hook checks for this before calling `memory_recall`.

## Cortx Integration Per Skill

### Principle: proxy_exec everywhere

Every command executed by any skill (test, build, clippy, git, etc.) goes through `proxy_exec`. Never direct `Bash` for project commands. This gives: git checkpoints, budget tracking, tier classification, and audit trail — for free.

### Light Adaptation (logic unchanged, cortx calls added)

**tdd**
- `proxy_exec` for all test runs
- `memory_recall` before writing a test — "have we seen a similar pattern?"
- `memory_store` when a new test pattern is discovered

**debugging**
- `memory_recall` in Phase 1 (root cause investigation) — "does this bug look familiar?"
- `proxy_exec` for all investigation commands
- `memory_store` to persist the root cause + fix for future sessions

**verification**
- `proxy_exec` for all verification commands

**worktrees**
- Unchanged — pure git operations, cortx adds nothing here

**parallel-agents**
- Unchanged in mechanics — sub-agents use `proxy_exec` internally

**writing-skills**
- Unchanged — meta-skill for creating skills

### Medium Adaptation (enriched flow)

**brainstorming**
- `memory_recall` at start — retrieve past design decisions related to the topic
- `memory_store` at end — persist design decisions for future sessions
- Otherwise identical process (questions, approaches, design sections, spec review)

**writing-plans**
- `memory_recall` to find similar past implementations
- **Mandatory:** call `planning_decompose` to create tasks on the kanban board with dependencies between them. The board is the source of truth for task status and ordering.
- A plan markdown file is still written (same format as superpowers) containing detailed implementation notes, code snippets, and file paths. This serves as reference material that the implementer agent receives alongside the board task.
- Tasks on the board include: title, description, acceptance criteria (embedded in description until the field is added to `planning_decompose`), priority, and `depends_on` references.
- There is a 1:1 mapping between plan steps and board tasks.

**requesting-code-review / receiving-code-review**
- `memory_recall` for context (original spec, past decisions)
- `memory_store` for important findings
- Otherwise same review process

**finishing**
- `session_report` to generate session summary
- `planning_complete_task` to mark tasks as done on the board
- Otherwise same options (merge, PR, keep, discard)

### Deep Adaptation (rethought flow)

**executing-plans**
- Entire cycle goes through cortx:
  1. `planning_claim_task` — atomic lock
  2. `memory_recall` — context for this specific task
  3. `proxy_exec` — all commands
  4. `planning_validate_gates` — quality checks (clippy, test, build)
  5. `planning_release_task` — done or failed
- On failure: retry with enriched error context
- On repeated failure: `planning_escalate` → `needs-human` label, move to next task

**subagent-dev**
- Same as executing-plans but orchestrator dispatches sub-agents
- Orchestrator claims the task, dispatches implementer, reviews result, then releases
- Each sub-agent uses `proxy_exec` for all commands

## Auto Mode — `/cortx:auto`

### Entry

```
/cortx:auto "Implement task dependencies (blocked-by/blocks)"
```

### Startup Confirmation

Before starting, the orchestrator displays its configuration and asks for confirmation:

```
Objective understood. Here's my config:
  ✓ Plan approval before execution
  ✓ Review after each task
  ✓ Approval before merge
  ✓ Max 3 retries before escalation
  ✓ 2 parallel agents

Go? (or adjust what you want)
```

Defaults are hardcoded in the skill. The user confirms or adjusts conversationally. No config file.

### Flow

```
1. INIT
   ├── Read config defaults, confirm with user
   ├── memory_recall (project context, past patterns)
   └── proxy_status (remaining budget)

2. DECOMPOSE
   ├── Analyze the objective
   ├── planning_decompose → create tasks on board with dependency DAG
   ├── [GATE: approve_decomposition] → human pause if enabled
   └── Result: ordered task list respecting dependency graph

3. EXECUTE (loop per task, respects DAG order)
   │
   ├── planning_claim_task (atomic lock)
   ├── memory_recall (context specific to this task)
   ├── [GATE: approve_each_task] → human pause if enabled
   │
   ├── Dispatch sub-agent (implementer) — always a FRESH agent per attempt
   │   ├── Receives: full task + memory context
   │   ├── Uses proxy_exec for everything
   │   ├── Commits work
   │   └── Returns: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
   │
   ├── If NEEDS_CONTEXT → orchestrator enriches via memory_recall + codebase grep
   │   └── Re-dispatch fresh implementer with enriched context (counts as retry)
   │
   ├── If DONE_WITH_CONCERNS → orchestrator evaluates concerns
   │   └── If concern is blocking → treat as BLOCKED; else proceed to review
   │
   ├── If BLOCKED → retry ≤ max_retries_before_escalate
   │   ├── Re-dispatch FRESH agent with: previous error output + memory_recall for similar errors
   │   └── If still blocked → planning_escalate + move to next task
   │
   ├── Max retries apply to ALL non-DONE statuses combined (BLOCKED + NEEDS_CONTEXT + review failures)
   │
   ├── REVIEW (if enabled)
   │   ├── Dispatch spec-reviewer → spec compliance
   │   ├── If fail → re-dispatch implementer with feedback
   │   ├── Dispatch code-reviewer → code quality
   │   └── If fail → re-dispatch implementer with feedback
   │
   ├── planning_validate_gates (clippy, test, build)
   │   └── If fail → re-dispatch implementer
   │
   ├── planning_release_task (done)
   ├── memory_store (patterns discovered, decisions made)
   └── Next task

4. PARALLEL (if parallel_agents > 1)
   └── Tasks with no dependency between them execute concurrently
       via Agent tool with isolated worktrees

5. FINISH
   ├── planning_validate_gates (full final suite)
   ├── session_report (session summary)
   ├── [GATE: approve_before_merge] → human pause if enabled
   └── Invoke /cortx:finishing (merge / PR / keep)
```

### Error Handling

| Situation | Behavior |
|-----------|----------|
| Sub-agent BLOCKED | Retry with enriched context (max `max_retries_before_escalate`) |
| Retries exhausted | `planning_escalate` → `needs-human` label, skip to next task |
| Gates fail | Re-dispatch implementer with exact error |
| Proxy budget exhausted | Stop, `session_report`, inform human |
| All tasks escalated | Stop, summary of what blocked |

### Parallelism

The orchestrator reads the task dependency DAG from the board. If `parallel_agents = 2` and tasks A and B have no shared dependency, they dispatch simultaneously in separate worktrees. When one finishes, the next unblocked task launches.

**Worktree merge strategy:** Each parallel agent works in its own worktree (created via `git worktree add`). When an agent finishes, the orchestrator merges its branch back into the feature branch before dispatching the next dependent task. If a merge conflict occurs, the orchestrator attempts auto-resolution; if it fails, it escalates to the human. The merge happens sequentially — only one merge at a time — even if agents run in parallel.

### Configurable Gates

| Gate | Default | Effect |
|------|---------|--------|
| `approve_decomposition` | `true` | Pause after decomposition for human validation |
| `approve_before_merge` | `true` | Pause before merge/PR |
| `approve_each_task` | `false` | Pause between each task |
| `max_retries_before_escalate` | `3` | Retries before escalating to human |
| `parallel_agents` | `2` | Max concurrent sub-agents |
| `spec_compliance_review` | `true` | Run spec reviewer after each task |
| `code_quality_review` | `true` | Run code reviewer after each task |

## Agent Prompts

### Implementer

Receives:
- Full task (title, description, acceptance criteria, dependencies)
- Memory context (`memory_recall` — similar bugs, known patterns)
- Constraint: all commands via `proxy_exec`

Returns:
- `DONE` — task complete, tests pass
- `DONE_WITH_CONCERNS` — complete but doubts on a point (details provided)
- `NEEDS_CONTEXT` — missing information to proceed (specifies what's needed)
- `BLOCKED` — cannot proceed (details blockers)

### Spec Reviewer

Receives:
- Original objective + specific task
- Git diff (BASE_SHA → HEAD_SHA)
- Instruction: "do not trust the implementer's report, verify the code yourself"

Returns:
- `PASS` — spec compliant
- `FAIL` — list of specific gaps (file:line)

### Code Reviewer

Receives:
- Git diff
- Project context (CLAUDE.md, conventions)

Returns:
- Issues categorized (Critical / Important / Minor)
- Assessment: ready or not

## Cortx MCP Tools Used

### Shipped (available today)

| Tool | Used By |
|------|---------|
| `proxy_exec` | All skills — every command execution |
| `proxy_rollback` | debugging, executing-plans — rollback on failure |
| `proxy_status` | auto mode init — check budget |
| `memory_recall` | session-start, brainstorming, debugging, tdd, executing-plans, auto |
| `memory_store` | brainstorming, debugging, tdd, auto — persist learnings |
| `memory_status` | session-start — verify cortx connection |
| `planning_decompose` | writing-plans, auto — create tasks on board |
| `planning_claim_task` | executing-plans, subagent-dev, auto — atomic task lock |
| `planning_release_task` | executing-plans, subagent-dev, auto — release lock |
| `session_report` | finishing, auto — generate session summary |

### Must be added to cortx (logic exists, needs MCP wrapper)

| Tool | Used By | Existing code |
|------|---------|---------------|
| `planning_validate_gates` | executing-plans, auto — quality checks | `gates.rs` |
| `planning_escalate` | executing-plans, auto — escalate blocked tasks | `orchestrator.rs` |
| `planning_complete_task` | finishing — mark tasks done | `orchestrator.rs` |
| `planning_list_tasks` | writing-plans, auto — read board state | `kanwise::Kanwise` |

## What Does NOT Change

- The brainstorming process (questions, approaches, design sections, spec review loop)
- The TDD discipline (red-green-refactor, iron law)
- The debugging methodology (4 phases, no fixes without root cause)
- The verification rule (evidence before claims)
- The git worktree mechanics
- The agent prompt structure (implementer, spec-reviewer, code-reviewer)
- The code review categories (Critical / Important / Minor)

The processes are proven. We only change the infrastructure underneath.
