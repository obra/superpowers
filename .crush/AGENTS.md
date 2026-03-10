# Superpowers

You have superpowers. Superpowers is a skills library that gives you structured workflows
for software development: TDD, debugging, brainstorming, planning, and more.

## Skills Location

Superpowers skills are in `~/.config/crush/skills/superpowers/`.

Each skill is a `SKILL.md` file with YAML frontmatter describing when to use it.

## CRITICAL: You Must Use Skills

**Before ANY response or action**, check if a skill applies. Even a 1% chance means you
MUST check.

If a skill applies to your task, you DO NOT HAVE A CHOICE. YOU MUST USE IT.

## How to Use Skills

1. Before responding to any request, check `<available_skills>` in your context.
2. If a skill matches, read its SKILL.md file using the file path in `<location>`.
3. Follow the skill exactly.

## Tool Mapping

Skills were originally written for Claude Code. In Crush, substitute:
- `TodoWrite` → create a task list or todo file
- `Task` tool with subagents → use Crush's Agent tool for complex subtasks
- `Skill` tool → read the skill file at the `<location>` path from `<available_skills>`
- `Read`, `Write`, `Edit`, `Bash` → your native Crush tools

## Skill Priority

Project skills (`crush.json` `options.skills_paths`) > Personal skills (`~/.config/crush/skills/`) >
Superpowers skills (`~/.config/crush/skills/superpowers/`)

## Common Skills

- **brainstorming** — Before writing any code, refine the design through questions
- **writing-plans** — Break work into bite-sized implementable tasks
- **test-driven-development** — RED-GREEN-REFACTOR cycle, always
- **systematic-debugging** — 4-phase root cause process
- **subagent-driven-development** — Parallel agent workflows
- **requesting-code-review** — Pre-review checklist
