---
name: diagnosing-superpowers
description: Use when a superpowers session went wrong and your human partner wants to know why — repeated work, ignored plans, stumbles, poor results, a skill that didn't fire, "it took too long", "why is it so expensive", "what is it doing" — or wants to build a bug report for the superpowers maintainers, for the current session or a past one identified by id or path, on any harness.
---

# Diagnosing Superpowers

## Overview

Pin down with your human partner what went wrong in a session, read the
transcripts on disk, and report what happened with evidence. You report;
you do not diagnose superpowers. Whoever triages the bundle or the issue
decides whether superpowers changes.

**Core principle:** Every finding cites `path:line`. No citation, no
finding. Every number comes from the transcript or from a command you ran,
never from memory.

## Workflow

Create a todo per step. Steps 5–7 run only on their stated condition.

1. **Problem intake.** Ask one question at a time until you can write a
   statement naming the session(s), the turn range if known, what your
   partner expected, what happened, and the observable they care about
   (wall-clock, tokens, repeated actions, one specific action). "It took
   too long" is a complaint, not a problem statement. Note whether the
   goal is a superpowers bug report.
2. **Locate.** Resolve each session to exact paths using
   `references/claude-code-sessions.md`, `references/codex-sessions.md`,
   or `references/other-harnesses.md` for any other harness. Confirm a
   past session by quoting its first prompt and timestamp, and list every
   candidate you rejected with the reason, or "none". Enumerate subagent
   transcripts. Create
   `~/.superpowers/diagnosing-superpowers/<session-id>/`, tell your
   partner the path, and fill `templates/case.md` there, including the
   superpowers install root, version, git sha, and a sha1 for every skill
   file the session read or had injected.
3. **Triage.** Read the region around the reported problem yourself. Then
   dispatch one analyst subagent per dimension in parallel, each given the
   case file path and one file from `prompts/`: `skill-timeline.md`,
   `plan-adherence.md`, `repeated-work.md`, `stumbles.md`,
   `quality-evidence.md`, `request-conflicts.md`, `cost-and-time.md`.
   Split a dimension by turn range when the transcript is long. Discard
   any returned finding without `path:line`.
4. **Report.** Fill every section of `templates/report.md` in order, write
   it to the workspace, show it, and give the path.
5. **GitHub issues** — when report §7 says possible or likely, or your
   partner asks. Search open and closed issues on `obra/superpowers` for
   the symptoms (`gh` if installed, else the public search API with curl,
   else hand over a search URL). Show matches and suggest adding the
   report to the closest. If none match, draft `templates/issue.md`, show
   the exact text, and create it only after approval. `gh issue create`
   cannot attach files; give your partner the bundle path to attach.
6. **Export** — when asked, or the intake goal was a bug report. Ask the
   redaction level: skeleton, evidence, or full. Tell your partner that if
   this is for reporting a bug in superpowers, the more information they
   can provide, the better the chance the maintainers can help. Build the
   bundle per `templates/bundle-README.md`, dispatch `prompts/scrub.md`, then
   `prompts/scrub-audit.md`, repeating both until the audit returns CLEAN.
   Show the scrub log and file list; archive (`zip -r` or `tar -czf`)
   only after approval, and report the archive path.
7. **Similar sessions** — when asked. Turn confirmed findings into a
   signature, list candidates by mtime and size, find marker line numbers,
   dispatch `prompts/similar-session.md` per candidate in parallel, and
   append report §9.

## Quick reference

| Complaint | Start with |
|---|---|
| "It took too long" | cost-and-time, stumbles |
| "Why did it do this extra work?" | repeated-work, plan-adherence |
| "Why is it so expensive?" | cost-and-time |
| "What the hell is it doing?" (still running) | skill-timeline; note in-progress in coverage |
| "It ignored the plan" | plan-adherence, compaction lines first |
| "Skill X never fired" | skill-timeline |

## Hard rules

- **Context safety.** One transcript line can be a megabyte. Check
  `wc -lc` and long lines first. Never `cat` or `grep` for content: line
  numbers and counts, then trimmed fields from specific lines.
- **Read-only.** Never modify, move, or delete a session file.
- **Exact paths to subagents.** A subagent's "current session" is its
  own. Pass absolute paths and ids.
- **Human prompts only.** Hook output, system reminders, and tool results
  are not your partner's words. In a subagent transcript, "user" is the
  parent agent.
- **No superpowers diagnosis.** Report §7 states involvement and stops.
  Never name a defect in a skill or propose a change. Pushing does not
  waive this; point at the issue step and offer the bundle. No advice to
  your partner either.
- **Approval gates.** No archive before your partner has seen the scrub
  log and file list. No issue or comment before they approve the exact
  text.
- **Intake before analysis.** Nothing in steps 2–7 starts until your
  partner has answered. If they are away, write the questions and stop.
  A statement you reconstructed for them is not an answer. An
  already-scoped request — one specific event, what is running now, or
  the analysis to run — is itself the statement: answer it, then ask.
  A whole-session "why" is a complaint.

## Red Flags

| Thought | Reality |
|---------|---------|
| "The problem is obvious, skip intake" | The problem statement scopes everything. Ask. |
| "They're away, so I'll reconstruct the statement" | You cannot reconstruct what they wanted. Write the questions and stop. |
| "I'll sweep everything now and ask at the end" | An unscoped sweep spends their budget on the wrong question. Ask first. |
| "Small, targeted edit, no restructuring needed" | Not your call, however small. Report the evidence; the triager decides. |
| "The price per token is well known" | Numbers you did not compute from the transcript are invented. Cite or drop. |
