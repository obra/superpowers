# Superpowers for VS Code Copilot (Agent Mode)

Guide for using Superpowers with GitHub Copilot in Visual Studio Code.

> **Requires:** VS Code 1.109+ and a GitHub Copilot subscription (Individual, Business, or Enterprise).

## Install

```bash
git clone https://github.com/obra/superpowers.git ~/.copilot/superpowers && ~/.copilot/superpowers/.copilot/install.sh
```

This will:
- Symlink each skill individually into `~/.copilot/skills/` (hub pattern)
- Symlink agent definitions into `~/.copilot/agents/`
- Inject the Superpowers context block into `~/.copilot/copilot-instructions.md`

Then **restart VS Code** or reload the window (`Ctrl+Shift+P` → "Developer: Reload Window").

## How It Works

VS Code 1.109 (February 2026) made Agent Skills generally available and enabled by default. At startup, Copilot Agent Mode scans `~/.copilot/skills/` for directories containing a `SKILL.md` file and makes them available automatically.

The installer also injects the Superpowers context block into `copilot-instructions.md`, which teaches Copilot the methodology — ensuring it checks for relevant skills before every task, maps Claude Code terminology to VS Code equivalents, and follows the full Superpowers workflow.

This is the same install used for GitHub Copilot CLI. Both share `~/.copilot/skills/`, so one install covers both.

## Usage

### Automatic Discovery

Open **Copilot Chat** in Agent Mode and start working. Skills activate automatically when your task matches:

- "help me plan this feature" → activates `writing-plans`
- "let's debug this issue" → activates `systematic-debugging`
- "brainstorm ideas for…" → activates `brainstorming`

### Slash Commands

You can also invoke skills directly:

```
/brainstorming
/writing-plans
/test-driven-development
```

### Managing Skills

Use the VS Code Command Palette (`Ctrl+Shift+P`):
- **Chat: Configure Skills** — view and manage installed skills

## Updating

```bash
cd ~/.copilot/superpowers && git pull && .copilot/install.sh
```

> **Note:** Re-running the installer ensures any new skills, agents, or hooks added upstream are linked correctly.

## Uninstalling

```bash
# Remove skill symlinks
find ~/.copilot/skills -type l -lname '*/superpowers/skills/*' -delete

# Remove agent symlinks
find ~/.copilot/agents -type l -lname '*/superpowers/agents/*' -delete

# Remove context block from copilot-instructions.md
sed -i.bak '/<!-- SUPERPOWERS-CONTEXT-START -->/,/<!-- SUPERPOWERS-CONTEXT-END -->/d' ~/.copilot/copilot-instructions.md && rm -f ~/.copilot/copilot-instructions.md.bak

# Remove the repo
rm -rf ~/.copilot/superpowers
```

## Troubleshooting

### Skills not showing up

1. **Check VS Code version**: Agent Skills require VS Code 1.109+. Check via `Help → About`.
2. **Check symlinks**: `ls -l ~/.copilot/skills/` — should show symlinks into your superpowers clone.
3. **Reload VS Code**: `Ctrl+Shift+P` → "Developer: Reload Window"
4. **Use Agent Mode**: Skills only work in Copilot Chat's Agent Mode, not inline completions.
5. **Check copilot-instructions.md**: `cat ~/.copilot/copilot-instructions.md` — should contain the SUPERPOWERS-CONTEXT block.

### Also using Copilot CLI?

Both VS Code and Copilot CLI read from `~/.copilot/skills/`. A single install works for both. See [README.copilot.md](README.copilot.md) for CLI-specific details.

If issues persist, please report them on the [Superpowers GitHub repository](https://github.com/obra/superpowers/issues).
