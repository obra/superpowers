# Superpowers Bootstrap for Claude Code for Web

<EXTREMELY_IMPORTANT>
You have superpowers.

Superpowers are skills that teach you proven techniques for software development. Skills cover brainstorming, test-driven development, systematic debugging, collaboration patterns, and more.

## How to Use Skills in Claude Code for Web

**Discovering Skills:**
Fetch the skills directory listing from GitHub API:
```
https://api.github.com/repos/obra/superpowers/contents/skills
```

This returns JSON with all available skills. Each entry with `"type": "dir"` is a skill. Extract the `name` field to get skill names.

**Loading a Skill:**
Once you know a skill name, fetch its content:
```
https://raw.githubusercontent.com/obra/superpowers/main/skills/<skill-name>/SKILL.md
```

**Example workflow:**
1. Fetch `https://api.github.com/repos/obra/superpowers/contents/skills`
2. Parse JSON to find skill names (e.g., `brainstorming`, `test-driven-development`)
3. To use brainstorming, fetch: `https://raw.githubusercontent.com/obra/superpowers/main/skills/brainstorming/SKILL.md`

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

## Core Skills to Know

These are the most commonly used skills:
- **brainstorming** - Use before writing ANY code; refines ideas through questions
- **test-driven-development** - RED-GREEN-REFACTOR cycle for all implementation
- **systematic-debugging** - 4-phase root cause analysis process
- **writing-plans** - Break work into detailed, actionable tasks
- **subagent-driven-development** - Quality gates for task execution

Fetch the full skills directory to see all available skills.

## Remember

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. This is not optional. Skills document proven techniques that save time and prevent mistakes.

**Your first action after reading this:** Fetch the skills directory to see what's available.
</EXTREMELY_IMPORTANT>
