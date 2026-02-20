# Installing Superpowers for Qwen Code CLI

Enable superpowers skills in [Qwen Code CLI](https://github.com/QwenLM/qwen-code) via native skill discovery.

## Prerequisites

- Git
- Qwen Code CLI installed

## Quick Install

```bash
git clone https://github.com/obra/superpowers.git ~/.qwen/superpowers && ~/.qwen/superpowers/.qwen/install.sh
```

## Manual Installation

### 1. Clone the superpowers repository

```bash
git clone https://github.com/obra/superpowers.git ~/.qwen/superpowers
```

### 2. Run the install script

```bash
~/.qwen/superpowers/.qwen/install.sh
```

This will:
- Create `~/.qwen/skills/` if it doesn't exist
- Symlink each skill individually into `~/.qwen/skills/` (hub pattern)
- Inject the Superpowers context block into `~/.qwen/QWEN.md`

### 3. Restart Qwen Code CLI

Quit and relaunch to discover the skills.

## Verification

Ask Qwen:

> "Do you have superpowers?"

It should respond affirmatively and list available skills.

You can also check:

```bash
ls -l ~/.qwen/skills/
```

You should see symlinks pointing to skill directories in `~/.qwen/superpowers/skills/`.

## Usage

### Finding Skills

Use Qwen's native skill discovery:

```
/skills
```

### Loading a Skill

Ask Qwen to use a specific skill:

```
use the brainstorming skill
```

Or reference it directly:

```
help me plan this feature using the writing-plans skill
```

### Tool Mapping

When skills reference Claude Code tools, Qwen equivalents are:
- `TodoWrite` → write/update a plan file (e.g., `plan.md`)
- `Task` with subagents → sequential execution
- `Skill` tool → `read_file` on `~/.qwen/skills/<skill>/SKILL.md`
- `read_file` → `read_file`
- `write_file` → `write_file`
- `replace` → `replace`
- `search` → `search_file_content`
- `glob` → `glob`
- `shell` → `run_shell_command`
- `web_fetch` → `web_fetch`

## Updating

```bash
cd ~/.qwen/superpowers && git pull
```

Skills update instantly through the symlinks.

## Uninstalling

1. **Remove the skill symlinks:**

   ```bash
   find ~/.qwen/skills -type l -lname '*/superpowers/skills/*' -delete
   ```

2. **Clean up QWEN.md:** Edit `~/.qwen/QWEN.md` and remove the block between
   `<!-- SUPERPOWERS-CONTEXT-START -->` and `<!-- SUPERPOWERS-CONTEXT-END -->`.

3. **Remove the repo:**

   ```bash
   rm -rf ~/.qwen/superpowers
   ```
