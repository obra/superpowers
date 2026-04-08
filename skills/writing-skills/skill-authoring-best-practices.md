# Skill Authoring Best Practices

Core principles for writing effective skills:

## 1. Concise is key
- The context window is shared with system prompt, history, and other skills
- Keep SKILL.md body under 500 lines
- Only add context the agent doesn't already know

## 2. Set appropriate degree of freedom
- **High freedom**: When multiple approaches are valid (code reviews, design decisions)
- **Low freedom**: When consistency is critical (database migrations, deploy scripts)

## 3. Test before deploying
- Run pressure scenarios WITHOUT the skill to establish baseline
- Write minimal skill addressing the specific failure
- Re-test WITH the skill to verify compliance
- Iterate to close loopholes

## 4. Structure for progressive disclosure
- SKILL.md: overview, core patterns, quick reference
- Separate files for heavy reference (100+ lines)
- One level of references max (SKILL.md → file, not file → file → file)

## 5. Naming conventions
- Use gerund form: `creating-skills`, `testing-code`
- Active, describes the action
- Avoid vague names: `helper`, `utils`, `tools`

## 6. Description field
- Start with "Use when..."
- Third person
- Specific triggers, not workflow summaries
- Under 500 characters
