# Superpowers for Codex

This guide explains how to install and use the Codex-only Superpowers fork.

## Quick Install

Tell Codex:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/Jo-Atom/superpowers-codex/refs/heads/main/.codex/INSTALL.md
```

## Manual Install

### Prerequisites

- Codex CLI
- Git
- One supported shell environment:
  - macOS or Linux with a POSIX shell
  - WSL
  - Windows PowerShell

### Steps

#### POSIX Shell / WSL

1. Clone the repository:

   ```bash
   git clone https://github.com/Jo-Atom/superpowers-codex.git "${CODEX_HOME:-$HOME/.codex}/superpowers"
   ```

2. Create the global skills symlink:

   ```bash
   mkdir -p "$HOME/.agents/skills"
   ln -s "${CODEX_HOME:-$HOME/.codex}/superpowers/skills" "$HOME/.agents/skills/superpowers"
   ```

3. Restart Codex.

These commands assume a POSIX shell and default `CODEX_HOME` to `~/.codex` when it is unset.

#### Native Windows PowerShell

```powershell
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME ".codex" }
$skillsRoot = Join-Path $HOME ".agents\\skills"
$repoPath = Join-Path $codexHome "superpowers"
git clone https://github.com/Jo-Atom/superpowers-codex.git $repoPath
New-Item -ItemType Directory -Force -Path $skillsRoot | Out-Null
cmd /c mklink /J "$skillsRoot\\superpowers" "$repoPath\\skills"
```

This creates a junction, which is the same lower-friction Windows install path upstream uses and normally does not require Developer Mode.

After the junction is created, restart Codex.

## Shell Expectations

- Core installation and repo-root instruction loading work on Codex CLI across macOS, Linux, WSL, and native Windows PowerShell.
- Some bundled helper workflows in this fork still invoke POSIX shell scripts directly.
- On native Windows, run those helper flows from WSL, Git Bash, or another POSIX shell until native wrappers are added.

## How It Works

- Codex reads `AGENTS.md` for repository instructions.
- Codex discovers personal skills from `$HOME/.agents/skills`.
- Superpowers adds workflow discipline on top of Codex-native skills and multi-agent tools. On POSIX/WSL this usually appears as a symlink; on native Windows it is typically a junction.

## Codex CLI vs Codex App

- CLI is the primary supported surface in this fork.
- App compatibility is best-effort and intentionally secondary.
- If a workflow behaves differently in App, prefer the CLI interpretation unless a skill explicitly documents the App caveat.

## Updating

```bash
cd "${CODEX_HOME:-$HOME/.codex}/superpowers" && git pull
```

## Uninstalling

```bash
rm "$HOME/.agents/skills/superpowers"
rm -rf "${CODEX_HOME:-$HOME/.codex}/superpowers"
```

## Troubleshooting

### Skills do not appear

```bash
ls -la "$HOME/.agents/skills/superpowers"
ls "${CODEX_HOME:-$HOME/.codex}/superpowers/skills"
```

PowerShell equivalent:

```powershell
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME ".codex" }
Get-Item (Join-Path $HOME ".agents\\skills\\superpowers") | Format-List FullName,LinkType,Target
Get-ChildItem (Join-Path $codexHome "superpowers\\skills")
```

On native Windows, the first path may be reported as a junction rather than a symlink. Either is fine as long as it resolves to the repository `skills/` directory.

### Windows junction issues

Junction creation normally works without special permissions. If it fails, retry from a normal PowerShell session and confirm the destination paths exist before rerunning the command.

### Instructions look stale

Restart Codex. `AGENTS.md` and skill discovery are evaluated when a session starts.

## Validation

See `docs/testing.md` for the Codex-only validation steps. The automated suite currently covers the POSIX/bash execution path of this checkout and does not currently prove native Windows execution behavior.
