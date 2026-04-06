# sspower

A fork of [Superpowers](https://github.com/obra/superpowers) (v5.0.5) — a complete software development workflow for Claude Code, customized for personal use.

## What it does

Composable "skills" that automatically trigger during your workflow: brainstorming, planning, TDD, debugging, code review, subagent-driven development, and more. The agent checks for relevant skills before any task — mandatory workflows, not suggestions.

## Installation

In Claude Code:

```bash
# Add the marketplace
/plugin marketplace add sskys18/sspower

# Install the plugin
/plugin install sspower@sspower
```

Skills auto-trigger from there — no extra setup needed.

## The Workflow

1. **brainstorming** — Refines ideas through questions, explores alternatives, presents design in sections
2. **using-git-worktrees** — Creates isolated workspace on new branch
3. **writing-plans** — Breaks work into bite-sized tasks with exact file paths and verification steps
4. **subagent-driven-development** / **executing-plans** — Dispatches subagents per task with two-stage review
5. **test-driven-development** — RED-GREEN-REFACTOR cycle
6. **requesting-code-review** — Reviews against plan, reports issues by severity
7. **finishing-a-development-branch** — Verifies tests, presents merge/PR/keep/discard options

## Skills

| Category | Skills |
|----------|--------|
| Testing | `test-driven-development` |
| Debugging | `systematic-debugging`, `verification-before-completion` |
| Collaboration | `brainstorming`, `writing-plans`, `executing-plans`, `dispatching-parallel-agents`, `requesting-code-review`, `receiving-code-review`, `using-git-worktrees`, `finishing-a-development-branch`, `subagent-driven-development` |
| Meta | `writing-skills`, `using-sspower` |
| sspower-only | `second-opinion` |

## Fork Customizations

See [docs/CUSTOMIZATIONS.md](docs/CUSTOMIZATIONS.md) for the full list of changes from upstream.

Key differences:
- **Reference extraction** — large inline examples moved to `references/` subdirs to reduce token load
- **`using-sspower`** — custom skill routing replacing `using-superpowers`
- **`second-opinion`** — independent review via Codex subagent
- **Claude Code only** — removed Cursor, Gemini, OpenCode configs

## Syncing with upstream

```bash
git fetch upstream
git merge upstream/main
```

## Credits

Original [Superpowers](https://github.com/obra/superpowers) by [Jesse Vincent](https://blog.fsck.com) and [Prime Radiant](https://primeradiant.com).

## License

MIT — see LICENSE file
