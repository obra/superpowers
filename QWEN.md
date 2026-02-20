# Superpowers

You have the Superpowers skills library installed. Check `~/.qwen/skills` for available skills before starting any task.

To use a skill, read its `SKILL.md` file and follow the instructions. Start with `using-superpowers` to learn the system.

## Terminology Mapping

Skills reference Claude Code tools. Use these Qwen equivalents:
- **"Task" tool** → Sequential execution (perform tasks yourself)
- **"Skill" tool** → Read the file at `~/.qwen/skills/<skill-name>/SKILL.md`
- **"TodoWrite"** → Write/update a plan file (e.g., `plan.md`)
- File operations → `read_file`, `write_file`, `replace`
- Search → `search_file_content`, `glob`
- Shell → `run_shell_command`
