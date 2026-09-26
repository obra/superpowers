# Agent & Skill Lessons — Pending Review

The capture queue for the `improving-harness` skill. Append observed instruction defects to
**Pending**; the skill moves entries to **Applied** or **Declined** on review.

**Capture bar (all four):** observed (not hypothetical), traceable to instructions (not a
model mistake under correct instructions), root cause (not symptom), not already in
**Declined**.

**Where to append:** the main checkout's copy of this file. If you are in a ticket worktree,
resolve the main checkout root with `dirname "$(git rev-parse --git-common-dir)"` and append
there — not your worktree's copy, which strands when the implementer commits only its ticket
paths.

**Where in the file:** insert the new entry at the END of the **Pending** section —
immediately above the `## Applied` heading. Never append to the end of the file: that
lands the entry below **Declined**, outside the section the review reads, and it is never
seen again.

**Before appending:** grep **Pending** and `.agentic-engineering/lessons/INDEX.md` for the entry's
target file and its root-cause nouns. A near-hit gets a dated addendum under the existing
entry ("second instance: …") instead of a new entry — a repeat raises priority, it does not
duplicate.

**Queue structure:** three sections — **Pending** (open entries), **Applied** (compressed
one-liners the index is generated from), **Declined** (settled — never re-propose).

## Pending

<!-- Template for new Pending entries (insert new entries ABOVE the "## Applied" heading):

### <short title>
- **Observed:** <YYYY-MM-DD>
- **Agent/skill:** <which .claude/agents/*.md, procedures/*.md, or .claude/skills/**/SKILL.md>
- **Scope:** <local | upstream> — local = a fact about this project (lands in
  docs/agent_invariants.md or CLAUDE.md); upstream = a defect in the generic agent
  instructions every project using the template shares
- **What went wrong:** <one line, the actual failure>
- **Root cause in instructions:** <the gap; what rule is missing or wrong>
- **Suggested fix:** <the rule to add/change, or "see review">
-->

## Applied

<!-- Compressed form, one per applied lesson — the index script reads exactly this shape:

### <slug> (<YYYY-MM-DD>)
<one line: what landed and where>
-->

## Declined

<!-- ### <short title> — declined <YYYY-MM-DD>: <the user's reason, verbatim if given> -->
