# Installing Superpowers for GitHub Copilot CLI

Enable superpowers skills in [GitHub Copilot CLI](https://docs.github.com/en/copilot/github-copilot-in-the-cli/about-github-copilot-in-the-cli) via native skill discovery.

## Prerequisites

- Git
- GitHub Copilot CLI installed and authenticated

## Quick Install

```bash
git clone https://github.com/obra/superpowers.git ~/.copilot/superpowers && ~/.copilot/superpowers/.copilot/install.sh
```

## Manual Installation

### 1. Clone the superpowers repository

```bash
git clone https://github.com/obra/superpowers.git ~/.copilot/superpowers
```

### 2. Run the install script

```bash
~/.copilot/superpowers/.copilot/install.sh
```

This will:
- Create `~/.copilot/skills/` if it doesn't exist
- Symlink each skill individually into `~/.copilot/skills/` (hub pattern)
- Symlink agent definitions into `~/.copilot/agents/`
- Inject the Superpowers context block into `~/.copilot/copilot-instructions.md`

### 3. Restart GitHub Copilot CLI

Quit and relaunch to discover the skills.

## Verification

Ask Copilot:

> "Do you have superpowers?"

It should respond affirmatively and list available skills.

You can also check:

```bash
ls -l ~/.copilot/skills/
```

You should see symlinks pointing to skill directories in `~/.copilot/superpowers/skills/`.

## Usage

### Finding Skills

Skills are discovered automatically at startup. You can also list them via the skills tool.

### Loading a Skill

Ask Copilot to use a specific skill:

```text
use the brainstorming skill
```

Or reference it directly:

```text
help me plan this feature using the writing-plans skill
```

### Tool Mapping

When skills reference Claude Code tools, Copilot CLI equivalents are:
- `TodoWrite` → write/update a plan file (e.g., `plan.md`)
- `Task` with subagents → built-in agents (explore, task, general-purpose, code-review)
- `Skill` tool → `skill` tool with the skill name
- `read_file` → `view`
- `write_file` → `edit` or `create`
- `replace` → `edit`
- `search` → `grep`
- `glob` → `glob`
- `shell` → `bash`
- `web_fetch` → `web_fetch`

## Updating

```bash
cd ~/.copilot/superpowers && git pull
```

Skills update instantly through the symlinks.

## Uninstalling

1. **Remove the skill symlinks:**

   ```bash
   find ~/.copilot/skills -type l -lname '*/superpowers/skills/*' -delete
   ```

2. **Remove the agent symlinks:**

   ```bash
   find ~/.copilot/agents -type l -lname '*/superpowers/.copilot/agents/*' -delete
   ```

3. **Clean up copilot-instructions.md:** Edit `~/.copilot/copilot-instructions.md` and remove the block between
   `<!-- SUPERPOWERS-CONTEXT-START -->` and `<!-- SUPERPOWERS-CONTEXT-END -->`.

4. **Remove the repo:**

   ```bash
   rm -rf ~/.copilot/superpowers
   ```
