# superpowers-mcp

MCP server that exposes [Superpowers](https://github.com/obra/superpowers) skills to any MCP-compatible agent.

## Why

Every existing Superpowers adapter (Cline, OpenCode, Codex…) requires:
- Knowing the repo path on disk
- Creating symlinks or copying files
- A platform-specific adapter per agent

The MCP server eliminates all of that. One config entry, any agent.

## Tools

| Tool | Input | Purpose |
|------|-------|---------|
| `list_skills` | — | Returns all skill names + descriptions (lazy — no body content) |
| `load_skill` | `{ name }` | Returns full skill content for the named skill |
| `list_capabilities` | — | Returns CAPABILITIES.md (platform-native tool mappings) |
| `get_bootstrap` | — | Returns the bootstrap guide explaining the skill system |

## Resources

| URI | Content |
|-----|---------|
| `skill://{name}` | Full SKILL.md body for the named skill |
| `superpowers://bootstrap` | Universal bootstrap document |
| `superpowers://capabilities` | CAPABILITIES.md |

## Installation

### Option 1: Zero-install via npx (recommended)

No setup needed. Just add this to your agent's MCP config:

```json
{
  "mcpServers": {
    "superpowers": {
      "command": "npx",
      "args": ["superpowers-mcp"]
    }
  }
}
```

### Option 2: Global install

```bash
npm install -g superpowers-mcp
```

Then use `superpowers-mcp` as the command instead of `npx superpowers-mcp`.

## Agent Configuration Examples

### Cline

VSCode settings or `.vscode/settings.json`:

```json
{
  "cline.mcpServers": {
    "superpowers": {
      "command": "npx",
      "args": ["superpowers-mcp"]
    }
  }
}
```

### Claude Code

`claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "superpowers": {
      "command": "npx",
      "args": ["superpowers-mcp"]
    }
  }
}
```

### Cursor

`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "superpowers": {
      "command": "npx",
      "args": ["superpowers-mcp"]
    }
  }
}
```

### Goose

`~/.config/goose/profiles.yaml`:

```yaml
extensions:
  superpowers:
    type: stdio
    cmd: npx
    args:
      - superpowers-mcp
```

## How it Works

```
Agent calls list_skills     → server scans skills/*/SKILL.md, returns names + descriptions
Agent calls load_skill(name)→ server reads skills/{name}/SKILL.md, returns body content
Agent calls get_bootstrap   → server reads universal/bootstrap.md
```

Skills are loaded **on demand** — nothing is injected into context until the agent asks for it.

## Development

```bash
# From repo root
cd .mcp
npm install
node index.js   # starts server on stdio; ^C to stop
```

## Updating

Skills update automatically when you update the npm package:

```bash
npx superpowers-mcp@latest   # always gets the newest version
```
