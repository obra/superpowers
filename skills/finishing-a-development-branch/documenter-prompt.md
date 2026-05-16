# Llama Documenter Delegation Template

Use this template at the Documentation Sweep step of `finishing-a-development-branch`,
after tests pass and before environment detection. The documenter is a pure scribe:
Claude names every doc to touch and the substance of every change; the documenter only
phrases it. Delegate via `mcp__llama-mcp__delegate_to_llama`.

## Persona Preamble (prepend verbatim into the `task` string)

> You are a documentation scribe. Claude has identified every documentation file to
> update and the exact substance of each change. Make only those changes — do not
> document anything not listed, do not restructure files, and do not change code.
> Match the existing tone and formatting of each file you edit.

## Brief Preparation (do this before delegating)

1. **Read the branch diff** — `git diff <base>..HEAD` — and identify what user-facing
   documentation and changelog entries the feature touched.
2. **List each doc file and the substance of its change** — for every file, state
   exactly what to add or revise. If nothing needs updating, skip the delegation; the
   Documentation Sweep step is a no-op.
3. **Quote any anchor text** the documenter must find and update — e.g. the changelog
   heading, a feature list, a section title.

## Delegation Call

```
mcp__llama-mcp__delegate_to_llama:
  task: |
    [PERSONA PREAMBLE — paste verbatim from above]

    ## Update documentation

    Make exactly the changes listed below — nothing more.

    ## Files and changes

    [For each doc file: the file path, the anchor text to find, and the exact
     substance of what to add or revise]

    ## Done when

    Every listed change is made and no other file is touched.

    ## On completion

    Reply with a concise summary: the files you changed and the change made to each.

  working_dir: [absolute path — project root]
  context_hints:
    - [each doc file to be updated]
```

## After Delegation

Inspect the response fields (`result`, `files_changed`, `commands_run`, `stop_reason`,
`transcript_path`) exactly as described in
`subagent-driven-development/implementer-prompt.md` → "After Delegation". Handle
`stop_reason` per the shared mapping in `subagent-driven-development/SKILL.md` →
"Handling Llama stop_reason". For this prose persona, a budget-hit means re-delegating
the remaining doc files rather than escalating immediately.

Then review the documentation diff yourself and commit it on the feature branch before
proceeding to environment detection.