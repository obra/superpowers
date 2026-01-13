# Signs of Skipping - Feedback Skill

## Red Flags (Critical Violations)

- Changes applied without showing diff
- Batch changes without per-change approval
- Changelog not updated after changes
- Proceeding with low confidence without clarification
- "I'll just make these changes" without approval flow
- All changes presented as all-or-nothing
- No explicit approval request per change
- Changelog section missing after changes applied

## Rationalization Patterns

- "The feedback is clear, I'll apply the changes"
- "These changes are related, I'll batch them together"
- "This is a simple update, no need for per-change approval"
- "The changelog can be updated later"
- "User will obviously approve these changes"
- "I understood the feedback perfectly"
- "These are minor changes, no diff needed"
- "Let me just update the document"

## Evidence of Non-Compliance

### Clarification Gate Violations
- No confidence assessment visible in output
- Ambiguous feedback accepted without questions
- Changes made on assumed understanding
- "I think you mean..." without confirmation

### Approval Gate Violations
- Changes applied without Old/New diff shown
- Multiple changes presented as single batch
- No "yes/no/modify" approval request visible
- Changes applied before user response
- "I'll make the following changes:" without per-change approval
- "Updating document with your feedback" without approval flow

### Changelog Gate Violations
- No Changelog section after changes complete
- Changelog entry missing date
- Changelog entry missing feedback round number
- Research tier not noted when research was used
- Changelog mentioned but not actually updated

## Severity Indicators

**Critical (Automatic FAIL):**
- No per-change approval flow (changes batched or auto-applied)
- No diff shown for any changes
- Changelog not updated at all
- Low confidence feedback acted on without clarification

**Warning (Partial Compliance):**
- Diff shown but approval not explicitly requested
- Some changes batched (not all per-change)
- Changelog updated but missing date or round number
- Clarification asked but not all ambiguities resolved

## Questions to Ask

When reviewing the session, ask:
1. Was confidence assessed before making changes?
2. Were clarifying questions asked if feedback was ambiguous?
3. Was each change shown with Old/New diff?
4. Was explicit approval requested per change?
5. Were changes applied only after approval?
6. Was the Changelog section updated with a dated entry?
7. Was the research tier noted if research was performed?
