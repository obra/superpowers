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
- File operations → `view_file`, `write_to_file`, `replace_file_content`, `multi_replace_file_content`
- Directory listing → `list_dir`
- Code structure → `view_file_outline`, `view_code_item`
- Search → `search_file_content`, `glob`
- Shell → `run_command`
- Web fetch → `read_url_content`
- Web search → `google_web_search`
<!-- SUPERPOWERS-CONTEXT-END -->
