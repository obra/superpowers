# Installing Superpowers for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed
- Git installed

## Installation Steps

> **Custom config directory:** If you've set `OPENCODE_CONFIG_DIR`, the commands below will use it automatically. Otherwise they default to `~/.config/opencode`.

### 1. Clone Superpowers

```bash
OPENCODE_CONFIG_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"
git clone https://github.com/obra/superpowers.git "$OPENCODE_CONFIG_DIR/superpowers"
```

### 2. Register the Plugin

Create a symlink so OpenCode discovers the plugin:

```bash
OPENCODE_CONFIG_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"
mkdir -p "$OPENCODE_CONFIG_DIR/plugins"
rm -f "$OPENCODE_CONFIG_DIR/plugins/superpowers.js"
ln -s "$OPENCODE_CONFIG_DIR/superpowers/.opencode/plugins/superpowers.js" "$OPENCODE_CONFIG_DIR/plugins/superpowers.js"
```

### 3. Symlink Skills

Create a symlink so OpenCode's native skill tool discovers superpowers skills:

```bash
OPENCODE_CONFIG_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"
mkdir -p "$OPENCODE_CONFIG_DIR/skills"
rm -rf "$OPENCODE_CONFIG_DIR/skills/superpowers"
ln -s "$OPENCODE_CONFIG_DIR/superpowers/skills" "$OPENCODE_CONFIG_DIR/skills/superpowers"
```

### 4. Restart OpenCode

Restart OpenCode. The plugin will automatically inject superpowers context.

Verify by asking: "do you have superpowers?"

## Usage

### Finding Skills

Use OpenCode's native `skill` tool to list available skills:

```
use skill tool to list skills
```

### Loading a Skill

Use OpenCode's native `skill` tool to load a specific skill:

```
use skill tool to load superpowers/brainstorming
```

### Personal Skills

Create your own skills in your OpenCode skills directory:

```bash
OPENCODE_CONFIG_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"
mkdir -p "$OPENCODE_CONFIG_DIR/skills/my-skill"
```

Create a `SKILL.md` in that directory:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

### Project Skills

Create project-specific skills in `.opencode/skills/` within your project.

**Skill Priority:** Project skills > Personal skills > Superpowers skills

## Updating

```bash
OPENCODE_CONFIG_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"
cd "$OPENCODE_CONFIG_DIR/superpowers"
git pull
```

## Troubleshooting

### Plugin not loading

```bash
OPENCODE_CONFIG_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"
ls -l "$OPENCODE_CONFIG_DIR/plugins/superpowers.js"
ls "$OPENCODE_CONFIG_DIR/superpowers/.opencode/plugins/superpowers.js"
```

### Skills not found

```bash
OPENCODE_CONFIG_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"
ls -l "$OPENCODE_CONFIG_DIR/skills/superpowers"
```

Verify the symlink points to `$OPENCODE_CONFIG_DIR/superpowers/skills`. Use `skill` tool to list what's discovered.

### Tool mapping

When skills reference Claude Code tools:
- `TodoWrite` → `todowrite`
- `Task` with subagents → `@mention` syntax
- `Skill` tool → OpenCode's native `skill` tool
- File operations → your native tools

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Full documentation: https://github.com/obra/superpowers/blob/main/docs/README.opencode.md
