# Installing Superpowers for Antigravity

Enable Superpowers skills in [Antigravity](https://deepmind.google), the agentic AI coding assistant by Google DeepMind, via native skill discovery.

## Prerequisites

- Git
- Antigravity installed

## Quick Install

```bash
git clone https://github.com/obra/superpowers.git ~/.gemini/superpowers && ~/.gemini/superpowers/.gemini/install.sh
```

## Manual Installation

### 1. Clone the superpowers repository

```bash
git clone https://github.com/obra/superpowers.git ~/.gemini/superpowers
```

### 2. Run the install script

```bash
~/.gemini/superpowers/.gemini/install.sh
```

This will:
- Create `~/.gemini/skills/` if it doesn't exist
- Symlink each skill individually into `~/.gemini/skills/` (hub pattern)
- Symlink skills into `~/.gemini/antigravity/skills/` if Antigravity is detected
- Symlink agent definitions into `~/.gemini/agents/`
- Inject the Superpowers context block into `~/.gemini/GEMINI.md`

### 3. Restart Antigravity

Quit and relaunch to pick up the new skills and context.

## Verification

Ask Antigravity:

> "Do you have superpowers?"

It should respond affirmatively and list available skills.

You can also check:

```bash
ls -l ~/.gemini/skills/
```

You should see symlinks pointing to skill directories in `~/.gemini/superpowers/skills/`.

## Usage

### Finding Skills

Skills are discovered automatically. Antigravity reads each skill's `SKILL.md` file when a matching task is detected.

### Loading a Skill

Ask Antigravity to use a specific skill:

```text
use the brainstorming skill
```

Or reference it directly:

```text
help me plan this feature using the writing-plans skill
```

### Tool Mapping

When skills reference Claude Code tools, Antigravity equivalents are:
- `TodoWrite` → write/update a plan file (e.g., `task.md`)
- `Task` with subagents → `browser_subagent` / `task_boundary`
- `Skill` tool → `view_file` on `~/.gemini/skills/<skill>/SKILL.md`
- `read_file` → `view_file`
- `write_file` → `write_to_file`
- `Edit` / `replace` → `replace_file_content`, `multi_replace_file_content`
- Directory listing → `list_dir`
- Code structure → `view_file_outline`, `view_code_item`
- `search` → `grep_search`, `find_by_name`
- `shell` → `run_command`
- `web_fetch` → `read_url_content`
- Web search → `search_web`
- Image generation → `generate_image`
- User communication (during tasks) → `notify_user`
- MCP tools → available via `mcp_*` tool prefix

## Updating

```bash
cd ~/.gemini/superpowers && git pull
```

Skills update instantly through the symlinks.

## Uninstalling

1. **Remove the skill symlinks:**

   ```bash
   find ~/.gemini/skills -type l -lname '*/superpowers/skills/*' -delete
   ```

2. **Remove the agent symlinks:**

   ```bash
   find ~/.gemini/agents -type l -lname '*/superpowers/.gemini/agents/*' -delete
   ```

3. **Clean up GEMINI.md:** Edit `~/.gemini/GEMINI.md` and remove the block between
   `<!-- SUPERPOWERS-CONTEXT-START -->` and `<!-- SUPERPOWERS-CONTEXT-END -->`.

4. **Remove the repo:**

   ```bash
   rm -rf ~/.gemini/superpowers
   ```
