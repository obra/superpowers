# Claude Code Tool Mapping

Use this reference when translating skill instructions into Claude Code behavior.

| Skill instruction | Claude Code behavior |
|-------------------|----------------------|
| Invoke or load a skill | Use the `Skill` tool. |
| Dispatch a subagent or task | Use the local subagent/task mechanism. |
| Create or update a todo | Use the local todo mechanism. |
| Read, edit, or search files | Use the appropriate file and shell tools. |
| Ask the user, present multiple-choice options, ask conversationally, present text options, or use the terminal | Render the question and any A/B/C/D choices as plain conversational terminal text. Do not use `AskUserQuestion`. |

`AskUserQuestion` is not the default mapping for user questions. Only use a native interactive prompt or picker when a skill explicitly asks for that modality.
