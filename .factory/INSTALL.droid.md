# Installing Superpowers for Factory Droid CLI

## Prerequisites

- Factory Droid CLI installed and authenticated
- Git installed

## Installation Steps

### 1. Clone Superpowers

```bash
mkdir -p ~/.factory/superpowers
cd ~/.factory/superpowers
git clone https://github.com/obra/superpowers.git .
```

### 2. Install Skills

```bash
mkdir -p ~/.factory/skills
cp -r ~/.factory/superpowers/skills/* ~/.factory/skills/
```

Note: Skills must be copied (not symlinked) as Droid CLI doesn't recognize symlinked skills. Re-run the copy command after `git pull` to get updates.

### 3. Install Commands

```bash
mkdir -p ~/.factory/commands
cd ~/.factory/commands
ln -s ~/.factory/superpowers/commands/* .
```

### 4. Install Droids

```bash
mkdir -p ~/.factory/droids
cd ~/.factory/droids
ln -s ~/.factory/superpowers/agents/* .
```

### 5. Install SessionStart Hook

Create or merge into `~/.factory/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "sh ~/.factory/superpowers/hooks/session-start.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

This uses the `session-start.sh` script directly from `~/.factory/superpowers/hooks/`; you do not need to copy or link the `hooks` directory.

> Note: Some Droid CLI versions log `SessionStart` hook output but do not inject its `additionalContext` into the model. If you do not see the "You have superpowers" bootstrap text when you ask Droid about superpowers, you can use an AGENTS.md-based bootstrap instead of, or in addition to, the hook.

### 6. AGENTS.md Bootstrap (Fallback or Alternative)

Append the full contents of the `using-superpowers` skill to your global AGENTS guidelines:

```bash
cat ~/.factory/skills/using-superpowers/SKILL.md >> ~/.factory/AGENTS.md
```

Then start a new `droid` session. Droid will now always see the `using-superpowers` instructions via AGENTS.md, even if the SessionStart hook output is ignored.

## Verification

Test the installation:

```bash
ls ~/.factory/skills
ls ~/.factory/commands
ls ~/.factory/droids
```

You should see superpowers skill folders, command files, and the `code-reviewer.md` droid.

Ask Droid: "Do you have superpowers?" — it should reference the bootstrap or `using-superpowers` skill.
