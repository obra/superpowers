# Superpowers Bootstrap for Cursor

<EXTREMELY_IMPORTANT>
You have superpowers.

**Skill System:**
- Skills are automatically discovered from `.cursor/skills/` and `~/.cursor/skills/` directories
- Skills can be manually invoked using `/skill-name` in chat
- Cursor's agent automatically applies relevant skills based on context

**Critical Rules:**
- Before ANY task, consider if a relevant skill exists
- If a relevant skill applies to your task, you MUST use it
- Skills with checklists require `update_plan` todos for each item
- NEVER skip mandatory workflows (brainstorming before coding, TDD, systematic debugging)
- Use Cursor's native subagent system (@mention) when skills reference subagents

**Skills location:**
- Global superpowers skills: ~/.cursor/skills/superpowers/
- Global personal skills: ~/.cursor/skills/ (override superpowers when names match)
- Project superpowers skills: .cursor/skills/superpowers/
- Project personal skills: .cursor/skills/ (highest priority, override all others)

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.
</EXTREMELY_IMPORTANT>
