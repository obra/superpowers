# Superpowers MCP Server for CodeBuddy

This directory contains the MCP (Model Context Protocol) server that integrates Superpowers skills with CodeBuddy.

## Quick Start

```bash
# Install dependencies
npm install

# Test the server
node test.js

# Run the server (for MCP client)
node index.js
```

## Configuration

### CodeBuddy Configuration

Add to CodeBuddy's MCP settings:

```json
{
  "name": "superpowers",
  "type": "stdio",
  "command": "node",
  "args": ["/absolute/path/to/.codebuddy/superpowers/.codebuddy/mcp-server/index.js"],
  "disabled": false,
  "configSource": "user",
  "timeout": 60
}
```

### Environment Setup

The MCP server searches for skills in the following directories (priority order):

1. `~/.codebuddy/skills/` - Project skills (highest priority)
2. `~/.config/codebuddy/skills/` - Personal skills
3. `<repository>/skills/` - Superpowers core skills

## MCP Tools

### `use_skill`

Loads a specific skill's content into the conversation.

**Parameters:**
- `skill_name` (string, required): Name of the skill to load

**Examples:**
- `superpowers:brainstorming` - Load brainstorming skill from superpowers
- `my-custom-skill` - Load personal or project skill
- `project:my-skill` - Force load from project skills

**Returns:**
- Skill content with metadata and supporting directory information

### `find_skills`

Lists all available skills across all skill directories.

**Parameters:**
- None

**Returns:**
- List of all skills with names, descriptions, and directory paths

### `get_bootstrap`

Gets the Superpowers bootstrap content including using-superpowers skill and tool mappings.

**Parameters:**
- `compact` (boolean, optional): Use compact version (for after context compaction)

**Returns:**
- Bootstrap content with using-superpowers skill loaded

## Architecture

### Shared Core Module

The MCP server uses `lib/skills-core.js` for skill discovery and parsing, sharing this logic with OpenCode and Codex implementations.

**Functions:**
- `extractFrontmatter(filePath)` - Parse YAML frontmatter
- `stripFrontmatter(content)` - Remove frontmatter from skill content
- `findSkillsInDir(dir, sourceType, maxDepth)` - Recursively discover skills
- `resolveSkillPath(skillName, superpowersDir, personalDir)` - Resolve skill with shadowing
- `checkForUpdates(repoDir)` - Check for git updates

### Skill Loading Flow

1. User calls `use_skill` with skill name
2. Server resolves skill path (project → personal → superpowers)
3. Reads SKILL.md file
4. Extracts metadata (name, description)
5. Strips frontmatter
6. Returns formatted skill content with directory information

### Bootstrap Flow

1. CodeBuddy starts session
2. Optionally calls `get_bootstrap` (compact: false)
3. Server loads using-superpowers skill
4. Adds tool mapping instructions
5. Returns complete bootstrap content

## Development

### Running Tests

```bash
node test.js
```

This tests:
- Shared skills-core module loading
- Skill discovery
- Skill parsing (frontmatter)
- Skill resolution (with shadowing)
- Bootstrap generation
- Tool schemas
- Directory structure

### Adding New Tools

To add a new MCP tool:

1. Add tool definition to `ListToolsRequestSchema` handler
2. Add implementation in `CallToolRequestSchema` handler
3. Update test.js to include new tool test
4. Update documentation

Example:

```javascript
// In ListToolsRequestSchema handler
{
  name: 'new_tool',
  description: 'Description of what the tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: '...' }
    },
    required: ['param1']
  }
}

// In CallToolRequestSchema handler
if (name === 'new_tool') {
  const { param1 } = args;
  // Implementation
  return { content: [{ type: 'text', text: result }] };
}
```

## Troubleshooting

### Server Won't Start

1. Check Node.js version: `node --version` (needs 18+)
2. Verify dependencies: `ls node_modules/@modelcontextprotocol`
3. Check file paths in configuration are absolute paths
4. Run test.js to verify core functionality

### Skills Not Found

1. Verify superpowers/skills/ directory exists
2. Check file permissions
3. Run `find_skills` tool to see what's discovered
4. Check skill files have SKILL.md with proper frontmatter

### MCP Connection Issues

1. Verify CodeBuddy supports MCP (check version)
2. Check MCP server is configured correctly
3. Enable debug logging in CodeBuddy
4. Try running server manually to see error messages

## Related Documentation

- Main documentation: `docs/README.codebuddy.md`
- Skill development: `skills/writing-skills/SKILL.md`
- Superpowers README: `README.md`
- CodeBuddy MCP guide: https://cloud.tencent.com/developer/article/2526313
