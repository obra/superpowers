# Feedback Compliance Checklist

## Clarification Gate (when confidence < 85%)

### Confidence Assessment
- [ ] Confidence level assessed before making changes
- [ ] If ambiguous, clarifying questions asked BEFORE presenting changes
- [ ] User confirmed interpretation before proceeding
- [ ] Evidence of "confidence > 85%" check visible

### Clarification Quality (if clarification occurred)
- [ ] Questions were targeted (1-2 max)
- [ ] Multiple choice options provided (not open-ended)
- [ ] Specific document content referenced

## Approval Gate (per change - COMPULSORY)

### Change Presentation Format
- [ ] Each change presented with Old/New diff
- [ ] "Old:" section shows exact text being replaced (quoted)
- [ ] "New:" section shows proposed replacement text (quoted)
- [ ] Change numbered (e.g., "Change 1 of 3")
- [ ] Section name identified for each change

### Approval Flow
- [ ] Each change presented individually (not batched)
- [ ] Explicit approval requested per change ("yes/no/modify")
- [ ] Wait for user response before proceeding to next change
- [ ] If "modify" selected, returned to clarification
- [ ] Never applied changes without explicit approval

### Evidence of Gate Execution
- [ ] Approval Gate logic visible in output
- [ ] Per-change approval flow demonstrated
- [ ] User approval explicitly recorded before application

## Changelog Gate (COMPULSORY)

### Changelog Section
- [ ] Changelog section exists or was created
- [ ] Entry is dated (YYYY-MM-DD format)
- [ ] Feedback round number included
- [ ] Research tier noted if research was used

### Changelog Quality
- [ ] Each changed section listed
- [ ] Brief description of each change included
- [ ] Keep a Changelog categories used when appropriate (Added, Changed, Fixed)

## Evidence Requirements

### What MUST appear in output:
- [ ] Confidence assessment before changes
- [ ] Old/New diff for each change
- [ ] "Apply this change? (yes/no/modify)" or similar approval request
- [ ] Changelog update announcement
- [ ] Completion check offering next steps

### What MUST NOT happen:
- [ ] Changes applied without showing diff
- [ ] Multiple changes batched without per-change approval
- [ ] Changelog skipped or forgotten
- [ ] Proceeding with low confidence without clarification
- [ ] "I'll make these changes" without approval flow

## Comparison to Expected Baseline

Without reinforcement (baseline), the agent might:
- Apply all changes at once without per-change approval
- Skip the diff presentation
- Forget to update changelog
- Accept ambiguous feedback without clarification

With reinforcement (compliance), the agent MUST:
- Assess confidence and clarify if needed
- Show Old/New diff for each change
- Wait for explicit approval per change
- Update changelog with dated entry
