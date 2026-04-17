/**
 * Returns a Markdown string that maps Claude Code tool names used in skills
 * to their VS Code / MCP equivalents.
 * This is appended to every skill response so the agent knows what to call.
 */
export function getVSCodeToolMapping(): string {
  return `
---

## VS Code / MCP Tool Mapping

When skills reference these tool names, use the VS Code/MCP equivalents:

| Skill references | VS Code / MCP equivalent |
|---|---|
| \`Read\` (file reading) | Read files from the workspace using your native tools |
| \`Write\` (file creation) | Create/edit workspace files using your native tools |
| \`Edit\` (file editing) | Apply edits to open files using your native tools |
| \`Bash\` (run commands) | Use the VS Code integrated terminal |
| \`Grep\` (search content) | Use VS Code workspace search |
| \`Glob\` (find files) | Use VS Code file search |
| \`TodoWrite\` (task tracking) | Output numbered task lists in Markdown |
| \`Skill\` tool (invoke skill) | Call the \`activate_skill\` MCP tool |
| \`Task\` (subagent dispatch) | Not available — execute tasks sequentially |
`.trim();
}
