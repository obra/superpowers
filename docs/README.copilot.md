# Superpowers for GitHub Copilot CLI

Guide for using Superpowers with GitHub Copilot CLI.

> **Also using VS Code?** The same install works for both CLI and VS Code Agent Mode. See [README.vscode-copilot.md](README.vscode-copilot.md) for VS Code-specific details.

## Quick Install

### Plugin Install (Recommended)

```bash
copilot plugin install obra/superpowers
```
> **Note:** The `copilot plugin install` command only installs from the repository's default (`main`) branch. To install a specific branch or version, use the Manual Install method below.

### Manual Install

```bash
git clone https://github.com/obra/superpowers.git ~/.copilot/superpowers && ~/.copilot/superpowers/.copilot/install.sh
```

This will:
- Register the local repository with Copilot CLI using `copilot plugin install`
- Inject the Superpowers context block into `~/.copilot/copilot-instructions.md`

Then restart GitHub Copilot CLI.

## How It Works

GitHub Copilot CLI natively supports skills via its plugin system. A `plugin.json` file declares the paths to skills, agents, commands, and hooks. The installer uses `copilot plugin install` to register your local clone as a plugin.

Custom instructions are also read from `~/.copilot/copilot-instructions.md`, which the installer uses to inject the Superpowers context block—ensuring Copilot knows to use the skills system on every session start.

## Usage

Once installed, skills are discovered automatically. Copilot will activate them when:
- You mention a skill by name (e.g., "use brainstorming")
- The task matches a skill's description

### Skill discovery directories

Copilot CLI loads skills via registered plugins (`copilot plugin list`) and explicit project-level directories:
- Registered plugin skills (`~/.copilot/installed-plugins/`)
- `.github/skills/` or `.claude/skills/` in the active project directory
- Custom directories via `COPILOT_SKILLS_DIRS` environment variable

## Updating

```bash
cd ~/.copilot/superpowers && git pull && .copilot/install.sh
```

> **Note:** Re-running the installer ensures any new skills, agents, or hooks added upstream are linked correctly.

## Uninstalling

### Plugin Uninstall (if installed via plugin)

```bash
copilot plugin uninstall superpowers
```

### Manual Uninstall (if installed manually)

```bash
# Unregister plugin from Copilot CLI
copilot plugin uninstall superpowers

# Remove context block from copilot-instructions.md
sed -i.bak '/<!-- SUPERPOWERS-CONTEXT-START -->/,/<!-- SUPERPOWERS-CONTEXT-END -->/d' ~/.copilot/copilot-instructions.md && rm -f ~/.copilot/copilot-instructions.md.bak

# Remove the repo
rm -rf ~/.copilot/superpowers
```

## Troubleshooting

### Skills not showing up

1. **Check symlinks**: `ls -l ~/.copilot/skills/` — should show symlinks into your superpowers clone
2. **Restart GitHub Copilot CLI**: Skills are discovered at startup
3. **Check copilot-instructions.md**: `cat ~/.copilot/copilot-instructions.md` — should contain the SUPERPOWERS-CONTEXT block

If issues persist, please report them on the [Superpowers GitHub repository](https://github.com/obra/superpowers/issues).

### Using VS Code instead of CLI?

The same `~/.copilot/skills/` directory is shared between Copilot CLI and VS Code Agent Mode. If you installed via the script above, your skills are already available in VS Code 1.109+. See [README.vscode-copilot.md](README.vscode-copilot.md) for VS Code-specific details.
