<!-- GENERATED: do not edit directly. Source: templates/.opencode/INSTALL.md -->
# Installing Superpowers for {{AGENT_NAME}}

## Prerequisites

- [{{AGENT_NAME}}](https://opencode.ai) installed
- Git installed

## Installation Steps

### 1. Clone Superpowers

```bash
git clone https://github.com/obra/superpowers.git {{SUPERPOWERS_DIR}}
```

### 2. Register the Plugin

Create a symlink so {{AGENT_NAME}} discovers the plugin:

```bash
mkdir -p {{PLUGIN_DIR}}
rm -f {{PLUGIN_DIR}}/superpowers.js
ln -s {{SUPERPOWERS_DIR}}/.opencode/plugins/superpowers.js {{PLUGIN_DIR}}/superpowers.js
```

### 3. Symlink Skills

Create a symlink so {{AGENT_NAME}}'s native skill tool discovers superpowers skills:

```bash
mkdir -p {{SKILLS_DIR}}
rm -rf {{SKILLS_DIR}}/superpowers
ln -s {{SUPERPOWERS_DIR}}/skills {{SKILLS_DIR}}/superpowers
```

### 4. Restart {{AGENT_NAME}}

Restart {{AGENT_NAME}}. The plugin will automatically inject superpowers context.

Verify by asking: "do you have superpowers?"

## Usage

### Finding Skills

Use {{AGENT_NAME}}'s native `skill` tool to list available skills:

```
use skill tool to list skills
```

### Loading a Skill

Use {{AGENT_NAME}}'s native `skill` tool to load a specific skill:

```
use skill tool to load superpowers/brainstorming
```

### Personal Skills

Create your own skills in `{{SKILLS_DIR}}/`:

```bash
mkdir -p {{SKILLS_DIR}}/my-skill
```

Create `{{SKILLS_DIR}}/my-skill/SKILL.md`:

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
cd {{SUPERPOWERS_DIR}}
git pull
```

## Troubleshooting

### Plugin not loading

1. Check plugin symlink: `ls -l {{PLUGIN_DIR}}/superpowers.js`
2. Check source exists: `ls {{SUPERPOWERS_DIR}}/.opencode/plugins/superpowers.js`
3. Check OpenCode logs for errors

### Skills not found

1. Check skills symlink: `ls -l {{SKILLS_DIR}}/superpowers`
2. Verify it points to: `{{SUPERPOWERS_DIR}}/skills`
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
