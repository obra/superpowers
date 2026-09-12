# Prime Agent Tool Mapping

Skills speak in actions. On Prime Agent, those actions begin in the persistent Python REPL exposed through `ipython`.

| Action skills request | Prime Agent equivalent |
| --- | --- |
| Invoke a skill | Inspect the listed skill's current `SKILL.md` through `ipython`; a human can use `/skill:name` |
| Read, create, search, or edit files; run commands | Use Python and `pathlib` through `ipython`; use `await edit(...)` for targeted edits and the preloaded `bash(...)` helper for project commands |
| Dispatch a subagent (`Subagent (general-purpose):` template) | Use `await rlm(...)`, then receive results through `agent_message` or a named result file |
| Task tracking ("create a todo", "mark complete") | Track state in the plan, the Superpowers SDD ledger, or a repo-local `TODO.md` |

## Skills and tools

Prime Agent includes each visible skill's name, description, and `SKILL.md` location in the system prompt. Inspect that file before following a matching skill. For Python-backed skills, call the documented pre-imported module API.

Machine work goes through `ipython`. Use Python for file operations, the preloaded `await edit(...)` skill for exact existing-file edits, and the preloaded `bash(...)` helper for shell commands. Do not invent direct `read`, `write`, `Task`, or `TodoWrite` calls.

## Subagents

`await rlm(...)` admits a child and returns a handle immediately; it never returns the child's eventual answer. Tell a child whose result you need to reply with `await agent_message.send(message, receiver_role="parent")` or to write a named result file. Use `agent_message` for follow-ups and `agent_observe` for bounded inspection.

Admit independent children without waiting between calls. Continue useful work or end the turn while they run. Never poll with `sleep` or a long blocking await. Use an exact model selector returned by `await rlm.find_models(...)`, or omit `model` to inherit the parent model.

## Task lists

Prime Agent has no built-in todo tool. Use the plan, the Superpowers SDD ledger, or a repo-local `TODO.md`. Do not use the `goal` skill as a todo substitute unless the human explicitly requested a persistent goal.
