# Inventory: claude-codex-settings

**Path:** /Users/jacob.hurlburt/repos/claude/claude-codex-settings

## Other Directories
- .claude/
- .claude-plugin/
- .codex/
- .vscode/

## Feature Details

### Agents (.claude/agents)
- agents/code-simplifier.md
- agents/pr-manager.md
- agents/commit-manager.md

### Commands (.claude/commands)
- commands/explain-architecture-pattern.md
- commands/update-pr-summary.md
- commands/create-pr.md
- commands/commit-staged.md

### Hooks (.claude/hooks)
- hooks/hook_tavily_extract_to_advanced.py
- hooks/hook_enforce_rg_over_grep.py
- hooks/hook_websearch_to_tavily_search.py
- hooks/hook_webfetch_to_tavily_extract.py
- hooks/hook_python_code_quality.py
- hooks/hook_prettier_formatting.py
- hooks/hook_markdown_formatting.py
- hooks/hook_bash_formatting.py
- hooks/hook_load_claude_md.py
- hooks/hooks.json

### Configuration Files
- CLAUDE.md (main configuration, symlinked as AGENTS.md)
- mcp.json (MCP server configuration)
- .codex/config.toml (Codex configuration)
- .claude/settings.json (Claude settings)
- .claude/settings-zai.json (Alternative settings)
- .claude/ccusage.json (Credit usage tracking)

### Documentation
- README.md
- INSTALL.md
- LICENSE

## Summary

**Total Features:**
- 3 agents
- 4 commands
- 10 hooks (9 Python hooks + 1 JSON config)

**Structure:** Uses `.claude` directory structure rather than top-level directories.
**Key Features:** Python code quality enforcement, Tavily search integration, formatting hooks, git workflow commands.
