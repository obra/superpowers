---
name: improving-harness-metalearn
description: Review and repair the learning loop's own machinery — the lessons queue's index and anchors, the improve-agents procedure, and near-duplicate rules across agent definitions — from run-records and queue metrics, gated on user approval. Use when improve-agents proposes it on a threshold, when the queue feels heavy, when the index is stale or unanchored lessons appear, or when the user invokes improving-harness-metalearn.
---

# improve-agents-metalearn — improving the learning loop itself

improve-agents turns incidents into rule edits (content). This skill turns run-records
and queue metrics into machinery edits (structure): the queue's representation, the
improve-agents procedure, and rule consolidation across defs. Same hard guardrails as
improve-agents, verbatim — read that skill's "Hard guardrails on editing these files"
before editing anything. Nothing auto-commits; every edit is presented for approval
before applying.

## The boundary and the recursion guard

You never edit this file (`improve-agents-metalearn/SKILL.md`) in a pass that edits anything
else, and you never run two passes back-to-back: your own defects are ordinary lessons,
routed through improve-agents. One meta level, terminating.

## Representation you maintain

- **Anchors:** every applied rule carries `<!-- lesson: <slug> -->` on the line above
  it (multi-hunk: `<slug>-2`, `-3`). "Already applied?" is
  `grep -rn "lesson: <slug>" AGENTS.md agents/ .agents/skills/ skills/`.
  Digit-suffixed hunks (`<slug>-2`, `-3`) count toward the base lesson's anchor total
  in the index; the Applied entry itself is always the bare slug — never suffix an
  Applied entry. An anchor whose slug has no Applied entry is reported at generation
  as a stray.
- **Index:** `.agentic-engineering/lessons/INDEX.md` is generated — regenerate with
  `python3 .agents/skills/improving-harness-metalearn/scripts/regen_index.py` (add `--check`
  to test staleness without writing). Never hand-edit it.
- **Applied entries:** once a lesson's anchors all verify present, its Applied entry
  compresses to `### <slug> (<date>)` plus one body line. The index is the record; git
  is the archive — incident detail lives in the queue file's history.
- **Run-records:** `.agentic-engineering/lessons/RUNS.md`, append-only, one block per
  improve-agents round: date · reviewed/applied/declined · already-fixed hits ·
  duplicates dropped · stranded entries recovered · drift flags · approval-gate slips ·
  upstreamed · queue sizes before/after.

## The thresholds that propose a run

improve-agents' closing step proposes this skill when any hold: uncompressed Applied
backlog > 40 entries; any drift flag (anchor missing from its indexed file); more than
one duplicate append since the last run; any approval-gate slip; any def over
prompt-decompose's `BODY_LINE_THRESHOLD` that decomposition cannot shrink. The user may
also invoke this skill directly, on any cadence.

## The run — six passes, each gated like an improve-agents lesson

1. **Index integrity.** Regenerate the index; diff against the committed index. Repair
   the anchors the diff exposes: a missing anchor means a hand edit removed or moved the
   rule — re-verify against current state, re-anchor where the rule now lives, or
   re-queue the lesson if the rule is gone. Never auto-restore rule text.
   `UNANCHORED: <slug>` (applied, no anchors) and `STRAY: <slug>` (anchor, no applied
   entry) are the two drift signals the regeneration prints — read them, not just the
   index diff.
2. **Compression.** Applied lessons whose anchors all verify compress to the one-line
   form. Present the compression as a single diff for one approval.
3. **Duplicate merge and stranded recovery.** Near-identical Pending entries merge with
   dated addenda naming the second instance. Entries sitting outside the three sections
   (below **Declined**, or bare `##` blocks) move into **Pending** — if more than one
   stranded entry turns up, the capture instructions are failing and that is a pass-5
   finding.
4. **Consolidation.** Near-duplicate rules across defs (three "name the ref" variants in
   three files) propose one canonical bullet or one shared procedure-doc section,
   listing what each replaces. Per-merge approval; the improve-agents style rules apply —
   rules land as rules, no war stories.
5. **Procedure repair.** Run-record patterns become drafted edits to
   `improve-agents/SKILL.md`: repeated approval-gate slips tighten the presentation
   step; a verification step that keeps finding already-fixed entries shortens its
   manual-read residual. One pattern, one diff, one approval.
6. **Report.** What ran, what is proposed for the next round, threshold state after the
   run.

## Out of scope

`CLAUDE.md` and `docs/` (surfaced, not edited); lesson-content quality (that is
improve-agents' review); anything inside a fenced code block (anchors and edits both).
