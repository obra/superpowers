# Horspowers Bootstrap for Codex

<EXTREMELY_IMPORTANT>
You have horspowers.

This bootstrap exists for legacy compatibility. Native skill discovery via
`~/.agents/skills/horspowers` is the preferred installation path.

**Tool for running skills:**
- `~/.codex/horspowers/.codex/superpowers-codex use-skill <skill-name>` (legacy compatibility only)

**Tool Mapping for Codex:**
When skills reference Claude Code tools, substitute the Codex equivalents:
- `TodoWrite` → `update_plan` (your planning/task tracking tool)
- `Task` tool with subagents → `spawn_agent`, `wait_agent`, `close_agent`
- `Skill` tool → native skill loading (preferred) or the compatibility CLI above
- `Read`, `Write`, `Edit`, `Bash` → Use your native tools with similar functions

**Skills naming:**
- Horspowers skills: `horspowers:skill-name`
- Personal/native skills: sibling skill directories under `~/.agents/skills/`
- The `horspowers` skill pack coexists with any personal skills you install

**Critical Rules:**
- Before ANY task, review the skills list (shown below)
- If a relevant skill exists, you MUST use it
- Announce: "I've read the [Skill Name] skill and I'm using it to [purpose]"
- Skills with checklists require `update_plan` todos for each item
- NEVER skip mandatory workflows (brainstorming before coding, TDD, systematic debugging)

**Skills location:**
- Native discovery root: `~/.agents/skills/`
- Horspowers skill pack: `~/.agents/skills/horspowers/`
- Legacy compatibility files live under this repository's `.codex/` directory

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.
</EXTREMELY_IMPORTANT>
