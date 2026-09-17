# Superpowers for IBM Bob

Complete guide for using [IBM Bob](https://bob.ibm.com/docs/ide).

## Prerequisites

- IBM Bob IDE (any version with `SessionStart` hook support)
- `bash` and `python3` available in your PATH (used by the install script)

## Installation

Clone this repository and run the install script. Bob has no `bob plugin install` CLI, so installation is handled by a script that copies skills and wires the bootstrap hook for you.

### Project-level install (recommended)

Run from inside your project directory, with the superpowers repo available:

```bash
git clone https://github.com/obra/superpowers /path/to/superpowers
cd /your/project
bash /path/to/superpowers/.bob-plugin/scripts/install.sh
```

This installs skills into `.bob/skills/` and wires the hook in `.bob/settings.json` — both scoped to your current project.

### Global install

```bash
bash /path/to/superpowers/.bob-plugin/scripts/install.sh --global
```

This installs skills into `~/.bob/skills/` and wires the hook in `~/.bob/settings/settings.json` — active across all Bob projects.

## What the script does

1. **Copies skills** from `skills/` into the target `.bob/skills/` directory (one subdirectory per skill). Bob auto-discovers skills from this directory.
2. **Wires the `SessionStart` hook** into `.bob/settings.json` (project) or `~/.bob/settings/settings.json` (global), creating the file if absent. The hook causes Bob to inject the Superpowers bootstrap into the model context at the start of every session.

The script is **idempotent** — re-running it does not duplicate the hook stanza and simply overwrites existing skill copies with the latest versions.

## Updating

After pulling the latest Superpowers commits, re-run the install script:

```bash
git -C /path/to/superpowers pull
bash /path/to/superpowers/.bob-plugin/scripts/install.sh   # or --global
```

## Smoke check

After installation, start a fresh Bob session and ask:

```
What are your superpowers?
```

Bob should respond with knowledge of its available skills.

## Acceptance test

Send exactly this message in a fresh Bob session:

```
Let's make a react todo list
```

A working integration triggers the `brainstorming` skill (via `use_skill`) **before any code is written**. If brainstorming does not trigger, the bootstrap is not loading — see Troubleshooting below.

## Manual install

If you prefer not to run the script:

1. **Copy skills:** Copy each subdirectory from `skills/` into `.bob/skills/` (or `~/.bob/skills/` for global):

   ```bash
   cp -r /path/to/superpowers/skills/* .bob/skills/
   ```

2. **Wire the hook:** Add the following stanza to `.bob/settings.json` (create the file if absent):

   ```json
   {
     "hooks": {
       "SessionStart": [
         {
           "hooks": [
             {
               "type": "command",
               "command": "sh hooks/session-start-bob",
               "timeout": 10
             }
           ]
         }
       ]
     }
   }
   ```

   For a global install, use an absolute path in `command`:
   ```json
   "command": "sh /path/to/superpowers/hooks/session-start-bob"
   ```

   And place the stanza in `~/.bob/settings/settings.json`.

3. Start a fresh Bob session and run the smoke check above.

## Troubleshooting

### Smoke check fails — Bob doesn't know its skills

The bootstrap hook is not loading. Check:

- The hook stanza is present in `.bob/settings.json` or `~/.bob/settings/settings.json`
- The path in `command` points to the correct `hooks/session-start-bob` script
- The script is executable: `chmod +x /path/to/superpowers/hooks/session-start-bob`
- Try running the hook manually to confirm it prints output:
  ```bash
  echo '{}' | bash /path/to/superpowers/hooks/session-start-bob
  ```

### Skills not found after install

- Verify `.bob/skills/` (or `~/.bob/skills/`) contains subdirectories with `SKILL.md` files
- Re-run the install script: `bash .bob-plugin/scripts/install.sh`
- Start a fresh Bob session

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
