# Pi Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On Pi these resolve to the tools below.

| Action skills request | Pi equivalent |
| --- | --- |
| Dispatch a subagent (`Subagent (general-purpose):` template) | Use an installed subagent tool such as `subagent` from `pi-subagents` if available |
| Task tracking ("create a todo", "mark complete") | Use an installed todo/task tool if available, otherwise track tasks in the plan or `TODO.md` |

## Subagents

Pi core does not ship a standard subagent tool. The `pi-subagents` package is a strong optional companion and provides a `subagent` tool with single-agent, chain, parallel, async, forked-context, and resume/status workflows. If no subagent tool is available, do not fabricate `Task` calls; execute sequentially in the current session or explain that the optional subagent capability is not installed.

## Task lists

Pi core does not ship a standard task-list tool. If a todo/task extension is installed, use its documented tool. Otherwise use Superpowers plan files, checklists in Markdown, or a repo-local `TODO.md` for task tracking. Older Superpowers docs may refer to `TodoWrite`; treat that as the task-tracking action above.

## When the subagent extension is installed

If `~/.pi/agent/extensions/subagent/` is set up (per Pi's official `examples/extensions/subagent/` plus the user-level `~/.pi/agent/agents/*.md` definitions), the `subagent` tool is loaded automatically. Dispatch with:

- Single: `subagent({ agent: "scout", task: "..." })`
- Parallel: `subagent({ tasks: [...] })` (max 8 tasks, 4 concurrent)
- Chain: `subagent({ chain: [{ agent, task: "... {previous} ..." }, ...] })` — `{previous}` carries the previous step's output

Agent definitions are markdown files with YAML frontmatter (`name`, `description`, `tools`, `model`, `systemPrompt`). They live at `~/.pi/agent/agents/*.md` (user-level, always loaded). Project-level agents under `.pi/agents/*.md` require `agentScope: "both"` or `"project"`. Default sample agents shipped with the extension: `scout` (fast recon), `planner` (writes plans), `reviewer` (read-only review), `worker` (full capabilities). To run an agent on a different model than the host session, set its `model:` field.

Workflow prompts (`/implement`, `/scout-and-plan`, `/implement-and-review`) live in `~/.pi/agent/prompts/*.md` and trigger the chain pattern.
