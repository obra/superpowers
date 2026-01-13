# Signs of Skipping: subagent-driven-development

## Red Flags (Critical Violations)

### Context Curation Failures
- Implementer told to "see plan file" or "read the plan" instead of full text
- File path reference without actual task content
- Missing structured handoff format (no Task:/Files:/Context:/Constraints: structure)
- Prior task decisions not carried forward to subsequent tasks

### Handoff Consumption Failures
- Implementer starts work without acknowledging context
- No "Received context for: [task]" statement
- Implementer says "I'll read the plan file" instead of using provided context
- Files modified without first referencing them from handoff
- Implementer asks "what files should I work on?" (context wasn't consumed)

### Review Sequence Violations
- Code Quality Review before Spec Compliance Review (WRONG ORDER)
- Reviews done in parallel instead of sequential
- Only one review type done (missing either Spec or Quality)
- Reviews mentioned but verdict not shown
- Review step skipped entirely with "I'll review later"

### Task Completion Violations
- Task marked complete without both reviews approved
- TodoWrite updated before reviews pass
- Moving to next task while current task has open review issues
- "Task complete" announced without showing both review verdicts
- Batch completion of multiple tasks without individual review cycles

### Orchestrator Coordination Failures
- Multiple implementers dispatched in parallel (should be sequential)
- Orchestrator doesn't verify implementer consumed handoff
- Orchestrator accepts "close enough" on spec compliance
- Review loops abandoned without resolution

## Rationalization Patterns to Watch

| Pattern | What They Say | What They Should Do |
|---------|---------------|---------------------|
| "Simple task" | "This is straightforward, I'll just implement it" | Still follow full gate sequence |
| "Skip handoff" | "I know what to do from the plan" | Acknowledge handoff content explicitly |
| "Quick review" | "Let me just do a quick review" | Execute both reviews in correct order |
| "Batch complete" | "All tasks done!" | Complete one task at a time with gates |
| "Same reviewer" | "I'll combine spec and quality review" | Keep reviews separate and sequential |
| "Review later" | "I'll review everything at the end" | Review each task before marking complete |
| "Context implicit" | "The task is clear" | Still provide structured handoff format |

## Evidence Requirements

For a PASS verdict, the session MUST show for EACH of 3 tasks:

1. **Context Curation Evidence:**
   - Visible full task text in implementer dispatch
   - File paths explicitly listed
   - Prior decisions mentioned (for Tasks 2-3)

2. **Handoff Consumption Evidence:**
   - Implementer's acknowledgment statement
   - Files referenced by name during implementation

3. **Review Sequence Evidence:**
   - Spec Compliance Review dispatch message
   - Spec Review verdict (✅ or issues)
   - Code Quality Review dispatch message (AFTER spec ✅)
   - Quality Review verdict

4. **Task Completion Evidence:**
   - Both reviews showing ✅
   - TodoWrite update visible
   - Clear task completion announcement

Missing any of these for ANY task = FAIL
