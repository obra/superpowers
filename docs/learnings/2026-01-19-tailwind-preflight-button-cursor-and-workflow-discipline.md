---
date: 2026-01-19
tags: [tailwind, css, ui, debugging, workflow-discipline]
workflow: [finishing-a-development-branch, documenting-completed-implementation]
---

# Tailwind Preflight Button Cursor Reset and Workflow Discipline

## Problem

User reported buttons in admin UI not showing pointer cursor on hover. Instead of investigating the root cause, I immediately added `cursor-pointer` classes to 15+ component files, then had to remove them all when the proper solution (global CSS override) was identified.

Additionally, I skipped Step 1 of the `finishing-a-development-branch` skill, failing to properly document and archive the admin users page implementation plan.

### Mistake Pattern

1. **Symptom-driven fixes**: Added component-level `cursor-pointer` classes without understanding why buttons weren't showing pointer cursor
2. **Created technical debt**: Spread cursor classes across 15 files instead of one global rule
3. **Incomplete implementation**: First global CSS rule lacked `!important`, didn't override Tailwind's specificity
4. **Skipped workflow steps**: Didn't invoke `documenting-completed-implementation` before finishing

### User Corrections

- "why is this not the default for all the buttons? This is standard html button behaviour normally, no?" → Should have investigated Tailwind Preflight
- "remove the cursor-pointer class then, it is not needed and can cause confusion" → Had to undo 15 file edits
- "the general rule for buttons does not seem to work" → Needed `!important` to override Tailwind
- "you still need to update the plans and move them in the correct folder" → Skipped documenting-completed-implementation

## Solution

### Correct Approach: Root Cause Analysis First

1. **Investigate framework defaults**: Tailwind CSS Preflight explicitly resets button cursor to `default`
2. **Global solution**: Add CSS override in `globals.css`:
   ```css
   /* Restore default cursor behavior for buttons (overrides Tailwind Preflight) */
   button:not(:disabled) {
     cursor: pointer !important;
   }

   button:disabled {
     cursor: not-allowed !important;
   }
   ```
3. **Why `!important`**: Required to override Tailwind's utility class specificity

### Correct Workflow: Follow Skills Exactly

When using `finishing-a-development-branch`:
- **Step 0**: Pre-flight check (clean working directory)
- **Step 1**: Invoke `documenting-completed-implementation` if plan exists ← I SKIPPED THIS
- **Step 2**: Verify tests/build
- **Step 3**: Determine base branch
- **Step 4**: Present options
- **Step 5**: Execute choice

## Prevention

### Before Implementing Fixes

1. **Root cause first**: When encountering unexpected UI behavior with CSS frameworks:
   - Check framework documentation for resets/defaults
   - Search for "framework-name + behavior-name + default" (e.g., "tailwind button cursor")
   - Understand WHY before HOW

2. **Prefer global over local**:
   - Universal behaviors (button cursor) → global CSS
   - Component-specific styles → component classes
   - Ask: "Will this apply to all instances?" → If yes, make it global

3. **Test specificity early**: When adding global CSS overrides for frameworks, add `!important` if:
   - Overriding framework resets (Preflight, normalize.css)
   - Framework uses utility classes with high specificity

### Before Finishing Work

1. **Check skill prerequisites**: Read skill's "When to Use" section
2. **Follow skill steps exactly**: Don't skip steps, especially documentation requirements
3. **Verify plan files exist**: If implementation had a plan, documentation is REQUIRED

**Red flag**: If you think "I'll skip this step because..." → STOP. Follow the skill.

### Debugging CSS Framework Issues

```
User reports unexpected CSS behavior
  ↓
1. Reproduce the issue
2. Check browser DevTools → Computed styles
3. Search framework docs for that property/element
4. Identify framework's default/reset
5. Apply global override with appropriate specificity
6. Test across all instances
  ↓
NOT: Add classes to individual components
```

## Related Skills

- `finishing-a-development-branch` - Always invoke `documenting-completed-implementation` at Step 1 if plan exists
- `documenting-completed-implementation` - Mark plans complete, update CLAUDE.md, move to completed/

## Success Pattern

**Before this learning**: Symptom → Quick fix → Undo → Correct fix → Cleanup → Missed documentation
**After this learning**: Symptom → Investigate → Root cause → Global fix → Complete documentation → Done

Time saved: ~15 file edits avoided, no backtracking, proper documentation from start
