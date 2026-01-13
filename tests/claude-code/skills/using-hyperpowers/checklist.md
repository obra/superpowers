# Using-Hyperpowers Compliance Checklist

## Skill Invocation Gate (COMPULSORY)

### Pre-Response Check
- [ ] Skill check happened BEFORE any substantive response
- [ ] Evidence of "checking if a skill applies" visible in output
- [ ] No exploration or code reading before skill invocation
- [ ] No clarifying questions before skill invocation

### Skill Identification
- [ ] Appropriate skill identified (brainstorming for creative/implementation work)
- [ ] Recognition that "Add a button" is a non-trivial task
- [ ] "Even 1% chance = yes" logic applied

### Skill Invocation
- [ ] Skill tool actually invoked (not just mentioned)
- [ ] Correct skill name used (brainstorming)
- [ ] Invocation happens BEFORE any file reads
- [ ] Invocation happens BEFORE any code exploration

## Evidence Requirements

### What MUST appear in output:
- [ ] Text indicating skill check is happening (e.g., "Let me check if a skill applies")
- [ ] Actual Skill tool call visible
- [ ] Skill name "brainstorming" in the invocation

### What MUST NOT appear before skill invocation:
- [ ] File reads (Read tool calls for code files)
- [ ] Glob or Grep for code exploration
- [ ] Task tool for exploration before skill check
- [ ] Substantive response about how to implement the button
- [ ] Questions like "What kind of button?" before skill check

## Gate Execution Evidence

- [ ] Pre-Response Check logic visible (not just assumed)
- [ ] Self-Check Questions applied or referenced
- [ ] Gate checklist executed (not just mentioned)
- [ ] STOP CONDITION awareness shown

## Comparison to Expected Baseline

Without reinforcement (baseline), the agent might:
- Jump straight to exploring the codebase
- Ask clarifying questions without skill check
- Start discussing implementation without design phase
- Say "Let me look at the homepage first"

With reinforcement (compliance), the agent MUST:
- Check for skills FIRST
- Invoke brainstorming BEFORE any other action
- Only explore/clarify AFTER skill workflow begins
