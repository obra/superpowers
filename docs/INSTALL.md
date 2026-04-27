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

### Step 2: Configure provider

In your `opencode.json`, configure your provider (example with PCAI/Qwen3):

```json
{
  "provider": {
    "pcai": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "PSW PCAI",
      "options": {
        "baseURL": "https://your-qwen3-endpoint/v1",
        "toolParser": "hermes-strict"
      },
      "models": {
        "Qwen/Qwen3-30B-A3B-Instruct-2507-FP8": {
          "name": "Qwen 3",
          "limit": {
            "context": 200000,
            "output": 32768
          }
        }
      }
    }
  },
  "model": "Qwen/Qwen3-30B-A3B-Instruct-2507-FP8"
}
```

### Step 3: Restart OpenCode

Restart OpenCode. Both plugins will auto-install and register.

Verify by asking: "Tell me about your superpowers and devkit-dotnet"

## Included Content

### Agents
- `orchestrator` - Main agent hub, single point of contact for developers

### Skills

**Methodology (Superpowers):**
- brainstorming, writing-plans, test-driven-development
- subagent-driven-development, systematic-debugging
- verification-before-completion, requesting-code-review
- receiving-code-review, finishing-a-development-branch
- using-git-worktrees, dispatching-parallel-agents, writing-skills, executing-plans

**.NET Technical:**
- scaffolding, clean-arch-design, ddd-aggregate, domain-analysis
- blazor-component, blazor-authentication, blazor-debugging
- fluentui-blazor, yarp-config, dapr-microservices
- jwt-auth, ef-core-filters, row-level-security, tenant-resolution
- sql-optimization, sql-code-review, dapper-reading
- document-export, and more...

**RAG & Utils:**
- rag-document-retrieval, document-parsing, find-skills

### Commands
- /start, /brainstorm, /plan, /execute, /poc
- /test, /review, /migrate
- rag-load, rag-search, analyze-image

### Scripts
- `.opencode/scripts/setup.sh` - Install dependencies
- `.opencode/scripts/test-endpoints.sh` - Test microservices health
- `.opencode/scripts/test-connections.sh` - Test SQL/Redis/Dapr connections

## Setup

After installation, run the setup script:

```bash
bash .opencode/scripts/setup.sh
```

This installs:
- Python dependencies (OpenCV, Pillow, PyTesseract)
- Tesseract OCR
- PyMuPDF, openpyxl, python-docx

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

## Uninstalling

Remove the plugin lines from your `opencode.json`:

```json
{
  "plugin": []
}
```

Then restart OpenCode.

## Troubleshooting

### Skills not loading

1. Check plugin order (superpowers first, devkit-dotnet second)
2. Run: `opencode run --print-logs "hello" 2>&1 | grep -i devkit`
3. Verify both plugins are installed: `ls ~/.config/opencode/plugins/`

### Commands not found

Commands are defined in `.opencode/commands/`. Ensure the plugin is loading correctly.

### Scripts not working

Make scripts executable:
```bash
chmod +x .opencode/scripts/*.sh
```

## Documentation

- [AGENTS.md](AGENTS.md) - Agent documentation
- [METHODOLOGY.md](METHODOLOGY.md) - Superpowers methodology guide

## Support

For issues with this DevKit, open an issue at:
https://github.com/Hayr06/superpowers/issues