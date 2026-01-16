# Always Proactively Suggest Next Skills After Workflow Steps

**Date:** 2026-01-15  
**Session:** calendar-prep-mvp /connect removal and test fixes  
**Category:** workflow-discipline

## User Feedback

> "I want that after using a skill or any part of a workflow to always suggest potential next skills to trigger."

## Problem

I was completing workflow steps but waiting for users to ask "what's next?" instead of proactively suggesting the next logical skill.

**Examples from this session:**
- ❌ After `verification-before-completion` succeeded → didn't suggest `finishing-a-development-branch`
- ❌ After `finishing-a-development-branch` completed → only mentioned `ai-self-reflection` as "optional"
- User had to explicitly tell me to use ai-self-reflection and said "it would be great if you would propose this next time"

## Root Cause

Being reactive instead of proactive. Treating next-skill suggestions as optional guidance rather than standard workflow practice.

## Correct Pattern

**After completing ANY skill or workflow step:**

1. **State completion clearly**
   - "✅ verification-before-completion finished - all tests pass"
   - "✅ finishing-a-development-branch complete - commits kept local"

2. **Proactively suggest next skill(s)**
   - "**Next step:** Use `finishing-a-development-branch` to complete this work"
   - "**Suggested:** Use `ai-self-reflection` to capture learnings from this session"
   - If multiple options: "**Potential next steps:** 1) `ai-self-reflection` to capture learnings, 2) Move to next task"

3. **Be directive, not passive**
   - ✅ "Next step: Use [skill]..."
   - ❌ "What would you like to do next?"

## Common Workflow Chains

| After This Skill | Suggest This Next |
|------------------|-------------------|
| `brainstorming` | `writing-plans` |
| `writing-plans` | `executing-plans` |
| `executing-plans` | `verification-before-completion` |
| `verification-before-completion` | `finishing-a-development-branch` |
| `finishing-a-development-branch` | `ai-self-reflection` OR `compound-learning` |
| `systematic-debugging` | `verification-before-completion` (after fix) |
| `test-driven-development` | `verification-before-completion` |
| `requesting-code-review` | `finishing-a-development-branch` (after feedback addressed) |

## Success Criteria

- Users never have to ask "what's next?"
- I always suggest the next logical skill immediately after completing one
- Suggestions are directive ("Next step:") not passive ("Maybe you could...")

## Related Learnings

- Similar to existing learnings about recognizing completion trigger phrases
- This is the broader pattern that applies to ALL workflow transitions
