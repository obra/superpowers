# Installing FeatureForge for Codex

Enable FeatureForge skills in Codex via native skill discovery. Codex and GitHub Copilot can share a single FeatureForge checkout at `~/.featureforge/install`.

## Prerequisites

- Git

## Fresh Install

1. **Clone the FeatureForge repository:**
   ```bash
   git clone https://github.com/dmulcahey/featureforge.git ~/.featureforge/install
   ```

2. **Create the skills symlink:**
   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.featureforge/install/skills ~/.agents/skills/featureforge
   ```

3. **Install the `code-reviewer` custom agent:**
   ```bash
   mkdir -p ~/.codex/agents
   ln -s ~/.featureforge/install/.codex/agents/code-reviewer.toml ~/.codex/agents/code-reviewer.toml
   ```

4. **Restart Codex** (quit and relaunch the CLI) to discover the skills and agent.

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
   cmd /c mklink /J "$env:USERPROFILE\.agents\skills\featureforge" "$env:USERPROFILE\.featureforge\install\skills"

   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.codex\agents"
   Copy-Item "$env:USERPROFILE\.featureforge\install\.codex\agents\code-reviewer.toml" "$env:USERPROFILE\.codex\agents\code-reviewer.toml" -Force
   ```

## Verify

```bash
ls -la ~/.agents/skills/featureforge
ls -la ~/.featureforge/install/skills
ls -la ~/.codex/agents/code-reviewer.toml
ls -la ~/.featureforge/install/.codex/agents/code-reviewer.toml
```

**Windows (PowerShell):**
```powershell
Get-Item "$env:USERPROFILE\.agents\skills\featureforge"
Get-ChildItem "$env:USERPROFILE\.featureforge\install\skills"
Get-Item "$env:USERPROFILE\.codex\agents\code-reviewer.toml"
Get-Item "$env:USERPROFILE\.featureforge\install\.codex\agents\code-reviewer.toml"
```

You should see a symlink (or junction on Windows) for the skills plus the installed `code-reviewer` agent.

## Codex Subagents

Current Codex releases enable subagent workflows by default. FeatureForge skills such as `dispatching-parallel-agents` and `subagent-driven-development` do not require the old multi-agent feature flag.

Codex ships built-in `default`, `worker`, and `explorer` agents:

- Use `worker` for implementation and fix tasks.
- Use `explorer` for read-heavy investigation and review tasks.
- Use `default` when the task needs broader judgment instead of a narrow execution or exploration role.

The `code-reviewer` custom agent is installed alongside the skills.

If you want custom project-scoped agents, add TOML files under `.codex/agents/`. Personal custom agents live under `~/.codex/agents/`. Each file must define `name`, `description`, and `developer_instructions`. Fields like `model`, `model_reasoning_effort`, `sandbox_mode`, `mcp_servers`, and `skills.config` inherit from the parent session when omitted.

Use `[agents]` in your Codex config to tune global limits such as `max_threads`, `max_depth`, and `job_max_runtime_seconds`. Most installs can leave `[agents]` unset; Codex defaults to six open agent threads and a max depth of one direct child layer.

## Runtime Helpers

Runtime helper state lives in `~/.featureforge/`. Generated skill preambles use this directory for session markers, contributor logs, update-check cache files, and project-scoped artifacts under `~/.featureforge/projects/`.

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

Skills update instantly through the symlink.

If you copied the Codex agent file on Windows, copy `~/.featureforge/install/.codex/agents/code-reviewer.toml` into `~/.codex/agents/code-reviewer.toml` again after updating.

Generated skill preambles run `~/.featureforge/install/bin/featureforge update-check` automatically when that install root is active, so new sessions can surface `UPGRADE_AVAILABLE` or `JUST_UPGRADED` without extra setup.

## Uninstalling

```bash
rm ~/.agents/skills/featureforge
rm ~/.codex/agents/code-reviewer.toml
```

**Windows (PowerShell):**
```powershell
Remove-Item "$env:USERPROFILE\.agents\skills\featureforge"
Remove-Item "$env:USERPROFILE\.codex\agents\code-reviewer.toml"
```

Optionally delete the shared clone if no other platform uses it: `rm -rf ~/.featureforge/install` (Windows: `Remove-Item -Recurse -Force "$env:USERPROFILE\.featureforge\install"`).
