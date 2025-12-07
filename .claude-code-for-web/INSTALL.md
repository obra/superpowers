# Installing Superpowers for Claude Code for Web

Claude Code for Web can install Superpowers skills locally to your home directory, making them available across sessions.

## Quick Start

Tell Claude Code for Web:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/main/.claude-code-for-web/INSTALL.md
```

Claude will install skills to `~/.claude/skills/superpowers/` and learn how to use them.

## What Gets Installed

Skills are installed to:
```
~/.claude/skills/superpowers/
├── brainstorming/
│   └── SKILL.md
├── test-driven-development/
│   └── SKILL.md
├── systematic-debugging/
│   └── SKILL.md
└── ... (all other skills)
```

## Updating Skills

To update to the latest skills, tell Claude:

```
Update my Superpowers skills by re-fetching them from GitHub and overwriting the local copies.
```

## Verification

After installation, ask Claude:

```
List my installed superpowers skills and read the using-superpowers skill.
```

## Session Persistence

Once installed, skills persist in your home directory. At the beginning of each new conversation, tell Claude:

```
Read ~/.claude/skills/superpowers/using-superpowers/SKILL.md and follow it.
```

## Limitations

See [README.md](README.md) for a complete list of limitations when using Superpowers with Claude Code for Web.

## Getting Help

- **Issues**: https://github.com/obra/superpowers/issues
- **Documentation**: https://github.com/obra/superpowers

---

## Instructions for Claude

Fetch and follow: https://raw.githubusercontent.com/obra/superpowers/main/.claude-code-for-web/bootstrap.md
