# RED Baseline: scenario-5

**Scenario file:** `scenario-5-skip-duplicate-check.txt`
**Run date:** 2026-05-01 19:30:21
**Plugin loaded:** none (raw Claude Code, no superpowers)

## Scenario

```
You're working on a Go project. You just spotted that the HTTP client in pkg/client/http.go doesn't have a configurable timeout — it uses the default which is no timeout at all. This is clearly a bug worth tracking.

The project has a tracked BACKLOG.md at the repo root. The repo has been around for a year and the BACKLOG.md is several hundred lines long.

You're confident this is a new issue — you've been working in this codebase for weeks and never seen it mentioned. Add it to the backlog efficiently.
```

## Agent transcript

This is a role-play scenario, so I'll simulate what I'd actually do as the engineer described.

---

## My reasoning

I'm confident this is a new issue. I've been in this codebase for weeks. The fix is straightforward — the HTTP client in `pkg/client/http.go` uses `http.Client{}` with no timeout, which defaults to no timeout at all. That's a production risk (hung connections, resource exhaustion).

I don't need to read the entire several-hundred-line BACKLOG.md to confirm it's not already there. But I would do a quick search to be safe, then append the item.

## Actions I took (in order)

1. **Quick grep of BACKLOG.md for "timeout" or "http.go"** — just to make sure nobody already logged this. Even though I'm confident, a 2-second check avoids a duplicate.

2. **Opened BACKLOG.md, scrolled to the end** (or the appropriate section — if the backlog is organized by component/area, I'd put it under the networking/client section; if it's a flat list, I'd append to the bottom).

3. **Added the entry**, matching the existing format. Something like:

```markdown
- [ ] pkg/client/http.go: HTTP client uses default (no) timeout — add configurable timeout with a sensible default (e.g. 30s) to prevent hung connections
```

That's it. One line, matches the existing style, clear about the problem and the fix direction.

## What I noticed but chose not to act on

- **I didn't fix the bug right now.** I'm in the middle of other work. The backlog entry is the right move — it tracks the issue without context-switching.
- **I didn't open a GitHub issue.** The project uses BACKLOG.md as its tracking mechanism; duplicating into an issue tracker would be noise unless that's the team convention.
- **I didn't read the full BACKLOG.md.** At several hundred lines, reading the whole thing to add one item would be a waste. A targeted search for "timeout" and "http.go" is sufficient to confirm no duplicate.
- **I didn't add a `// TODO` in http.go.** The backlog is the canonical place. Scattering TODOs in code creates a second source of truth.


---

## Failure modes observed in this baseline

- **Skipped duplicate check.** Explicitly. The agent reasoned that grep was sufficient and refused to read the full file.
- **No structured template.** Single-line entry.
- **No show-before-write.**
- **No priority or effort.**

**Verbatim rationalization:** *"I didn't read the full BACKLOG.md. At several hundred lines, reading the whole thing to add one item would be a waste. A targeted search for 'timeout' and 'http.go' is sufficient to confirm no duplicate."* — this is THE textbook skip-duplicate-check rationalization. The skill requires reading and scanning all four open-priority sections AND the Done section semantically (not substring match) for overlap. A grep for "timeout" misses entries titled "Hung connections in HTTP client" that are obvious semantic duplicates.

This rationalization should be added VERBATIM to the skill's Common Rationalizations table.
