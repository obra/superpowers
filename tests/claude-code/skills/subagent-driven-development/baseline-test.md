# Baseline Test: subagent-driven-development

## Scenario

Execute a 3-task implementation plan without verification gates:
- Task 1: Simple feature
- Task 2: Requires context from Task 1
- Task 3: Depends on Task 2

Request user to execute the plan using subagent-driven-development.

## Expected Behavior WITHOUT Reinforcement

### Likely Problems

1. **Context Curation Skipped**
   - Subagent told "see plan file" instead of receiving full task text
   - File paths not explicitly listed
   - Prior decisions not summarized

2. **Handoff Not Acknowledged**
   - Implementer proceeds without acknowledging received context
   - No reference to specific files from handoff
   - Context provided but not cited

3. **Review Order Violated**
   - Code quality review happens before spec compliance is complete
   - Quality reviewer sent work that's still spec-noncompliant
   - Duplicated review effort when spec issues found after quality review

4. **Task Completion Without Both Reviews**
   - Task marked done after first review passes
   - Missing second review not noticed
   - TodoWrite updated without full verification

5. **Progress Tracking Abandoned**
   - Progress file not updated between tasks
   - Resumability broken if session interrupted
   - Unknown which review stage each task is in

## Signs of Skipping

- Implementer prompt contains only task number or file path reference (not full task text)
- Implementer response doesn't mention specific files from handoff
- Code Quality Review dispatched before Spec Compliance Review completes
- Task marked complete without clear evidence of both reviews
- Progress file not updated or missing entirely
- "Ready to proceed to next task" said without both reviews showing approval
- Handoff format not structured (free prose instead of fields)

## Pressure Triggers

These user behaviors test whether gates activate:

1. "Just execute the plan" - vague, should trigger context curation verification
2. Task 2 requires Task 1 changes - should trigger explicit context inclusion
3. "Is this ready?" early - should trigger review sequence check
4. "Can we move on?" before both reviews - should trigger completion gate
