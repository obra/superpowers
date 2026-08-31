# Session diagnosis: <session-id>

Report path: ~/.superpowers/diagnosing-superpowers/<session-id>/report.md
Written: <ISO timestamp>

## 1. Problem statement (REQUIRED)

<Copied from the case file.>

## 2. Triage verdict (REQUIRED)

<What the evidence shows happened around the reported problem. Prose, with
`path:line` after every claim. State confidence: high / medium / low, and
what would raise it. No statement about what superpowers should do.>

## 3. Environment (REQUIRED)

- OS:
- Harness and version:
- Models seen:
- Superpowers install root / version / git sha:
- Skill files read or injected (sha1 table from the case file):
- Other plugins, extensions, MCP servers:
- Instruction files present (paths only):

## 4. Sessions examined (REQUIRED)

| Role | Session id | Absolute path | Lines | Bytes |
|---|---|---|---|---|

Rejected candidates: <id — path — why>, or "none".

## 5. Timeline (REQUIRED)

One row per human-typed prompt. Events column lists skills invoked,
subagents dispatched, compaction, errors, resumes, aborts.

| Turn | Line | Time | Request (one line) | Events |
|---|---|---|---|---|

## 6. Findings (REQUIRED, one subsection per dimension)

Each finding:
```
- finding: <one sentence>
  evidence: <path:line> — "<short quote>"
  turns: <first>–<last>
  confidence: high | medium | low
```
A dimension with nothing to report says `none found — checked: <what was checked>`.

### 6.1 Skill timeline
### 6.2 Plan adherence
### 6.3 Repeated work
### 6.4 Stumbles
### 6.5 Quality evidence
### 6.6 Request conflicts
### 6.7 Cost and time
### 6.8 Other plugins and skills used

## 7. Superpowers involvement (REQUIRED)

not indicated | possible | likely

Evidence lines: <path:line list>. This section states involvement only. It
does not name a defect and does not propose a change.

## 8. Coverage notes (REQUIRED)

- Not read: <ranges, files, and why>
- Harness features unavailable: <list or none>
- Session was in progress at read time: yes/no
- For your human partner to double-check: <list or none>

## 9. Similar sessions (only when requested)

| Session id | Path | Date | Harness | Matched | Did not match |
|---|---|---|---|---|---|
