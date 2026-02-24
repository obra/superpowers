# Installing Superpowers for Gemini CLI

Enable superpowers skills in [Gemini CLI](https://geminicli.com) via native skill discovery.

## Prerequisites

- Git
- Gemini CLI v0.24.0+ installed
- Node.js (required for deterministic skill routing hooks)
- Python 3 (used by installer for safe JSON manipulation)

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
- Register BeforeAgent/BeforeTool hooks in `~/.gemini/settings.json`
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
- `TodoWrite` → write/update a task list (e.g., `task.md` or `plan.md`)
- `Task` with subagents → sub-agents in `~/.gemini/agents/`
- `Skill` tool → `activate_skill` tool with the skill name
- File operations → `read_file`, `write_file`, `replace`
- Directory listing → `list_directory`
- Code structure → Use shell tools or `read_file`
- Search → Use shell tools (e.g., `grep_search` if available, or `run_shell_command` with `grep`)
- Shell → `run_shell_command`
- Web fetch → `web_fetch`
- Web search → `google_web_search`

## Updating

```bash
cd ~/.gemini/superpowers && git pull
```

Skills update instantly through the symlinks.

## Uninstalling

1. **Remove the skill symlinks:**

   ```bash
   [ -d ~/.gemini/skills ] && find ~/.gemini/skills -type l -lname '*/superpowers/skills/*' -delete
   ```

2. **Remove the agent symlinks:**

   ```bash
   [ -d ~/.gemini/agents ] && find ~/.gemini/agents -type l -lname '*/superpowers/agents/*' -delete
   ```

3. **Remove hooks from settings.json:**
   ```bash
   python3 -c "
import json
with open('$HOME/.gemini/settings.json') as f: d = json.load(f)
for k in ('beforeAgent','beforeTool'):
    d.get('hooks',{}).get(k,[])[:] = [h for h in d.get('hooks',{}).get(k,[]) if 'superpowers' not in h.get('name','')]
with open('$HOME/.gemini/settings.json','w') as f: json.dump(d,f,indent=2); f.write('\n')
"
   ```

4. **Clean up GEMINI.md:**
   ```bash
   sed -i.bak '/<\!-- SUPERPOWERS-CONTEXT-START -->/, /<\!-- SUPERPOWERS-CONTEXT-END -->/d' ~/.gemini/GEMINI.md && rm -f ~/.gemini/GEMINI.md.bak
   ```

5. **Remove the repo:**

   ```bash
   rm -rf ~/.gemini/superpowers
   ```
