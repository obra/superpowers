# pp-superpowers

Power Platform development skills for Claude Code. Guides you through structured requirements gathering, solution architecture, schema design, UI design, and deployment — all tailored to Power Apps, Power Automate, and Dataverse.

> **Important:** pp-superpowers must NOT be installed alongside the `superpowers` plugin (`superpowers@claude-plugins-official`). The original plugin's skill triggers conflict with pp-superpowers routing. Uninstall `superpowers` before installing this plugin.

## Installation

```bash
/plugin install pp-superpowers
```

## Current Skills

**Foundation (Phase 1)**
- **solution-discovery** — Structured requirements conversation that produces a `.foundation/` directory consumed by all downstream skills. Supports CREATE, RESUME, and UPDATE modes.

**Kept from upstream** (evaluate during alm-workflow phase)
- **using-git-worktrees** — Isolated development workspaces via git worktrees
- **finishing-a-development-branch** — Merge/PR decision workflow

## Planned Skills

| Phase | Skills |
|---|---|
| Phase 1b | solution-strategy |
| Phase 2 | application-design, schema-design |
| Phase 3 | ui-design, business-logic, security |
| Phase 4 | integration, alm-workflow, environment-setup |

## How It Works

Start a conversation and describe your Power Platform project. The session-start hook loads `using-pp-superpowers`, which routes you to the right skill. For new projects, `solution-discovery` walks you through 10 stages of requirements gathering and produces the `.foundation/` directory that all downstream skills consume.

## Attribution

Forked from [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent / Prime Radiant. Adapted for Power Platform by Chris Treichel / SDFX Studios.

## License

MIT License — see LICENSE file for details.
