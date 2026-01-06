# Hyperpowers for Codex

Complete guide for using Hyperpowers with OpenAI Codex.

## Quick Install

Tell Codex:

```
Fetch and follow instructions from https://raw.githubusercontent.com/bradwindy/hyperpowers/refs/heads/main/.codex/INSTALL.md
```

## Manual Installation

### Prerequisites

- OpenAI Codex access
- Shell access to install files

### Installation Steps

#### 1. Clone Hyperpowers

```bash
mkdir -p ~/.codex/hyperpowers
git clone https://github.com/bradwindy/hyperpowers.git ~/.codex/hyperpowers
```

#### 2. Install Bootstrap

The bootstrap file is included in the repository at `.codex/hyperpowers-bootstrap.md`. Codex will automatically use it from the cloned location.

#### 3. Verify Installation

Tell Codex:

```
Run ~/.codex/hyperpowers/.codex/hyperpowers-codex find-skills to show available skills
```

You should see a list of available skills with descriptions.

## Usage

### Finding Skills

```
Run ~/.codex/hyperpowers/.codex/hyperpowers-codex find-skills
```

### Loading a Skill

```
Run ~/.codex/hyperpowers/.codex/hyperpowers-codex use-skill hyperpowers:brainstorming
```

### Bootstrap All Skills

```
Run ~/.codex/hyperpowers/.codex/hyperpowers-codex bootstrap
```

This loads the complete bootstrap with all skill information.

### Personal Skills

Create your own skills in `~/.codex/skills/`:

```bash
mkdir -p ~/.codex/skills/my-skill
```

Create `~/.codex/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

Personal skills override hyperpowers skills with the same name.

## Architecture

### Codex CLI Tool

**Location:** `~/.codex/hyperpowers/.codex/hyperpowers-codex`

A Node.js CLI script that provides three commands:
- `bootstrap` - Load complete bootstrap with all skills
- `use-skill <name>` - Load a specific skill
- `find-skills` - List all available skills

### Shared Core Module

**Location:** `~/.codex/hyperpowers/lib/skills-core.js`

The Codex implementation uses the shared `skills-core` module (ES module format) for skill discovery and parsing. This is the same module used by the OpenCode plugin, ensuring consistent behavior across platforms.

### Tool Mapping

Skills written for Claude Code are adapted for Codex with these mappings:

- `TodoWrite` → `update_plan`
- `Task` with subagents → Tell user subagents aren't available, do work directly
- `Skill` tool → `~/.codex/hyperpowers/.codex/hyperpowers-codex use-skill`
- File operations → Native Codex tools

## Updating

```bash
cd ~/.codex/hyperpowers
git pull
```

## Troubleshooting

### Skills not found

1. Verify installation: `ls ~/.codex/hyperpowers/skills`
2. Check CLI works: `~/.codex/hyperpowers/.codex/hyperpowers-codex find-skills`
3. Verify skills have SKILL.md files

### CLI script not executable

```bash
chmod +x ~/.codex/hyperpowers/.codex/hyperpowers-codex
```

### Node.js errors

The CLI script requires Node.js. Verify:

```bash
node --version
```

Should show v14 or higher (v18+ recommended for ES module support).

## Getting Help

- Report issues: https://github.com/bradwindy/hyperpowers/issues
- Main documentation: https://github.com/bradwindy/hyperpowers
- Blog post: https://blog.fsck.com/2025/10/27/skills-for-openai-codex/

## Note

Codex support is experimental and may require refinement based on user feedback. If you encounter issues, please report them on GitHub.
