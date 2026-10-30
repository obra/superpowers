# Superpowers session diagnosis bundle

Session: <session-id>
Harness: <name> <version> (<provenance label>)    Superpowers: <version> (<sha or "not a checkout">; <provenance label>)
Redaction level: skeleton | evidence | full
Built: <ISO timestamp>

Qualify header version fields as historical evidence, unverified snapshot,
current observation, or unknown. `environment.json` carries the same
provenance distinctions for every environment field and its supporting
location.

## What this is

A scrubbed record of a coding-agent session that had superpowers installed
and went wrong. It lets an agent or person who was not present decide
whether superpowers contributed and, if so, what to change. The report
inside states what happened with `path:line` evidence. By design it
contains no diagnosis of superpowers and no proposed fix; that is the
reader's job.

## Files

- `report.md` — the diagnosis report (problem statement, verdict,
  environment, sessions, timeline, findings, involvement, coverage notes).
- `case.md` — the case file the analysts worked from.
- `environment.json` — machine-readable copy of the environment section.
- `timeline.md` — the per-turn timeline.
- `findings/<dimension>.md` — raw analyst findings per dimension.
- `transcripts/<session-id>.md` — condensed per-turn rendering of each
  examined session (never the raw JSONL). Tool-result bodies by level:

  | Level | Tool-result bodies |
  |---|---|
  | skeleton | intentionally limited; replaced by `[tool result: <tool>, <bytes> bytes, exit <code>]` |
  | evidence | kept for cited events, including the commands and results needed to support findings |
  | full | all kept |
- `scrub-log.md` — every placeholder used and its category (never the
  original value).

## How to read it

Start with `report.md` §1–2, then §7 (involvement) and the evidence lines
it cites, then the matching turns in `transcripts/`. `path:line` references
point at the original files on the reporter's machine; the same line
numbers are preserved in the condensed transcripts as `[L<n>]` markers.

## Redaction

Placeholders look like `<EMAIL-1>`, `<PERSON-2>`, `<SECRET-3>`, `<HOST-4>`,
`<REPO-5>`, `<ORG-6>`, `<PROPRIETARY-7>`; home paths are rewritten to `~/…`. The same placeholder
always refers to the same original value within this bundle.

## Producer instructions

Completed bundles replace these instructions with actual results.

After scrubbing, check every material exported finding using only this bundle:
resolve its citation to an included transcript/source marker, read the cited
command/result or quotation, and verify that it supports the claim. Path and
line existence alone are insufficient. Record specific limitations when the
redaction level or necessary withholding removes support.

Reconcile report, case, environment, findings, README and any local issue
draft. Refresh scrub-log counts against final files excluding the log itself.
Remove stale export statements; distinguish bundle preparation from archive
delivery. Retain a mapping from historical anchors to included evidence.

Record the independent privacy audit separately from evidence usefulness:
- Privacy audit: CLEAN or unresolved misses.
- Evidence support: supported or limited, with affected findings and reasons.

If content changes after checking, repeat the affected checks. Present the
final log, file list and both outcomes for the existing archive approval.
Archive the reviewed files and verify the delivered archive matches them.
Record archive delivery outside the reviewed bundle rather than changing its
contents after approval. Scrubbing is not exhaustive privacy certification.
