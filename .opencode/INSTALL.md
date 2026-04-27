# Installing DevKit DotNet + Superpowers

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed
- .NET SDK 8/9/10 (for .NET development)

## Installation

### Step 1: Add plugins to opencode.json

Add both plugins to the `plugin` array in your `opencode.json` (global or project-level):

```json
{
  "plugin": [
    "superpowers@git+https://github.com/obra/superpowers.git",
    "devkit-dotnet@git+https://github.com/Hayr06/superpowers.git"
  ]
}
```

**Important:** Superpowers must be listed FIRST, then devkit-dotnet. The plugin order matters.

### Step 2: Restart OpenCode

Restart OpenCode. Both plugins will auto-install and register all skills, agents, and commands.

Verify by asking: "Tell me about your superpowers and devkit-dotnet"

## Setup Script

After installation, run the setup script to install dependencies:

```bash
bash .opencode/scripts/setup.sh
```

This installs:
- Python dependencies (OpenCV, Pillow, PyTesseract for Vision)
- Tesseract OCR
- RAG dependencies (PyMuPDF, openpyxl, python-docx)

## Included Content

### Agents
- `orchestrator` - Main agent hub, single point of contact for developers

### Skills (40+ total)

**Methodology (13 Superpowers skills):**
- brainstorming, writing-plans, test-driven-development
- subagent-driven-development, systematic-debugging
- verification-before-completion, requesting-code-review
- receiving-code-review, finishing-a-development-branch
- using-git-worktrees, dispatching-parallel-agents, writing-skills, executing-plans

**.NET Technical (25+ skills):**
- scaffolding, clean-arch-design, ddd-aggregate, domain-analysis
- blazor-component, blazor-authentication, blazor-debugging, blazor-error-handling, blazor-hosting
- fluentui-blazor, yarp-config, dapr-microservices
- jwt-auth, ef-core-filters, row-level-security, tenant-resolution
- sql-optimization, sql-code-review, dapper-reading, sqlserver-migration
- document-export, nuget-manager, dotnet-best-practices
- error-handling-patterns, fix-errors, frontend-design
- i18n-localization, microsoft-docs, rate-limiting

**RAG & Utils:**
- rag-document-retrieval, document-parsing, find-skills

### Commands
- `/start` - Full session with brainstorming
- `/brainstorm` - Design session
- `/plan` - Create implementation plan
- `/execute` - Execute plan
- `/poc` - Proof of concept
- `/test` - Run tests with coverage
- `/review` - Code review
- `/migrate` - Monolith to microservices
- rag-load, rag-search, analyze-image

### Scripts
- `setup.sh` - Install dependencies
- `test-endpoints.sh` - Test microservices /health endpoints
- `test-connections.sh` - Test SQL Server, Redis, Dapr connections

## Updating

Both plugins update automatically when you restart OpenCode.

To pin specific versions:

```json
{
  "plugin": [
    "superpowers@git+https://github.com/obra/superpowers.git#v5.0.3",
    "devkit-dotnet@git+https://github.com/Hayr06/superpowers.git#main"
  ]
}
```

## Troubleshooting

### Plugin not loading

1. Check plugin order (superpowers FIRST, devkit-dotnet SECOND)
2. Check logs: `opencode run --print-logs "hello" 2>&1 | grep -i devkit`
3. Verify plugins are installed: `ls ~/.config/opencode/plugins/`

### Skills not found

Use `skill` tool to list what's discovered:
```
use skill tool to list skills
```

### Scripts not working

Make scripts executable:
```bash
chmod +x .opencode/scripts/*.sh
```

## Documentation

- [AGENTS.md](AGENTS.md) - Agent documentation
- [docs/METHODOLOGY.md](docs/METHODOLOGY.md) - Superpowers methodology guide
- [docs/INSTALL.md](docs/INSTALL.md) - Full installation guide

## Getting Help

- DevKit issues: https://github.com/Hayr06/superpowers/issues
- Superpowers: https://github.com/obra/superpowers/issues