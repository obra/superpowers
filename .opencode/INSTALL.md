# Installing Superpowers for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed
- Git installed

## Installation Steps

> **Path note:** Use `OPENCODE_CONFIG_DIR` as the install root when it is set. Otherwise, use the default config directory (`~/.config/opencode` on macOS/Linux).

### 1. Set your config directory

```bash
OPENCODE_CONFIG_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"
```

### 2. Clone Superpowers

```bash
git clone https://github.com/obra/superpowers.git "${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}/superpowers"
```

### 3. Register the Plugin

Create a symlink so OpenCode discovers the plugin:

```bash
mkdir -p "${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}/plugins"
rm -f "${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}/plugins/superpowers.js"
ln -s "${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}/superpowers/.opencode/plugins/superpowers.js" "${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}/plugins/superpowers.js"
```

### 4. Symlink Skills

Create a symlink so OpenCode's native skill tool discovers superpowers skills:

```bash
mkdir -p "${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}/skills"
rm -rf "${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}/skills/superpowers"
ln -s "${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}/superpowers/skills" "${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}/skills/superpowers"
```

### 5. Restart OpenCode

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

Create your own skills in `"${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}/skills/"`:

```bash
mkdir -p "${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}/skills/my-skill"
```

Create `"${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}/skills/my-skill/SKILL.md"`:

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
cd "${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}/superpowers"
git pull
```

## Troubleshooting

### Plugin not loading

1. Set config root: `OPENCODE_CONFIG_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"`
2. Check plugin symlink: `ls -l "${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}/plugins/superpowers.js"`
3. Check source exists: `ls "${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}/superpowers/.opencode/plugins/superpowers.js"`
4. Check OpenCode logs for errors

### Skills not found

1. Set config root: `OPENCODE_CONFIG_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"`
2. Check skills symlink: `ls -l "${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}/skills/superpowers"`
3. Verify it points to: `"${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}/superpowers/skills"`
4. Use `skill` tool to list what's discovered

### Tool mapping

When skills reference Claude Code tools:
- `TodoWrite` -> `todowrite`
- `Task` with subagents -> `@mention` syntax
- `Skill` tool -> OpenCode's native `skill` tool
- File operations -> your native tools

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Full documentation: https://github.com/obra/superpowers/blob/main/docs/README.opencode.md
