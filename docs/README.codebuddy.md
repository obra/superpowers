# Superpowers for CodeBuddy

Complete guide for using Superpowers with [Tencent CodeBuddy](https://copilot.tencent.com), including support for the internal version.

## Quick Install

### Method 1: Using npx (Recommended for CodeBuddy Internal)

Tell CodeBuddy in Craft mode:

```
Configure MCP server:
- Name: superpowers
- Type: stdio
- Command: npx
- Args: -y, github.com/binbinao/superpowers#main/.codebuddy/mcp-server

Or download and run locally:
git clone https://github.com/binbinao/superpowers.git ~/.codebuddy/superpowers
node ~/.codebuddy/superpowers/.codebuddy/mcp-server/index.js
```

### Method 2: Manual Installation

#### Prerequisites

- [CodeBuddy](https://copilot.tencent.com) installed (VS Code or JetBrains plugin)
- Node.js 18+ installed
- Git installed

#### Installation Steps

##### 1. Clone Superpowers

```bash
mkdir -p ~/.codebuddy
git clone https://github.com/binbinao/superpowers.git ~/.codebuddy/superpowers
```

##### 2. Install Dependencies

```bash
cd ~/.codebuddy/superpowers/.codebuddy/mcp-server
npm install
```

##### 3. Configure MCP in CodeBuddy

**For VS Code Plugin:**

1. Open VS Code
2. Click the CodeBuddy icon in the sidebar
3. Select "Craft" mode
4. Click "MCP" option
5. Click "Add MCP Server" or "Configure"
6. Add new server with these settings:

```json
{
  "name": "superpowers",
  "type": "stdio",
  "command": "node",
  "args": [
    "/Users/your-home/.codebuddy/superpowers/.codebuddy/mcp-server/index.js"
  ],
  "disabled": false
}
```

**For JetBrains Plugin:**

1. Open CodeBuddy settings in your JetBrains IDE
2. Navigate to MCP configuration
3. Add new server with same settings as above

**For Internal Version:**

The internal version of CodeBuddy supports additional configuration options:

```json
{
  "name": "superpowers",
  "type": "stdio",
  "command": "node",
  "args": [
    "/Users/your-home/.codebuddy/superpowers/.codebuddy/mcp-server/index.js"
  ],
  "disabled": false,
  "configSource": "user",
  "timeout": 60
}
```

##### 4. Restart CodeBuddy

Restart CodeBuddy to load the MCP server. You should see "superpowers" in the MCP tools list.

##### 5. Verify Installation

Ask CodeBuddy in Craft mode:

```
Use the find_skills tool to list all available superpowers skills
```

You should see a list of available skills.

## Usage

### Finding Skills

Use the `find_skills` tool in Craft mode:

```
Use find_skills tool to list available skills
```

### Loading a Skill

Use the `use_skill` tool in Craft mode:

```
Use use_skill tool with skill_name: "superpowers:brainstorming"
```

### Getting Bootstrap

To get the full superpowers bootstrap (recommended for new sessions):

```
Use get_bootstrap tool with compact: false
```

For compact version after context compaction:

```
Use get_bootstrap tool with compact: true
```

### Personal Skills

Create your own skills in `~/.config/codebuddy/skills/`:

```bash
mkdir -p ~/.config/codebuddy/skills/my-skill
```

Create `~/.config/codebuddy/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

### Project Skills

Create project-specific skills in your CodeBuddy project:

```bash
# In your CodeBuddy project directory
mkdir -p .codebuddy/skills/my-project-skill
```

Create `.codebuddy/skills/my-project-skill/SKILL.md`:

```markdown
---
name: my-project-skill
description: Use when [condition] - [what it does]
---

# My Project Skill

[Your skill content here]
```

## Skill Priority

Skills are resolved with this priority order:

1. **Project skills** (`.codebuddy/skills/`) - Highest priority
2. **Personal skills** (`~/.config/codebuddy/skills/`)
3. **Superpowers skills** (`~/.codebuddy/superpowers/skills/`)

You can force resolution to a specific level:
- `project:skill-name` - Force project skill
- `skill-name` - Search project → personal → superpowers
- `superpowers:skill-name` - Force superpowers skill

## Features

### MCP Server Architecture

The CodeBuddy implementation uses the Model Context Protocol (MCP) standard:

**Location:** `~/.codebuddy/superpowers/.codebuddy/mcp-server/`

**Components:**
- Three MCP tools: `use_skill`, `find_skills`, `get_bootstrap`
- Uses shared `lib/skills-core.js` module (also used by Codex and OpenCode)
- Automatic bootstrap on session start
- Context compaction support with compact bootstrap

### Shared Core Module

**Location:** `~/.codebuddy/superpowers/lib/skills-core.js`

**Functions:**
- `extractFrontmatter()` - Parse skill metadata
- `stripFrontmatter()` - Remove metadata from content
- `findSkillsInDir()` - Recursive skill discovery
- `resolveSkillPath()` - Skill resolution with shadowing
- `checkForUpdates()` - Git update detection

This module is shared between CodeBuddy, OpenCode, and Codex implementations for code reuse.

### Tool Mapping

Skills written for Claude Code are automatically adapted for CodeBuddy. The MCP server provides mapping instructions:

- `TodoWrite` → `todo_write`
- `Task` with subagents → CodeBuddy's task system
- `Skill` tool → `use_skill` MCP tool
- File operations → Native CodeBuddy tools

## Architecture

### MCP Server Structure

```javascript
// .codebuddy/mcp-server/index.js
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Exposes 3 tools:
// 1. use_skill - Load a specific skill
// 2. find_skills - List all available skills
// 3. get_bootstrap - Get superpowers bootstrap content

// Uses shared lib/skills-core.js for skill discovery and parsing
```

### Configuration File (CodeBuddy Internal)

CodeBuddy internal version supports configuring MCP via `Craft_mcp_setting.json`:

```json
{
  "servers": {
    "superpowers": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/.codebuddy/superpowers/.codebuddy/mcp-server/index.js"],
      "disabled": false,
      "configSource": "user",
      "timeout": 60
    }
  }
}
```

## Updating

```bash
cd ~/.codebuddy/superpowers
git pull
cd .codebuddy/mcp-server
npm install  # If dependencies changed
```

Restart CodeBuddy to load the updates.

## Troubleshooting

### MCP server not starting

1. Check Node.js version: `node --version` (should be 18+)
2. Check file exists: `ls ~/.codebuddy/superpowers/.codebuddy/mcp-server/index.js`
3. Check dependencies installed: `ls ~/.codebuddy/superpowers/.codebuddy/mcp-server/node_modules`
4. Try running manually: `node ~/.codebuddy/superpowers/.codebuddy/mcp-server/index.js`
5. Check CodeBuddy logs for error messages

### Skills not found

1. Verify skills directory: `ls ~/.codebuddy/superpowers/skills`
2. Use `find_skills` tool to see what's discovered
3. Check skill structure: each skill needs a `SKILL.md` file
4. Verify MCP server is running and enabled in CodeBuddy

### Tools not available

1. Check MCP server is configured correctly
2. Verify CodeBuddy version supports MCP (requires recent version with MCP support)
3. Check CodeBuddy MCP settings to ensure superpowers server is enabled
4. Try restarting CodeBuddy

### Permission errors

1. Ensure Node.js has execute permission on the script
2. Check file permissions: `ls -la ~/.codebuddy/superpowers/.codebuddy/mcp-server/index.js`
3. If using npm install, verify ~/.npm directory is writable

### Internal version specific issues

For the internal version of CodeBuddy:
1. Verify `configSource: "user"` is set
2. Check if additional authentication is required
3. Verify timeout value is appropriate (default 60 seconds)
4. Check if there are specific network restrictions

## Getting Help

- Report issues: https://github.com/binbinao/superpowers/issues
- Main documentation: https://github.com/binbinao/superpowers
- CodeBuddy docs: https://cloud.tencent.com/document/product/1749
- CodeBuddy MCP guide: https://cloud.tencent.com/developer/article/2526313

## Differences from Other Platforms

### CodeBuddy vs Claude Code

- **MCP Protocol**: CodeBuddy uses MCP instead of Claude's native plugin system
- **Craft Mode**: Skills work best in CodeBuddy's Craft mode
- **Tool Names**: CodeBuddy uses different tool names (todo_write vs TodoWrite)

### CodeBuddy vs OpenCode

- **MCP vs Plugin**: CodeBuddy uses MCP (stdio transport), OpenCode uses custom plugin system
- **Configuration**: CodeBuddy uses MCP settings, OpenCode uses opencode.json
- **Internal Version**: CodeBuddy has an internal version with extended capabilities

### CodeBuddy vs Codex

- **MCP vs CLI**: CodeBuddy uses MCP server, Codex uses shell scripts
- **Real-time**: MCP provides real-time tool invocation, Codex is manual
- **Richer Interface**: CodeBuddy has a GUI with Craft mode integration

## Testing

The implementation includes test verification. To manually test:

```bash
cd ~/.codebuddy/superpowers
node .codebuddy/mcp-server/test.js
```

This will:
1. Load shared skills-core module
2. Discover all available skills
3. Test skill resolution
4. Verify bootstrap generation

## Internal Version Features

The internal version of CodeBuddy provides additional capabilities:

1. **Team Knowledge Base Integration**: Skills can reference team knowledge bases
2. **Custom Agent Management**: Configure custom agents for specific workflows
3. **Multi-model Support**: Switch between different models (混元, DeepSeek, GLM)
4. **Enterprise Authentication**: SSO and enterprise account integration
5. **Advanced MCP Configuration**: More granular control over MCP servers

To utilize these features with Superpowers:

1. Create project skills that reference team knowledge bases
2. Configure custom agents in CodeBuddy settings to work with specific skills
3. Use MCP configuration to pass additional parameters to skills

## Best Practices

### For Internal CodeBuddy Users

1. **Centralize Skills**: Use `~/.config/codebuddy/skills/` for team-wide skills
2. **Project-Specific**: Use `.codebuddy/skills/` for project-specific overrides
3. **Version Control**: Track `.codebuddy/skills/` in git for team sharing
4. **Regular Updates**: Keep superpowers updated for latest improvements
5. **Monitor Usage**: Use CodeBuddy's analytics to see which skills are most useful

### Skill Development

1. **Follow TDD**: Use `writing-skills` skill for creating new skills
2. **Test Locally**: Test skills in personal skills dir before promoting
3. **Document Well**: Clear descriptions help skill discovery
4. **Share with Team**: Good skills can be shared via git or team knowledge base

## Contributing

Skills live in this repository. To contribute:

1. Fork the repository
2. Create a branch for your skill
3. Follow `writing-skills` skill to create and test new skills
4. Submit a PR

See `skills/writing-skills/SKILL.md` for complete guide.
