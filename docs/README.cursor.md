# Superpowers for Cursor

One-command installation of Superpowers for Cursor's Agent Skills system.

## Quick Start

```bash
npx github:obra/superpowers/.cursor install --global
```

Restart Cursor. Done! 🎉

## What You Get

All Superpowers skills, automatically available in Cursor:

- **brainstorming** - Interactive design refinement
- **writing-plans** - Task breakdown with TDD focus
- **executing-plans** - Batch execution with checkpoints
- **subagent-driven-development** - Multi-agent task execution
- **systematic-debugging** - Root cause analysis workflow
- **test-driven-development** - RED-GREEN-REFACTOR enforcement
- **using-git-worktrees** - Isolated development branches
- **requesting-code-review** - Plan compliance verification
- **finishing-a-development-branch** - Merge/PR workflow
- And more...

## How Skills Work in Cursor

### Automatic Invocation

Just describe your task - the agent decides which skills to use:

```text
"Let's build a new feature for user authentication"
→ Agent uses: brainstorming → writing-plans → executing-plans
```

### Manual Invocation

Type `/` in chat, search for skill name:

```text
/ → "brainstorming" → Select
```

### View Skills

Settings (`Cmd+Shift+J` / `Ctrl+Shift+J`) → Rules → Agent Decides

## Commands

```bash
# Install
npx github:obra/superpowers/.cursor install --global  # All projects
npx github:obra/superpowers/.cursor install --local   # Current project

# List installed skills
npx github:obra/superpowers/.cursor list

# Uninstall
npx github:obra/superpowers/.cursor uninstall --global
npx github:obra/superpowers/.cursor uninstall --local
```

## Requirements

- **Cursor IDE** with **Nightly channel** (Settings → Beta → Update Channel → Nightly)
- **Node.js** 18.0.0+

## Architecture

**Global install:**
```text
~/.cursor/
├── superpowers/           # Full repo
│   └── skills/           # All skills
└── skills/               # Symlinks (Cursor discovers these)
    ├── brainstorming -> ../superpowers/skills/brainstorming
    └── ...
```

**Local install:**
```text
your-project/
├── .cursor-superpowers/  # Full repo
└── .cursor/
    └── skills/           # Symlinks
        ├── brainstorming -> ../../.cursor-superpowers/skills/brainstorming
        └── ...
```

## Why Cursor?

Cursor's native Agent Skills support means:
- ✅ No plugins to configure
- ✅ Automatic skill discovery
- ✅ Built-in invocation UI
- ✅ Cross-compatibility with Claude Code skills

Same skill format works across Cursor, Claude Code, OpenCode, and Codex.

## Documentation

- **Installation**: [INSTALL.md](../.cursor/INSTALL.md) - Detailed setup guide
- **CLI Reference**: [README.md](../.cursor/README.md) - Command documentation
- **Cursor Skills**: [cursor.com/docs/context/skills](https://cursor.com/docs/context/skills)
- **Superpowers**: [github.com/obra/superpowers](https://github.com/obra/superpowers)

## Troubleshooting

**Skills not appearing?**
1. Verify Nightly channel (Settings → Beta)
2. Restart Cursor completely
3. Check: `npx github:obra/superpowers/.cursor list`

**Permission errors on Windows?**
Enable Developer Mode or run as Administrator.

**Skills not triggering?**
Mention keywords from skill descriptions, or manually invoke with `/`.

Full troubleshooting: [INSTALL.md](../.cursor/INSTALL.md#troubleshooting)

## Updating

```bash
# Pull latest changes
cd ~/.cursor/superpowers  # or .cursor-superpowers for local
git pull

# Restart Cursor
```

## License

MIT License - see [LICENSE](../LICENSE)
