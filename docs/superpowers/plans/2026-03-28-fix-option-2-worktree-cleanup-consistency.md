# Fix Option 2 Worktree Cleanup Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the internal contradiction in finishing-a-development-branch so Option 2 consistently preserves the worktree.

**Architecture:** Apply two surgical edits in one skill document: remove Option 2's cleanup instruction and narrow Step 5 cleanup scope to Options 1 and 4. Then run targeted consistency checks across Quick Reference, Common Mistakes, and Red Flags to ensure all sections agree.

**Tech Stack:** Markdown, Git, ripgrep

**Spec:** GitHub issue report: Option 2 must keep worktree; cleanup applies only to Options 1 and 4.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `skills/finishing-a-development-branch/SKILL.md` | Defines branch finishing workflow behavior and option semantics | Modify |

---

### Task 1: Capture Baseline Inconsistency Evidence

**Files:**
- Read: `skills/finishing-a-development-branch/SKILL.md`

- [ ] **Step 1: Locate conflicting statements**

Run:
```bash
rg -n "Option 2|Then: Cleanup worktree|For Options 1, 2, 4|Keep Worktree|Only cleanup for Options 1 and 4|Options 1 & 4 only" skills/finishing-a-development-branch/SKILL.md
```

Expected: Matches show Option 2 currently says cleanup, while Quick Reference/Common Mistakes/Always indicate Option 2 keeps worktree.

- [ ] **Step 2: Confirm exact edit targets**

Read the matched sections and confirm two required changes:
1. Remove the line under Option 2: `Then: Cleanup worktree (Step 5)`
2. Change Step 5 scope line from `For Options 1, 2, 4:` to `For Options 1, 4:`

- [ ] **Step 3: Commit checkpoint note (no code change yet)**

Record implementation intent in commit body draft:
- Option 2 keeps worktree
- Step 5 cleanup scope excludes Option 2
- No behavioral change for Options 1, 3, 4

---

### Task 2: Apply Markdown Fixes

**Files:**
- Modify: `skills/finishing-a-development-branch/SKILL.md`

- [ ] **Step 1: Remove cleanup handoff from Option 2**

In the Option 2 section, delete exactly this line:
```markdown
Then: Cleanup worktree (Step 5)
```

- [ ] **Step 2: Narrow Step 5 cleanup scope**

In the Step 5 section, change:
```markdown
**For Options 1, 2, 4:**
```
To:
```markdown
**For Options 1, 4:**
```

- [ ] **Step 3: Keep all other content unchanged**

Do not modify:
- Quick Reference row for Option 2
- Common Mistakes note saying cleanup only for Options 1 and 4
- Red Flags “Always” line saying cleanup for Options 1 & 4 only

- [ ] **Step 4: Commit**

```bash
git add skills/finishing-a-development-branch/SKILL.md
git commit -m "fix(finishing-a-development-branch): align Option 2 with worktree retention" -m "Remove Option 2 cleanup instruction and limit Step 5 cleanup scope to Options 1 and 4, matching Quick Reference and guidance sections."
```

Expected: One-file docs-only commit.

---

### Task 3: Validate Internal Consistency

**Files:**
- Read: `skills/finishing-a-development-branch/SKILL.md`

- [ ] **Step 1: Re-run targeted consistency search**

Run:
```bash
rg -n "Then: Cleanup worktree|For Options 1, 2, 4|For Options 1, 4|Keep Worktree|Automatic worktree cleanup|Options 1 & 4 only" skills/finishing-a-development-branch/SKILL.md
```

Expected:
- No match for `Then: Cleanup worktree` under Option 2
- No match for `For Options 1, 2, 4`
- One Step 5 match for `For Options 1, 4`
- Existing guidance lines still indicate Option 2 keeps worktree and cleanup is only for Options 1 and 4

- [ ] **Step 2: Manual read-through of option flow**

Verify end-to-end option behavior is now unambiguous:
- Option 1: cleanup yes
- Option 2: cleanup no
- Option 3: cleanup no
- Option 4: cleanup yes

- [ ] **Step 3: Optional lightweight markdown lint (if available)**

Run (optional):
```bash
npx markdownlint-cli2 skills/finishing-a-development-branch/SKILL.md
```

Expected: No new markdown issues introduced.

---

### Task 4: PR Readiness and Submission

**Files:**
- Modify: PR description in GitHub

- [ ] **Step 1: Prepare PR summary**

Use this summary:
- Removed Option 2 instruction to cleanup worktree
- Updated Step 5 scope to Options 1 and 4
- Confirmed Quick Reference, Common Mistakes, and Red Flags now align

- [ ] **Step 2: Add verification notes**

Include checks performed:
- grep/rg consistency scan before and after
- manual section read-through for all 4 options

- [ ] **Step 3: Submit/Update PR**

Ensure PR clearly states this is an internal consistency docs fix with no runtime code impact.

---

## Self-Review

1. Spec coverage:
- Required removal in Option 2: covered by Task 2 Step 1
- Required Step 5 scope change: covered by Task 2 Step 2
- Internal consistency with other sections: covered by Task 3

2. Placeholder scan:
- No TODO/TBD markers
- Commands and expected outcomes are explicit

3. Terminology consistency:
- Uses one rule throughout: Option 2 keeps worktree; cleanup only for Options 1 and 4

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-03-28-fix-option-2-worktree-cleanup-consistency.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?