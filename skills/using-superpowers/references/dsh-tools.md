# DeepSeek Harness (dsh) Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On the DeepSeek Harness these resolve to the tools below. The full mapping for the deltas is inlined in the `superpowers:bootstrap` system-prompt section the plugin registers; keep the two in sync.

| Action skills request | DeepSeek Harness equivalent |
| --- | --- |
| Read a file | `read` (`file_path`; returns line-numbered text) |
| Create a file | `write` (full replacement) |
| Edit a file | `edit` (literal `old_string`/`new_string`; set `replace_all` when the match repeats) |
| Delete a file | `bash` with `rm` (or `pwsh` `Remove-Item` on Windows) |
| Run a shell command | `bash` on macOS/Linux, `pwsh` on Windows (fresh shell per call; pass `workdir`; set `run_in_background: true` for long work, then `job_output` / `job_kill` / `job_list`) |
| Search file contents | `grep` (ripgrep syntax) |
| Find files by name | `glob` |
| Fetch a URL / web search | `web_fetch` / `web_search` |
| Invoke a skill | `skill` with the exact skill name from the session skill catalog. Catalog names are plain (`brainstorming`), never the `superpowers:`-prefixed forms used in skill prose. |
| Dispatch a subagent | `subagent` (standalone prompt; background by default) or `subagent_fork` (inherits this conversation). There are NO named subagent types — put the role and instructions in the prompt itself. Delegation depth is 1 (subagents cannot spawn subagents), and per-subagent `model`/`provider` selection is off by default unless enabled in Host settings. `send_message` and `list_agents` address live agents only (finished subagent IDs fail with `TEAM_MEMBER_NOT_FOUND`) — for follow-up rounds, dispatch a fresh `subagent` with the brief, previous report, and findings as files. Stop a running one with `interrupt_agent`. Large multi-agent orchestration → `workflow`. Fresh-agent iteration loops → `ralph` (only when the human asks for them). |
| Create / update todos | `todo_write` (send the ENTIRE list every call — it replaces the previous list) |
| Ask the human partner | `ask_user_question` |
| Long-running objectives | `create_goal` / `get_goal` / `update_goal` |
| Plan mode | `exit_plan_mode` (present the complete plan as markdown; implement only after approval) |

## Skills

dsh has a native skill system: a `skill` tool plus a layered registry. This plugin reads every `skills/*/SKILL.md` at load time and registers it through `ctx.skills`, so each skill appears in the session skill catalog under its plain frontmatter name. Always load skills through the `skill` tool — do not read `SKILL.md` files directly.

## Bootstrap

dsh has no session-start shell hook. The plugin instead registers the `using-superpowers` body as an ordered system-prompt section, which dsh reassembles before every model step — so the bootstrap is present from the first request and after compaction with no per-session opt-in. The inline tool mapping for the deltas below is part of that section.

## Subagents

- **Prompt-only (no named types):** There is no subagent-type parameter. Write the role and full instructions into the `subagent` prompt itself, and pass any context the child needs, because a plain `subagent` sees none of this conversation. Skills that dispatch typed subagents (e.g. `dispatching-parallel-agents`, `subagent-driven-development`) must translate each type into an equivalent prompt preamble. `subagent_fork` is the variant that inherits this conversation.
- **Follow-ups after completion:** Both tools are background-first and results arrive as notices. However, `send_message` and `list_agents` only address live agents (or active teammates when the agent-team bundle is installed); sending to a finished subagent's ID fails with `TEAM_MEMBER_NOT_FOUND`, and finished subagents disappear from `list_agents`. For a follow-up round (such as SDD's "resume the implementer"), dispatch a fresh `subagent` with the brief, its previous report, and the findings passed as files.
- **Delegation depth is 1:** Enforced by dsh (`subagent depth 2 exceeds maxDepth 1`). A subagent cannot dispatch its own subagents; state this constraint in implementer and reviewer briefs.
- **Per-subagent model selection:** `subagent` accepts `provider` and `model` only when the Host's subagent model selection setting is enabled (disabled by default in `@deepseek-ai/dsh-tool-subagent`). When disabled, every child runs on the session's model; do not assume a different model tier unless that setting is active.

## Windows shell and sandbox notes

- **Shell tool (`pwsh`) and Git Bash:** On Windows, dsh's shell tool is `pwsh`. Running bundled bash helper scripts has two pitfalls:
  - *Inside the `workspace-write` sandbox:* MSYS `bash.exe` fails at startup with `NtCreateDirectoryObject … 0xC0000022`, regardless of which `bash.exe` is chosen. Apply the script's work directly in PowerShell, or ask the human partner to run it outside the sandbox.
  - *Outside the sandbox:* `Git\usr\bin\bash.exe` started from `pwsh` lacks `/usr/bin` on its `PATH` (so scripts fail with `basename: command not found`). Use `Git\bin\bash.exe` instead; `git --exec-path` locates Git's root regardless of which `git.exe` is first on `PATH`.
- **`node --test` inside the Windows sandbox:** Default test isolation spawns child processes with piped stdio, which the Windows sandbox blocks with `spawn EPERM`. Run in-process with `--test-isolation=none` (Node 22: `--experimental-test-isolation=none`) before requesting sandbox escalation.

## Task lists

Use `todo_write`. It replaces the entire list on every call — resend all items, not a delta. Older Superpowers docs may refer to `TodoWrite`; treat that as this action.

## Plan mode

dsh plan mode uses `exit_plan_mode`: present the complete plan as markdown in that single tool call and implement only after approval. Brainstorming still comes first — the `using-superpowers` rule ("before entering plan mode, invoke brainstorming") applies unchanged.
