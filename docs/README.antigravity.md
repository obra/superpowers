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
2. Symlinks agent definitions into `~/.gemini/agents/`
3. Injects a Superpowers context block into `~/.gemini/GEMINI.md` with:
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
| `Read` / `view_file` | `view_file` |
| `Write` / `write_file` | `write_to_file` |
| `Edit` / `replace` | `replace_file_content`, `multi_replace_file_content` |
| `Search` | `grep_search`, `find_by_name` |
| `Shell` | `run_command` |
| `WebFetch` | `read_url_content` |
| Web Search | `search_web` |

## Updating

```bash
cd ~/.gemini/superpowers && git pull
```

Skills update instantly through the symlinks.

## Uninstalling

1. Remove skill symlinks:
   ```bash
   find ~/.gemini/skills -type l -lname '*/superpowers/skills/*' -delete
   ```

2. Remove agent symlinks:
   ```bash
   find ~/.gemini/agents -type l -lname '*/superpowers/.gemini/agents/*' -delete
   ```

3. Edit `~/.gemini/GEMINI.md` and remove the block between `<!-- SUPERPOWERS-CONTEXT-START -->` and `<!-- SUPERPOWERS-CONTEXT-END -->`.

4. Remove the repo:
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
