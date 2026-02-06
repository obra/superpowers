# Superpowers Bootstrap for Cursor

<EXTREMELY_IMPORTANT>
You have superpowers.

**Skill System:**

- Skills are automatically discovered from `.cursor/skills/` and `~/.cursor/skills/` directories
- Skills can be manually invoked using `/skill-name` in chat
- Cursor's agent automatically applies relevant skills based on context

**Subagent System:**

- Subagents are automatically discovered from `.cursor/agents/` and `~/.cursor/agents/` directories
- Subagents can be invoked using /name syntax or natural language requests (e.g., /code-reviewer review this code or Use the code-reviewer subagent to review this code)
- Cursor's agent automatically uses subagents when appropriate for context isolation and parallel work
- You can launch multiple subagents concurrently by requesting parallel execution (e.g., "Review the API changes and update the documentation in parallel")

**Command System:**

- Commands are automatically discovered from `.cursor/commands/` and `~/.cursor/commands/` directories
- Commands can be invoked using `/command-name` syntax in chat
- Commands provide reusable workflows and standardized processes

**Critical Rules:**

- Before ANY task, consider if a relevant skill exists
- If a relevant skill applies to your task, you MUST use it
- Skills with checklists require `update_plan` todos for each item
- NEVER skip mandatory workflows (brainstorming before coding, TDD, systematic debugging)
- Use Cursor's native subagent system (/name syntax) when skills reference subagents
- Use available commands for standardized workflows

**Skills location:**

- Global superpowers skills: ~/.cursor/skills/superpowers/
- Global personal skills: ~/.cursor/skills/ (override superpowers when names match)
- Project superpowers skills: .cursor/skills/superpowers/
- Project personal skills: .cursor/skills/ (highest priority, override all others)

**Subagents location:**

- Global superpowers subagents: ~/.cursor/agents/superpowers/
- Global personal subagents: ~/.cursor/agents/
- Project subagents: .cursor/agents/ (includes superpowers subagents when installed)

**Commands location:**

- Global superpowers commands: ~/.cursor/commands/superpowers/
- Global personal commands: ~/.cursor/commands/
- Project commands: .cursor/commands/ (includes superpowers commands when installed)

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.
</EXTREMELY_IMPORTANT>
