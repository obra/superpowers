# Installing Superpowers for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed
- Node.js installed
- Git installed

## Installation Steps

### 1. Install Superpowers

```bash
# Clone superpowers to OpenCode config directory
mkdir -p ~/.config/opencode/superpowers
git clone https://github.com/obra/superpowers.git ~/.config/opencode/superpowers

# Copy the prompt file for agent configuration
mkdir -p ~/.config/opencode/prompts
cp ~/.config/opencode/superpowers/.opencode/prompts/superpowers.txt ~/.config/opencode/prompts/
```

### 2. Register the Plugin

OpenCode discovers plugins from `~/.config/opencode/plugin/`. Create a symlink:

```bash
mkdir -p ~/.config/opencode/plugin
ln -sf ~/.config/opencode/superpowers/.opencode/plugin/superpowers.js ~/.config/opencode/plugin/superpowers.js
```

Alternatively, for project-local installation:

```bash
# In your OpenCode project
mkdir -p .opencode/plugin
ln -sf ~/.config/opencode/superpowers/.opencode/plugin/superpowers.js .opencode/plugin/superpowers.js
```

### 3. Configure Agent Prompt

The static prompt file `~/.config/opencode/prompts/superpowers.txt` was copied in step 1. Add this to your agent configuration.

**Option A: Extend the Build agent** (recommended)

Edit `~/.config/opencode/opencode.json`:

```json
{
  "agent": {
    "build": {
      "prompt": "{file:./prompts/superpowers.txt}"
    }
  }
}
```

**Option B: Create a custom agent**

Create `~/.config/opencode/agent/superbuild.md`:

```markdown
---
description: Build agent with superpowers support
---

{file:./prompts/superpowers.txt}
```

### 4. Restart OpenCode

Restart OpenCode to load the plugin and activate the prompt.

## Usage

### Finding Skills

Use the `find_skills` tool to list all available skills:

```
use find_skills tool
```

### Loading a Skill

Use the `use_skill` tool to load a specific skill:

```
use use_skill tool with skill_name: "superpowers:brainstorming"
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

Personal skills override superpowers skills with the same name.

## Updating

```bash
cd ~/.config/opencode/superpowers
git pull
```

## Troubleshooting

### Plugin not loading

1. Check plugin file exists: `ls ~/.config/opencode/superpowers/.opencode/plugin/superpowers.js`
2. Check OpenCode logs for errors
3. Verify Node.js is installed: `node --version`

### Skills not found

1. Verify skills directory exists: `ls ~/.config/opencode/superpowers/skills`
2. Use `find_skills` tool to see what's discovered
3. Check file structure: each skill should have a `SKILL.md` file

### Tool mapping issues

When a skill references a Claude Code tool you don't have:
- `TodoWrite` → use `update_plan`
- `Task` with subagents → use `@mention` syntax to invoke OpenCode subagents
- `Skill` → use `use_skill` tool
- File operations → use your native tools

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Documentation: https://github.com/obra/superpowers
