# cortx-skills

AI-native development workflow for coding agents, deeply integrated with [cortx](https://github.com/tienedev/cortx) MCP for orchestrated software development.

Fork of [superpowers](https://github.com/obra/superpowers) by Jesse Vincent ([@obra](https://github.com/obra)).

> **cortx-skills replaces superpowers entirely.** Do not install both.

## Prerequisites

- **cortx binary** installed and on your PATH
- **cortx MCP server running** — cortx-skills has a hard dependency on the cortx MCP server. All skills call cortx MCP tools (`proxy_exec`, `memory_recall`, `memory_store`, `planning_*`). There is no fallback.

## Installation

```bash
git clone https://github.com/tienedev/cortx-skills
```

In Claude Code:

```bash
/plugin install cortx-skills --path /path/to/cortx-skills
```

## Two Modes

### Architecte Mode (human-in-the-loop)

Sequential workflow with human validation at each stage:

`/cortx:brainstorming` → `/cortx:writing-plans` → `/cortx:executing-plans` → `/cortx:finishing-a-development-branch`

1. **Brainstorming** — Refine the design through dialogue
2. **Writing plans** — Break the design into detailed implementation tasks
3. **Executing plans** — Execute tasks with cortx claim/gate/release cycle
4. **Finishing** — Wrap up the branch (merge/PR/keep/discard)

### Auto Mode (autonomous)

Single command, fully autonomous execution:

```
/cortx:auto "implement feature X"
```

The orchestrator decomposes the objective, dispatches tasks, reviews results, and drives to completion without human intervention.

## Available Skills

| Skill | Description |
|-------|-------------|
| `cortx:brainstorming` | Design refinement through dialogue |
| `cortx:writing-plans` | Detailed implementation plans |
| `cortx:executing-plans` | Execute plans with cortx claim/gate/release cycle |
| `cortx:subagent-driven-development` | Dispatch fresh subagent per task with review |
| `cortx:test-driven-development` | Red-green-refactor with memory |
| `cortx:systematic-debugging` | Systematic root cause analysis with memory |
| `cortx:verification-before-completion` | Evidence before claims |
| `cortx:requesting-code-review` | Code review dispatch |
| `cortx:receiving-code-review` | Handle review feedback |
| `cortx:using-git-worktrees` | Git worktree management |
| `cortx:finishing-a-development-branch` | Branch wrap-up (merge/PR/keep/discard) |
| `cortx:auto` | Autonomous orchestration mode |
| `cortx:dispatching-parallel-agents` | Concurrent subagent workflows |
| `cortx:writing-skills` | Create new skills |
| `cortx:using-cortx` | Meta-skill: skill discovery and activation |

## cortx Integration

All skills communicate through cortx MCP tools:

- **`proxy_exec`** — secure command execution through the 7-layer pipeline
- **`memory_recall` / `memory_store`** — persistent context across sessions
- **`planning_list_tasks` / `planning_next_task` / `planning_complete_task`** — kanban-based task tracking

## Auto Mode Quickstart

```
/cortx:auto "add rate limiting to the API endpoints"
```

The orchestrator will:
1. Recall relevant context from memory
2. Decompose the objective into tasks on the kanban board
3. Claim and execute each task through `proxy_exec`
4. Review results and store learnings in memory
5. Complete or escalate based on outcomes

## Acknowledgments

Fork of [superpowers](https://github.com/obra/superpowers) by Jesse Vincent ([@obra](https://github.com/obra)). The original skill architecture and workflow patterns are his work.

## License

MIT License — see LICENSE file for details.
