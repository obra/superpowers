Read `prompts/analyst-common.md` first; it gives your role, inputs,
context-safety rules, and the return format. This file adds the dimension.

Dimension: Plan adherence

Recover the plan the session agreed to, then map each plan step to what
happened. "Plan" here means any agreed course of action, not git commits.

1. Find the agreed plan: a design or plan agreed in chat (look for the
   assistant text preceding a human "yes/ok/go ahead"), a spec or plan file
   written during the session (tool calls that write under `docs/`,
   `plans/`, `specs/`, or any file the human named), a todo-list record whose
   meaning was established in the case file, or any numbered checklist in
   assistant text. Quote each plan step with its `path:line`.
2. Mark structural events between the plan and its execution: compaction
   events identified during discovery, resumes, aborted turns, and associated
   session dispatches. Note their line numbers; plan drift right after one of
   these is a distinct finding.
3. For each plan step, find the tool calls and assistant text that
   executed it, or establish that none did. Report:
   - steps skipped (no execution found; quote the plan step);
   - steps executed out of order (line numbers show the order);
   - steps silently changed (execution differs from the plan step in a
     way the assistant never announced; quote both);
   - steps invented (work done that no plan step covers);
   - drift immediately after a structural event (cite the event line and
     the first divergent action).
4. If there is no recoverable plan, say so as the only finding, with
   the lines you checked.
