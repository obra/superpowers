---
name: creating-github-issues
description: Use when user describes a problem, bug, or feature request that should become a GitHub issue - guides through clarification, codebase analysis, solution options, and creates well-structured issue with implementation details
---

# Creating GitHub Issues

## Overview

Transform problem descriptions into comprehensive, actionable GitHub issues.

**Core principle:** Clarify → Analyze → Options → Create

**Announce at start:** "I'm using the creating-github-issues skill to help create a well-structured issue."

## When to Use

- User describes a bug, feature request, or improvement
- Need to document technical debt or architecture changes
- Converting a discussion into trackable work
- User says "create an issue for..." or "file a bug for..."

**Don't use for:**
- Resolving existing issues (use resolving-github-issues skill)
- Simple questions that don't need tracking
- Issues in repos without write access

## The Process

### Phase 1: Understand and Clarify

**Categorize the issue type:**
- Bug Report: unexpected behavior, errors, crashes
- Feature Request: new functionality
- Performance: slow operations, memory issues
- Architecture: code structure, maintainability
- Security: vulnerabilities, exposure risks
- Documentation: missing or unclear docs

**Ask targeted questions based on type:**

| Type | Key Questions |
|------|---------------|
| Bug | Steps to reproduce? Expected vs actual? |
| Feature | What problem does this solve? Who benefits? |
| Performance | Where is slowdown? Have metrics? |
| Architecture | What pain points? Current limitations? |

**Always gather:**
- Error messages or logs (if applicable)
- Environment details
- Priority/impact level
- Attempted workarounds

### Phase 2: Analyze Codebase

**Scope identification:**
- Which files/modules are involved?
- What are the dependencies?
- Are there similar patterns to follow?

**Root cause analysis (for bugs):**
- Examine specific code areas
- Check for anti-patterns or common issues
- Review recent related commits

### Phase 3: Present Solution Options

Offer 2-3 approaches:

```markdown
**Approach 1: [Name]**
- Description: [brief explanation]
- Pros: [advantages]
- Cons: [drawbacks]
- Effort: Low/Medium/High
- Risk: Low/Medium/High

**Approach 2: [Name]**
[same format]

**Recommendation:** [preferred approach with reasoning]
```

Ask: "Which approach works for you, or should I explore alternatives?"

### Phase 4: Create the Issue

After user confirms approach, create issue with this structure:

```markdown
## Summary
[2-3 sentence overview]

## Problem Description
[Current state and why it needs to change]

## Steps to Reproduce (for bugs)
1. [Step]
2. [Step]

**Expected:** [what should happen]
**Actual:** [what happens]

## Proposed Solution
[Chosen approach details]

## Implementation Details
### Files to Modify
- `path/to/file.ts` - [what changes]

### Key Points
- [Important consideration]

### Testing Requirements
- [ ] Unit tests for [X]
- [ ] Integration tests for [Y]

## Acceptance Criteria
- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]

## Additional Context
- Dependencies: [if any]
- Risks: [potential issues]
```

### Phase 5: Confirm and Submit

Show the draft issue and ask:
- "Ready to create this issue?"
- "Any sections to adjust?"
- "What labels should we add?"

Then:
```bash
gh issue create --title "<type>: <title>" --body "<content>" --repo <owner/repo>
```

## Quick Reference

| Phase | Action | Output |
|-------|--------|--------|
| 1. Clarify | Ask questions | Clear requirements |
| 2. Analyze | Search codebase | Affected files, root cause |
| 3. Options | Present approaches | User-selected solution |
| 4. Create | Draft issue | Structured markdown |
| 5. Submit | `gh issue create` | Issue URL |

## Issue Quality Checklist

Every issue must be:
- [ ] **Self-contained** - developer can start immediately
- [ ] **Actionable** - specific steps, not vague directions
- [ ] **Testable** - clear acceptance criteria
- [ ] **Scoped** - one issue per problem (split if multiple)

## Common Mistakes

### Creating issue without clarification
- Problem: Vague issues require follow-up, waste time
- Fix: Always ask clarifying questions first

### Skipping codebase analysis
- Problem: Implementation details are guesses
- Fix: Identify actual files and patterns before writing

### One giant issue for multiple problems
- Problem: Hard to track, assign, or close
- Fix: Ask "Should I create separate issues for each?"

### Missing acceptance criteria
- Problem: No clear definition of "done"
- Fix: Always include testable checkboxes

## Edge Cases

**Can't understand codebase:**
- Ask user to point to relevant files
- Focus on specific area mentioned

**Issue too vague after questions:**
- Provide template: "To create a useful issue, I need: [list]"

**Multiple issues described:**
- Identify and confirm: "I see 3 distinct issues. Create separate issues for each?"

## Integration

**Pairs with:**
- **resolving-github-issues** - Opposite workflow (resolve vs create)
- **brainstorming** - For complex feature requests needing design
- **writing-plans** - If issue needs detailed implementation plan
