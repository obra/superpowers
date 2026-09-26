---
name: recording-changelog
description: Use at the end of a task that completed a meaningful milestone (feature, breaking change, migration, deliberate decision). Append a curated Why/Changed/Backups/Impact/Rollback entry to this repo's CHANGELOG.md — per-repo, newest first, milestone-level only.
---

# Recording the Changelog

<SUBAGENT-STOP>
If you are a subagent dispatched to execute a specific task, ignore this skill — but if you completed
a milestone, note it in your final report so the orchestrating agent records it.
</SUBAGENT-STOP>

## What it is

A per-repo `CHANGELOG.md` at the repo root. It records **meaningful milestones** — features, breaking
changes, migrations, deliberate decisions — in the homelab Why/Changed/Backups/Impact/Rollback shape.
It complements git history (atomic commits) with the human-facing narrative: what changed, why, what
it affects, and how to undo it. This is the durable form of AGENTS.md §6's review-friendly summary.

## When to record (milestones only)

Record when a task completed something a reviewer would care about. Do NOT record trivial commits.
Record if you:

- added, removed, or changed a feature, command, or public interface,
- made a breaking change or a migration,
- made a deliberate decision or changed a convention,
- changed something with an operational or security impact,
- produced something that needs a backup or a rollback path.

Do NOT record: every commit, typo fixes, formatting, refactors with no behavior change, or
internal-only unreviewed work.

## Format

Newest first — insert at the top, under the header. Use `templates/changelog-entry.md`:

    ## YYYY-MM-DD — <Milestone title>
    **Why:** the reason (context, not just "added X").
    **Changed:**
    - one bullet per meaningful change (commands, files, decisions, behavior).
    **Backups:** where the prior state is recoverable, or N/A.
    **Impact:** what it affects / how it behaves now / what was verified.
    **Rollback:** the exact command or path to undo, or "Reversible." / "N/A".

## How

1. Only after the task is verified and you are about to finish (or at a milestone boundary).
2. Prepend the entry at the top of `CHANGELOG.md`, newest first.
3. Keep it terse but complete — this is the review artifact.
4. If the milestone is a code change awaiting review, record it in the changelog too so the reviewer
   sees the why/rollback alongside the diff.
5. Match the existing style if the repo already has a CHANGELOG.md.

## Do NOT

- Put secrets or credentials in it (AGENTS.md §4 no-secrets rule).
- Record work that has not been verified (follow AGENTS.md §5).
- Overwrite existing entries — only prepend.
