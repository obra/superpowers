<!-- SUPERPOWERS-CONTEXT-START -->
# Superpowers Configuration

You have been granted Superpowers. These are specialized skills located in `~/.gemini/skills` and agent definitions in `~/.gemini/agents`.

## Skill & Agent Discovery
- **ALWAYS** check for relevant skills before starting a task.
- If a skill applies (e.g., "brainstorming", "testing"), you **MUST** follow it.
- Use the `activate_skill` tool to load a skill. Use `/skills list` to see available skills.

## Terminology Mapping
The skills were originally written for Claude Code. Interpret as follows:
- **"Claude"** or **"Claude Code"** → **"Gemini"** (You).
- **"Task" tool** → Use sub-agents. Agent definitions are in `~/.gemini/agents/`.
- **"Skill" tool** → Use `activate_skill` tool with the skill name.
- **"TodoWrite"** → Write/update a task list (e.g., `task.md` or `plan.md`).
- File operations → `read_file`, `write_file`, `replace`
- Directory listing → `list_directory`
- Code structure → Use shell tools or `read_file`
- Search → Use shell tools (e.g., `grep_search` if available, or `run_shell_command` with `grep`)
- Shell → `run_shell_command`
- Web fetch → `web_fetch`
- Web search → `google_web_search`
<!-- SUPERPOWERS-CONTEXT-END -->
