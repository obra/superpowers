# Llama Planner Delegation Template

Use this template in the `writing-plans` skill, after Claude has produced the Scope
Check, the File Structure map, and the task-list outline (which tasks exist, in what
order). Those decomposition decisions are locked in by Claude. The planner expands
that outline into the full plan body. Delegate via `mcp__llama-mcp__delegate_to_llama`.

## Persona Preamble (prepend verbatim into the `task` string)

> You are an implementation planner. The task decomposition is already decided — the
> list of tasks, their order, and which files each touches are fixed. Do not add,
> remove, reorder, or merge tasks. Your job is to expand each task in the outline into
> the bite-sized step structure: the failing-test step, the run-it step, the
> minimal-implementation step with real code, the verify step, and the commit step.
> Every code step must contain actual, complete code — never "TBD", never "add error
> handling", never "similar to Task N". Use exact file paths and exact commands with
> expected output.

## Brief Preparation (do this before delegating)

1. **Paste the spec** — the planner needs the full spec text to write accurate code blocks.
2. **Paste the File Structure map** — every file to create or modify and its responsibility.
3. **Paste the task-list outline** — each task title, its order, the files it touches,
   and any per-task notes you have already decided.
4. **State the plan file path and the required plan header** —
   `docs/superpowers/plans/YYYY-MM-DD-<feature>.md` plus the plan header block from
   the writing-plans skill.
5. **Name the conventions** — test framework, run commands, and commit-message style,
   so generated steps match the codebase.

## Delegation Call

```
mcp__llama-mcp__delegate_to_llama:
  task: |
    [PERSONA PREAMBLE — paste verbatim from above]

    ## Write this implementation plan

    Write the plan to `<exact plan path>`, starting with the required header block below.

    ## Required plan header

    [The exact header block from the writing-plans skill, filled in]

    ## Spec (full text)

    [Paste the full spec]

    ## File Structure map

    [Every file to create/modify and its responsibility]

    ## Task-list outline

    [Each task: title, order, files touched, per-task notes]

    ## Conventions

    [Test framework, run commands, commit-message style]

    ## Done when

    The plan file exists at the path above, every task from the outline is expanded
    into bite-sized steps with complete code blocks, and there are no placeholders.

    ## On completion

    Reply with a concise summary: the file you wrote and the list of tasks it contains.

  working_dir: [absolute path — project root]
  context_hints:
    - [an existing plan under docs/superpowers/plans/ as a format reference, if one exists]
```

## After Delegation

Inspect the response fields (`result`, `files_changed`, `commands_run`, `stop_reason`,
`transcript_path`) exactly as described in
`subagent-driven-development/implementer-prompt.md` → "After Delegation". Handle
`stop_reason` per the shared mapping in `subagent-driven-development/SKILL.md` →
"Handling Llama stop_reason". For this prose persona, a budget-hit means re-delegating
the plan task-by-task rather than escalating immediately.

Then run the writing-plans Self-Review yourself on Llama's plan — spec coverage,
placeholder scan, type consistency, implementer fit. If you find issues, re-delegate a
focused fix or fix them inline.