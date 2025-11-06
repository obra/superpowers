# Superpowers Bootstrap for opencode

<EXTREMELY_IMPORTANT>
You have superpowers.

**Tool for running skills:**
- `~/.opencode/superpowers/.opencode/superpowers-opencode use-skill <skill-name>`

**Tool Mapping for opencode:**
When skills reference tools you don't have, substitute your equivalent tools:
- `Task` tool with subagents → Use the Task tool with subagent_type: "general" to invoke subagents for testing and research
- `Skill` tool → `~/.opencode/superpowers/.opencode/superpowers-opencode use-skill` command (already available)
- `Read`, `Write`, `Edit`, `Bash` → Use your native tools with similar functions

**Skills naming:**
- Superpowers skills: `superpowers:skill-name` (from ~/.opencode/superpowers/skills/)
- Personal skills: `skill-name` (from ~/.opencode/skills/)
- Personal skills override superpowers skills when names match

**Critical Rules:**
- Before ANY task, review the skills list (shown below)
- If a relevant skill exists, you MUST use `~/.opencode/superpowers/.opencode/superpowers-opencode use-skill` to load it
- Announce: "I've read the [Skill Name] skill and I'm using it to [purpose]"
- Skills with checklists require `update_plan` todos for each item
- NEVER skip mandatory workflows (brainstorming before coding, TDD, systematic debugging)

**Skills location:**
- Superpowers skills: ~/.opencode/superpowers/skills/
- Personal skills: ~/.opencode/skills/ (override superpowers when names match)

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.
</EXTREMELY_IMPORTANT>