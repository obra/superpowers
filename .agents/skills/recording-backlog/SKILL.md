---
name: recording-backlog
description: Use when an idea or deferred work surfaces mid-task that isn't worth doing now but shouldn't be lost. Append a [Future] entry to this repo's BACKLOG.md — per-repo, newest first. Also use at task end to log any out-of-scope follow-ups you identified.
---

# Recording the Backlog

<SUBAGENT-STOP>
If you are a subagent dispatched to execute a specific task, ignore this skill — but if you surface a
deferred idea or out-of-scope follow-up, note it in your final report so the orchestrating agent can
backlog it.
</SUBAGENT-STOP>

## What it is

A per-repo `BACKLOG.md` at the repo root. It records **deferred / future work** that surfaced during
a task but isn't worth doing now — kept on the radar so it isn't forgotten. Newest first. It is the
companion to `CHANGELOG.md` (done work) and the learnings store (environment facts): backlog is
*future* work you're deliberately setting aside.

## When to backlog (triggers)

Log it when ANY of these is true:

- An idea or improvement surfaces mid-task that is out of scope now but worth remembering.
- You identified a follow-up that would be valuable but isn't part of the current milestone.
- A task or change was deliberately deferred or rejected (record why).
- A known gap or limitation is noted and should be addressed later.

Do NOT backlog: things already tracked in GitHub issues, trivial one-off ideas, anything being
actively worked right now, or work that belongs in the learnings store (facts) or CHANGELOG (done).

## Format

Newest first — insert at the top, under the header. Use `templates/backlog-entry.md`:

    ## [Future] <Title>
    - **Status:** Backlogged YYYY-MM-DD (from <source>). <why it was deferred / what it is>.
    - **Possible levers (not yet evaluated):** <options to consider>.
    - **Re-trigger conditions (address when any occur):** <what should prompt picking this up>.
    - **Effort if pursued:** <low/medium/high + rough scope>. Reversible / non-disruptive?
    - **Companion:** <related files, skills, issues>.

## How

1. Only after the task is verified and you are about to finish (or at a milestone boundary).
2. Prepend the entry at the top of `BACKLOG.md`, newest first.
3. Keep it terse but complete — enough that a future agent can pick it up cold.
4. Match the existing style if the repo already has a BACKLOG.md.
5. If an item moves from backlog into active work, note that in its Status line (or move it out).

## Do NOT

- Put secrets or credentials in it (AGENTS.md §4 no-secrets rule).
- Backlog work that is already being tracked elsewhere (issues, milestones, active branch).
- Overwrite existing entries — only prepend.
