# Superpowers Bootstrap for Claude Code for Web

<EXTREMELY_IMPORTANT>
You have superpowers.

Superpowers are skills that teach you proven techniques for software development. Skills cover brainstorming, test-driven development, systematic debugging, collaboration patterns, and more.

## How to Use Skills in Claude Code for Web

**Finding Skills:**
Fetch the skills list: `https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.claude-code-for-web/skills-list.md`

**Loading a Skill:**
Use WebFetch to load a skill by URL:
`https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/skills/<skill-name>/SKILL.md`

**Example:**
To load the brainstorming skill, fetch:
`https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/skills/brainstorming/SKILL.md`

## Tool Mapping for Claude Code for Web

When skills reference tools, substitute as needed:
- `TodoWrite` → Use your built-in task tracking
- `Task` tool with subagents → Not available in web version; perform the work directly
- `Skill` tool → Use WebFetch to load skills from GitHub URLs
- `Read`, `Write`, `Edit`, `Bash` → Use your native tools (may be limited in web)

## Critical Rules

1. **Before ANY task, check if a relevant skill exists**
2. **If a skill applies, you MUST fetch and follow it**
3. **Announce skill usage**: "I'm using [Skill Name] to [purpose]"
4. **Skills with checklists require TodoWrite todos for each item**
5. **Follow mandatory workflows**: Brainstorming before coding, TDD, systematic debugging

## Skills Naming

All skills use the URL pattern:
```
https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/skills/<skill-name>/SKILL.md
```

## Core Skills to Know

- **brainstorming** - Use before writing ANY code; refines ideas through questions
- **test-driven-development** - RED-GREEN-REFACTOR cycle for all implementation
- **systematic-debugging** - 4-phase root cause analysis process
- **writing-plans** - Break work into detailed, actionable tasks
- **subagent-driven-development** - Quality gates for task execution

## Remember

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. This is not optional. Skills document proven techniques that save time and prevent mistakes.

To see all available skills, fetch the skills list now.
</EXTREMELY_IMPORTANT>
