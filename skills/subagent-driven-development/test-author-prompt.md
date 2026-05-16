# Llama Test Author Delegation Template

Use this template in the per-task loop of `subagent-driven-development`, immediately
before the implementer delegation. The test author writes the failing test(s) for a
task; the implementer (the next delegation) makes them pass. Delegate via
`mcp__llama-mcp__delegate_to_llama`.

## Persona Preamble (prepend verbatim into the `task` string)

> You are a test author. Write failing tests only — do not write any implementation
> code. Claude has named the exact behaviors and edge cases to cover; write one clear,
> idiomatic test per behavior. The tests must fail because the implementation does not
> exist yet, not because of syntax or import errors. Do not stub or implement the code
> under test.

## Brief Preparation (do this before delegating)

1. **List the behaviors and edge cases** the task's tests must cover — name each one
   concretely.
2. **Name the test file path and the framework** — exact path, test runner, and
   assertion style.
3. **Provide the interface under test** — the function/class signature the tests will
   call, as decided in the plan, so the tests call it correctly.
4. **Apply the right-size check** from `subagent-driven-development/SKILL.md` →
   "Right-Sizing Before Delegating" before delegating.

## Delegation Call

```
mcp__llama-mcp__delegate_to_llama:
  task: |
    [PERSONA PREAMBLE — paste verbatim from above]

    ## Write failing tests

    Write tests to `<exact test file path>`. Write failing tests only — no implementation.

    ## Behaviors and edge cases to cover

    [Each behavior named concretely]

    ## Interface under test

    [The signature(s) the tests will call]

    ## Conventions

    [Test runner, assertion style]

    ## Done when

    The test file exists, contains one test per named behavior, and the tests fail
    because the implementation does not exist yet. No implementation code is written.

    ## On completion

    Reply with a concise summary: the test file you wrote, the tests it contains, and
    the command to run them.

  working_dir: [absolute path — project root]
  context_hints:
    - [the file the implementation will live in, if it exists]
    - [an existing test file as a format reference]
```

## After Delegation

Inspect the response fields (`result`, `files_changed`, `commands_run`, `stop_reason`,
`transcript_path`) exactly as described in `./implementer-prompt.md` → "After
Delegation". Handle `stop_reason` per the shared mapping in `./SKILL.md` → "Handling
Llama stop_reason".

Then run the tests yourself and confirm they fail for the right reason — the
implementation is missing, not a syntax or import error. If they pass, compile-error,
or fail wrongly, re-delegate a focused fix (see "Fix-loop context discipline" in
`./SKILL.md`). Only once the tests fail correctly, proceed to the implementer
delegation (`./implementer-prompt.md`).