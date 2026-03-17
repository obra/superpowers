# Kiro IDE Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | Kiro IDE equivalent |
|-----------------|---------------------|
| `Read` (file reading) | `discloseContext` or native file reading tools |
| `Write` (file creation) | Native file writing tools |
| `Edit` (file editing) | Native file editing tools |
| `Bash` (run commands) | Native shell/command execution tools |
| `Grep` (search file content) | Native search tools |
| `Glob` (search files by name) | Native file pattern matching tools |
| `TodoWrite` (task tracking) | Native task tracking or use in-memory tracking |
| `Skill` tool (invoke a skill) | `discloseContext` to load skill files from `~/.kiro/powers/repos/superpowers/skills/[skill-name]/SKILL.md` |
| `Task` tool (dispatch subagent) | Check Kiro IDE documentation for subagent support |

## Kiro IDE Integration Model

Kiro IDE uses a **Power system** with in-place context loading:
- Skills are **not copied** to `~/.kiro/skills/`
- Skills remain in `~/.kiro/powers/repos/superpowers/skills/`
- The `discloseContext` tool loads skill content on-demand
- No shell scripts or file copying required

## How Skills Load in Kiro IDE

1. **Bootstrap**: When the Power activates, `POWER.md` instructs the agent to load `skills/using-superpowers/SKILL.md`
2. **On-demand**: When a skill is needed, the agent uses `discloseContext` or equivalent to read the skill's `SKILL.md` file
3. **Keywords**: Skills activate via natural language keywords (e.g., "use systematic-debugging")
4. **No slash commands**: Global `/` commands are not supported in this mode

## Updating Skills

Since skills are read directly from the cloned repository:
```bash
cd ~/.kiro/powers/repos/superpowers
git pull
```

The agent immediately sees updated skill content on the next invocation.
