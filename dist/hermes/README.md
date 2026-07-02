# Superpowers for Hermes Agent

> Hermes-compatible exports of all Superpowers skills.
> Install individual skills: `hermes skills install <url-to-raw-SKILL.md> --name superpowers:<skill-name>`

## Skills

| Skill | Description | Install Command |
|:------|:------------|:---------------|
| `brainstorming` | Use before any creative work — explores user intent, requirements, and design before implementation | `hermes skills install https://raw.githubusercontent.com/pandaliu00/superpowers/main/dist/hermes/brainstorming/SKILL.md --name superpowers:brainstorming` |
| `writing-plans` | Use when you have a spec or requirements for a multi-step task, before touching code | `hermes skills install https://raw.githubusercontent.com/pandaliu00/superpowers/main/dist/hermes/writing-plans/SKILL.md --name superpowers:writing-plans` |
| `test-driven-development` | Use when implementing any feature or bugfix, before writing implementation code — enforces RED-GREEN-REFACTOR | `hermes skills install https://raw.githubusercontent.com/pandaliu00/superpowers/main/dist/hermes/test-driven-development/SKILL.md --name superpowers:test-driven-development` |
| `subagent-driven-development` | Use when executing implementation plans with independent tasks — fresh subagent per task + two-stage review | `hermes skills install https://raw.githubusercontent.com/pandaliu00/superpowers/main/dist/hermes/subagent-driven-development/SKILL.md --name superpowers:subagent-driven-development` |
| `requesting-code-review` | Use when completing work — independent code review with security scan and quality gates | `hermes skills install https://raw.githubusercontent.com/pandaliu00/superpowers/main/dist/hermes/requesting-code-review/SKILL.md --name superpowers:requesting-code-review` |
| `dispatching-parallel-agents` | Use when facing 2+ independent tasks that can be worked on without shared state | `hermes skills install https://raw.githubusercontent.com/pandaliu00/superpowers/main/dist/hermes/dispatching-parallel-agents/SKILL.md --name superpowers:dispatching-parallel-agents` |
| `finishing-a-development-branch` | Use when all tasks complete — verify, test, merge/PR | `hermes skills install https://raw.githubusercontent.com/pandaliu00/superpowers/main/dist/hermes/finishing-a-development-branch/SKILL.md --name superpowers:finishing-a-development-branch` |
| `systematic-debugging` | Use when encountering a bug — structured hypothesis→verify→root-cause→fix | `hermes skills install https://raw.githubusercontent.com/pandaliu00/superpowers/main/dist/hermes/systematic-debugging/SKILL.md --name superpowers:systematic-debugging` |
| `using-git-worktrees` | Use when starting implementation — creates isolated git worktree for development | `hermes skills install https://raw.githubusercontent.com/pandaliu00/superpowers/main/dist/hermes/using-git-worktrees/SKILL.md --name superpowers:using-git-worktrees` |
| `executing-plans` | Use when executing implementation plans in this session — batch execution with checkpoints | `hermes skills install https://raw.githubusercontent.com/pandaliu00/superpowers/main/dist/hermes/executing-plans/SKILL.md --name superpowers:executing-plans` |
| `receiving-code-review` | Use when receiving code review feedback — how to respond and address findings | `hermes skills install https://raw.githubusercontent.com/pandaliu00/superpowers/main/dist/hermes/receiving-code-review/SKILL.md --name superpowers:receiving-code-review` |
| `writing-skills` | Use when creating or editing skills — TDD-inspired skill authoring methodology | `hermes skills install https://raw.githubusercontent.com/pandaliu00/superpowers/main/dist/hermes/writing-skills/SKILL.md --name superpowers:writing-skills` |
| `using-superpowers` | Use in every session — establishes how to discover and invoke skills before any action | `hermes skills install https://raw.githubusercontent.com/pandaliu00/superpowers/main/dist/hermes/using-superpowers/SKILL.md --name superpowers:using-superpowers` |


## Quick Start

1. Install the bootstrap: `hermes skills install <url>/dist/hermes/using-superpowers/SKILL.md --name superpowers:using-superpowers`
2. Load in session: `skill_view("superpowers:using-superpowers")`
3. Now when you say "Let's build X", Superpowers methodology auto-triggers.

## Tool Mapping

| Superpowers (Claude Code) | Hermes Agent |
|:-------------------------:|:------------:|
| `Skill` tool | `skill_view` / `skills_list` |
| `TodoWrite` | `todo` |
| `Subagent` / `Task` | `delegate_task` |
| `Glob` / `grep` | `search_files` |
| `Bash` | `terminal` |
| `read_file` | `read_file` |
| `write_file` | `write_file` |
| `web_search` | `web_search` |

## Updating

Re-install skills to get latest version: `hermes skills install <url> --name superpowers:<name>`
