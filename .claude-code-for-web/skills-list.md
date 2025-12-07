# Available Superpowers Skills

Use WebFetch to load any skill by its URL.

## Base URL

```
https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/skills/
```

## Skills

### Collaboration

| Skill | Description | URL |
|-------|-------------|-----|
| brainstorming | Use before writing code - refines ideas through Socratic questions | `skills/brainstorming/SKILL.md` |
| writing-plans | Use when starting implementation - creates detailed task breakdowns | `skills/writing-plans/SKILL.md` |
| executing-plans | Use with a plan - batch execution with human checkpoints | `skills/executing-plans/SKILL.md` |
| subagent-driven-development | Use for autonomous development - fast iteration with quality gates | `skills/subagent-driven-development/SKILL.md` |
| dispatching-parallel-agents | Use for concurrent work - parallel subagent workflows | `skills/dispatching-parallel-agents/SKILL.md` |
| requesting-code-review | Use before completing work - pre-review checklist | `skills/requesting-code-review/SKILL.md` |
| receiving-code-review | Use when given feedback - how to respond to reviews | `skills/receiving-code-review/SKILL.md` |
| using-git-worktrees | Use for parallel branches - isolated development workspaces | `skills/using-git-worktrees/SKILL.md` |
| finishing-a-development-branch | Use when tasks complete - merge/PR decision workflow | `skills/finishing-a-development-branch/SKILL.md` |

### Testing

| Skill | Description | URL |
|-------|-------------|-----|
| test-driven-development | Use for all implementation - RED-GREEN-REFACTOR cycle | `skills/test-driven-development/SKILL.md` |
| condition-based-waiting | Use for async tests - reliable wait patterns | `skills/condition-based-waiting/SKILL.md` |
| testing-anti-patterns | Use when writing tests - common pitfalls to avoid | `skills/testing-anti-patterns/SKILL.md` |

### Debugging

| Skill | Description | URL |
|-------|-------------|-----|
| systematic-debugging | Use when fixing bugs - 4-phase root cause process | `skills/systematic-debugging/SKILL.md` |
| root-cause-tracing | Use when stuck on bugs - find the real problem | `skills/root-cause-tracing/SKILL.md` |
| verification-before-completion | Use before declaring done - ensure it's actually fixed | `skills/verification-before-completion/SKILL.md` |
| defense-in-depth | Use for reliability - multiple validation layers | `skills/defense-in-depth/SKILL.md` |

### Meta

| Skill | Description | URL |
|-------|-------------|-----|
| using-superpowers | Use at session start - introduction to the skills system | `skills/using-superpowers/SKILL.md` |
| writing-skills | Use when creating skills - best practices for new skills | `skills/writing-skills/SKILL.md` |
| testing-skills-with-subagents | Use when validating skills - quality testing approach | `skills/testing-skills-with-subagents/SKILL.md` |
| sharing-skills | Use when sharing skills - how to distribute skills | `skills/sharing-skills/SKILL.md` |

## Loading a Skill

To load a skill, use WebFetch with the full URL:

```
https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/skills/<skill-name>/SKILL.md
```

**Example:** To load brainstorming:
```
https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/skills/brainstorming/SKILL.md
```

## Critical Reminder

**Before ANY task, check this list.** If a relevant skill exists, you MUST fetch and follow it.

Skills are not suggestions - they are mandatory workflows that prevent known mistakes.
