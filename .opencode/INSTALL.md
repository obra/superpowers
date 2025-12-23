<!--
AGENT INSTRUCTION: Detect the user's operating system and show only the relevant commands for their platform (Unix or Windows). Do not show both unless explicitly requested.
-->

# Installing Superpowers for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed
- Node.js installed
- Git installed

## Installation Steps

### For Unix (macOS/Linux)

#### 1. Install Superpowers

```bash
mkdir -p ~/.config/opencode/superpowers
git clone https://github.com/obra/superpowers.git ~/.config/opencode/superpowers
```

#### 2. Register the Plugin

Create a symlink so OpenCode discovers the plugin:

```bash
mkdir -p ~/.config/opencode/plugin
ln -sf ~/.config/opencode/superpowers/.opencode/plugin/superpowers.js ~/.config/opencode/plugin/superpowers.js
```

#### 3. Restart OpenCode

Restart OpenCode. The plugin will automatically inject superpowers context via the chat.message hook.

You should see superpowers is active when you ask "do you have superpowers?"

### For Windows

#### 1. Install Superpowers

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.config\opencode\superpowers"
git clone https://github.com/obra/superpowers.git "$env:USERPROFILE\.config\opencode\superpowers"
```

#### 2. Register the Plugin

Create a symlink so OpenCode discovers the plugin:

**Note:** Creating symlinks on Windows requires Developer Mode to be enabled. To enable Developer Mode:
1. Open Settings > System > For developers
2. Enable "Developer Mode"

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.config\opencode\plugin"
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.config\opencode\plugin\superpowers.js" -Target "$env:USERPROFILE\.config\opencode\superpowers\.opencode\plugin\superpowers.js"
```

#### 3. Restart OpenCode

Restart OpenCode. The plugin will automatically inject superpowers context via the chat.message hook.

You should see superpowers is active when you ask "do you have superpowers?"

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

#### For Unix (macOS/Linux)

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

#### For Windows

Create your own skills in `%USERPROFILE%\.config\opencode\skills\`:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.config\opencode\skills\my-skill"
```

Create `%USERPROFILE%\.config\opencode\skills\my-skill\SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

Personal skills override superpowers skills with the same name.

### Project Skills

#### For Unix (macOS/Linux)

Create project-specific skills in your OpenCode project:

```bash
# In your OpenCode project
mkdir -p .opencode/skills/my-project-skill
```

Create `.opencode/skills/my-project-skill/SKILL.md`:

```markdown
---
name: my-project-skill
description: Use when [condition] - [what it does]
---

# My Project Skill

[Your skill content here]
```

#### For Windows

Create project-specific skills in your OpenCode project:

```powershell
# In your OpenCode project
New-Item -ItemType Directory -Force -Path ".opencode\skills\my-project-skill"
```

Create `.opencode\skills\my-project-skill\SKILL.md`:

```markdown
---
name: my-project-skill
description: Use when [condition] - [what it does]
---

# My Project Skill

[Your skill content here]
```

**Skill Priority:** Project skills override personal skills, which override superpowers skills.

**Skill Naming:**
- `project:skill-name` - Force project skill lookup
- `skill-name` - Searches project → personal → superpowers
- `superpowers:skill-name` - Force superpowers skill lookup

## Updating

### For Unix (macOS/Linux)

```bash
cd ~/.config/opencode/superpowers
git pull
```

### For Windows

```powershell
cd "$env:USERPROFILE\.config\opencode\superpowers"
git pull
```

## Troubleshooting

### Plugin not loading

#### For Unix (macOS/Linux)

1. Check plugin file exists: `ls ~/.config/opencode/superpowers/.opencode/plugin/superpowers.js`
2. Check OpenCode logs for errors
3. Verify Node.js is installed: `node --version`

#### For Windows

1. Check plugin file exists: `Test-Path "$env:USERPROFILE\.config\opencode\superpowers\.opencode\plugin\superpowers.js"`
2. Check OpenCode logs for errors
3. Verify Node.js is installed: `node --version`

### Skills not found

#### For Unix (macOS/Linux)

1. Verify skills directory exists: `ls ~/.config/opencode/superpowers/skills`
2. Use `find_skills` tool to see what's discovered
3. Check file structure: each skill should have a `SKILL.md` file

#### For Windows

1. Verify skills directory exists: `Test-Path "$env:USERPROFILE\.config\opencode\superpowers\skills"`
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
