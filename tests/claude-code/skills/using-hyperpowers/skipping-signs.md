# Signs of Skipping - Using-Hyperpowers Skill

## Red Flags (Critical Violations)

- Response given without checking for applicable skills
- "Let me explore the codebase first" without skill invocation
- "This is straightforward, I'll just..." without skill
- Skill mentioned but not actually invoked (Skill tool not called)
- Code files read before invoking design skill
- Clarifying questions asked before skill check
- Direct implementation discussion without design phase

## Rationalization Patterns

- "This is a simple task, I'll just add the button"
- "Let me first understand the codebase structure"
- "Let me look at the homepage component first"
- "I need context before I can help with this"
- "This is straightforward, no need for brainstorming"
- "Let me check what's on the homepage already"
- "I'll explore the project first"
- "Let me ask some clarifying questions" (before skill check)

## Evidence of Non-Compliance

### Skill Invocation Gate Violations
- No explicit skill check visible in output
- Skill tool not invoked (only mentioned in text)
- Wrong skill identified (e.g., suggesting exploration instead of brainstorming)
- Skill check happens AFTER file reads or exploration
- Skill check happens AFTER clarifying questions

### Pre-Response Check Violations
- Substantive response without skill invocation
- Exploration or code reading before skill check
- Questions about button requirements before skill check
- Implementation discussion before design phase
- Direct jump to "here's how we'll add the button"

### Self-Check Question Violations
- "Simple question" rationalization applied
- "Need context first" rationalization applied
- "Let me explore first" without recognizing this IS a skill trigger
- Assumption that skill doesn't apply without explicit check

## Severity Indicators

**Critical (Automatic FAIL):**
- No skill invocation happens at all
- File reads occur before skill check
- Substantive implementation response without skill
- "Let me explore first" without skill invocation

**Warning (Partial Compliance):**
- Skill mentioned but tool not called
- Skill check happens but wrong skill chosen
- Skill invoked but after some exploration
- Gate mentioned but not visibly executed

## Questions to Ask

When reviewing the session, ask:
1. Did Claude check for applicable skills BEFORE any other action?
2. Was the Skill tool actually invoked (not just mentioned)?
3. Did any file reads happen before skill invocation?
4. Was brainstorming identified as the applicable skill?
5. Was there any rationalization to skip the skill check?
6. Did exploration happen before or after skill invocation?
