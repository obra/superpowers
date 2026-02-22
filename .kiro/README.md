# Superpowers Kiro Configuration

This project uses Kiro for AI-assisted development with Superpowers skills.

## Quick Start

1. Use `/using-superpowers` to learn about available skills
2. Use `/brainstorming` before starting any creative work
3. Use `/writing-plans` to create implementation plans
4. Use `/executing-plans` to implement plan tasks

## Directory Structure

```
.kiro/
├── README.md           # This file
└── steering/           # Kiro steering commands
    ├── README.md       # Command reference
    └── sp-*.md         # Individual skill steerings
```

## Superpowers Skills

All skills are prefixed with `sp-` to avoid conflicts (the list below omits the prefix for brevity; actual command/file names include it):

- **Development Workflow**: `sp-brainstorming`, `sp-writing-plans`, `sp-executing-plans`, `sp-subagent-driven-development`
- **Code Quality**: `sp-test-driven-development`, `sp-systematic-debugging`, `sp-requesting-code-review`, `sp-receiving-code-review`, `sp-verification-before-completion`
- **Git Operations**: `sp-using-git-worktrees`, `sp-finishing-a-development-branch`
- **Advanced**: `sp-dispatching-parallel-agents`, `sp-writing-skills`

## Skill Location

The actual skill files are located in:
- `skills/<skill-name>/SKILL.md`
