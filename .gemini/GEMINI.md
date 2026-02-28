<!-- SUPERPOWERS-CONTEXT-START -->
# Superpowers Configuration

You have been granted Superpowers. These are specialized skills located in `~/.gemini/skills` and agent definitions in `~/.gemini/agents`.

## Important: Skill Activation in Gemini CLI

Gemini CLI treats this context file as **advisory**, not mandatory. Unlike Claude Code, Gemini does not automatically activate skills based solely on this file.

### Recent Improvements (v0.30.0+)
- **Enhanced Skill Matching**: Better heuristics for matching user requests to skill descriptions
- **YOLO Mode**: Use `--yolo` flag or Ctrl+Y to auto-approve skill activations and tool calls
- **Improved Auto-Activation**: Recent versions have improved automatic skill detection

### How to Use Superpowers Effectively

1. **Explicit Skill Invocation**: For reliable activation, explicitly tell Gemini to use a specific skill by name. Example:
   - "Use the brainstorming skill"
   - "Help me plan this feature using the writing-plans skill"

2. **Check for Relevant Skills**: Before starting any task, check if a Superpowers skill applies:
   - Use `/skills list` to see available skills
   - Look for skills matching the task (e.g., "test-driven-development", "systematic-debugging")

3. **Manual Activation**: If a skill applies, activate it using the `activate_skill` tool or explicitly tell Gemini to use it.

4. **Use YOLO Mode**: For more automatic behavior, start Gemini CLI with `--yolo` flag or press Ctrl+Y during a session to auto-approve skill activations.

## Skill & Agent Discovery

### Available Superpowers Skills

**Brainstorming** (`brainstorming/`) - Generate ideas, explore possibilities, consider alternatives  
**Writing Plans** (`writing-plans/`) - Create structured development plans with clear goals and steps  
**Test-Driven Development** (`test-driven-development/`) - Write tests first, implement incrementally  
**Systematic Debugging** (`systematic-debugging/`) - Methodical approach to finding and fixing bugs  
**Subagent-Driven Development** (`subagent-driven-development/`) - Coordinate specialized sub-agents for complex tasks  
**Executing Plans** (`executing-plans/`) - Follow through on development plans step by step  
**Receiving Code Review** (`receiving-code-review/`) - Incorporate feedback and improve code quality  
**Requesting Code Review** (`requesting-code-review/`) - Prepare code for review and address feedback  
**Dispatching Parallel Agents** (`dispatching-parallel-agents/`) - Manage multiple concurrent tasks  
**Using Git Worktrees** (`using-git-worktrees/`) - Work with multiple Git branches simultaneously  
**Finishing a Development Branch** (`finishing-a-development-branch/`) - Complete and clean up feature branches  
**Verification Before Completion** (`verification-before-completion/`) - Ensure quality before marking tasks done  
**Writing Skills** (`writing-skills/`) - Create new Superpowers skills for specific tasks  
**Using Superpowers** (`using-superpowers/`) - General guidance on leveraging the Superpowers ecosystem  

### Agent Definitions

Agent definitions are available in `~/.gemini/agents/`:
- `implementer.md` - Implementation specialist
- `code-reviewer.md` - Code review specialist  
- `spec-reviewer.md` - Specification review specialist

## Terminology Mapping

The skills were originally written for Claude Code. Interpret as follows:

- **"Claude"** or **"Claude Code"** → **"Gemini"** (You).
- **"Task" tool** → Use sub-agents. Agent definitions are in `~/.gemini/agents/`.
- **"Skill" tool** → Use `activate_skill` tool with the skill name.
- **"TodoWrite"** → Write/update a task list (e.g., `task.md` or `plan.md`).
- File operations → `read_file`, `write_file`, `replace`
- Directory listing → `list_directory`
- Code structure → Use shell tools or `read_file`
- Search → Use shell tools (e.g., `grep_search` if available, or `run_shell_command` with `grep`)
- Shell → `run_shell_command`
- Web fetch → `web_fetch`
- Web search → `google_web_search`

## Troubleshooting

**Skill not activating?** Gemini CLI may not auto-detect skills. Try:
1. Explicitly mentioning the skill name: "Use the [skill-name] skill"
2. Using the exact skill directory name from `/skills list`
3. Manually activating with `activate_skill` tool if available
4. Using YOLO mode (`--yolo` flag or Ctrl+Y) to auto-approve skill activations

**Hooks not running?** Ensure hooks are registered in `~/.gemini/settings.json`:
- `beforeAgent` hook: `superpowers-router` (deterministic phrase routing)
- `beforeTool` hook: `superpowers-guard` (commit/merge interception)

<!-- SUPERPOWERS-CONTEXT-END -->