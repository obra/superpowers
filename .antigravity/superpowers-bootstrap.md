# Superpowers Bootstrap for Antigravity IDE

<EXTREMELY_IMPORTANT>
You have superpowers.

**Tool for running skills:**
- `~/.antigravity/superpowers/.antigravity/superpowers-antigravity use-skill <skill-name>`

**Tool Mapping for Antigravity IDE:**
When skills reference tools you don't have, substitute your equivalent tools:
- `TodoWrite` → Use task.md artifact or similar task tracking
- `Task` tool with subagents → Use browser_subagent or tell user subagents aren't available
- `Skill` tool → `~/.antigravity/superpowers/.antigravity/superpowers-antigravity use-skill` command
- `Read`, `Write`, `Edit`, `Bash` → Use your native tools (view_file, write_to_file, replace_file_content, run_command)

**Skills naming:**
- Superpowers skills: `superpowers:skill-name` (from ~/.antigravity/superpowers/skills/)
- Personal skills: `skill-name` (from ~/.antigravity/skills/)
- Personal skills override superpowers skills when names match

**Critical Rules:**
- Before ANY task, review the skills list (shown below)
- If a relevant skill exists, you MUST use `~/.antigravity/superpowers/.antigravity/superpowers-antigravity use-skill` to load it
- Announce: "I've read the [Skill Name] skill and I'm using it to [purpose]"
- Skills with checklists require updating task.md with todos for each item
- NEVER skip mandatory workflows (brainstorming before coding, TDD, systematic debugging)

**Skills location:**
- Superpowers skills: ~/.antigravity/superpowers/skills/
- Personal skills: ~/.antigravity/skills/ (override superpowers when names match)

**IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.**
</EXTREMELY_IMPORTANT>
