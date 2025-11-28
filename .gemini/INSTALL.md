# Installing Superpowers for Gemini CLI

## Prerequisites

- [Gemini CLI](https://github.com/google-gemini/gemini-cli) installed
- Node.js installed
- Git installed

## Installation Steps

### 1. Install from GitHub

```bash
gemini extensions install https://github.com/obra/superpowers
```

Or install from a local clone:

```bash
git clone https://github.com/obra/superpowers.git ~/.config/gemini/superpowers
gemini extensions link ~/.config/gemini/superpowers/.gemini
```

### 2. Build the MCP Server

If installing from local:

```bash
cd ~/.gemini/extensions/superpowers/mcp-server
npm install
npm run build
```

### 3. Restart Gemini CLI

Restart Gemini CLI. The extension will automatically load the superpowers context.

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

Create your own skills in `~/.config/gemini/skills/`:

```bash
mkdir -p ~/.config/gemini/skills/my-skill
```

Create `~/.config/gemini/skills/my-skill/SKILL.md`:

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

Create project-specific skills in your project:

```bash
# In your project directory
mkdir -p .gemini/skills/my-project-skill
```

Create `.gemini/skills/my-project-skill/SKILL.md`:

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

## Tool Mapping

When skills reference tools from other environments:

| Skill References | Gemini CLI Equivalent |
|------------------|----------------------|
| `TodoWrite` | `write_todos` |
| `Skill` tool | `use_skill` |
| `Read`, `Write`, `Edit` | Your native file tools |
| `Bash` | `run_shell_command` |
| `Task` with subagents | Break into sequential steps |

## Updating

```bash
gemini extensions update superpowers
```

Or if installed locally:

```bash
cd ~/.config/gemini/superpowers
git pull
cd .gemini/mcp-server
npm run build
```

## Troubleshooting

### Extension not loading

1. Check extension is installed: `gemini extensions list`
2. Verify MCP server is built: `ls ~/.gemini/extensions/superpowers/mcp-server/dist/`
3. Check Gemini CLI logs for errors

### Skills not found

1. Verify skills directory exists: `ls ~/.gemini/extensions/superpowers/skills`
2. Use `find_skills` tool to see what's discovered
3. Check file structure: each skill should have a `SKILL.md` file

### MCP Server errors

1. Rebuild: `cd ~/.gemini/extensions/superpowers/mcp-server && npm run build`
2. Check Node.js version: `node --version` (requires Node 18+)

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Documentation: https://github.com/obra/superpowers
