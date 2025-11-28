# Superpowers for Droid CLI

Complete guide for using Superpowers with Factory Droid CLI.

## Quick Install

Tell Droid:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.droid/INSTALL.md
```

## Manual Installation

### Prerequisites

- Factory Droid CLI access
- Node.js v18+ (for ES module support)
- Shell access to install files

### Installation Steps

#### 1. Clone Superpowers

```bash
mkdir -p ~/.factory/superpowers
git clone https://github.com/obra/superpowers.git ~/.factory/superpowers
```

#### 2. Install Bootstrap

The bootstrap file is included in the repository at `.droid/superpowers-bootstrap.md`. Droid will automatically use it from the cloned location.

#### 3. Verify Installation

Tell Droid:

```
Run ~/.factory/superpowers/.droid/superpowers-droid find-skills to show available skills
```

You should see a list of available skills with descriptions.

## Usage

### Finding Skills

```
Run ~/.factory/superpowers/.droid/superpowers-droid find-skills
```

### Loading a Skill

```
Run ~/.factory/superpowers/.droid/superpowers-droid use-skill superpowers:brainstorming
```

### Bootstrap All Skills

```
Run ~/.factory/superpowers/.droid/superpowers-droid bootstrap
```

This loads the complete bootstrap with all skill information.

### Personal Skills

Create your own skills in `~/.factory/skills/`:

```bash
mkdir -p ~/.factory/skills/my-skill
```

Create `~/.factory/skills/my-skill/SKILL.md`:

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

### Droid CLI Tool

**Location:** `~/.factory/superpowers/.droid/superpowers-droid`

A Node.js CLI script (ES module) that provides four commands:
- `bootstrap` - Load complete bootstrap with all skills
- `use-skill <name>` - Load a specific skill
- `find-skills` - List all available skills
- `update` - Update superpowers from GitHub

### Shared Core Module

**Location:** `~/.factory/superpowers/lib/skills-core.js`

The Droid implementation uses the shared `skills-core` module (ES module format) for skill discovery and parsing. This is the same module used by the Codex and OpenCode implementations, ensuring consistent behavior across platforms.

### Tool Mapping

Droid CLI has **native tools** that match superpowers requirements. No mapping needed for most tools:

| Superpowers Reference | Droid CLI Tool | Notes |
|-----------------------|----------------|-------|
| `TodoWrite` | `TodoWrite` | **Native** - use directly |
| `Task` with subagents | `Task` | **Native** - use directly |
| `Skill` tool | Native + CLI | Native for personal skills, CLI for superpowers |
| `Read`, `Write`, `Edit` | `Read`, `Create`, `Edit` | **Native** - use directly |
| `Bash`/`Execute` | `Execute` | **Native** - use directly |

### Directory Structure

```
~/.factory/
├── superpowers/              # Cloned repository
│   ├── skills/               # Superpowers skills (20 skills)
│   ├── lib/
│   │   └── skills-core.js    # Shared library
│   ├── agents/
│   │   └── code-reviewer.md  # Code reviewer agent
│   └── .droid/
│       ├── superpowers-droid         # CLI script
│       └── superpowers-bootstrap.md  # Bootstrap instructions
├── skills/                   # Personal skills directory
│   └── my-custom-skill/
│       └── SKILL.md
├── droids/                   # Custom droids (Droid-specific)
└── AGENTS.md                 # Global instructions (includes superpowers trigger)
```

## Updating

```bash
cd ~/.factory/superpowers
git pull
```

Or use the CLI:

```bash
~/.factory/superpowers/.droid/superpowers-droid update
```

## Advantages of Droid CLI

Droid CLI has several advantages over other platforms:

| Feature | Codex | OpenCode | Droid CLI |
|---------|-------|----------|-----------|
| Native TodoWrite | ❌ (map to update_plan) | ❌ | ✅ |
| Native Subagents | ❌ | ❌ | ✅ |
| Custom Droids | ❌ | ❌ | ✅ (100+ droids) |
| Native Skill tool | ❌ | ❌ | ✅ (for personal) |

## Troubleshooting

### Skills not found

1. Verify installation: `ls ~/.factory/superpowers/skills`
2. Check CLI works: `~/.factory/superpowers/.droid/superpowers-droid find-skills`
3. Verify skills have SKILL.md files

### CLI script not executable

```bash
chmod +x ~/.factory/superpowers/.droid/superpowers-droid
```

### Node.js errors

The CLI script requires Node.js with ES module support. Verify:

```bash
node --version
```

Should show v18 or higher for full ES module support.

### Personal skills not showing

Ensure personal skills directory exists and has proper structure:

```bash
ls ~/.factory/skills/
ls ~/.factory/skills/my-skill/SKILL.md
```

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
- Droid CLI: https://factory.ai

## Note

Droid CLI support is experimental and may require refinement based on user feedback. If you encounter issues, please report them on GitHub.
