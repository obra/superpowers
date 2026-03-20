# CLAUDE.md — Superpowers

## Project Overview

Superpowers is a complete software development workflow for AI coding agents. It provides composable "skills" that automatically activate based on context, guiding agents through brainstorming, planning, TDD, debugging, code review, and deployment.

## Architecture

```
superpowers/
├── skills/                    # 14 composable skills (auto-activate)
│   ├── brainstorming/         # Socratic idea refinement
│   ├── writing-plans/         # Implementation planning
│   ├── executing-plans/       # Plan execution in sessions
│   ├── test-driven-development/ # RED-GREEN-REFACTOR cycle
│   ├── systematic-debugging/  # 4-phase root cause analysis
│   ├── subagent-driven-development/ # Parallel subagent execution
│   ├── dispatching-parallel-agents/ # Independent task coordination
│   ├── requesting-code-review/  # Dispatch code review
│   ├── receiving-code-review/   # Process review feedback
│   ├── finishing-a-development-branch/ # Merge/PR workflow
│   ├── using-git-worktrees/   # Isolated branch work
│   ├── verification-before-completion/ # Pre-completion checks
│   ├── using-superpowers/     # Meta: how to use the system
│   └── writing-skills/        # Create new skills
├── commands/                  # Slash commands
│   ├── brainstorm.md          # /brainstorm
│   ├── write-plan.md          # /write-plan
│   └── execute-plan.md        # /execute-plan
├── agents/                    # Subagent configurations
├── hooks/                     # Git and CI hooks
├── tests/                     # Test suite
└── docs/                      # Documentation
```

## Core Workflow

```
brainstorming → writing-plans → executing-plans → verification → finishing
```

1. **Brainstorm**: Socratic refinement of ideas into specs
2. **Plan**: Break into tasks clear enough for a junior engineer
3. **Execute**: Subagent-driven development with TDD
4. **Verify**: Check completeness before declaring done
5. **Finish**: PR/merge workflow

## Key Principles

- **Think before coding** — Always brainstorm and plan first
- **True TDD** — RED → GREEN → REFACTOR, no shortcuts
- **YAGNI** — You Aren't Gonna Need It
- **DRY** — Don't Repeat Yourself
- **Subagent isolation** — Independent tasks run in parallel
- **Two-stage review** — Self-review then external review

## Slash Commands

| Command | Purpose |
|---------|---------|
| `/brainstorm` | Socratic idea refinement → spec document |
| `/write-plan` | Implementation plan from spec |
| `/execute-plan` | Execute plan with subagents |

## Git Workflow

- Never push directly to `main`
- Use feature branches: `feat/...`, `fix/...`
- Conventional commits in English
- Always verify before completing a branch

## Skill Hub Cross-Reference

Este repo contribui 14 skills de workflow para o ecossistema compartilhado:
- **Workflow**: brainstorming, writing-plans, executing-plans, test-driven-development, systematic-debugging, subagent-driven-development, dispatching-parallel-agents, requesting-code-review, receiving-code-review, finishing-a-development-branch, using-git-worktrees, verification-before-completion, writing-skills, using-superpowers

Para o catalogo completo de 73 skills, consulte: `../skill-hub/CATALOG.md`

### Skills complementares de outros repos
| Precisa de | Repo | Skill |
|-----------|------|-------|
| Design visual | bullcast | vibe-design, ui-ux-design |
| React frontend | bullcast | frontend-react |
| API design | bullcast | backend-api |
| Design intelligence | ui-ux-pro-max-skill | ui-ux-pro-max |
| Marketing/Growth | ecommerce-ops | copywriting-persuasivo, facebook-ads |
