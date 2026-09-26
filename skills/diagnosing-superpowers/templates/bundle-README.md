# Superpowers session diagnosis bundle

Session: <ID-1>
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

This bundle contains scrubbed copies of local case, report, and findings.
The local diagnostic originals and raw session transcripts remain unchanged.

## Files

- `report.md` — the scrubbed diagnosis report (problem statement, verdict,
  environment, sessions, timeline, findings, involvement, coverage notes).
- `case.md` — a scrubbed copy of the case file the analysts worked from.
- `environment.json` — machine-readable copy of the environment section.
- `timeline.md` — the per-turn timeline.
- `findings/<dimension>.md` — scrubbed analyst findings per dimension.
- `transcripts/id-n.md` — condensed per-turn rendering of each
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
it cites, then the matching turns in `transcripts/`. Verified public files may
appear as `<SUPERPOWERS_ROOT>/skills/…:line`; other local paths become stable
`<LOCAL_PATH-n>` aliases. Session, task and correlation IDs become stable
`<ID-n>` aliases, with `id-n` filenames. Original line numbers remain as
`[L<n>]` markers.

## Redaction

Placeholders look like `<EMAIL-1>`, `<PERSON-2>`, `<SECRET-3>`, `<HOST-4>`,
`<REPO-5>`, `<ORG-6>`, `<PROPRIETARY-7>`, `<LOCAL_PATH-8>`,
`<UNRELATED_PLUGINS-9>`, `<PRIVATE_CONTEXT-10>`, `<CONFIDENTIAL-11>`, and
`<ID-12>`. Verified safe-root file paths retain only their public relative
suffix; other machine-specific paths are replaced in full. Unrelated plugin
inventories, private request context, and other confidential content are
minimized. The same placeholder always refers to the same original value
within this bundle.

## Producer instructions

Completed bundles replace these instructions with actual results.

Create this directory from copies of the local case, report, timeline and
findings, then add condensed transcripts at the chosen evidence level. Scrub
and minimize every copied file before the independent privacy audit. Never
rewrite the local originals. The issue draft is a separate public extraction
from the local report; it is not the report or the bundle.
Choose a generic BUNDLE directory and archive name; neither may contain a raw
session, task, or correlation ID. Rename copied transcript files with file-safe
`id-n` aliases and update links before audit. Inspect delivered archive names
and contents after archiving.

Give the independent auditor the unchanged local `case.md` as SOURCE_CASE,
read-only. It identifies the verified roots and original evidence needed to
check safe relative paths and ID aliases against bundle copies. SOURCE_CASE and
the original sources never enter the reviewed bundle or archive. If that
comparison cannot be completed, do not mark the privacy audit CLEAN.

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
