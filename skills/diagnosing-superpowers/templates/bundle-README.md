# Superpowers session diagnosis bundle

Session: <session-id>
Harness: <name> <version>    Superpowers: <version> (<sha or "not a checkout">)
Redaction level: skeleton | evidence | full
Built: <ISO timestamp>

## What this is

A scrubbed record of a coding-agent session in which superpowers was
installed and something went wrong, prepared so that an agent or person
who was not present can decide whether superpowers contributed and, if so,
what to change. The report inside states what happened with `path:line`
evidence. By design it contains no diagnosis of superpowers and no proposed
fix; that is the reader's job.

## Files

- `report.md` — the diagnosis report (problem statement, verdict,
  environment, sessions, timeline, findings, involvement, coverage notes).
- `case.md` — the case file the analysts worked from.
- `environment.json` — machine-readable copy of the environment section.
- `timeline.md` — the per-turn timeline.
- `findings/<dimension>.md` — raw analyst findings per dimension.
- `transcripts/<session-id>.md` — condensed per-turn rendering of each
  examined session (never the raw JSONL). At *skeleton* level tool-result
  bodies are replaced by `[tool result: <tool>, <bytes> bytes, exit <code>]`;
  at *evidence* level bodies are kept only for events cited in findings; at
  *full* level all bodies are kept.
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
