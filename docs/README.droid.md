# Superpowers for Factory Droid CLI

Complete guide for using Superpowers with [Factory Droid CLI](https://docs.factory.ai).

## Quick Install

Tell Droid:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.factory/INSTALL.droid.md
```

## Manual Installation

### Prerequisites

- Factory Droid CLI installed and authenticated
- Git installed

### Installation Steps

#### 1. Clone Superpowers

```bash
mkdir -p ~/.factory/superpowers
git clone https://github.com/obra/superpowers.git ~/.factory/superpowers
```

#### 2. Install Skills

Copy skills to Droid's discovery location:

```bash
mkdir -p ~/.factory/skills
cp -r ~/.factory/superpowers/skills/* ~/.factory/skills/
```

Note: Skills must be copied (not symlinked) as Droid CLI doesn't recognize symlinked skills. Re-run the copy command after `git pull` to get updates.

#### 3. Install Commands (Optional but Recommended)

```bash
mkdir -p ~/.factory/commands
cd ~/.factory/commands
ln -s ~/.factory/superpowers/commands/* .
```

#### 4. Install Droids

```bash
mkdir -p ~/.factory/droids
cd ~/.factory/droids
ln -s ~/.factory/superpowers/agents/* .
```

This exposes all Superpowers agents (like `code-reviewer`) as custom droids usable via the Task tool.

#### 5. Install SessionStart Hook (Optional) and/or AGENTS.md Bootstrap

Add or merge the following into `~/.factory/settings.json` (create if missing):

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

On SessionStart, Droid runs the `session-start.sh` script from `~/.factory/superpowers/hooks/` and should receive an `<EXTREMELY_IMPORTANT>` block with the full `using-superpowers` skill, which bootstraps all superpowers functionality.

> Note: Some Droid CLI versions log `SessionStart` hook output but do not inject its `additionalContext` into the model. If you do not see the "You have superpowers" bootstrap text when you ask Droid about superpowers, fall back to an AGENTS.md-based bootstrap.

**AGENTS.md bootstrap (recommended fallback if above hook is not working)**

1. Open or create `~/.factory/AGENTS.md`.
2. Append the full contents of the `using-superpowers` skill to your AGENTS guidelines:

   ```bash
   cat ~/.factory/skills/using-superpowers/SKILL.md >> ~/.factory/AGENTS.md
   ```

3. Start a new `droid` session. Droid will now always see the `using-superpowers` instructions via AGENTS.md, even if the SessionStart hook output is ignored.

## Usage

### Skills

Droid auto-invokes skills when appropriate. Key skills include:

- `brainstorming` - Interactive design refinement
- `writing-plans` - Create detailed implementation plans
- `test-driven-development` - TDD workflow
- `systematic-debugging` - Structured debugging approach

### Commands

Available slash commands:

| Command | Description |
|---------|-------------|
| `/brainstorm` | Interactive design refinement using Socratic method |
| `/write-plan` | Create detailed implementation plan with bite-sized tasks |
| `/execute-plan` | Execute plan in batches with review checkpoints |

### Droids

Use the Task tool with `code-reviewer` to review code:

```
Run the Task tool with subagent_type 'code-reviewer' to review the staged diff.
```

## Troubleshooting

### Skills not detected

1. Verify symlinks: `ls -la ~/.factory/skills`
2. Check skill files exist: `ls ~/.factory/superpowers/skills`
3. Ensure each skill has a `SKILL.md` file

### Commands missing

1. Run `/commands` and verify files appear
2. Check symlinks: `ls -la ~/.factory/commands`

### Droids missing

1. Run `/droids` and verify `code-reviewer` appears
2. Check file exists: `ls -la ~/.factory/droids/code-reviewer.md`

### SessionStart hook not running

1. Run `/hooks` and inspect `SessionStart` configuration
2. Verify script is executable: `chmod +x ~/.factory/hooks/session-start.sh`
3. Alternatively copy the content of using-superpowers/SKILL.md to ~/.factory/AGENTS.md

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
