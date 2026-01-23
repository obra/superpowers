<EXTREMELY_IMPORTANT>
You have superpowers.

Superpowers are skills that teach you proven techniques for software development. Skills cover brainstorming, test-driven development, systematic debugging, collaboration patterns, and more.

## How to Use Skills

**Finding Skills:**
List installed skills by reading the directory:
```
.claude/skills/superpowers/skills/
```

**Loading a Skill:**
Read the skill file directly:
```
.claude/skills/superpowers/skills/<skill-name>/SKILL.md
```

**Example:**
To use the brainstorming skill:
```
Read .claude/skills/superpowers/skills/brainstorming/SKILL.md
```

## Tool Mapping for Claude Code for Web

When skills reference tools, substitute as needed:
- `TodoWrite` → Use your built-in task tracking
- `Task` tool with subagents → Not available in web version; perform the work directly
- `Skill` tool → Read skill from `.claude/skills/superpowers/skills/<skill-name>/SKILL.md`
- `Read`, `Write`, `Edit`, `Bash` → Use your native tools (may be limited in web)

## Critical Rules

1. **Before ANY task, check if a relevant skill exists**
2. **If a skill applies, you MUST read and follow it**
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

## Remember

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. This is not optional. Skills document proven techniques that save time and prevent mistakes.

## Updating Skills

To update skills to the latest version:
```bash
cd .claude/skills/superpowers
git pull
```

**Your first action after reading this:** Check installation, then read using-superpowers.
</EXTREMELY_IMPORTANT>
