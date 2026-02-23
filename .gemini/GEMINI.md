# Superpowers

You have the Superpowers skills library installed. Before taking any action, you MUST read the `using-superpowers` skill to learn how to use the skills system properly.

This is not optional. Read `using-superpowers` BEFORE your first response in every conversation.

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
- **"TodoWrite"** → Write/update a plan file (e.g., `task.md` in your artifact directory).
- File operations → `view_file`, `write_to_file`, `replace_file_content`, `multi_replace_file_content`
- Search → `grep_search`, `find_by_name`
- Shell → `run_command`
- Web fetch → `read_url_content`
- Web search → `search_web`
<!-- SUPERPOWERS-CONTEXT-END -->
