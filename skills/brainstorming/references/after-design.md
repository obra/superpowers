# Brainstorming — After the Design

## Documentation

- Write the validated design (spec) to `docs/specs/YYYY-MM-DD-<topic>-design.md`
  - (User preferences for spec location override this default)
- Use elements-of-style:writing-clearly-and-concisely skill if available
- Commit the design document to git

## Spec Self-Review

After writing the spec document, look at it with fresh eyes:

1. **Placeholder scan:** Any "TBD", "TODO", incomplete sections, or vague requirements? Fix them.
2. **Internal consistency:** Do any sections contradict each other? Does the architecture match the feature descriptions?
3. **Scope check:** Is this focused enough for a single implementation plan, or does it need decomposition?
4. **Ambiguity check:** Could any requirement be interpreted two different ways? If so, pick one and make it explicit.

Fix any issues inline. No need to re-review — just fix and move on.

## Codex Spec Review

After the spec self-review passes:

1. Use `codex-bridge.mjs rescue --cd . --prompt @spec-review-prompt.md` for independent spec review
2. Codex reviews the spec independently
3. If Issues Found: fix, re-run Codex review (max 2 iterations)
4. If Approved: proceed to user review
5. Present Codex output verbatim — do not paraphrase or filter

**Critical:** Do NOT tell Codex what your spec review found — reviewer independence. If Codex and your reviews contradict, present both and let user decide.

## User Review Gate

After reviews pass, ask the user to review the written spec:

> "Spec written and committed to `<path>`. Please review it and let me know if you want to make any changes before we start writing out the implementation plan."

Wait for the user's response. If they request changes, make them and re-run the review loop. Only proceed once the user approves.

## Transition to Implementation

- Invoke the writing-plans skill to create a detailed implementation plan
- Do NOT invoke any other skill. writing-plans is the next step.
