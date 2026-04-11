# Superpowers — Installation Guide

Install Superpowers on your preferred coding agent platform.

---

## Claude Code

### Official Marketplace

```bash
/plugin install superpowers@claude-plugins-official
```

### Community Marketplace

First, add the marketplace:

```bash
/plugin marketplace add obra/superpowers-marketplace
```

Then install:

```bash
/plugin install superpowers@superpowers-marketplace
```

---

## Cursor

In Cursor Agent chat:

```text
/add-plugin superpowers
```

Or search for "superpowers" in the Cursor plugin marketplace.

---

## Codex

Tell Codex:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md
```

Detailed docs: [docs/README.codex.md](docs/README.codex.md)

---

## OpenCode

Tell OpenCode:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md
```

Detailed docs: [.opencode/INSTALL.md](.opencode/INSTALL.md)

---

## GitHub Copilot CLI

Install the plugin:

```bash
gh extension install github/gh-copilot
```

Then configure the Superpowers hook by pointing your Copilot CLI config to the hooks directory.

---

## Gemini CLI

Superpowers provides a Gemini extension. Install it and enable the plugin following the Gemini CLI documentation.

See [gemini-extension.json](gemini-extension.json) for the extension definition.

---

## Manual Installation (Any Platform)

Clone the repository and point your agent's plugin/hook configuration to this directory:

```bash
git clone https://github.com/obra/superpowers.git
cd superpowers
```

Then configure your agent to use the hooks from the `hooks/` directory and skills from the `skills/` directory.

---

## Using with Ollama (Local AI Models)

Superpowers works with any AI provider, including local Ollama models. See [docs/ollama-setup.md](docs/ollama-setup.md) for a comprehensive guide on configuring your platform to use Ollama.

Quick start for OpenCode + Ollama: see [.opencode/OLLAMA.md](.opencode/OLLAMA.md)

---

## Verification

After installation, start a new session with your coding agent. You should see Superpowers context injected automatically (the SessionStart hook runs on session startup).

Try asking your agent to build something. It should automatically enter the brainstorming workflow instead of jumping straight into code.

---

## Requirements

| Platform | Requirements |
|----------|-------------|
| Claude Code | Claude Code installed and authenticated |
| Cursor | Cursor installed |
| Codex | Codex installed |
| OpenCode | OpenCode installed |
| GitHub Copilot CLI | GitHub CLI + Copilot extension installed |
| Gemini CLI | Gemini CLI installed |
| **Windows (all platforms)** | **Git Bash** (from [Git for Windows](https://git-scm.com/download/win)) — required for SessionStart hooks. If not installed, you'll see a clear error message. |

---

## Troubleshooting

### "Git Bash not found" on Windows

Install [Git for Windows](https://git-scm.com/download/win) or add Git Bash to your PATH. The hook requires bash to run cross-platform.

### Skills not triggering

Make sure the SessionStart hook is running. You should see Superpowers context output when you start a new session.

### "Plugin not found"

Double-check the plugin name and marketplace source. For manual installs, verify the path points to the cloned repository root.

---

## Next Steps

Once installed, read the [README.md](README.md) to understand the Superpowers workflow philosophy and how the skills work together.
