# Development Workflow

<!-- BEGIN:SUPERPOWERS_ONLY -->
## Superpowers Plugin (Required)

This project requires the [superpowers](https://github.com/obra/superpowers) plugin.

If skills like `brainstorming`, `writing-plans`, `systematic-debugging` are not available,
**stop and instruct the user to install superpowers first:**

```bash
# Claude Code
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace

# Cursor
/plugin-add superpowers
```
<!-- END:SUPERPOWERS_ONLY -->

## Workflow Rules

- All feature development MUST follow a structured process: requirements gathering → design → implementation with tests → code review
<!-- BEGIN:SUPERPOWERS_ONLY -->
- Specifically: brainstorming → writing-plans → subagent-driven-development
<!-- END:SUPERPOWERS_ONLY -->
- All bugfixes MUST follow systematic root cause investigation before proposing fixes
<!-- BEGIN:SUPERPOWERS_ONLY -->
- Specifically: systematic-debugging (4-phase root cause investigation)
- Before claiming any work is complete, MUST run verification-before-completion
- Worktrees go in `.worktrees/` (already gitignored)
<!-- END:SUPERPOWERS_ONLY -->

## Project Conventions

- Test framework: vitest
- Code style: ESLint + Prettier
- Branch naming: `feature/<name>`, `fix/<name>`
- Commits: concise, in English, describe the "why"
- Language: communicate with the user in Chinese (Simplified)
