# Superpowers for GitHub Copilot CLI

Guide for using Superpowers with GitHub Copilot CLI.

> **Also using VS Code?** The same install works for both CLI and VS Code Agent Mode. See [README.vscode-copilot.md](README.vscode-copilot.md) for VS Code-specific details.

## Quick Install

### Plugin Install (Recommended)

```bash
copilot plugin add https://github.com/obra/superpowers
```

### Manual Install

```bash
git clone https://github.com/obra/superpowers.git ~/.copilot/superpowers && ~/.copilot/superpowers/.copilot/install.sh
```

This will:
- Symlink each skill individually into `~/.copilot/skills/` (hub pattern)
- Symlink agent definitions into `~/.copilot/agents/`
- Inject the Superpowers context block into `~/.copilot/copilot-instructions.md`

Then restart GitHub Copilot CLI.

## How It Works

GitHub Copilot CLI natively supports skills. At startup it scans `~/.copilot/skills/` for directories containing a `SKILL.md` file and makes them available as skills. When a task matches a skill's description, Copilot invokes the skill tool to load the full instructions.

The installer creates individual symlinks (hub pattern) so each skill is discoverable independently. Skills update instantly whenever you `git pull`.

Custom instructions are also read from `~/.copilot/copilot-instructions.md`, which the installer uses to inject the Superpowers context block—ensuring Copilot knows to use the skills system on every session start.

## Usage

Once installed, skills are discovered automatically. Copilot will activate them when:
- You mention a skill by name (e.g., "use brainstorming")
- The task matches a skill's description

### Skill directories scanned by Copilot CLI

- `~/.copilot/skills/` — personal skills (where Superpowers installs)
- `~/.claude/skills/` — also scanned if present
- `.github/skills/`, `.claude/skills/` in the project directory
- Custom directories via `COPILOT_SKILLS_DIRS` environment variable

## Updating

```bash
cd ~/.copilot/superpowers && git pull
```

## Uninstalling

```bash
find ~/.copilot/skills -type l -lname '*/superpowers/skills/*' -delete
find ~/.copilot/agents -type l -lname '*/superpowers/agents/*' -delete
# Edit ~/.copilot/copilot-instructions.md and remove the SUPERPOWERS-CONTEXT block
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
