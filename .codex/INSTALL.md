# Installing Superpowers for Codex

Enable Superpowers in Codex via native skill discovery. The stable path is:

- symlink `skills/` into `~/.agents/skills/`
- optionally enable `multi_agent`
- optionally copy the example role configs and prompts from `.codex/examples/`

## Prerequisites

- Git

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.codex/superpowers
   ```

2. **Create the skills symlink:**
   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.codex/superpowers/skills ~/.agents/skills/superpowers
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
   cmd /c mklink /J "$env:USERPROFILE\.agents\skills\superpowers" "$env:USERPROFILE\.codex\superpowers\skills"
   ```

3. **Enable multi-agent** in your real `~/.codex/config.toml`:
   ```toml
   [features]
   multi_agent = true
   ```

4. **Optional but recommended:** copy or adapt the example files from:
   - `~/.codex/superpowers/.codex/examples/config.toml`
   - `~/.codex/superpowers/.codex/examples/agents/`
   - `~/.codex/superpowers/.codex/examples/prompts/`

5. **Optional stable notification example:** copy
   `~/.codex/superpowers/.codex/examples/notify.py` into your real
   `~/.codex/notify.py` and wire it into `notify = [...]` in your real config.

6. **Optional experimental hooks:** copy
   `~/.codex/superpowers/.codex/examples/hooks.json` and
   `~/.codex/superpowers/.codex/examples/hooks/` into your real `~/.codex/`
   and enable:
   ```toml
   [features]
   codex_hooks = true
   ```

7. **Restart Codex** so it reloads skill metadata.

## Repo-Local Variant

If you only want Superpowers inside one project, you can create a project-local
symlink instead of the user-level one:

```bash
mkdir -p .agents/skills
ln -s ~/.codex/superpowers/skills .agents/skills/superpowers
```

Codex will discover that repo-local skills directory when you work inside the
project.

## Migrating from Old Bootstrap

If you installed Superpowers before native skill discovery:

1. Pull the latest repo:
   ```bash
   cd ~/.codex/superpowers && git pull
   ```

2. Create the `.agents/skills` symlink shown above.
3. Remove any old `superpowers-codex bootstrap` block from `~/.codex/AGENTS.md`.
4. Prefer `multi_agent = true`; do not use the old collab feature flag.
5. Restart Codex.

## Verify

```bash
ls -la ~/.agents/skills/superpowers
```

You should see a symlink (or junction on Windows) pointing at your Superpowers
skills directory.

To verify the role catalog is available, inspect:

```bash
find ~/.codex/superpowers/.codex/examples/agents -maxdepth 1 -name '*.toml'
```

To verify the prompt library is available, inspect:

```bash
find ~/.codex/superpowers/.codex/examples/prompts -maxdepth 1 -name '*.md'
```

## Updating

```bash
cd ~/.codex/superpowers && git pull
```

## Uninstalling

```bash
rm ~/.agents/skills/superpowers
```

Optionally delete the clone:

```bash
rm -rf ~/.codex/superpowers
```
