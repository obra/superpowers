# Superpowers — Skills for Any AI Agent

**Superpowers** gives your AI coding agents structured development workflows: brainstorming, test-driven development, systematic debugging, implementation planning, and code review — via the **Model Context Protocol (MCP)**.

## Works With

- ✅ **GitHub Copilot** (Agent Mode)
- ✅ **Cline**
- ✅ **Roo Code**
- ✅ **Continue**
- ✅ Any MCP-compatible client

## Quickstart

1. Install this extension from the VS Code Marketplace
2. Open your AI agent (Copilot Agent Mode, Cline, etc.)
3. The **Superpowers Skills** MCP server is registered automatically

## Available Skills

| Use | Skill |
|---|---|
| Design before coding | `brainstorm` prompt or `activate_skill("brainstorming")` |
| Write implementation plan | `plan` prompt or `activate_skill("writing-plans")` |
| Debug systematically | `debug` prompt or `activate_skill("systematic-debugging")` |
| Test-driven development | `tdd` prompt or `activate_skill("test-driven-development")` |
| Code review | `review` prompt or `activate_skill("requesting-code-review")` |
| + 9 more | `list_skills` tool |

## MCP Tools

| Tool | Description |
|---|---|
| `activate_skill` | Load a skill by name. Returns full content the agent must follow. |
| `list_skills` | List all available skills with descriptions. |

## MCP Resources

Each skill is also available as a readable resource:
- `superpowers://bootstrap` — Core bootstrap context
- `superpowers://skills/brainstorming`
- `superpowers://skills/test-driven-development`
- ... (14 skills total)

## MCP Prompts

Pre-built prompt templates to kickstart workflows:
- `brainstorm` — Brainstorm a feature
- `debug` — Debug an issue
- `tdd` — Start TDD
- `plan` — Write an implementation plan
- `review` — Request a code review

## Manual Configuration (without VS Code extension)

Add to `.vscode/mcp.json` or `cline_mcp.json`:

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

## Links

- [GitHub](https://github.com/obra/superpowers)
- [Discord](https://discord.gg/35wsABTejz)
- [Release Notes](https://github.com/obra/superpowers/blob/main/RELEASE-NOTES.md)
