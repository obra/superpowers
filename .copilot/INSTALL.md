# Installing Superpowers for GitHub Copilot Local Installs

Enable Superpowers skills and agents in GitHub Copilot local installs by linking Copilot's discovery paths to the shared Superpowers checkout at `~/.superpowers/install`.

## Prerequisites

- Git

## Fresh Install

1. **Clone the superpowers repository:**
   ```bash
   git clone https://github.com/dmulcahey/superpowers.git ~/.superpowers/install
   ```

2. **Create the skills symlink:**
   ```bash
   mkdir -p ~/.copilot/skills
   ln -s ~/.superpowers/install/skills ~/.copilot/skills/superpowers
   ```

3. **Install the code-reviewer custom agent from the canonical agents directory:**
   ```bash
   mkdir -p ~/.copilot/agents
   ln -s ~/.superpowers/install/agents/code-reviewer.md ~/.copilot/agents/code-reviewer.agent.md
   ```

4. **Restart GitHub Copilot CLI** so it discovers the newly installed skills and agent.

## Windows

Use a junction for the skills directory and copy the agent file into Copilot's agent directory:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.copilot\skills"
cmd /c mklink /J "$env:USERPROFILE\.copilot\skills\superpowers" "$env:USERPROFILE\.superpowers\install\skills"

New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.copilot\agents"
Copy-Item "$env:USERPROFILE\.superpowers\install\agents\code-reviewer.md" "$env:USERPROFILE\.copilot\agents\code-reviewer.agent.md" -Force
```

## Migrate Existing Install

If you already have `~/.codex/superpowers` or `~/.copilot/superpowers`, use the migration helper instead of keeping separate clones:

```bash
tmpdir=$(mktemp -d)
git clone --depth 1 https://github.com/dmulcahey/superpowers.git "$tmpdir/superpowers"
"$tmpdir/superpowers/bin/superpowers" install migrate
rm -rf "$tmpdir"
```

If `~/.superpowers/install` already exists, you can run `~/.superpowers/install/bin/superpowers install migrate` directly.

**Windows (PowerShell):**
```powershell
if (Test-Path "$env:USERPROFILE\.superpowers\install") {
  & "$env:USERPROFILE\.superpowers\install\bin\superpowers.exe" install migrate
} else {
  $tmpRoot = Join-Path $env:TEMP "superpowers-migrate"
  $tmpDir = Join-Path $tmpRoot ([guid]::NewGuid().ToString())
  git clone --depth 1 https://github.com/dmulcahey/superpowers.git (Join-Path $tmpDir "superpowers")
  & (Join-Path $tmpDir "superpowers\bin\superpowers.exe") install migrate
  Remove-Item -Recurse -Force $tmpDir
}
```

Migration only consolidates the checkout. After migrating, continue with steps 2 and 3 to create or refresh `~/.copilot/skills/superpowers` and `~/.copilot/agents/code-reviewer.agent.md`, then restart GitHub Copilot CLI.

## Verify

```bash
ls -la ~/.copilot/skills/superpowers
ls -la ~/.copilot/agents/code-reviewer.agent.md
ls -la ~/.superpowers/install/skills
ls -la ~/.superpowers/install/agents/code-reviewer.md
```

**Windows (PowerShell):**
```powershell
Get-Item "$env:USERPROFILE\.copilot\skills\superpowers"
Get-Item "$env:USERPROFILE\.copilot\agents\code-reviewer.agent.md"
Get-ChildItem "$env:USERPROFILE\.superpowers\install\skills"
Get-Item "$env:USERPROFILE\.superpowers\install\agents\code-reviewer.md"
```

You should see the installed skills location and the code-reviewer agent file.

## Runtime Helpers

Runtime helper state lives in `~/.superpowers/`. Generated skill preambles use this directory for session markers, contributor logs, update-check cache files, and project-scoped artifacts under `~/.superpowers/projects/`.

Optional: enable contributor mode for future sessions with:

```bash
~/.superpowers/install/bin/superpowers config set superpowers_contributor true
```

**Windows (PowerShell):**
```powershell
& "$env:USERPROFILE\.superpowers\install\bin\superpowers.exe" config set superpowers_contributor true
```

If you disable update notices, re-enable them with:

```bash
~/.superpowers/install/bin/superpowers config set update_check true
```

**Windows (PowerShell):**
```powershell
& "$env:USERPROFILE\.superpowers\install\bin\superpowers.exe" config set update_check true
```

## Updating

```bash
cd ~/.superpowers/install && git pull
```

If you copied the agent file on Windows, copy ~/.superpowers/install/agents/code-reviewer.md into ~/.copilot/agents/code-reviewer.agent.md again after updating.

If you migrated from `~/.codex/superpowers` or `~/.copilot/superpowers`, rerun `~/.superpowers/install/bin/superpowers install migrate` after updating if you need to restore the compatibility links. In PowerShell, use `& "$env:USERPROFILE\.superpowers\install\bin\superpowers.exe" install migrate`.

Generated skill preambles run `~/.superpowers/install/bin/superpowers update-check` automatically when that install root is active, so new sessions can surface `UPGRADE_AVAILABLE` or `JUST_UPGRADED` without extra setup.

## Uninstalling

```bash
rm ~/.copilot/skills/superpowers
rm ~/.copilot/agents/code-reviewer.agent.md
```

**Windows (PowerShell):**
```powershell
Remove-Item "$env:USERPROFILE\.copilot\skills\superpowers"
Remove-Item "$env:USERPROFILE\.copilot\agents\code-reviewer.agent.md"
```

Optionally delete the shared clone if no other platform uses it: `rm -rf ~/.superpowers/install` (Windows: `Remove-Item -Recurse -Force "$env:USERPROFILE\.superpowers\install"`).
