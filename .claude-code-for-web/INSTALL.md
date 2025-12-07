# Installing Superpowers for Claude Code for Web

Claude Code for Web can install Superpowers skills locally to your home directory, making them available across sessions.

## Quick Start

Tell Claude Code for Web:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/main/.claude-code-for-web/bootstrap.md
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

## Manual Installation

If you prefer to install manually, tell Claude:

```
Install Superpowers skills to my home directory:

1. Fetch https://api.github.com/repos/obra/superpowers/contents/skills to get the list of skills
2. For each skill directory in the response:
   - Create ~/.claude/skills/superpowers/<skill-name>/
   - Fetch https://raw.githubusercontent.com/obra/superpowers/main/skills/<skill-name>/SKILL.md
   - Write the content to ~/.claude/skills/superpowers/<skill-name>/SKILL.md
3. After installation, read ~/.claude/skills/superpowers/using-superpowers/SKILL.md and follow it
```

## How It Works

1. **Installation**: Claude fetches skills from GitHub and writes them to `~/.claude/skills/superpowers/`
2. **Usage**: Skills are read from local files using the Read tool
3. **Discovery**: Claude can list skills with `ls ~/.claude/skills/superpowers/` or by reading the directory

## Updating Skills

To update to the latest skills, tell Claude:

```
Update my Superpowers skills by re-fetching them from GitHub and overwriting the local copies.
```

Or to update a specific skill:

```
Update the brainstorming skill from https://raw.githubusercontent.com/obra/superpowers/main/skills/brainstorming/SKILL.md
```

## Verification

After installation, ask Claude:

```
List my installed superpowers skills and read the using-superpowers skill.
```

Claude should show the skills in `~/.claude/skills/superpowers/` and display the using-superpowers content.

## Session Persistence

Once installed, skills persist in your home directory. However, Claude Code for Web does not automatically load skills at session start. At the beginning of each conversation, tell Claude:

```
Read ~/.claude/skills/superpowers/using-superpowers/SKILL.md and follow it.
```

## Limitations

See [README.md](README.md) for a complete list of limitations when using Superpowers with Claude Code for Web.

## Getting Help

- **Issues**: https://github.com/obra/superpowers/issues
- **Documentation**: https://github.com/obra/superpowers
