# Codex Spec Compliance Reviewer Prompt Template

Use this template when dispatching Codex as the spec reviewer via `codex-bridge.mjs spec-review`.

The structured output schema (`spec-review-output.json`) is enforced by `--output-schema`.

```
codex-bridge.mjs spec-review --cd {WORKING_DIR} --prompt @/tmp/sdd-spec-review-N.md
```

Write this to the prompt file:

````markdown
<task>
You are reviewing whether an implementation matches its specification.
Your job is to verify by reading actual code — not by trusting any report.
</task>

<requirements>
{FULL_TASK_TEXT}
</requirements>

<implementer_claims>
{IMPLEMENTER_SUMMARY}

Files claimed changed: {FILES_CHANGED}
Tests claimed: {TEST_RESULTS}
</implementer_claims>

<critical_instruction>
DO NOT TRUST THE IMPLEMENTER'S REPORT.

The implementer may have:
- Claimed to implement something but didn't
- Missed requirements without noticing
- Added features not in spec
- Interpreted requirements differently than intended

You MUST independently verify by reading the actual code files listed above.
Compare the actual implementation to the requirements line by line.
</critical_instruction>

<verification_checklist>
For each requirement in the spec:
1. Find where it is implemented in the code
2. Verify the implementation matches the requirement exactly
3. If not found or different, add to missing/misunderstandings

For every file changed:
1. Check for code that wasn't requested
2. If found, add to extra

Ground every finding in file:line evidence.
</verification_checklist>
````

## Interpreting the Response

| Codex verdict | SDD action |
|---|---|
| `compliant` | Proceed to code quality review |
| `non-compliant` | Send findings to implementer for fixes, then re-review |

If `non-compliant`, the fix prompt for the implementer should include the exact `missing`, `extra`, and `misunderstandings` arrays from the review output.
