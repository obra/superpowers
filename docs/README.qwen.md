# Superpowers for Qwen Code CLI

Guide for using Superpowers with [Qwen Code CLI](https://github.com/QwenLM/qwen-code).

## Quick Install

Tell Qwen:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.qwen/INSTALL.md
```

Or run locally:

```bash
git clone https://github.com/obra/superpowers.git ~/.qwen/superpowers && ~/.qwen/superpowers/.qwen/install.sh
```

## What the Installer Does

1. Symlinks each skill individually into `~/.qwen/skills/` (hub pattern — your custom skills coexist safely)
2. Symlinks agent definitions into `~/.qwen/agents/` (required for subagent workflows)
3. Symlinks custom commands into `~/.qwen/commands/` (deterministic skill triggers like `/brainstorm`)
4. Injects a Superpowers context block into `~/.qwen/QWEN.md` with:
   - Skill discovery instructions
   - Terminology mapping (Claude Code tools → Qwen equivalents)

## Alternative: Extension Install

Qwen Code also supports extension-based install:

```bash
qwen extensions install https://github.com/obra/superpowers
```

> **Note:** The extension install uses `qwen-extension.json` and provides the `.qwen/QWEN.md` context file. However, the install-script approach above is recommended because it provides individual skill symlinks and injects the full context block with tool mappings.

## How It Works

Qwen Code CLI scans `~/.qwen/skills/` at startup and discovers skills by looking for directories containing a `SKILL.md` file. The installer creates symlinks so all Superpowers skills are discoverable.

The `using-superpowers` skill guides Qwen on when and how to use the other skills.

## Usage

Once installed, skills are discovered automatically. Qwen will activate them when:
- You mention a skill by name (e.g., "use brainstorming")
- The task matches a skill's description
- The `using-superpowers` skill directs it

Use `/skills` to view all available skills.

## Tool Mapping

Skills reference Claude Code tools. Qwen equivalents:

| Claude Code | Qwen Code |
|-------------|-----------|
| `Task` (subagents) | `task()` tool |
| `Skill` tool | `read_file` on `~/.qwen/skills/<skill>/SKILL.md` |
| `TodoWrite` | Write/update `plan.md` |
| `read_file` | `read_file` |
| `write_file` | `write_file` |
| `Edit` / `replace` | `replace` |
| `Search` | `search_file_content` |
| `Glob` | `glob` |
| `Shell` | `run_shell_command` |
| `WebFetch` | `web_fetch` |

**Note on Subagent Configuration:** The installer automatically links the required subagent definitions (`implementer`, `spec-reviewer`, `code-reviewer`) into `~/.qwen/agents/`. These Markdown+YAML files define each subagent's role, system prompt, and allowed tools. To add custom subagents beyond these, create additional Markdown+YAML files in `~/.qwen/agents/`.

## Updating

```bash
cd ~/.qwen/superpowers && git pull && .qwen/install.sh
```

> **Note:** Re-running the installer ensures any new skills, agents, or commands added upstream are linked correctly.

## Uninstalling

1. Remove skill symlinks:
   ```bash
   find ~/.qwen/skills -type l -lname '*/superpowers/skills/*' -delete
   ```

2. Remove agent symlinks:
   ```bash
   find ~/.qwen/agents -type l -lname '*/superpowers/.qwen/agents/*' -delete
   ```

3. Remove command symlinks:
   ```bash
   find ~/.qwen/commands -type l -lname '*/superpowers/.qwen/commands/*' -delete
   ```

4. Edit `~/.qwen/QWEN.md` and remove the block between `<!-- SUPERPOWERS-CONTEXT-START -->` and `<!-- SUPERPOWERS-CONTEXT-END -->`.

5. Remove the repo:
   ```bash
   rm -rf ~/.qwen/superpowers
   ```

## Troubleshooting

### Skills not showing up

1. Verify symlinks exist:
   ```bash
   ls -l ~/.qwen/skills/
   ```
2. Check that skill directories contain `SKILL.md`:
   ```bash
   ls ~/.qwen/superpowers/skills/*/SKILL.md
   ```
3. Restart Qwen Code CLI.

### Skills reference unknown tools

The context block in `~/.qwen/QWEN.md` contains tool mappings. If it's missing, re-run the installer:

```bash
~/.qwen/superpowers/.qwen/install.sh
```
