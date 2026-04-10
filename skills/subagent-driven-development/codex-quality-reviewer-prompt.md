# Codex Code Quality Reviewer Prompt Template

Use this template when dispatching Codex as the quality reviewer via `codex-bridge.mjs review`.

The structured output schema (`quality-review-output.json`) is enforced by `--output-schema`.

**Only dispatch after spec compliance review passes.**

```
codex-bridge.mjs review --cd {WORKING_DIR} --prompt @/tmp/sdd-quality-review-N.md
```

Write this to the prompt file:

````markdown
<task>
You are performing a code quality review of Task {N}: {TASK_NAME}.
The implementation has already passed spec compliance — your job is to verify
it is well-built: clean, tested, maintainable, and secure.
</task>

<change_context>
What was implemented: {WHAT_WAS_IMPLEMENTED}
Plan/requirements: {PLAN_OR_REQUIREMENTS}

Review the git diff between commits:
  Base: {BASE_SHA}
  Head: {HEAD_SHA}

Run: git diff {BASE_SHA}..{HEAD_SHA}
</change_context>

<review_criteria>
Architecture and design:
- SOLID principles and established patterns
- Proper separation of concerns and loose coupling
- Integration with existing systems
- Each file has one clear responsibility with well-defined interface

Code quality:
- Proper error handling and type safety
- Code organization, naming conventions, maintainability
- No security vulnerabilities (injection, XSS, OWASP top 10)
- No performance issues

Testing:
- Test coverage and quality
- Tests use real code — flag any mock that isn't an external network boundary
- Tests verify real behavior, not mock behavior
- Edge cases covered

This change specifically:
- Are units decomposed for independent understanding and testing?
- Does implementation follow the file structure from the plan?
- Did this change create or significantly grow files? (Don't flag pre-existing sizes)
</review_criteria>

<grounding_rules>
Every issue must reference a specific file and line range.
Do not flag hypothetical problems — only real issues visible in the diff.
Severity guide:
- critical: blocks merge, breaks correctness or security
- important: should fix before proceeding, tech debt or bug risk
- minor: suggestion, style, could be better
</grounding_rules>
````

## Interpreting the Response

| Codex verdict | SDD action |
|---|---|
| `approve` | Mark task complete, proceed to next task |
| `needs-attention` | Check severity of issues |

Issue handling:
- **critical**: Must fix before proceeding. Resume Codex implementer with fix instructions
- **important**: Should fix. Resume Codex implementer
- **minor**: Note for later, can proceed

After fixes, re-run quality review to confirm resolution.
