# Codex Implementer Prompt Template

Use this template when dispatching Codex as the implementer via `codex-bridge.mjs implement`.

The structured output schema (`implementation-output.json`) is enforced by `--output-schema` — Codex MUST return valid JSON matching the contract. Unlike Claude subagents, Codex cannot ask mid-task questions — front-load all context.

```
codex-bridge.mjs implement --write --cd {WORKING_DIR} --prompt @/tmp/sdd-task-N.md
```

Write this to the prompt file:

````markdown
<task>
You are implementing Task {N}: {TASK_NAME}

{FULL_TASK_TEXT}
</task>

<context>
{SCENE_SETTING}

Project structure:
{RELEVANT_FILE_TREE}

Key dependencies and patterns:
{ARCHITECTURAL_CONTEXT}
</context>

<instructions>
1. Implement exactly what the task specifies — nothing more, nothing less
2. Write tests against REAL code — no mocks. Use real databases (SQLite in-memory), real file systems (temp dirs), real modules. Only mock external network calls you cannot control.
3. Follow TDD if the task says to
4. Follow existing codebase patterns and conventions
5. Each file should have one clear responsibility
6. If a file grows beyond the plan's intent, report DONE_WITH_CONCERNS
7. In existing codebases, improve code you touch but don't restructure outside your task

Run all tests and verify they pass before reporting.
</instructions>

<output_fields>
When you report back, fill in every field accurately:
- files_changed: list EVERY file you created or modified, using full absolute paths. Check your work — if you created foo.js and foo.test.js, both must appear here. Do not leave this empty.
- tests: set ran=true if you executed the test runner. Count the actual number of passing and failing tests from the output. Include the raw test runner output in details.
- self_review: summarize what you checked and any concerns.
- concerns: only populate if status is DONE_WITH_CONCERNS.
- questions: only populate if status is NEEDS_CONTEXT.
</output_fields>

<self_review>
Before reporting, review your work:
- Did I fully implement everything in the spec?
- Did I miss any requirements or edge cases?
- Are names clear and accurate?
- Did I avoid overbuilding (YAGNI)?
- Did I only build what was requested?
- Do tests use real code with zero mocks? (only external network calls may be mocked)
- Do tests verify real behavior?
- Did I list ALL files I created or modified in files_changed?
</self_review>

<escalation_policy>
If you cannot complete the task:
- Set status to BLOCKED with a clear blocked_reason
- If you need more information: set status to NEEDS_CONTEXT with specific questions
- If you completed but have doubts: set status to DONE_WITH_CONCERNS with concerns listed
- Bad work is worse than no work — escalate rather than guess
</escalation_policy>
````

## Handling the Response

The bridge returns structured JSON. Map to SDD flow:

| Codex status | SDD action |
|---|---|
| `DONE` | Proceed to spec review |
| `DONE_WITH_CONCERNS` | Read concerns. Correctness issue → re-dispatch with fix instructions. Observation → note and proceed |
| `NEEDS_CONTEXT` | Provide context via `codex-bridge.mjs resume --session-id {SESSION_ID} --prompt "Context: {ANSWERS}"` |
| `BLOCKED` | Assess: context problem → provide it; too complex → break up or switch to Claude; plan wrong → escalate |

## Re-dispatch for Fixes

When spec or quality review finds issues, resume the implementer's Codex thread:

```
codex-bridge.mjs resume --session-id {SESSION_ID} --prompt "Fix these issues from review: {REVIEW_FINDINGS}"
```

The session ID is printed to stderr as `[codex:session] <id>` during the implement run. Capture it to target the correct thread — do NOT use `--last` if reviews ran between implement and fix, as `--last` would resume the reviewer instead.

If the session ID was lost, fall back to a fresh `implement` run with the original task + fix instructions combined.
