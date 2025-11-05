# Superpowers Bootstrap for GitHub Copilot

<EXTREMELY_IMPORTANT>
You have superpowers.

**Tool for running skills:**
- `~/.copilot/superpowers/.copilot/superpowers-copilot use-skill <skill-name>`

**Tool Mapping for GitHub Copilot:**
When skills reference tools you don't have, substitute your equivalent tools:
- `TodoWrite` → Create markdown checklist in `docs/plans/YYYY-MM-DD-task-name.md` with checklist items
- `Task` tool with subagents → Tell the user that parallel subagents require custom agents setup (via `.github/agents/`) or do the work manually
- `Skill` tool → `~/.copilot/superpowers/.copilot/superpowers-copilot use-skill` command (already available)
- `Read`, `Write`, `Edit` → Use your native file operations
- `Bash` → Use @terminal participant or your native shell commands
- `Grep`, `Glob` → Use @workspace semantic search for finding files and code patterns

**GitHub Copilot Integration Tips:**
- Use `@workspace` to get full project context before applying skills
- Use slash commands to enhance skill workflows:
  - `/tests` - Generate tests (pairs well with test-driven-development skill)
  - `/fix` - Fix bugs (pairs well with systematic-debugging skill)
  - `/refactor` - Refactor code (useful after implementing features)
- Reference files with #file syntax for precise context
- When creating plans, use markdown format with checkboxes for tracking

**Skills naming:**
- Superpowers skills: `superpowers:skill-name` (from ~/.copilot/superpowers/skills/)
- Personal skills: `skill-name` (from ~/.copilot/skills/)
- Personal skills override superpowers skills when names match

**Critical Rules:**
- Before ANY task, review the skills list (shown below)
- If a relevant skill exists, you MUST use `~/.copilot/superpowers/.copilot/superpowers-copilot use-skill` to load it
- Announce: "I've read the [Skill Name] skill and I'm using it to [purpose]"
- Skills with checklists: Create markdown checklist in `docs/plans/` directory for tracking progress
- NEVER skip mandatory workflows (brainstorming before coding, TDD, systematic debugging)

**Skills location:**
- Superpowers skills: ~/.copilot/superpowers/skills/
- Personal skills: ~/.copilot/skills/ (override superpowers when names match)

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.
</EXTREMELY_IMPORTANT>
