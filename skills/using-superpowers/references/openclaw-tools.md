# OpenClaw tool mapping

When a Superpowers skill names an action, use the corresponding OpenClaw tool available in this session:

| Action | OpenClaw equivalent |
| --- | --- |
| Invoke a skill | Read its full `skills/<name>/SKILL.md` with `read` before acting. For example, read `skills/brainstorming/SKILL.md` when brainstorming applies. OpenClaw lists eligible skills and their paths in the session prompt. There is no built-in `Skill` call to invent. |
| Read, create, or edit files | `read`, `write`, `edit`, or `apply_patch` when available |
| Run shell commands and tests | `exec`; use `process` for a running command |
| Search or fetch the web | `web_search` and `web_fetch` when available |
| Dispatch a subagent | `sessions_spawn` when available and permitted by session policy; otherwise work in this session or explain the limitation |
| Track tasks | Use a plan file or repo-local `TODO.md` unless a task tool is actually available |

Use the skill path shown by OpenClaw's skill catalog. The relative examples above describe the bundled Superpowers tree; do not assume the current workspace contains that tree.
