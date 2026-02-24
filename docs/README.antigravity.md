# Superpowers for Antigravity

Guide for using Superpowers with [Antigravity](https://deepmind.google), the agentic AI coding assistant by Google DeepMind.

## Quick Install

```bash
git clone https://github.com/obra/superpowers.git ~/.gemini/superpowers && ~/.gemini/superpowers/.gemini/install.sh
```

Then restart Antigravity.

> **Note:** Antigravity and Gemini CLI share `~/.gemini/` — if you've already installed Superpowers for Gemini CLI, skills are already available. The install script is idempotent, so re-running it is safe.

## What the Installer Does

1. Symlinks each skill individually into `~/.gemini/skills/` (hub pattern — your custom skills coexist safely)
2. Symlinks skills into `~/.gemini/antigravity/skills/` if Antigravity is detected on the system
3. Symlinks agent definitions into `~/.gemini/agents/`
4. Injects a Superpowers context block into `~/.gemini/GEMINI.md` with:
   - Skill discovery instructions
   - Terminology mapping (Claude Code tools → Antigravity equivalents)

## Alternative: Extension Install

Antigravity supports extension-based install via `antigravity-extension.json`. However, the install-script approach above is recommended because it provides individual skill symlinks and injects the full context block with tool mappings.

## How It Works

Antigravity reads skills from `~/.gemini/skills/` at startup and discovers skills by looking for directories containing a `SKILL.md` file. The installer creates symlinks so all Superpowers skills are discoverable.

The `using-superpowers` skill guides Antigravity on when and how to use the other skills.

## Usage

Once installed, Antigravity will check for relevant skills before starting any task. It reads skill instructions directly using `view_file` on the `SKILL.md` in each skill directory.

## Tool Mapping

Skills reference Claude Code tools. Antigravity equivalents:

| Claude Code | Antigravity |
|-------------|-------------|
| `Skill` tool | `view_file` on `~/.gemini/skills/<skill>/SKILL.md` |
| `Task` (subagents) | `browser_subagent` / `task_boundary` |
| `TodoWrite` | Write/update `task.md` in your artifact directory |
| `Read` / `read_file` | `view_file` |
| `Write` / `write_file` | `write_to_file` |
| `Edit` / `replace` | `replace_file_content`, `multi_replace_file_content` |
| `LS` / directory listing | `list_dir` |
| Code structure | `view_file_outline`, `view_code_item` |
| `Search` | `grep_search`, `find_by_name` |
| `Shell` | `run_command` |
| `WebFetch` | `read_url_content` |
| Web Search | `search_web` |
| Image generation | `generate_image` |
| User communication (during tasks) | `notify_user` |
| MCP integrations | `mcp_*` tools (e.g. `mcp_StitchMCP_*`, `mcp_context7_*`) |

## Updating

```bash
cd ~/.gemini/superpowers && git pull && .gemini/install.sh
```

> **Note:** Re-running the installer ensures any new skills, agents, or hooks added upstream are linked correctly.

## Uninstalling

1. Remove skill symlinks:
   ```bash
   find ~/.gemini/skills -type l -lname '*/superpowers/skills/*' -delete
   ```

2. Remove Antigravity-specific skill symlinks (if applicable):
   ```bash
   find ~/.gemini/antigravity/skills -type l -lname '*/superpowers/skills/*' -delete 2>/dev/null
   ```

3. Remove agent symlinks:
   ```bash
   find ~/.gemini/agents -type l -lname '*/superpowers/agents/*' -delete
   ```

4. Remove hooks from settings.json (if installed):
   ```bash
   python3 -c "
import json
with open('$HOME/.gemini/settings.json') as f: d = json.load(f)
for k in ('beforeAgent','beforeTool'):
    d.get('hooks',{}).get(k,[])[:] = [h for h in d.get('hooks',{}).get(k,[]) if 'superpowers' not in h.get('name','')]
with open('$HOME/.gemini/settings.json','w') as f: json.dump(d,f,indent=2); f.write('\n')
" 2>/dev/null || true
   ```

5. Remove the injected Superpowers context block from GEMINI.md:
   ```bash
   sed -i.bak '/<!-- SUPERPOWERS-CONTEXT-START -->/,/<!-- SUPERPOWERS-CONTEXT-END -->/d' ~/.gemini/GEMINI.md && rm -f ~/.gemini/GEMINI.md.bak
   ```

6. Remove the repo:
   ```bash
   rm -rf ~/.gemini/superpowers
   ```

## Troubleshooting

### Skills not showing up

1. Verify symlinks exist:
   ```bash
   ls -l ~/.gemini/skills/
   ```
2. Check that skill directories contain `SKILL.md`:
   ```bash
   ls ~/.gemini/superpowers/skills/*/SKILL.md
   ```
3. Restart Antigravity.

### Skills reference unknown tools

The context block in `~/.gemini/GEMINI.md` contains tool mappings. If it's missing, re-run the installer:

```bash
~/.gemini/superpowers/.gemini/install.sh
```
