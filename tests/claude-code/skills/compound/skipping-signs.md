# Signs of Skipping - Compound Skill

## Red Flags (Critical Violations)

- No capture triggered after "that worked" phrase appears
- Solution doc not created after recognizing non-trivial problem
- Solution doc missing required sections (Symptoms, Failed Attempts, Root Cause, Solution, Prevention)
- Root cause is superficial ("fixed the typo", "moved the variable") without explaining WHY
- Pattern detection not executed (no `ls docs/solutions/` or similar command)

## Rationalization Patterns

- "This was simple, no need to document"
- "The fix is self-explanatory"
- "I'll skip the solution doc since it's a common issue"
- "Let me just acknowledge the fix without documenting"
- "The error message is enough to remember"
- Skipping Failed Attempts section because "it only took one try" (when multiple attempts were actually made)

## Evidence of Non-Compliance

- Trigger phrase "that worked" appears but compound skill not invoked
- Solution document created without all required sections
- Symptoms section missing quoted error message
- Failed Attempts section empty when debugging involved multiple steps
- Root Cause just restates WHAT was changed, not WHY it was wrong
- Prevention section missing or contains only vague advice
- Pattern detection gate mentioned but command not actually executed
- No announcement of solution capture location

## Section Quality Issues

- **Symptoms:** Missing exact error message in quotes
- **Failed Attempts:** Missing description of what was tried before success
- **Root Cause:** Superficial explanation (what changed vs why it was wrong)
- **Solution:** Vague guidance instead of step-by-step instructions
- **Prevention:** Generic advice like "be more careful" instead of actionable items

## Gate Execution Issues

- Solution Quality Gate checklist mentioned but not verified before saving
- Pattern Detection Gate skipped entirely
- Gates appear in output but sections still incomplete
- "STOP CONDITION" ignored despite missing sections
