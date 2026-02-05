# Installing Superpowers for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed
- Git installed

## Installation Steps

### 1. Run installer

This will clone/update the central repo at `~/.superpowers` and create the OpenCode links:

- `~/.config/opencode/superpowers -> ~/.superpowers`
- `~/.config/opencode/plugins/superpowers.js -> ~/.superpowers/.opencode/plugins/superpowers.js`
- `~/.config/opencode/skills/superpowers -> ~/.superpowers/skills`

If this is your first install (and `~/.superpowers` does not exist yet), run from a temporary clone:

```bash
git clone https://github.com/obra/superpowers.git /tmp/superpowers
node /tmp/superpowers/.opencode/superpowers-opencode install
```

If you already have `~/.superpowers` installed, you can run:

```bash
node ~/.superpowers/.opencode/superpowers-opencode upgrade
```

### 2. Restart OpenCode

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

Create your own skills in `~/.config/opencode/skills/`:

```bash
mkdir -p ~/.config/opencode/skills/my-skill
```

Create `~/.config/opencode/skills/my-skill/SKILL.md`:

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
node ~/.superpowers/.opencode/superpowers-opencode upgrade
```

## Troubleshooting

### Plugin not loading

1. Check plugin symlink: `ls -l ~/.config/opencode/plugins/superpowers.js`
2. Check source exists: `ls ~/.config/opencode/superpowers/.opencode/plugins/superpowers.js`
3. Check OpenCode logs for errors

### Skills not found

1. Check skills symlink: `ls -l ~/.config/opencode/skills/superpowers`
2. Verify it points to: `~/.config/opencode/superpowers/skills`
3. Use `skill` tool to list what's discovered

### Tool mapping

When skills reference Claude Code tools:
- `TodoWrite` → `update_plan`
- `Task` with subagents → `@mention` syntax
- `Skill` tool → OpenCode's native `skill` tool
- File operations → your native tools

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Full documentation: https://github.com/obra/superpowers/blob/main/docs/README.opencode.md
