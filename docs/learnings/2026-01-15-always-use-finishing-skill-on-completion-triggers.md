---
date: 2026-01-15
type: user-correction
source: ai-detected
confidence: high
tags: [skills, finishing-a-development-branch, workflow, git]
project: calendar-prep-mvp
---

# Always use finishing-a-development-branch skill when user says "complete this"

## What Happened

User said "let's complete this then" after successful deployment and verification. I manually committed changes with git instead of invoking the `finishing-a-development-branch` skill. User corrected: "why are you not using the correct skills for this?"

## AI Assumption

Assumed that since I was already on the master branch and changes were working, I could skip the finishing skill workflow and just commit directly.

## Reality

The finishing-a-development-branch skill must ALWAYS be invoked when user signals completion, regardless of:
- Which branch you're on
- Whether changes are already working
- How "simple" the completion seems

The skill enforces critical steps that manual commits bypass:
- Proper test verification (not just "tests exist")
- Presenting merge options to user (merge locally, PR, keep as-is, discard)
- Documentation checks
- Git workflow safety

## Lesson

**Trigger phrases that require finishing-a-development-branch:**
- "let's complete this"
- "finish this work"
- "wrap this up"
- "we're done"
- "finalize this"

**Action:** Invoke `finishing-a-development-branch` IMMEDIATELY when user says any completion phrase.

**Exception:** Only skip if user explicitly says "just commit it" or "skip the workflow".

## Context

Applies to ALL projects and situations. The finishing skill is not about complexity - it's about giving the user proper control over how work is integrated.

## Suggested Action

This is a general pattern. No CLAUDE.md changes needed - just strict adherence to skill invocation rules from using-superpowers skill.

---

**IMPLEMENTED (2026-01-15):** Enhanced using-superpowers skill in v4.1.2:
- Added "Common Trigger Phrases" table with explicit skill invocation examples
- Completion triggers: "let's complete this" → finishing-a-development-branch
- Debugging triggers: "this is broken" → systematic-debugging
- Feature triggers: "add feature X" → brainstorming first
