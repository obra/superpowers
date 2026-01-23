# Superpowers for Trae

Complete guide for using Superpowers with Trae.

## Quick Install

Tell Trae:

```
Fetch and follow instructions from https://raw.githubusercontent.com/ice-zjchen/superpowers/refs/heads/main/.trae/INSTALL.md
```

## Manual Installation

### Prerequisites

- Trae access
- Shell access to install files
- Node.js installed

### Installation Steps

#### 1. Clone Superpowers

```bash
mkdir -p ~/.trae/superpowers
git clone https://github.com/ice-zjchen/superpowers.git ~/.trae/superpowers
```

#### 2. Install Bootstrap

The bootstrap file is included in the repository at `.trae/superpowers-bootstrap.md`. Trae will automatically use it from the cloned location.

#### 3. Verify Installation

Tell Trae:

```
Run ~/.trae/superpowers/.trae/superpowers-trae find-skills to show available skills
```

You should see a list of available skills with descriptions.

## Usage

### Finding Skills

```
Run ~/.trae/superpowers/.trae/superpowers-trae find-skills
```

### Loading a Skill

```
Run ~/.trae/superpowers/.trae/superpowers-trae use-skill superpowers:brainstorming
```

### Bootstrap All Skills

```
Run ~/.trae/superpowers/.trae/superpowers-trae bootstrap
```

This loads the complete bootstrap with all skill information.

### Personal Skills

Create your own skills in `~/.trae/skills/`:

```bash
mkdir -p ~/.trae/skills/my-skill
```

Create `~/.trae/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

Personal skills override superpowers skills with the same name.

## Architecture

### Trae CLI Tool

**Location:** `~/.trae/superpowers/.trae/superpowers-trae`

A Node.js CLI script that provides three commands:
- `bootstrap` - Load complete bootstrap with all skills
- `use-skill <name>` - Load a specific skill
- `find-skills` - List all available skills

### Shared Core Module

**Location:** `~/.trae/superpowers/lib/skills-core.js`

The Trae implementation uses the shared `skills-core` module for skill discovery and parsing. This is the same module used by the Codex CLI and OpenCode plugin, ensuring consistent behavior across platforms.

### Tool Mapping

Skills written for Claude Code are adapted for Trae with these mappings:

- `TodoWrite` → `update_plan`
- `Task` with subagents → Tell user subagents aren't available, do work directly
- `Skill` tool → `~/.trae/superpowers/.trae/superpowers-trae use-skill`
- File operations → Native Trae tools

## Updating

```bash
cd ~/.trae/superpowers
git pull
```

## Troubleshooting

### Skills not found

1. Verify installation: `ls ~/.trae/superpowers/skills`
2. Check CLI works: `~/.trae/superpowers/.trae/superpowers-trae find-skills`
3. Verify skills have SKILL.md files

### CLI script not executable

```bash
chmod +x ~/.trae/superpowers/.trae/superpowers-trae
```

### Node.js errors

The CLI script requires Node.js. Verify:

```bash
node --version
```

Should show v14 or higher (v18+ recommended for ES module support).

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
