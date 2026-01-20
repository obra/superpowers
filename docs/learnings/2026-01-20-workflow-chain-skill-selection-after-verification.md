# Workflow Chain: Correct Skill After verification-before-completion

**Date:** 2026-01-20
**Context:** After completing verification-before-completion skill following executing-plans
**Severity:** Medium
**Type:** Workflow discipline

## The Mistake

After completing `verification-before-completion`, I suggested using `superpowers:compound-learning` as the next step. User corrected me to use `superpowers:ai-self-reflection` instead.

## What Happened

Session flow:
1. ✅ Used `executing-plans` to implement full plan (21 tasks, 16 commits)
2. ✅ Used `verification-before-completion` to verify all requirements met
3. ❌ Suggested `compound-learning` as next step
4. ✅ User corrected: should use `ai-self-reflection`

## Why It Matters

The `using-superpowers` skill explicitly documents the "Common Workflow Chains" table which shows:

```
| After This Skill              | Suggest This Next          | When                           |
|-------------------------------|---------------------------|--------------------------------|
| verification-before-completion| finishing-a-development-  | All tests pass                 |
|                              | branch                     |                                |
```

And in the `verification-before-completion` skill itself, at the bottom:

```markdown
### Optional: Self-Reflection

✅ Verification complete!

Reflect on this session and capture learnings? (optional)

1. Yes - use ai-self-reflection
2. No - skip

If yes: Invoke ai-self-reflection skill.
```

## Root Cause

I confused two similar but distinct skills:

- **compound-learning**: "Use when capturing learnings immediately after solving problems and verifying solutions work. Quick 30-second capture to build institutional knowledge."
- **ai-self-reflection**: "Use when verification-before-completion finishes or when analyzing the session for mistakes and capturing learnings. Detects user corrections, backtracking, and repeated errors to build institutional knowledge."

The key difference:
- `compound-learning` is for **quick post-solution capture** (brief, focused)
- `ai-self-reflection` is for **session retrospection** (comprehensive analysis of mistakes/corrections)

## Correct Behavior

After `verification-before-completion`:

1. Check if tests passed
2. If yes → suggest `finishing-a-development-branch` to handle documentation, plan updates, and git workflow
3. Optionally (as shown in verification skill): suggest `ai-self-reflection` for session retrospection

The workflow chain is:
```
verification-before-completion → finishing-a-development-branch → ai-self-reflection
```

NOT:
```
verification-before-completion → compound-learning  ❌
```

## How to Prevent

1. **Consult the workflow chains table** in `using-superpowers` before suggesting next steps
2. **Read the skill content** - `verification-before-completion` explicitly mentions `ai-self-reflection` at the bottom
3. **Understand skill purposes**:
   - `compound-learning`: Quick tactical learnings after fixing a specific problem
   - `ai-self-reflection`: Deep session analysis for mistakes/corrections/patterns

## Status

- [x] Mistake identified
- [x] Root cause understood
- [x] Learning documented
- [ ] Ready for implementation (update skill suggestion logic)

## Related

- `using-superpowers` skill - "Common Workflow Chains" table
- `verification-before-completion` skill - Bottom section mentions ai-self-reflection
- `compound-learning` skill - Different use case (post-solution quick capture)
- `ai-self-reflection` skill - Session retrospection and mistake analysis
