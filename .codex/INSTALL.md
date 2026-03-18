# Installing Ultrapowers for Codex

Enable ultrapowers skills in Codex via native skill discovery. Just clone and symlink.

## Prerequisites

- Git

## Installation

1. **Clone the ultrapowers repository:**
   ```bash
   git clone https://github.com/ennio-datatide/ultrapowers.git ~/.codex/ultrapowers
   ```

2. **Create the skills symlink:**
   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.codex/ultrapowers/skills ~/.agents/skills/ultrapowers
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
   cmd /c mklink /J "$env:USERPROFILE\.agents\skills\ultrapowers" "$env:USERPROFILE\.codex\ultrapowers\skills"
   ```

3. **Restart Codex** (quit and relaunch the CLI) to discover the skills.

## Migrating from old bootstrap

If you installed ultrapowers before native skill discovery, you need to:

1. **Update the repo:**
   ```bash
   cd ~/.codex/ultrapowers && git pull
   ```

2. **Create the skills symlink** (step 2 above) — this is the new discovery mechanism.

3. **Remove the old bootstrap block** from `~/.codex/AGENTS.md` — any block referencing `ultrapowers-codex bootstrap` is no longer needed.

4. **Restart Codex.**

## Verify

```bash
ls -la ~/.agents/skills/ultrapowers
```

You should see a symlink (or junction on Windows) pointing to your ultrapowers skills directory.

## Updating

```bash
cd ~/.codex/ultrapowers && git pull
```

Skills update instantly through the symlink.

## Uninstalling

```bash
rm ~/.agents/skills/ultrapowers
```

Optionally delete the clone: `rm -rf ~/.codex/ultrapowers`.
