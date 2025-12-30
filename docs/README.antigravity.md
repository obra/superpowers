# Superpowers for Antigravity IDE

Complete guide for using Superpowers with Antigravity IDE.

## Quick Install

Tell Antigravity:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.antigravity/INSTALL.md
```

## Manual Installation

### Prerequisites

- Antigravity IDE installed
- Node.js installed (v14+, v18+ recommended)
- Git installed

### Installation Steps

#### 1. Clone Superpowers

**Linux/macOS:**
```bash
mkdir -p ~/.antigravity/superpowers
git clone https://github.com/obra/superpowers.git ~/.antigravity/superpowers
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.antigravity\superpowers"
git clone https://github.com/obra/superpowers.git "$env:USERPROFILE\.antigravity\superpowers"
```

#### 2. Configure Global Rules

Add to `~/.gemini/GEMINI.md`:

```markdown
## Superpowers System

<EXTREMELY_IMPORTANT>
You have superpowers. Superpowers teach you new skills and capabilities.
RIGHT NOW run: `~/.antigravity/superpowers/.antigravity/superpowers-antigravity bootstrap` and follow the instructions it returns.
</EXTREMELY_IMPORTANT>
```

#### 3. Verify Installation

Tell Antigravity:

```
Run ~/.antigravity/superpowers/.antigravity/superpowers-antigravity find-skills to show available skills
```

You should see a list of available skills with descriptions.

## Usage

### Finding Skills

```
Run ~/.antigravity/superpowers/.antigravity/superpowers-antigravity find-skills
```

### Loading a Skill

```
Run ~/.antigravity/superpowers/.antigravity/superpowers-antigravity use-skill superpowers:brainstorming
```

### Bootstrap All Skills

```
Run ~/.antigravity/superpowers/.antigravity/superpowers-antigravity bootstrap
```

This loads the complete bootstrap with all skill information.

### Personal Skills

Create your own skills in `~/.antigravity/skills/`:

```bash
mkdir -p ~/.antigravity/skills/my-skill
```

Create `~/.antigravity/skills/my-skill/SKILL.md`:

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

### Antigravity CLI Tool

**Location:** `~/.antigravity/superpowers/.antigravity/superpowers-antigravity`

A Node.js CLI script that provides three commands:
- `bootstrap` - Load complete bootstrap with all skills
- `use-skill <name>` - Load a specific skill
- `find-skills` - List all available skills

### Shared Core Module

**Location:** `~/.antigravity/superpowers/lib/skills-core.js`

The Antigravity implementation uses the shared `skills-core` module for skill discovery and parsing. This is the same module used by Codex and OpenCode plugins, ensuring consistent behavior across platforms.

### Tool Mapping

Skills written for Claude Code are adapted for Antigravity with these mappings:

- `TodoWrite` → Use task.md artifact or similar task tracking
- `Task` with subagents → Use browser_subagent or tell user subagents aren't available
- `Skill` tool → `~/.antigravity/superpowers/.antigravity/superpowers-antigravity use-skill`
- File operations → Native Antigravity tools (view_file, write_to_file, run_command, etc.)

## Updating

```bash
cd ~/.antigravity/superpowers
git pull
```

## Troubleshooting

### Skills not found

1. Verify installation: `ls ~/.antigravity/superpowers/skills`
2. Check CLI works: `node ~/.antigravity/superpowers/.antigravity/superpowers-antigravity find-skills`
3. Verify skills have SKILL.md files

### CLI script not working

The CLI script requires Node.js. Verify:

```bash
node --version
```

Should show v14 or higher (v18+ recommended).

### Windows path issues

On Windows, use the full path with `node`:

```powershell
node "$env:USERPROFILE\.antigravity\superpowers\.antigravity\superpowers-antigravity" bootstrap
```

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
