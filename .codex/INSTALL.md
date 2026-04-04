# Installing Superpowers for Codex

Install the Codex-only Superpowers fork by cloning it locally and linking its skills into Codex's global skill directory.

These instructions support macOS, Linux, WSL, and native Windows PowerShell. They default `CODEX_HOME` to `~/.codex` when it is unset.

## Installation (POSIX / WSL)

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

## Installation (Windows PowerShell)

```powershell
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME ".codex" }
$skillsRoot = Join-Path $HOME ".agents\\skills"
$repoPath = Join-Path $codexHome "superpowers"
git clone https://github.com/Jo-Atom/superpowers-codex.git $repoPath
New-Item -ItemType Directory -Force -Path $skillsRoot | Out-Null
cmd /c mklink /J "$skillsRoot\\superpowers" "$repoPath\\skills"
```

This creates a junction, matching upstream's lower-friction native Windows install path.

Restart Codex after the junction is created.

Native Windows PowerShell is supported for installation and repo-root Codex use. Some optional helper workflows in this fork still ship as POSIX shell scripts, so use WSL or another POSIX shell for those flows until native wrappers are added.

## Verify

```bash
ls -la "$HOME/.agents/skills/superpowers"
ls "${CODEX_HOME:-$HOME/.codex}/superpowers/skills"
```

Expected: `~/.agents/skills/superpowers` resolves to the repository's `skills/` directory. On POSIX/WSL this is typically a symlink; on native Windows it is typically a junction.

PowerShell equivalent:

```powershell
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME ".codex" }
Get-Item (Join-Path $HOME ".agents\\skills\\superpowers") | Format-List FullName,LinkType,Target
Get-ChildItem (Join-Path $codexHome "superpowers\\skills")
```
