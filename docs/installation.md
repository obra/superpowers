# Installing Sonbbal Superpowers

Sonbbal Superpowers ships two platform packages from one repository:

| Platform | Package |
| --- | --- |
| Claude Code | `claude-code/` |
| Codex | `codex/` |

The repository root is the project overview and marketplace entry point. It is not the Claude Code runtime package.

## Claude Code

Run these commands in Claude Code:

```text
/plugin marketplace add Sonbbal/superpowers
/plugin install sonbbal-superpowers@sonbbal-marketplace
```

Update:

```text
/plugin update sonbbal-superpowers
```

Verify from a local clone:

```bash
bash tests/claude-code/test-plugin-package.sh
```

The Claude Code marketplace source should be `./claude-code`.

## Codex

Clone or update the repository:

```bash
git clone https://github.com/Sonbbal/superpowers.git ~/.codex/superpowers
cd ~/.codex/superpowers
git pull
```

If your Codex environment uses native skill discovery, create the skills symlink:

```bash
mkdir -p ~/.agents/skills
ln -s ~/.codex/superpowers/codex/skills ~/.agents/skills/sonbbal-superpowers-codex
```

Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\sonbbal-superpowers-codex" "$env:USERPROFILE\.codex\superpowers\codex\skills"
```

Restart Codex after install or update.

Verify:

```bash
find ~/.agents/skills/sonbbal-superpowers-codex -name SKILL.md | sort
```

Run package tests:

```bash
bash tests/codex/test-plugin-package.sh
```

## Migration Notes

Older Claude Code docs and historical design plans may mention root-level `skills/`, `agents/`, `commands/`, or `hooks/`. Current Claude Code runtime files live under `claude-code/`.

The root `.codex/INSTALL.md` remains as a compatibility pointer for one release cycle. The canonical Codex install guide is `codex/INSTALL.md`.
