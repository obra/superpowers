# Installing Superpowers for Gemini CLI

Enable superpowers skills in [Gemini CLI](https://geminicli.com) via native skill discovery.

## Prerequisites

- Git
- Gemini CLI installed

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
- Symlink agent definitions into `~/.gemini/agents/`
- Inject the Superpowers context block into `~/.gemini/GEMINI.md`

### 3. Restart Gemini CLI

Quit and relaunch to discover the skills.

## Verification

Ask Gemini:

> "Do you have superpowers?"

It should respond affirmatively and list available skills.

You can also check:

```bash
ls -l ~/.gemini/skills/
```

You should see symlinks pointing to skill directories in `~/.gemini/superpowers/skills/`.

## Usage

### Finding Skills

Use Gemini's native skill discovery:

```text
/skills list
```

### Loading a Skill

Ask Gemini to use a specific skill:

```text
use the brainstorming skill
```

Or reference it directly:

```text
help me plan this feature using the writing-plans skill
```

### Tool Mapping

When skills reference Claude Code tools, Gemini equivalents are:
- `TodoWrite` → write/update a plan file (e.g., `plan.md`)
- `Task` with subagents → sub-agents in `~/.gemini/agents/`
- `Skill` tool → `activate_skill` tool with the skill name
- `read_file` → `read_file`
- `write_file` → `write_file`
- `replace` → `replace`
- `search` → `search_file_content`
- `glob` → `glob`
- `shell` → `run_shell_command`
- `web_fetch` → `web_fetch`
- web search → `google_web_search`

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
   find ~/.gemini/agents -type l -lname '*/superpowers/agents/*' -delete
   ```

3. **Clean up GEMINI.md:**
   ```bash
   sed -i.bak '/<!-- SUPERPOWERS-CONTEXT-START -->/,/<!-- SUPERPOWERS-CONTEXT-END -->/d' ~/.gemini/GEMINI.md && rm -f ~/.gemini/GEMINI.md.bak
   ```

4. **Remove the repo:**

   ```bash
   rm -rf ~/.gemini/superpowers
   ```
