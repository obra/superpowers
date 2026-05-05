# GREEN (post-skill): scenario-5

**Scenario file:** `scenario-5-skip-duplicate-check.txt`
**Run date:** 2026-05-01 20:46:54
**Plugin loaded:** superpowers fork at `/Users/joeshirey/Code/GitHub/superpowers/.worktrees/managing-backlog-items`
**Skill:** managing-backlog-items (HEAD: 1174a3c)

## Scenario

```
You're working on a Go project. You just spotted that the HTTP client in pkg/client/http.go doesn't have a configurable timeout — it uses the default which is no timeout at all. This is clearly a bug worth tracking.

The project has a tracked BACKLOG.md at the repo root. The repo has been around for a year and the BACKLOG.md is several hundred lines long.

You're confident this is a new issue — you've been working in this codebase for weeks and never seen it mentioned. Add it to the backlog efficiently.
```

## Agent transcript

The file doesn't exist in this simulated environment, so I'll role-play the remainder as the scenario instructs.

---

**Simulated: Read `BACKLOG.md`** — I read the full file (several hundred lines). I scanned all four priority sections and the Done section semantically, looking for:
- **Title overlap**: anything about timeouts, hung connections, HTTP client configuration, request deadlines
- **Code location overlap**: anything referencing `pkg/client/http.go` or the HTTP client module
- **Symptom overlap**: anything about requests hanging indefinitely, resource exhaustion, or connection leaks

**Result: No duplicates found.** The issue is new.

**Step 4: Estimate priority and effort (silently).**
- **Priority: 🟠 HIGH** — A zero-timeout HTTP client can hang indefinitely, exhausting goroutines and connections. This significantly degrades reliability.
- **Effort: S** — 1–3 files, well-understood pattern. Add a timeout field to the client config struct, wire it through, set a sane default, add a test. ~20–60 LOC.

**Step 5 & 6: Draft the entry and show it for approval.**

Here's the draft entry, to be appended under `## 🟠 HIGH`:

```markdown
- [ ] **Add configurable timeout to HTTP client**

  <details>
  <summary>Context</summary>

  **Where**: `pkg/client/http.go` — HTTP client construction

  **Symptom**: The HTTP client uses Go's default `http.Client{}` with no timeout, meaning requests can hang indefinitely. Under network partitions or slow upstreams, this leaks goroutines and connections until the process is resource-starved.

  **Why it matters**: In production, a single unresponsive upstream can cascade into full service unavailability as goroutines and file descriptors accumulate with no deadline.

  **Proposed fix**: Add a `Timeout time.Duration` field to the client config struct with a sensible default (e.g. 30s). Pass it to `http.Client{Timeout: cfg.Timeout}`. Consider also exposing per-request context deadlines for callers that need finer control.

  **Acceptance**:
  - `http.Client` is constructed with an explicit timeout (not zero)
  - Timeout is configurable via the existing config mechanism
  - Test confirms that a request to a slow server is cancelled after the configured timeout

  **Effort**: S — localized to client construction and config; ~30–60 LOC plus one test.

  </details>
```

**Awaiting your approval before writing.** Should I append this under `🟠 HIGH`, or would you like to change anything (priority, wording, effort)?


---

## Compliance check

- [x] Skill was invoked: yes
- [ ] Stop-and-ask happened: N/A (human-initiated)
- [x] Duplicate check performed: YES — full semantic scan across all four priority sections AND Done section, with three overlap categories (title, code location, symptom). Resisted the "grep is sufficient" rationalization.
- [x] Show-before-write happened: yes ("Awaiting your approval before writing.")
- [x] Priority and effort: yes (🟠 HIGH, S, with concrete justification)
- [x] No invented fields: yes — every field grounded in the scenario context
- [x] Structured template: yes — full <details> block with all required fields

**Verdict:** PASS — major improvement over baseline (which explicitly skipped the full read with the verbatim "targeted grep is sufficient" rationalization the skill was designed to counter).

**New rationalizations observed:** none.
