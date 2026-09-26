# Antigravity CLI (`agy`) Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On the Antigravity CLI (`agy`) these resolve to the tools below.

| Action skills request | Antigravity CLI equivalent |
|----------------------|----------------------|
| Dispatch a subagent (`Subagent (general-purpose):` template) | `invoke_subagent` with a built-in `TypeName` — `self` for full-capability work, `research` for read-only |
| Task tracking ("create a todo", "mark complete") | a **task artifact** — `write_to_file` with `IsArtifact: true` and `ArtifactType: "task"` (see [Task tracking](#task-tracking)). **Not** `manage_task`, which manages background processes. |
| Ask interactive questions / interview ("ask_question", "clarifying questions") | `ask_question` tool (renders interactive modal with selectable options, default write-in, and `(Recommended)` prefix — see [Interactive questioning](#interactive-questioning)) |

## Interactive questioning

Antigravity provides the `ask_question` tool for interactive questions during skills like `brainstorming`. When called, `ask_question` displays an interactive modal with selectable options and a write-in response box, blocking execution until the user responds.

### The Dual-Surface Pattern & Bottom-Anchored TL;DR

The modal header has limited height and should not be overloaded with long prose. Instead, pair the main chat stream with the modal in the same turn:

1. **Bottom-Anchored TL;DR (Anti-Scrolling Invariant)**: In the chat message, always place the **TL;DR & Recommendation** at the very bottom (immediately above where the modal appears). As long responses stream down, top content scrolls off-screen; placing the summary at the bottom ensures it is immediately visible in the viewport when streaming stops.
2. **Strict Length Budget (No Bombardment)**:
   - **Problem / Finding**: 1–2 sentences explaining what's underspecified or found in code (with file links).
   - **Tradeoffs**: 1-line bullet per option highlighting key pros & cons.
   - **TL;DR & Recommendation**: 1–2 punchy sentences summarizing the core choice and rationale.
3. **Chat Message Format**:
   ```markdown
   ### Decision Context: <Topic Title>

   **Problem / Finding**:
   <1-2 sentences on what's underspecified or found in code. Link relevant files/lines.>

   **Tradeoffs**:
   - **<Option A>**: <1-line pros & cons>
   - **<Option B>**: <1-line pros & cons>

   ---
   💡 **TL;DR & Recommendation**:
   <1-2 punchy sentences summarizing the core choice and why the (Recommended) path was chosen.>
   ```
4. **Modal Formatting**:
   - Keep the modal `question` to a concise single sentence (<120 characters) ending with `(see chat for details)`.
   - Provide 2–4 options formatted as user responses with a short tag + 1-line rationale.
   - Prefix the first option with `(Recommended)`.
   - Do NOT include an "Other" option (the UI modal provides a write-in box by default).
   - Do NOT enumerate options (the UI modal enumerates them automatically).
   - Set `is_multi_select: true` only when multiple selections make sense, otherwise `false`.
5. **Codebase First & One at a Time**:
   - Walk down each branch of the design tree, resolving dependencies between decisions one-by-one.
   - If a question can be answered by exploring the codebase, explore the codebase instead of asking.


## Task tracking

Antigravity has **no todo tool** (`manage_task` manages background
processes — `list`/`kill`/`status`/`send_input` — it is *not* a checklist). When a
skill says to create a todo list or track tasks, maintain a **task artifact**: a
markdown checklist saved with `write_to_file` (`IsArtifact: true`,
`ArtifactMetadata.ArtifactType: "task"`), edited with `replace_file_content` /
`multi_replace_file_content` as you go.

At the start of any multi-step task, create the task artifact listing every step of
your plan. As you complete each step, edit the artifact to mark it done (`- [x]`).
If the plan changes, update the checklist. Keep it current — it is your source of
truth for what remains; once the conversation gets long, re-read it before starting
each step.
