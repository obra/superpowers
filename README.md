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

### Optional: Codex integration

Several skills use Codex (GPT-5.4) for independent review and implementation. sspower calls the Codex CLI directly via its own `codex-bridge.mjs` — no external Claude Code plugin needed.

```bash
# Install Codex CLI
npm install -g @openai/codex

# Authenticate
codex login

# Verify
node scripts/codex-bridge.mjs setup
```

Without Codex CLI installed, all other skills work fine — Codex-dependent features (`second-opinion`, Codex engine in SDD, `codex-enrich`) will just be unavailable.

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

## Key Differences from Upstream Superpowers

See [docs/CUSTOMIZATIONS.md](docs/CUSTOMIZATIONS.md) for the full changelog.

### Architecture: Token-Efficient Progressive Disclosure

Upstream Superpowers loads entire skill content into context. sspower splits every skill into a lean `SKILL.md` (<100 lines) + `references/` subdirectory. The agent reads references only when needed, saving thousands of tokens per session.

| Skill | Upstream | sspower SKILL.md | sspower references/ |
|-------|-------------|------------------|---------------------|
| writing-skills | 647 lines | ~50 lines | 3 files (344 lines) |
| test-driven-development | 313 lines | ~50 lines | 1 file (74 lines) |
| systematic-debugging | 263 lines | ~50 lines | 2 files (227 lines) |
| subagent-driven-development | 279 lines | ~50 lines | 2 files (143 lines) |

### New Skills

| Skill | What it does |
|-------|-------------|
| **`using-sspower`** | Replaces upstream `using-superpowers` — custom routing with red-flags table and multi-platform tool mapping |
| **`second-opinion`** | Routes to Codex for independent review via native `codex-bridge.mjs`: rescue when stuck, adversarial review for high-risk merges, standard review otherwise |

### Improved Skills (eval-tested)

| Skill | What changed |
|-------|-------------|
| **dispatching-parallel-agents** | Added batch sizing table (5-8 files/agent) for bulk operations |
| **finishing-a-development-branch** | Mandatory worktree cleanup with per-option reporting |
| **verification-before-completion** | Language-agnostic command detection — reads project configs instead of hardcoded lookup |

### Removed (Claude Code only)

Cursor, Gemini, and OpenCode configs removed — sspower targets Claude Code exclusively.

## Syncing with upstream

```bash
git fetch upstream
git merge upstream/main
```

## Credits

Original [Superpowers](https://github.com/obra/superpowers) by [Jesse Vincent](https://blog.fsck.com) and [Prime Radiant](https://primeradiant.com).

## License

MIT — see LICENSE file
