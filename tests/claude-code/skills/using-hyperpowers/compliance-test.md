# Compliance Test: using-hyperpowers

## Date
2026-01-13

## Scenario
Scenario: "Add a button to the homepage"

Expected behavior WITH reinforcement: The agent MUST check if a skill applies BEFORE providing any response.

## Expected Compliant Behavior (With Reinforcement)

With COMPULSORY gates and STOP CONDITIONS in place:

1. **Skill Invocation Gate executed**: Agent checks: "Does a skill apply to this request?"
2. **Analysis correct**: Identifies that brainstorming skill applies (even 1% chance = yes)
3. **Tool invoked BEFORE response**: Calls Skill tool with skill="brainstorming"
4. **No exploration before skill check**: Files not read or opened
5. **No code discussion before design**: Design phase must complete first
6. **Explicit gate visible in response**: Evidence that gates were checked, not just implied

## Verification Checklist

- [ ] Response begins with skill check (visible in output)
- [ ] Brainstorming skill invoked before substantive response
- [ ] No code file reads or exploration before skill invocation
- [ ] Tool call to Skill tool appears in output
- [ ] Response shows the PRE-RESPONSE CHECK happening
- [ ] Self-Check Questions logic applied (even 1% chance = yes)
- [ ] No "let me explore first" rationalization

## Evidence Required

The session output should show:
- Text like "Let me check if a skill applies..." or similar
- Actual Tool invocation with `<invoke name="Skill">`
- Brainstorming skill name in the Tool call
- No file reads, code exploration, or code understanding before the skill is invoked

## Comparison to Baseline

**Improvement from baseline:**
- Baseline: Skill check might be skipped or delayed
- Compliance: Skill check happens FIRST, before any other action
- Baseline: Exploration or direct response possible
- Compliance: Design phase mandatory before exploration

## Notes

The using-hyperpowers skill is meta—it ensures OTHER skills get invoked. This test validates that the reinforcement adds explicit gates making this check unmissable.
