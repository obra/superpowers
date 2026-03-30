# Installing Superpowers for Codex

Enable Superpowers skills through a symlink and install native Codex subagents as direct TOML files.

## Prerequisites

- Git

## Installation

1. **Clone the superpowers repository:**
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.codex/superpowers
   ```

2. **Create the skills symlink:**
   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.codex/superpowers/skills ~/.agents/skills/superpowers
   ```

3. **Install the agent TOMLs:**
   ```bash
   mkdir -p ~/.codex/agents
   cp ~/.codex/superpowers/.codex/agents/*.toml ~/.codex/agents/
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
   cmd /c mklink /J "$env:USERPROFILE\.agents\skills\superpowers" "$env:USERPROFILE\.codex\superpowers\skills"
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.codex\agents"
   Copy-Item "$env:USERPROFILE\.codex\superpowers\.codex\agents\*.toml" "$env:USERPROFILE\.codex\agents\"
   ```

4. **Restart Codex** (quit and relaunch the CLI) to discover both the skills and the native agent roles.

## Migrating from old bootstrap

If you installed superpowers before native skill discovery, you need to:

1. **Update the repo:**
   ```bash
   cd ~/.codex/superpowers && git pull
   ```

2. **Create the skills symlink** (step 2 above).

3. **Copy the agent TOMLs** (step 3 above).

4. **Remove the old bootstrap block** from `~/.codex/AGENTS.md` - any block referencing `superpowers-codex bootstrap` is no longer needed.

5. **Restart Codex.**

## Verify

```bash
ls -la ~/.agents/skills/superpowers
find ~/.codex/agents -maxdepth 1 -name 'superpowers_*.toml' | sort
```

You should see:

- a symlink (or junction on Windows) for the skills directory
- four native Codex agent TOMLs directly under `~/.codex/agents`

## Updating

```bash
cd ~/.codex/superpowers && git pull
```

Skills update through the skills symlink after you restart Codex. Agent role updates require rerunning the copy command from step 3, then restarting Codex.

## Uninstalling

```bash
rm ~/.agents/skills/superpowers
rm ~/.codex/agents/superpowers_*.toml
```

Optionally delete the clone: `rm -rf ~/.codex/superpowers`.
