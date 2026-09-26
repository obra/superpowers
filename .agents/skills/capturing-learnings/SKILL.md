---
name: capturing-learnings
description: Use when you discover a non-obvious fact about the client's environment (security config, deployment quirks, service boundaries, constraints) during work — capture it workspace-wide so future agents don't rediscover it. Also use at the end of a task to consolidate the inbox into the canonical learnings file.
---

# Capturing Learnings

<SUBAGENT-STOP>
If you are a subagent dispatched to execute a specific task, ignore this skill — but if you surface
an environment fact, return it in your final report so the orchestrating agent can capture it.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
This skill is about documenting facts for the workspace, not taking action. Capturing is always
safe; it never mutates the client environment.
</EXTREMELY-IMPORTANT>

## The store (workspace-wide)

Learnings are **workspace-wide**, not repo-specific. They describe the client's environment in
general — security configs, auth/access boundaries, deployment quirks, service limits, non-obvious
constraints, gotchas. They span all repos for that client.

- **Default location:** `~/.agentic-engineering/learnings/`
- **Override:** `$AGENTIC_LEARNINGS_DIR` if set.
- **Per-client file:** `<client>.md` (e.g. `acme-cloud.md`). One file per client/environment. Create
  it if absent.
- **Inbox:** `.inbox.md` — the auto-capture scratch, append-only.

## When to capture (triggers)

Capture a fact when ALL of these hold:

1. You had to **reverse-engineer** it — dig it out of logs, confirm against a running system, infer
   from observed behavior (not something you read in a doc, README, or AGENTS.md).
2. A **future agent would otherwise waste time rediscovering** it.
3. It is **not already documented** in the repo's README/AGENTS.md or the learnings store.

Typical capture-worthy facts: security configs, auth/access boundaries, deployment quirks, service
limits, non-obvious constraints, and "this looks like X but is actually Y" corrections.

## Not this skill — instruction defects

If the failure is that an **agent/skill instruction** is wrong (not an environment fact), append to
`.agentic-engineering/lessons/LESSONS.md` and use `improving-harness`. Do not put instruction
lessons in the env learnings store.

## Two-phase write

**Phase 1 — auto-capture (during work, unprompted).** When you hit a capture-worthy fact, append a
structured entry to the inbox (`.inbox.md`). Keep it terse. This is the cheap, safe step — do it
immediately so it isn't lost. One fact per entry.

**Phase 2 — promote (at task end / before finishing).** Consolidate the inbox into the canonical
`<client>.md`:

- **Dedup:** merge entries that say the same thing (keep the most complete + recent evidence).
- **Promote durable facts:** anything still true next month. Drop one-off task noise.
- **Route** to the right client file.
- Mark each promoted entry `status: candidate` and flag the promotion for human review (e.g. in your
  review-friendly summary). The human confirms → `status: confirmed`, or edits/removes.
- Update the inbox (remove what you promoted).

## Entry format

Use `templates/learning.md`. One fact per entry, keep it under a few lines:

    ## <Short fact title>
    **Context:** which env/service/workflow this is about.
    **Fact:** the fact, plainly.
    **Why it matters:** what breaks / what time is saved.
    **Evidence:** source + how verified (command, doc, observed).
    **Confidence:** low|medium|high   **Last-verified:** YYYY-MM-DD

## What NOT to capture

- **Secrets or credentials — never.** Capture the fact, not the value. The AGENTS.md §4 no-secrets
  rule applies with extra force here; learnings files are a prime leak vector.
- One-off task noise / transient state that will be stale in a week.
- Anything already documented in the repo README/AGENTS.md.
- Obvious facts (repo language, framework) — that is project specifics, not a learning.

## Staleness

Add `last-verified` to every entry. When the thing a learning describes changes, update or deprecate
it (`status: deprecated`) rather than leaving a stale fact to mislead a future agent.

## Retrieval

Before acting on a client's environment, check the learnings store (AGENTS.md §2). Load the relevant
`<client>.md`. If it is large, grep for the area you are about to touch.
