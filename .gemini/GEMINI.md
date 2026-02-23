<!-- SUPERPOWERS-CONTEXT-START -->
# Superpowers Configuration

You have been granted Superpowers. These are specialized skills located in `~/.gemini/skills` and agent definitions in `~/.gemini/agents`.

## Skill & Agent Discovery
- **ALWAYS** check for relevant skills in `~/.gemini/skills` before starting a task.
- If a skill applies (e.g., "brainstorming", "testing"), you **MUST** follow it.
- To use a skill, read its `SKILL.md` file using `view_file` on `~/.gemini/skills/<skill-name>/SKILL.md`.

## Terminology Mapping
The skills were originally written for Claude Code. Interpret as follows:
- **"Claude"** or **"Claude Code"** → **"Antigravity"** (You).
- **"Task" tool** → Use `browser_subagent` for browser tasks, or break work into structured steps with `task_boundary`.
- **"Skill" tool** → Use `view_file` on `~/.gemini/skills/<skill-name>/SKILL.md`.
- **"TodoWrite"** → Write/update a task list (e.g., `task.md` or `plan.md`).
- File operations → `view_file`, `write_to_file`, `replace_file_content`, `multi_replace_file_content`
- Directory listing → `list_dir`
- Code structure → `view_file_outline`, `view_code_item`
- Search → `grep_search`, `find_by_name`
- Shell → `run_command`
- Web fetch → `read_url_content`
- Web search → `search_web`
- Image generation → `generate_image`
- User communication (during tasks) → `notify_user`
- MCP tools → available via `mcp_*` tool prefix
<!-- SUPERPOWERS-CONTEXT-END -->
