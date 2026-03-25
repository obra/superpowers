# Installing FeatureForge for GitHub Copilot Local Installs

Enable FeatureForge skills and agents in GitHub Copilot local installs by linking Copilot's discovery paths to the shared FeatureForge checkout at `~/.featureforge/install`.

## Prerequisites

- Git

## Fresh Install

1. **Clone the FeatureForge repository:**
   ```bash
   git clone https://github.com/dmulcahey/featureforge.git ~/.featureforge/install
   ```

2. **Create the skills symlink:**
   ```bash
   mkdir -p ~/.copilot
   ln -s ~/.featureforge/install/skills ~/.copilot/skills
   ```

3. **Install the code-reviewer custom agent from the canonical agents directory:**
   ```bash
   mkdir -p ~/.copilot/agents
   ln -s ~/.featureforge/install/agents/code-reviewer.md ~/.copilot/agents/code-reviewer.agent.md
   ```

4. **Restart GitHub Copilot CLI** so it discovers the newly installed skills and agent.

## Windows

Use a junction for the skills directory and copy the agent file into Copilot's agent directory:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.copilot"
cmd /c mklink /J "$env:USERPROFILE\.copilot\skills" "$env:USERPROFILE\.featureforge\install\skills"

New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.copilot\agents"
Copy-Item "$env:USERPROFILE\.featureforge\install\agents\code-reviewer.md" "$env:USERPROFILE\.copilot\agents\code-reviewer.agent.md" -Force
```

## Verify

```bash
ls -la ~/.copilot/skills
ls -la ~/.copilot/agents/code-reviewer.agent.md
ls -la ~/.featureforge/install/skills
ls -la ~/.featureforge/install/agents/code-reviewer.md
```

**Windows (PowerShell):**
```powershell
Get-Item "$env:USERPROFILE\.copilot\skills"
Get-Item "$env:USERPROFILE\.copilot\agents\code-reviewer.agent.md"
Get-ChildItem "$env:USERPROFILE\.featureforge\install\skills"
Get-Item "$env:USERPROFILE\.featureforge\install\agents\code-reviewer.md"
```

You should see the installed skills location and the code-reviewer agent file.

## Runtime Helpers

Runtime helper state lives in `~/.featureforge/`. Generated skill preambles use this directory for session markers, contributor logs, update-check cache files, and project-scoped artifacts under `~/.featureforge/projects/`.

Generated skill preambles always invoke the packaged install binary under `~/.featureforge/install/bin/` (`featureforge` on Unix, `featureforge.exe` on Windows). That packaged install binary resolves the active runtime root through `featureforge repo runtime-root --path`, so repo checkouts and `~/.featureforge/install` use the same runtime-owned contract without swapping executables.

Supported first-turn entry goes through `featureforge session-entry resolve --message-file <path>`. Spawned subagents pass `--spawned-subagent` and bypass the first-turn prompt by default unless they explicitly opt back in.

Optional: enable contributor mode for future sessions with:

```bash
~/.featureforge/install/bin/featureforge config set featureforge_contributor true
```

**Windows (PowerShell):**
```powershell
& "$env:USERPROFILE\.featureforge\install\bin\featureforge.exe" config set featureforge_contributor true
```

If you disable update notices, re-enable them with:

```bash
~/.featureforge/install/bin/featureforge config set update_check true
```

**Windows (PowerShell):**
```powershell
& "$env:USERPROFILE\.featureforge\install\bin\featureforge.exe" config set update_check true
```

## Updating

```bash
cd ~/.featureforge/install && git pull
```

If you copied the agent file on Windows, copy ~/.featureforge/install/agents/code-reviewer.md into ~/.copilot/agents/code-reviewer.agent.md again after updating.

When `~/.featureforge/install` is the active runtime root, generated skill preambles run the packaged install binary from `~/.featureforge/install/bin/` (`featureforge` on Unix, `featureforge.exe` on Windows) for `update-check` automatically so new sessions can surface `UPGRADE_AVAILABLE` or `JUST_UPGRADED` without extra setup.

For the canonical deterministic validation matrix after install or update, see `docs/testing.md` in this repository.

## Uninstalling

```bash
rm ~/.copilot/skills
rm ~/.copilot/agents/code-reviewer.agent.md
```

**Windows (PowerShell):**
```powershell
Remove-Item "$env:USERPROFILE\.copilot\skills"
Remove-Item "$env:USERPROFILE\.copilot\agents\code-reviewer.agent.md"
```

Optionally delete the shared clone if no other platform uses it: `rm -rf ~/.featureforge/install` (Windows: `Remove-Item -Recurse -Force "$env:USERPROFILE\.featureforge\install"`).
