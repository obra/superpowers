# Conflict History Log

Adapted from Overstory's conflict learning pattern. Record conflicts here so patterns emerge over time.

**How to use:**
- Add a row every time a merge conflict requires Tier 2, 3, or 4 resolution
- After a few weeks, files that appear repeatedly → assign to one worktree only
- File types that are always Tier 2 safe → add to the standard Tier 2 list below

---

## Standard Tier 2 (Auto-Resolve) File Types

These are always safe to take the incoming (worker) version:

| File Pattern | Strategy | Reason |
|-------------|----------|--------|
| `package-lock.json` | `git checkout --theirs` | Lock files regenerate; take the worker's version |
| `yarn.lock` | `git checkout --theirs` | Same as above |
| `*.json` in `data/` | `git checkout --theirs` | Generated data files |
| New files in `sql/creations/` | Keep both (additive) | SQL creation scripts are additive, not conflicting |
| New files in `sql/migrations/` | Keep both (additive) | Migration scripts are additive |

---

## Conflict Log

| Date | Worktrees | File Pattern | Conflict Type | Tier Used | Resolution | Outcome |
|------|-----------|-------------|---------------|-----------|------------|---------|
| — | — | — | — | — | — | — |

---

*Started: 2026-02-18*  
*Based on: Overstory conflict learning pattern (adapted for human developer workflow)*
