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

All skills are prefixed with `sp-` to avoid conflicts:

- **Development Workflow**: `brainstorming`, `writing-plans`, `executing-plans`, `subagent-driven-development`
- **Code Quality**: `test-driven-development`, `systematic-debugging`, `requesting-code-review`, `receiving-code-review`, `verification-before-completion`
- **Git Operations**: `using-git-worktrees`, `finishing-a-development-branch`
- **Advanced**: `dispatching-parallel-agents`, `writing-skills`

## Skill Location

The actual skill files are located in:
- `skills/<skill-name>/SKILL.md`
