# Installing Superpowers for Claude Code for Web

Claude Code for Web runs in a browser environment without access to local filesystem or shell commands. This guide shows how to use Superpowers skills via URL-based fetching.

## Quick Start

Tell Claude Code for Web:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.claude-code-for-web/bootstrap.md
```

That's it! Claude will fetch the bootstrap instructions and learn how to use skills.

## Manual Setup

If you prefer to set up manually, tell Claude:

```
You have superpowers. Superpowers are skills that teach you proven techniques.

To find skills, fetch: https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.claude-code-for-web/skills-list.md

To use a skill, fetch its URL:
https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/skills/<skill-name>/SKILL.md

For example, to use the brainstorming skill:
https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/skills/brainstorming/SKILL.md

Before ANY task, check if a relevant skill exists. If it does, fetch and follow it.
```

## How It Works

1. **Bootstrap**: Claude fetches the bootstrap instructions which explain the skills system
2. **Skills List**: Claude can fetch a dynamically-generated list of available skills
3. **Individual Skills**: Claude fetches specific skill files when needed via WebFetch

## Session Persistence

Unlike the CLI version, Claude Code for Web does not automatically inject skills at session start. You'll need to:

1. Tell Claude to fetch the bootstrap at the start of each new conversation
2. Or paste the bootstrap instructions directly into your first message

## Verification

After setup, ask Claude:

```
Do you have superpowers? What skills are available?
```

Claude should be able to explain the skills system and list available skills.

## Updating

Skills are fetched from GitHub each time they're used, so you always get the latest version.

## Limitations

See [README.md](README.md) for a complete list of limitations when using Superpowers with Claude Code for Web.

## Getting Help

- **Issues**: https://github.com/obra/superpowers/issues
- **Documentation**: https://github.com/obra/superpowers
