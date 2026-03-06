# Token-Lean Agents & Skills Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce token usage by replacing the 1% skill-loading rule with a >50% confidence threshold and adding a tiered review protocol to subagent-driven-development.

**Architecture:** Two targeted edits to existing Markdown skill files. No new files. No code changes. Each task is a focused text edit with manual before/after verification.

**Tech Stack:** Markdown, git

---

### Task 1: Update `using-superpowers` — confidence threshold

**Files:**
- Modify: `skills/using-superpowers/SKILL.md`

**Step 1: Open the file and locate the three places that mention "1%"**

There are exactly 3 occurrences:
- Line 7: inside `<EXTREMELY-IMPORTANT>` block
- Line 24: in "The Rule" section
- Line 46: inside the dot diagram, label on edge `"Might any skill apply?" -> "Invoke Skill tool"`

**Step 2: Apply the edit**

Replace all three occurrences:

Line 7 — change:
```
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.
```
to:
```
If you think there is a good chance (>50%) a skill applies to what you are doing, you MUST invoke the skill.
```

Line 24 — change:
```
**Invoke relevant or requested skills BEFORE any response or action.** Even a 1% chance a skill might apply means that you should invoke the skill to check. If an invoked skill turns out to be wrong for the situation, you don't need to use it.
```
to:
```
**Invoke relevant or requested skills BEFORE any response or action.** Load a skill when you are more likely than not that it applies — when the task clearly or probably maps to a named skill, not just tangentially. If an invoked skill turns out to be wrong for the situation, you don't need to use it.
```

Line 46 — change the edge label in the dot diagram:
```
    "Might any skill apply?" -> "Invoke Skill tool" [label="yes, even 1%"];
```
to:
```
    "Might any skill apply?" -> "Invoke Skill tool" [label="yes, probably (>50%)"];
```

**Step 3: Update the Red Flags table**

Remove this row:
```
| "This doesn't need a formal skill" | If a skill exists, use it. |
```

Replace with:
```
| "It probably applies" | Probably (>50%) = load it. Tangentially = skip it. |
```

Also remove this row (it implies every single action needs a skill check, reinforcing 1% behavior):
```
| "The skill is overkill" | Simple things become complex. Use it. |
```

Replace with:
```
| "The skill is overkill" | If you genuinely think it won't help, don't load it. Trust judgment. |
```

**Step 4: Verify**

Search for remaining `1%` in the file — should be zero:
```bash
grep -n "1%" skills/using-superpowers/SKILL.md
```
Expected: no output.

**Step 5: Commit**

```bash
git add skills/using-superpowers/SKILL.md
git commit -m "feat: replace 1% skill-loading rule with >50% confidence threshold

Reduces speculative skill loading that pulls multi-KB files into context
for tasks that only tangentially relate to a skill domain."
```

---

### Task 2: Update `subagent-driven-development` SKILL.md — tiered review protocol

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md`

**Step 1: Add Task Classification section**

Insert the following new section immediately after the `## When to Use` section (after the closing ` ``` ` of that section's dot diagram block, before `**vs. Executing Plans (parallel session):**`):

```markdown
## Task Classification

Before dispatching each task, classify it into a tier. The tier determines which reviews run.

| Tier | Signals | Review pipeline |
|------|---------|-----------------|
| **Simple** | ≤2 files touched, follows existing pattern explicitly, no new abstraction, pure addition | Implementer self-review only |
| **Standard** | 3–5 files, new feature with clear spec, no new abstractions | Implementer + spec reviewer |
| **Complex** | New abstractions, cross-cutting concerns, >5 files, architectural change, ambiguous spec | Full: implementer + spec reviewer + quality reviewer |

**Classification rules:**
- Classify **before** dispatching the implementer subagent
- Default to **Standard** when uncertain — never round down to Simple
- Declare the tier in the task context sent to the implementer: `**Review tier: Simple / Standard / Complex**`
- You may escalate tier mid-task if the implementer report reveals unexpected complexity
- Simple must be earned: all Simple signals must be present, not just some

```

**Step 2: Update the process flow diagram**

Find the current per-task cluster in the dot diagram (the `subgraph cluster_per_task` block). Replace it entirely with the following updated version that branches on tier:

```dot
subgraph cluster_per_task {
    label="Per Task";
    "Classify task tier" [shape=box];
    "Tier?" [shape=diamond];
    "Dispatch implementer subagent (./implementer-prompt.md)" [shape=box];
    "Implementer subagent asks questions?" [shape=diamond];
    "Answer questions, provide context" [shape=box];
    "Implementer subagent implements, tests, commits, self-reviews" [shape=box];
    "Simple: self-review done?" [shape=diamond];
    "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" [shape=box];
    "Spec reviewer subagent confirms code matches spec?" [shape=diamond];
    "Implementer subagent fixes spec gaps" [shape=box];
    "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" [shape=box];
    "Code quality reviewer subagent approves?" [shape=diamond];
    "Implementer subagent fixes quality issues" [shape=box];
    "Mark task complete in TodoWrite" [shape=box];
}
```

Add edges inside the cluster:
```dot
"Classify task tier" -> "Tier?";
"Tier?" -> "Dispatch implementer subagent (./implementer-prompt.md)" [label="all tiers"];
"Dispatch implementer subagent (./implementer-prompt.md)" -> "Implementer subagent asks questions?";
"Implementer subagent asks questions?" -> "Answer questions, provide context" [label="yes"];
"Answer questions, provide context" -> "Dispatch implementer subagent (./implementer-prompt.md)";
"Implementer subagent asks questions?" -> "Implementer subagent implements, tests, commits, self-reviews" [label="no"];
"Implementer subagent implements, tests, commits, self-reviews" -> "Simple: self-review done?" [label="tier=Simple"];
"Implementer subagent implements, tests, commits, self-reviews" -> "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" [label="tier=Standard or Complex"];
"Simple: self-review done?" -> "Mark task complete in TodoWrite" [label="yes"];
"Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" -> "Spec reviewer subagent confirms code matches spec?";
"Spec reviewer subagent confirms code matches spec?" -> "Implementer subagent fixes spec gaps" [label="no"];
"Implementer subagent fixes spec gaps" -> "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" [label="re-review"];
"Spec reviewer subagent confirms code matches spec?" -> "Mark task complete in TodoWrite" [label="yes, tier=Standard"];
"Spec reviewer subagent confirms code matches spec?" -> "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" [label="yes, tier=Complex"];
"Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" -> "Code quality reviewer subagent approves?";
"Code quality reviewer subagent approves?" -> "Implementer subagent fixes quality issues" [label="no"];
"Implementer subagent fixes quality issues" -> "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" [label="re-review"];
"Code quality reviewer subagent approves?" -> "Mark task complete in TodoWrite" [label="yes"];
"Mark task complete in TodoWrite" -> "More tasks remain?";
```

**Step 3: Update the Red Flags section**

Find the existing Red Flags / "Never:" list and add:

```markdown
**Task classification:**
- Don't default to Simple to save tokens — default is Standard
- Don't skip classifying (just dispatching without declaring tier)
- Don't assign Simple to tasks that modify more than 2 files
- Don't forget to escalate tier if implementer report reveals complexity
```

**Step 4: Update the Cost section**

Find:
```
**Cost:**
- More subagent invocations (implementer + 2 reviewers per task)
```

Replace with:
```
**Cost:**
- Subagent invocations vary by tier: Simple (1), Standard (2), Complex (3)
- Classify honestly — over-classifying as Simple risks quality gaps
```

**Step 5: Verify**

```bash
grep -n "Classify\|Simple\|Standard\|Complex\|tier" skills/subagent-driven-development/SKILL.md | head -30
```

Expected: lines showing the new classification section, tier table, and updated Red Flags.

**Step 6: Commit**

```bash
git add skills/subagent-driven-development/SKILL.md
git commit -m "feat: add tiered review protocol to subagent-driven-development

Simple tasks (<=2 files, existing pattern): self-review only
Standard tasks (3-5 files, clear spec): implementer + spec reviewer
Complex tasks (abstractions, >5 files): full 3-agent pipeline

Reduces subagent invocations ~40% on typical plans with mixed task complexity."
```

---

### Task 3: Update implementer-prompt.md — declare tier in task context

**Files:**
- Modify: `skills/subagent-driven-development/implementer-prompt.md`

**Step 1: Locate the context block in the prompt template**

Find the section:
```
## Context

[Scene-setting: where this fits, dependencies, architectural context]
```

**Step 2: Add tier declaration after Context block**

Insert the following immediately after the `## Context` block and before `## Before You Begin`:

```markdown
## Review Tier

**Tier:** [Simple / Standard / Complex]

[Simple: Your self-review IS the review. No external reviewer will follow. Be thorough — your self-review is the quality gate.]
[Standard: A spec reviewer will check your work after you report back. Focus on spec compliance.]
[Complex: Both a spec reviewer and a code quality reviewer will check your work. Focus on correctness, tests, and clean implementation.]
```

**Step 3: Verify**

```bash
grep -n "Review Tier\|Tier:" skills/subagent-driven-development/implementer-prompt.md
```

Expected: 2 lines — the header and the tier field.

**Step 4: Commit**

```bash
git add skills/subagent-driven-development/implementer-prompt.md
git commit -m "feat: add review tier declaration to implementer prompt template

Tells the implementer subagent which reviews will follow their work,
so they can calibrate their self-review effort accordingly."
```

---

## Verification Checklist

After all tasks:

1. `grep -n "1%" skills/using-superpowers/SKILL.md` → no output
2. `grep -n "50%" skills/using-superpowers/SKILL.md` → 2+ lines
3. `grep -n "Simple\|Standard\|Complex" skills/subagent-driven-development/SKILL.md` → 10+ lines
4. `grep -n "Review Tier" skills/subagent-driven-development/implementer-prompt.md` → 1 line
5. `git log --oneline -5` → 3 new commits visible
