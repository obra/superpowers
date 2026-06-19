---
name: merge-conflict-resolution
description: Use when git merge produces conflict markers — classifies conflicts by type, applies per-type resolution strategies, and verifies the result
---

<SUBAGENT-STOP>
If you were dispatched as a subagent and encounter merge conflicts, report BLOCKED status to your controller — do not attempt to resolve merge conflicts independently.
</SUBAGENT-STOP>

# Merge Conflict Resolution

## Overview

Merge conflicts are a signal to slow down and understand intent before editing files.

**Core principle:** Classify first, then resolve. Never guess intent — understand what each side changed and why before merging.

**Announce at start:** "I'm using the merge-conflict-resolution skill to resolve this merge conflict."

## The Process

### Step 1: Detect & Classify

Start by identifying every conflicted file:

```bash
git diff --name-only --diff-filter=U
```

For each conflicted file, inspect the merge state and both sides of the conflict:

```bash
git diff --merge <file>
git show :1:<file>   # common ancestor
git show :2:<file>   # ours
git show :3:<file>   # theirs
```

Classify each conflict before editing it:

| Type | How to recognize it | Initial response |
|------|---------------------|------------------|
| Both modified | Both branches changed the same region | Read both sides and determine intent |
| Delete/modify | One side deleted a file the other modified | Determine whether the file should exist |
| Generated file | Lockfiles, compiled output, generated artifacts | Regenerate instead of hand-editing |
| Semantic conflict | No marker overlap, but behavior/logic now disagrees | Treat as a design problem, not a text problem |

### Step 2: Resolve Per Type

Apply the strategy that matches the conflict type:

**Both modified:**
- Read both sides of each conflict region
- Understand *intent* of each change (check commit messages if unclear)
- Merge intelligently — preserve both intents when possible
- If one side clearly supersedes the other, take the newer intent
- If genuinely ambiguous → **escalate to user** with both sides shown

**Delete/modify:**
- Ask: "Branch A deleted this file, Branch B modified it. Which intent wins?"
- If delete wins: `git rm <file>`
- If modify wins: `git add <file>` (keep modified version)

**Generated file:**
- Auto-resolve: `git checkout --theirs <file> && <regenerate command>`
- Or: `git rm <file> && <regenerate command>`
- Never manually edit generated files

**Semantic conflict:**
- No markers to resolve — this is a test failure after clean merge
- Use `systematic-debugging` skill to find root cause
- Common pattern: renamed symbol, moved file, changed API

Do not use `--ours` or `--theirs` as a default answer. Those flags are only correct when they match the intended outcome.

### Step 3: Mark Resolved & Verify

After resolving a file, stage it:

```bash
git add <file>
```

Then verify there are no remaining unresolved conflicts:

```bash
git diff --name-only --diff-filter=U
```

If conflicts remain, continue resolving them before proceeding.

Run the relevant tests after staging the resolved file(s). If tests fail, return to **Step 2** and re-check whether the issue is actually a **semantic conflict**. A semantic conflict = the merge is textually clean but behaviorally wrong (e.g., a renamed function call that the merge didn't catch).

### Step 4: Complete the Merge

When all conflicts are resolved and tests pass, finish the merge:

```bash
git merge --continue
```

Final verification must confirm:

- Tests pass
- No conflict markers remain: `grep -r "<<<<<<" . --include="*.md" --include="*.js" --include="*.ts" --include="*.py" --include="*.sh"` returns nothing
- Working tree is clean or only contains intentional, unrelated changes

## Auto-Resolve Rules & Escalation

### CAN auto-resolve

| Situation | Safe action | Reasoning |
|-----------|-------------|-----------|
| Generated file | Regenerate from source, then stage the result | No intent to preserve — it's derived |
| Whitespace-only differences | Normalize formatting and keep the intended content | No semantic difference |
| Superset change | Combine both changes when one branch is a strict superset of the other | Preserves both intents |
| Same change on both sides | Keep the shared result if both sides made the same edit | Duplicate effort, identical intent |

### MUST escalate

| Situation | Why it must escalate | What to show |
|-----------|----------------------|-------------|
| Both sides changed the same logic differently | Intent is unclear without review | Both sides of the conflict with commit messages |
| Delete/modify conflict | File existence itself is in dispute | File path, what was deleted, what was modified |
| Resolution might break invariants | Needs design-level judgment | The conflict + what invariants might be affected |
| 3+ files conflicted | Likely a broader design or refactor issue | List of all conflicted files with conflict type |

### Escalation format template

```text
Merge conflict needs human decision.

Files:
- <file 1>
- <file 2>

Conflict type:
- <both modified | delete/modify | generated | semantic>

What changed on each side:
- ours: <brief summary>
- theirs: <brief summary>

Recommended options:
1. <option>
2. <option>

Question:
- Which intent should win?
```

## Quick Reference

| Step | Goal | Key command |
|------|------|-------------|
| Detect & Classify | Find all conflicted files and identify conflict type | `git diff --name-only --diff-filter=U` |
| Resolve Per Type | Apply the correct strategy for the conflict type | `git show :1:<file>`, `:2`, `:3` |
| Mark & Verify | Stage resolved files and confirm conflicts are gone | `git add <file>` + `git diff --name-only --diff-filter=U` |
| Complete | Finish the merge and confirm success | `git merge --continue` |

## Common Mistakes

1. **Taking `--ours` / `--theirs` as the default** — Fast, but often wrong when intent matters.
2. **Resolving without understanding intent** — Text may merge cleanly while behavior becomes incorrect.
3. **Forgetting generated files** — Hand-editing lockfiles or build output usually creates drift.
4. **Skipping post-merge tests** — A resolved merge is not complete until behavior is verified.
5. **Aborting instead of resolving** — Aborting is only for backing out of the merge, not for avoiding a hard conflict.

## Red Flags

### Never list

- Never guess which side is correct without reading both sides
- Never use `--ours` or `--theirs` without verifying they match the intended outcome
- Never hand-edit generated artifacts when regeneration is available
- Never skip tests after resolving conflicts
- Never abort a merge without user confirmation

### Always list

- Always classify the conflict type first
- Always read commit messages for both sides
- Always regenerate generated files when possible
- Always stage resolved files before continuing the merge
- Always escalate ambiguous conflicts to the user

## Integration

**Called by:**

- **finishing-a-development-branch** - When merge conflicts appear during local merge completion
- **subagent-driven-development** - When a task branch or per-task merge hits conflicts
- **dispatching-parallel-agents** - When parallel work converges and needs reconciliation

**Pairs with:**

- **systematic-debugging** - For semantic conflicts and behavior-level disagreements
- **verification-before-completion** - For final checks before claiming the merge is done
