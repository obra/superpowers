# Installing Sonbbal Superpowers for Codex

Enable the Codex-compatible Sonbbal Superpowers package through the Codex plugin package or native skill discovery.

## Prerequisites

- Git

## Clone

```bash
git clone https://github.com/Sonbbal/superpowers.git ~/.codex/superpowers
```

If you already cloned it:

```bash
cd ~/.codex/superpowers
git pull
```

## Plugin Package Installation

Use the Codex plugin package at:

```text
codex
```

The repository includes a marketplace entry at:

```text
.agents/plugins/marketplace.json
```

That entry points Codex at the Codex-specific package instead of the root Claude Code package.

After installing through your Codex plugin flow, restart Codex so the plugin metadata and skills are rediscovered.

## Symlink Fallback

If your Codex setup uses native skill discovery directly, symlink the Codex-compatible skills directory:

```bash
mkdir -p ~/.agents/skills
ln -s ~/.codex/superpowers/codex/skills ~/.agents/skills/sonbbal-superpowers-codex
```

Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\sonbbal-superpowers-codex" "$env:USERPROFILE\.codex\superpowers\codex\skills"
```

Restart Codex after creating the symlink or junction.

## Verify

```bash
find ~/.agents/skills/sonbbal-superpowers-codex -name SKILL.md | sort
```

You should see the Codex-compatible skills from `codex/skills`, including `using-superpowers`, `executing-plans`, `team-driven-development`, and the other packaged Superpowers workflows.

## Test The Package

From the repository clone:

```bash
cd ~/.codex/superpowers
bash tests/codex/run-tests.sh
```

## Updating

```bash
cd ~/.codex/superpowers
git pull
```

If you used the symlink fallback, skills update through the symlink.

## Uninstalling Symlink Fallback

```bash
rm ~/.agents/skills/sonbbal-superpowers-codex
```

Windows PowerShell:

```powershell
Remove-Item "$env:USERPROFILE\.agents\skills\sonbbal-superpowers-codex"
```

Optionally delete the clone:

```bash
rm -rf ~/.codex/superpowers
```
