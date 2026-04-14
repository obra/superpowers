# Karpathy Supplement Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate three behavioral supplements from the Karpathy guidelines into the superpowers project: proactive assumption-surfacing, surgical change discipline (including orphan cleanup), and top-level success criteria.

**Architecture:** Add small, focused sections to three existing documents. No new files are created. Changes are additive and non-breaking.

**Tech Stack:** Markdown documentation only.

---

### Task 1: Add "Before Acting" to `using-superpowers` skill

**Files:**
- Modify: `/root/code/superpowers/skills/using-superpowers/SKILL.md:116-118`

- [ ] **Step 1: Read the target file and locate the insertion point**

Read `/root/code/superpowers/skills/using-superpowers/SKILL.md` and confirm the "User Instructions" section ends around line 116-118 with:
```markdown
## User Instructions

Instructions say WHAT, not HOW. "Add X" or "Fix Y" doesn't mean skip workflows.
```

- [ ] **Step 2: Insert the new section immediately after "User Instructions"**

Insert the following markdown block directly after the "User Instructions" section of `/root/code/superpowers/skills/using-superpowers/SKILL.md` (before any following content, or at end of file if it's the last section):

```markdown
## Before Acting

Stop and align before executing.

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.
```

- [ ] **Step 3: Verify the insertion**

Run: `grep -n "Before Acting" /root/code/superpowers/skills/using-superpowers/SKILL.md`
Expected: Line number where the new section appears.

- [ ] **Step 4: Commit**

```bash
git add /root/code/superpowers/skills/using-superpowers/SKILL.md
git commit -m "docs(using-superpowers): add Before Acting section from Karpathy guidelines"
```

---

### Task 2: Add surgical-change discipline to implementer prompt

**Files:**
- Modify: `/root/code/superpowers/skills/subagent-driven-development/implementer-prompt.md:88-98`

- [ ] **Step 1: Read the target file and locate the insertion point**

Read `/root/code/superpowers/skills/subagent-driven-development/implementer-prompt.md` and confirm the "Discipline" self-review checklist ends around lines 88-98 with:
```markdown
    **Discipline:**
    - Did I avoid overbuilding (YAGNI)?
    - Did I only build what was requested?
    - Did I follow existing patterns in the codebase?
```

- [ ] **Step 2: Insert two new checklist items into the Discipline section**

Replace the existing "Discipline" block with:
```markdown
    **Discipline:**
    - Did I avoid overbuilding (YAGNI)?
    - Did I only build what was requested?
    - Did I follow existing patterns in the codebase?
    - Did I match existing style, even if I would do it differently?
    - Did I remove imports/variables/functions that my changes made unused?
```

Also append the following paragraph immediately after the "Discipline" checklist (before the "Testing" checklist) to make the cleanup obligation explicit:
```markdown
    Clean up your own mess: remove anything your changes made unused
    (imports, variables, functions), but don't delete pre-existing dead code
    unless asked.
```

- [ ] **Step 3: Verify the insertion**

Run: `grep -n "match existing style" /root/code/superpowers/skills/subagent-driven-development/implementer-prompt.md`
Expected: Match found.

Run: `grep -n "Clean up your own mess" /root/code/superpowers/skills/subagent-driven-development/implementer-prompt.md`
Expected: Match found.

- [ ] **Step 4: Commit**

```bash
git add /root/code/superpowers/skills/subagent-driven-development/implementer-prompt.md
git commit -m "docs(subagent-driven-development): add surgical-change discipline to implementer prompt"
```

---

### Task 2b: Add surgical-change discipline to `executing-plans` skill

**Files:**
- Modify: `/root/code/superpowers/skills/executing-plans/SKILL.md:24-31`

- [ ] **Step 1: Read the target file and locate the insertion point**

Read `/root/code/superpowers/skills/executing-plans/SKILL.md` and confirm the "Step 2: Execute Tasks" section contains:
```markdown
For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed
```

- [ ] **Step 2: Expand the "Execute Tasks" list with surgical-change rules**

Replace the existing "For each task" block with:
```markdown
For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. **Surgical changes only:** match existing style, remove any imports/variables/functions your changes made unused, and don't refactor adjacent code
4. Run verifications as specified
5. Mark as completed
```

- [ ] **Step 3: Verify the insertion**

Run: `grep -n "Surgical changes only" /root/code/superpowers/skills/executing-plans/SKILL.md`
Expected: Match found.

Run: `grep -n "remove any imports/variables/functions your changes made unused" /root/code/superpowers/skills/executing-plans/SKILL.md`
Expected: Match found.

- [ ] **Step 4: Commit**

```bash
git add /root/code/superpowers/skills/executing-plans/SKILL.md
git commit -m "docs(executing-plans): add surgical-change discipline to task execution"
```

---

### Task 3: Add success criteria to `CLAUDE.md`

**Files:**
- Modify: `/root/.claude/CLAUDE.md` (end of file, after "## General")

- [ ] **Step 1: Read the target file and confirm the tail**

Read the end of `/root/.claude/CLAUDE.md` and confirm the last section is "## General" ending with:
```markdown
- Describe the problem you solved, not just what you changed
```

- [ ] **Step 2: Append the new section at the very end of the file**

Insert the following markdown block as the final section of `/root/.claude/CLAUDE.md`:

```markdown

## Success Criteria

These guidelines are working if:
- Fewer unnecessary changes in diffs.
- Fewer rewrites due to overcomplication.
- Clarifying questions come before implementation rather than after mistakes.
```

- [ ] **Step 3: Verify the insertion**

Run: `grep -n "Success Criteria" /root/.claude/CLAUDE.md`
Expected: Line number where the new section appears.

Run: `tail -n 5 /root/.claude/CLAUDE.md`
Expected: Ends with "Clarifying questions come before implementation rather than after mistakes."

- [ ] **Step 4: Commit**

```bash
git add /root/.claude/CLAUDE.md
git commit -m "docs(CLAUDE): add Karpathy-derived success criteria"
```

---

## Self-Review

1. **Spec coverage:**
   - Task 1 covers "暴露假设，敢于 push back" → `using-superpowers/SKILL.md` ✅
   - Task 2 covers "风格匹配 + 清理自己的孤儿代码" → `subagent-driven-development/implementer-prompt.md` ✅
   - Task 2b covers "风格匹配 + 清理自己的孤儿代码" → `executing-plans/SKILL.md` ✅
   - Task 3 covers "效果验证标准" → `/root/.claude/CLAUDE.md` ✅

2. **Placeholder scan:** No TBD, TODO, or vague steps found.

3. **Type consistency:** N/A (documentation-only changes).
