# Llama Feature Designer Delegation Template

Use this template at step 6 of the `brainstorming` skill ("Write design doc"), after
the design has been approved with the user (step 5). Every design decision is already
made; the feature designer's job is to turn the approved design into a well-structured
spec document. Delegate via the `mcp__llama-mcp__delegate_to_llama` MCP tool.

## Persona Preamble (prepend verbatim into the `task` string)

> You are a feature designer. You are writing a design specification document from a
> complete set of decisions that have already been made and approved. Every design
> question is settled — do not invent requirements, change scope, or add features.
> You have latitude on how to structure the document and how to word it: organize the
> sections clearly, write in plain technical prose, and make the spec easy to read.
> If something is genuinely missing or contradictory, note it explicitly at the end
> under "Open questions for Claude" rather than guessing.

## Brief Preparation (do this before delegating)

1. **Collect every approved design section** — architecture, components, data flow,
   error handling, testing, non-goals. Paste the full substance of each into the
   `task` string. The feature designer must not have to reconstruct decisions.
2. **List the resolved decisions and tradeoffs** — for each significant choice, state
   what was chosen and what was rejected, so the spec records the reasoning.
3. **State the exact spec file path** — `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.
4. **Provide the metadata** — date, author, status line.

## Delegation Call

```
mcp__llama-mcp__delegate_to_llama:
  task: |
    [PERSONA PREAMBLE — paste verbatim from above]

    ## Write this spec document

    Write the design specification to `<exact spec path>`.

    ## Approved design (full substance)

    [Every approved section, with all decisions inline]

    ## Resolved decisions and tradeoffs

    [Each choice: what was chosen, what was rejected, why]

    ## Document metadata

    Date / Author / Status: [values]

    ## Done when

    The spec file exists at the path above, covers every section listed, contains no
    "TBD"/"TODO"/placeholder text, and records the resolved decisions. No code is written.

    ## On completion

    Reply with a concise summary: the file you wrote, the sections it contains, and
    anything you flagged under "Open questions for Claude".

  working_dir: [absolute path — project root]
  context_hints:
    - [an existing spec under docs/superpowers/specs/ as a format reference, if one exists]
```

## After Delegation

Inspect the response fields (`result`, `files_changed`, `commands_run`, `stop_reason`,
`transcript_path`) exactly as described in
`subagent-driven-development/implementer-prompt.md` → "After Delegation". Handle
`stop_reason` per the shared mapping in `subagent-driven-development/SKILL.md` →
"Handling Llama stop_reason". For this prose persona, a budget-hit
(`max_steps`/`timeout`/`token_limit`) means re-delegating the spec section-by-section
rather than escalating immediately.

Then run brainstorming step 7 (spec self-review) yourself on Llama's draft — the
placeholder, consistency, scope, and ambiguity checks. If you find issues, re-delegate
a focused fix or fix them inline.
