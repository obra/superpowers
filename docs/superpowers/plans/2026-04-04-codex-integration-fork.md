# Codex Integration Fork — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fork obra/superpowers into a private repo with native Codex integration at 3 workflow points.

**Architecture:** Clone upstream into existing repo via rebase, add codex-gate skill, modify 6 existing skill files to wire Codex into the brainstorming, execution, and review phases. Register as a custom marketplace.

**Tech Stack:** Git, GitHub CLI (`gh`), Claude Code plugin system, Markdown skill files

**Spec:** `docs/superpowers/specs/2026-04-03-codex-integration-fork-design.md`

---

### Task 1: Establish upstream tracking and private origin

**Files:**
- No file changes — git operations only

- [ ] **Step 1: Add upstream remote and fetch**

```bash
cd ~/Mine/claude-skills
git remote add upstream https://github.com/obra/superpowers.git
git fetch upstream
```

Expected: Remote added, upstream refs fetched.

- [ ] **Step 2: Rebase spec commits onto upstream history**

```bash
git rebase --onto upstream/main --root main
```

Expected: Our spec commits are replayed on top of upstream's full history. If conflicts occur (blind copy vs upstream), accept upstream's version for all non-spec files since the copy was identical.

- [ ] **Step 3: Verify history**

```bash
git log --oneline | head -10
```

Expected: Upstream commits followed by our spec commits at the top.

- [ ] **Step 4: Create private repo and push**

```bash
gh repo create sskys18/claude-skills --private
git remote add origin git@github.com:sskys18/claude-skills.git
git push -u origin main
```

- [ ] **Step 5: Verify remotes**

```bash
git remote -v
```

Expected:
```
origin    git@github.com:sskys18/claude-skills.git (fetch)
origin    git@github.com:sskys18/claude-skills.git (push)
upstream  https://github.com/obra/superpowers.git (fetch)
upstream  https://github.com/obra/superpowers.git (push)
```

- [ ] **Step 6: Commit**

No commit needed — this task is git plumbing only.

---

### Task 2: Create codex-gate skill

**Files:**
- Create: `skills/codex-gate/SKILL.md`

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p skills/codex-gate
```

- [ ] **Step 2: Write SKILL.md from spec**

Create `skills/codex-gate/SKILL.md` with this content:

```markdown
---
name: codex-gate
description: Codex integration for superpowers workflow. Activates at 3 points — spec review during brainstorming, execution delegation during implementation, and independent final review gate before finishing a branch. Invoke when the workflow reaches these decision points, or when the user says "codex review", "codex gate", or "second opinion".
allowed-tools: Bash, Read, Glob, Grep, Agent, AskUserQuestion, Skill
---

# Codex Gate — Superpower Integration

This skill connects Codex into the superpower workflow at three points:
1. **Spec review** — independent second opinion on design docs during brainstorming
2. **Execution delegation** — use `/codex:rescue` instead of a Claude subagent when the user chooses
3. **Final review gate** — run `/codex:review` as an independent second opinion after Claude's code review

## When this skill activates

- During `superpowers:brainstorming`, after Claude subagent spec review passes and before user reviews
- Inside `superpowers:subagent-driven-development` or `superpowers:executing-plans`, at each task execution decision point
- After `superpowers:requesting-code-review` completes and before `superpowers:finishing-a-development-branch`
- When the user says "codex review", "codex gate", "independent review", or "second opinion"

---

## Part 1: Spec review

After the Claude subagent spec review loop passes during `superpowers:brainstorming`, run an independent Codex review before the user sees the spec.

### Flow

```
spec-document-reviewer subagent (Claude) — approved
    ↓
codex-gate: spec review
    ↓
    Build Codex review task with spec file path
    ↓
    Run /codex:rescue with review task
    ↓
    Present Codex findings verbatim
    ↓
    If issues found:
        Fix issues
        Re-run Codex review (max 2 iterations)
    ↓
    If approved or max iterations reached:
        Surface to user for final review
```

### Execution steps

1. Read the spec document path from the brainstorming workflow
2. Build a Codex review task:
   ```
   Task: Review this design spec for completeness, consistency, and implementability.

   Context: This spec was written during a brainstorming session and has already
   passed a Claude subagent review. You are providing an independent second opinion.

   Files in scope: <spec file path>

   Constraints:
   - Do NOT rubber-stamp. Look for gaps that would cause problems during implementation.
   - Focus on: completeness, internal contradictions, ambiguous requirements, scope creep, YAGNI
   - Do NOT suggest stylistic changes or minor rewording

   Acceptance criteria:
   - Status: Approved | Issues Found
   - If issues: list each with section reference and why it matters
   ```
3. Run `/codex:rescue` with the review task
4. Present Codex output verbatim to the user
5. If issues found: fix them, re-run Codex review (max 2 iterations, then surface to user)
6. If approved: proceed to user review

### Critical rules

- Do NOT tell Codex what Claude's spec review found or what was fixed — reviewer independence
- Do NOT paraphrase or filter Codex output
- If Codex and Claude's reviews contradict, present both findings and let the user decide

---

## Part 2: Execution delegation

When working inside `superpowers:subagent-driven-development` or `superpowers:executing-plans`, at each task:

1. Present the execution choice:
   ```
   How should I execute this task?
   1. Inline (I handle it directly)
   2. Subagent (Claude subagent — fresh context)
   3. Codex execute (delegate to Codex via /codex:rescue)
   ```

2. If the user picks **Codex execute**:
   - Build a detailed task spec with: task description, files in scope, constraints, acceptance criteria, and relevant code context
   - Run `/codex:rescue` with the full spec
   - Use `--background` for tasks touching 3+ files
   - Wait for result via `/codex:result`
   - Continue the superpower review cycle (spec-compliance → code-quality) on Codex's output

3. If the user doesn't specify, default to the existing superpower behavior (Claude subagent).

### Codex rescue task spec format

When delegating to Codex, compose the task as a detailed spec, not a one-liner:

```
Task: <clear description of what to build/fix/change>

Context:
<relevant architecture notes, related files, current behavior>

Files in scope:
<specific file paths to read and/or modify>

Constraints:
- <what NOT to do>
- <limits on scope>
- <patterns to follow>

Acceptance criteria:
- <how to verify the task is done>
- <what tests should pass>
- <what behavior should change>

Current code:
<paste relevant snippets from files Codex needs to understand>
```

### Critical rules

- The task spec must be detailed, not a one-liner — Codex has no session context
- Codex output goes through the same review cycle as any other implementer

---

## Part 3: Final review gate

After Claude's own code review (`superpowers:requesting-code-review`) completes, run the Codex independent review gate before proceeding to `superpowers:finishing-a-development-branch`.

### Flow

```
superpowers:requesting-code-review
    ↓ (Claude's review complete, issues addressed)
    ↓
codex-gate: independent review
    ↓
    Run /codex:review (or /codex:adversarial-review for high-risk changes)
    ↓
    Present Codex findings to user verbatim
    ↓
    If verdict is "needs-attention":
        Ask user which findings to address
        Fix selected issues
        Re-run review (max 2 iterations, then surface to user)
    ↓
    If verdict is "approve" or user says "proceed":
        Continue to superpowers:finishing-a-development-branch
```

### Execution steps

1. **Assess scope** — check `git diff --shortstat` to understand change size
2. **Choose review type**:
   - Standard changes → `/codex:review`
   - High-risk changes (security, auth, data, architecture) → `/codex:adversarial-review`
   - If the user explicitly requests adversarial, use that regardless of scope
3. **Run the review**:
   - Small changes (1-2 files): run foreground with `--wait`
   - Larger changes: run background with `--background`, check `/codex:status`
4. **Present results verbatim** — do not paraphrase, summarize, or editorialize Codex output
5. **Gate decision**:
   - `approve` → proceed to finishing-a-development-branch
   - `needs-attention` → present findings, ask user which to fix, fix them, re-review (max 2 iterations, then surface to user)
6. **Never auto-fix** review findings without user confirmation

### Critical rules

- Codex review runs in a **fresh context** — it has no knowledge of Claude's implementation reasoning
- Do NOT tell Codex what the fix was or why — it sees only task + diff + code
- This is the **reviewer independence principle**: the reviewer must form its own opinion
- Present Codex output exactly as received — this is the user's second opinion, not Claude's to filter

---

## Updated superpower flow

The complete flow with Codex integration:

```
superpowers:brainstorming
    ↓ spec review: Claude subagent → Codex review → User review  (Part 1)
superpowers:writing-plans
    ↓
superpowers:subagent-driven-development (or executing-plans)
    Per task:
        Choose: inline / subagent / Codex execute  (Part 2)
        → spec-compliance review
        → code-quality review
        → mark complete
    ↓
superpowers:requesting-code-review (Claude's review)
    ↓
superpowers:codex-gate (Codex independent review)  (Part 3)
    ↓
superpowers:finishing-a-development-branch
```

---

## Integration with existing plugins

This skill uses:
- **superpowers** — the workflow framework (this plugin)
- **codex** (`codex@openai-codex`) — the execution and review runtime
  - `/codex:rescue` for task delegation and spec review
  - `/codex:review` for standard code review
  - `/codex:adversarial-review` for aggressive review
  - `/codex:status` for job tracking
  - `/codex:result` for retrieving completed results
```

- [ ] **Step 3: Verify file exists**

```bash
cat skills/codex-gate/SKILL.md | head -5
```

Expected: Shows the frontmatter with `name: codex-gate`.

- [ ] **Step 4: Commit**

```bash
git add skills/codex-gate/SKILL.md
git commit -m "Add codex-gate skill: Codex integration at 3 workflow points"
```

---

### Task 3: Modify brainstorming skill

**Files:**
- Modify: `skills/brainstorming/SKILL.md` (checklist at lines 22-32, flow diagram at lines 36-65)

- [ ] **Step 1: Add Codex spec review to the checklist**

In the `## Checklist` section, add a new step 8 between the current step 7 (spec review loop) and step 8 (user reviews). The new checklist should read:

```
7. **Spec review loop** — dispatch spec-document-reviewer subagent with precisely crafted review context (never your session history); fix issues and re-dispatch until approved (max 3 iterations, then surface to human)
8. **Codex spec review** — invoke `superpowers:codex-gate` Part 1 for independent Codex review of the spec; fix issues and re-run (max 2 iterations)
9. **User reviews written spec** — ask user to review the spec file before proceeding
10. **Transition to implementation** — invoke writing-plans skill to create implementation plan
```

(Original steps 8 and 9 become 9 and 10.)

- [ ] **Step 2: Add Codex node to the process flow diagram**

In the `digraph brainstorming` block, add the Codex review node and edges. Insert between `"Spec review passed?"` and `"User reviews spec?"`:

Add node:
```
    "Codex spec review\n(superpowers:codex-gate Part 1)" [shape=box];
    "Codex review passed?" [shape=diamond];
```

Change the edge from spec review to user review:
```
    "Spec review passed?" -> "Codex spec review\n(superpowers:codex-gate Part 1)" [label="approved"];
    "Codex spec review\n(superpowers:codex-gate Part 1)" -> "Codex review passed?";
    "Codex review passed?" -> "Codex spec review\n(superpowers:codex-gate Part 1)" [label="issues found,\nfix and re-run"];
    "Codex review passed?" -> "User reviews spec?" [label="approved"];
```

Remove the old direct edge:
```
    "Spec review passed?" -> "User reviews spec?" [label="approved"];
```

- [ ] **Step 3: Add Codex spec review section**

After the existing "**Spec Review Loop:**" section and before "**User Review Gate:**", add:

```markdown
**Codex Spec Review:**
After the Claude subagent spec review loop passes:

1. Invoke `superpowers:codex-gate` Part 1 (Spec Review)
2. Codex reviews the spec independently via `/codex:rescue`
3. If Issues Found: fix, re-run Codex review (max 2 iterations)
4. If Approved: proceed to user review
5. Present Codex output verbatim — do not paraphrase or filter
```

- [ ] **Step 4: Verify the file is valid**

```bash
head -35 skills/brainstorming/SKILL.md
```

Expected: Checklist shows 10 items with Codex spec review at position 8.

- [ ] **Step 5: Commit**

```bash
git add skills/brainstorming/SKILL.md
git commit -m "Add Codex spec review step to brainstorming workflow"
```

---

### Task 4: Modify executing-plans skill

**Files:**
- Modify: `skills/executing-plans/SKILL.md` (Integration section at end of file)

- [ ] **Step 1: Add codex-gate to Integration section**

In the `## Integration` section at the bottom, add after the existing entries:

```markdown
- **superpowers:codex-gate** - REQUIRED: At each task execution decision point, invoke codex-gate to present Codex as a third execution option (inline / subagent / Codex execute)
```

The final Integration section should read:

```markdown
## Integration

**Required workflow skills:**
- **superpowers:using-git-worktrees** - REQUIRED: Set up isolated workspace before starting
- **superpowers:writing-plans** - Creates the plan this skill executes
- **superpowers:codex-gate** - REQUIRED: At each task execution decision point, invoke codex-gate to present Codex as a third execution option (inline / subagent / Codex execute)
- **superpowers:finishing-a-development-branch** - Complete development after all tasks
```

- [ ] **Step 2: Verify**

```bash
tail -10 skills/executing-plans/SKILL.md
```

Expected: Shows codex-gate in the Integration section.

- [ ] **Step 3: Commit**

```bash
git add skills/executing-plans/SKILL.md
git commit -m "Add codex-gate to executing-plans Integration section"
```

---

### Task 5: Modify subagent-driven-development skill

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md` (Integration section at end of file)

- [ ] **Step 1: Add codex-gate to Integration section**

In the `## Integration` section, add after `superpowers:requesting-code-review`:

```markdown
- **superpowers:codex-gate** - REQUIRED: At each task execution decision point, invoke codex-gate to present Codex as a third execution option (inline / subagent / Codex execute). Also runs as independent review gate after code review.
```

The final Integration section should read:

```markdown
## Integration

**Required workflow skills:**
- **superpowers:using-git-worktrees** - REQUIRED: Set up isolated workspace before starting
- **superpowers:writing-plans** - Creates the plan this skill executes
- **superpowers:requesting-code-review** - Code review template for reviewer subagents
- **superpowers:codex-gate** - REQUIRED: At each task execution decision point, invoke codex-gate to present Codex as a third execution option (inline / subagent / Codex execute). Also runs as independent review gate after code review.
- **superpowers:finishing-a-development-branch** - Complete development after all tasks

**Subagents should use:**
- **superpowers:test-driven-development** - Subagents follow TDD for each task

**Alternative workflow:**
- **superpowers:executing-plans** - Use for parallel session instead of same-session execution
```

- [ ] **Step 2: Verify**

```bash
tail -15 skills/subagent-driven-development/SKILL.md
```

Expected: Shows codex-gate in the Integration section.

- [ ] **Step 3: Commit**

```bash
git add skills/subagent-driven-development/SKILL.md
git commit -m "Add codex-gate to subagent-driven-development Integration section"
```

---

### Task 6: Modify requesting-code-review skill

**Files:**
- Modify: `skills/requesting-code-review/SKILL.md` (add cross-reference after Integration section)

- [ ] **Step 1: Add codex-gate handoff**

At the end of the file (after `See template at: requesting-code-review/code-reviewer.md`), add:

```markdown

## After Code Review

After all review issues are addressed, invoke `superpowers:codex-gate` Part 3 (Final Review Gate) for an independent Codex review before proceeding to `superpowers:finishing-a-development-branch`. This is a required step — do not skip directly to finishing the branch.
```

- [ ] **Step 2: Verify**

```bash
tail -5 skills/requesting-code-review/SKILL.md
```

Expected: Shows the codex-gate handoff section.

- [ ] **Step 3: Commit**

```bash
git add skills/requesting-code-review/SKILL.md
git commit -m "Add codex-gate handoff to requesting-code-review"
```

---

### Task 7: Modify finishing-a-development-branch skill

**Files:**
- Modify: `skills/finishing-a-development-branch/SKILL.md` (Integration section at end of file)

- [ ] **Step 1: Add codex-gate as prerequisite**

In the `## Integration` section at the bottom, add `superpowers:codex-gate` as a prerequisite. The section should read:

```markdown
## Integration

**Prerequisite:**
- **superpowers:codex-gate** - REQUIRED: Codex independent review must complete before finishing the branch

**Called by:**
- **subagent-driven-development** (Step 7) - After all tasks complete
- **executing-plans** (Step 5) - After all batches complete

**Pairs with:**
- **using-git-worktrees** - Cleans up worktree created by that skill
```

- [ ] **Step 2: Verify**

```bash
tail -12 skills/finishing-a-development-branch/SKILL.md
```

Expected: Shows codex-gate as prerequisite in Integration.

- [ ] **Step 3: Commit**

```bash
git add skills/finishing-a-development-branch/SKILL.md
git commit -m "Add codex-gate as prerequisite to finishing-a-development-branch"
```

---

### Task 8: Update marketplace.json

**Files:**
- Modify: `.claude-plugin/marketplace.json`

- [ ] **Step 1: Read current value**

```bash
cat .claude-plugin/marketplace.json
```

Expected: Shows `"name": "superpowers-dev"` (or similar).

- [ ] **Step 2: Update marketplace name and owner**

Change the `name` to `codex-integration` and update the owner info:

```json
{
  "name": "codex-integration",
  "description": "Superpowers fork with native Codex integration at 3 workflow points",
  "owner": {
    "name": "sskys18"
  },
  "plugins": [
    {
      "name": "superpowers",
      "description": "Superpowers with Codex integration: spec review, execution delegation, and independent final review gate",
      "version": "5.0.5",
      "source": "./",
      "author": {
        "name": "sskys18"
      }
    }
  ]
}
```

- [ ] **Step 3: Verify plugin.json is unchanged**

```bash
cat .claude-plugin/plugin.json
```

Expected: `"name": "superpowers"` — no changes needed.

- [ ] **Step 4: Commit**

```bash
git add .claude-plugin/marketplace.json
git commit -m "Set marketplace name to codex-integration"
```

---

### Task 9: Push and register marketplace

**Files:**
- Modify: `~/.claude/settings.json`

- [ ] **Step 1: Push all changes**

```bash
git push origin main
```

- [ ] **Step 2: Add marketplace to settings.json**

In `~/.claude/settings.json`, add to the `extraKnownMarketplaces` section:

```json
"codex-integration": {
  "source": {
    "source": "github",
    "repo": "sskys18/claude-skills"
  }
}
```

Verify this matches the shape of the existing `openai-codex` entry in the same section.

- [ ] **Step 3: Switch plugin source**

In `~/.claude/settings.json` `enabledPlugins`:

- Set `"superpowers@claude-plugins-official": false` (or remove the entry)
- Add `"superpowers@codex-integration": true`

- [ ] **Step 4: Commit settings change**

No git commit — settings.json is outside the repo.

---

### Task 10: Verify and cleanup

**Files:**
- No repo changes — verification and external cleanup

- [ ] **Step 1: Restart Claude Code**

Exit and restart Claude Code to pick up new plugin configuration.

- [ ] **Step 2: Verify skills load**

Check that superpowers skills appear with the `superpowers:` prefix. The skill list should include `superpowers:codex-gate`.

- [ ] **Step 3: Cleanup memory workaround**

Remove the project-scoped memory that was the workaround:

```bash
rm ~/.claude/projects/-Users-sskys-Mine-codex-bridge/memory/feedback_codex_gate_auto.md
```

Update `~/.claude/projects/-Users-sskys-Mine-codex-bridge/memory/MEMORY.md` to remove the codex-gate-auto entry.

- [ ] **Step 4: Cleanup local skill**

```bash
rm -rf ~/.claude/skills/codex-gate/
```

The skill now lives inside the plugin at `skills/codex-gate/SKILL.md`.

- [ ] **Step 5: Verify codex-gate activates**

Test by saying "codex review" or starting a brainstorming session — the codex-gate skill should be recognized.

---

## Rollback

If verification fails at any point:

```bash
# In ~/.claude/settings.json:
# Set "superpowers@claude-plugins-official": true
# Remove "superpowers@codex-integration"
# Restart Claude Code
```

Original superpowers restored immediately. Debug the fork without blocking work.
