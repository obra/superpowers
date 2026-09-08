Read `prompts/analyst-common.md` first; it gives your role, inputs,
context-safety rules, and the return format. This file adds the dimension.

Dimension: Plan adherence

Recover what the session committed to, then map each commitment to what
happened.

1. Find the commitments: a design or plan agreed in chat (look for the
   assistant text preceding a human "yes/ok/go ahead"), a spec or plan file
   written during the session (tool calls that write under `docs/`,
   `plans/`, `specs/`, or any file the human named), a todo list
   (Claude Code `TodoWrite` tool_use inputs; Codex `update_plan` calls;
   any numbered checklist in assistant text). Quote each commitment with
   its `path:line`.
2. Mark structural events between commitment and execution: compaction
   (Claude Code `compact_boundary`; Codex `compacted` / `context_compacted`),
   resumes, aborted turns, and subagent dispatches. Note their line
   numbers; plan drift right after one of these is a distinct finding.
3. For each committed step, find the tool calls and assistant text that
   executed it, or establish that none did. Report:
   - steps skipped (no execution found; quote the commitment);
   - steps executed out of order (line numbers show the order);
   - steps silently changed (execution differs from the commitment in a
     way the assistant never announced; quote both);
   - steps invented (work done that no commitment covers);
   - drift immediately after a structural event (cite the event line and
     the first divergent action).
4. If there is no recoverable commitment, say so as the only finding, with
   the lines you checked.
