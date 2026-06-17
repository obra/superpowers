---
name: handoff
description: Use when the human asks to pause, stop, resume later, hand off work, preserve context, or leave a continuation note for a future session
---

# Handoff

Produce a compact continuation note that lets your human partner, or a future
agent, restart without rediscovering the session.

**Core principle:** capture operational state, not reassurance. The handoff must
make the next action obvious.

## When Invoked

Stop active work and write the handoff. Do not continue implementation after
the handoff unless your human partner asks you to. Use already-visible context
where possible; run only small read-only checks, such as `git status`, when
needed to avoid guessing.

Do not create persistent handoff files, slash commands, resume systems, or
memory stores unless explicitly requested. The default output is the message
itself.

## Handoff Contract

Use this order:

```markdown
**Goal**
[One sentence: what we were trying to accomplish.]

**Current State**
[What is true now. Include branch/PR/status if relevant.]

**Decisions Made**
[Key choices and why. Omit if none.]

**Files Touched**
- `path`: what changed or why it matters

**Commands Run**
- `command`: result or important output

**Risks / Open Questions**
- [Known risk, blocker, missing verification, or decision still needed]

**Next Action**
[The single best next step.]
```

## Rules

- Keep it concise: usually 100-250 words; expand only when the session has
  multiple branches, PRs, or unresolved risks.
- Prefer concrete facts over narrative. Include exact file paths, branch names,
  PR numbers, commands, test results, and blockers.
- Separate verified facts from guesses. Use "Need to verify:" for uncertain
  items.
- Include failed or skipped verification. A future agent needs to know what not
  to trust.
- If nothing changed on disk, say so.
- If the next action requires human review, approval, credentials, or external
  state, make that the `Next Action`.

## Example

```markdown
**Goal**
Add a small `handoff` skill for explicit end-of-session continuation notes.

**Current State**
Branch `codex/human-handoff-skill` is based on `upstream/dev`. Prior-art search
found #931, #590, and #1617; this branch is intentionally smaller: no slash
commands, no persistent resume files.

**Decisions Made**
Use a single explicit-invocation skill because broad handoff/resume systems have
been rejected as too speculative.

**Files Touched**
- `skills/handoff/SKILL.md`: new skill contract
- `tests/explicit-skill-requests/prompts/handoff-please.txt`: explicit request fixture
- `tests/explicit-skill-requests/run-all.sh`: includes the fixture

**Commands Run**
- `gh pr list ... handoff`: found prior art
- `bash -n tests/explicit-skill-requests/run-all.sh tests/explicit-skill-requests/run-test.sh`: passed

**Risks / Open Questions**
- Maintainers may ask for stronger behavior evals because this is behavior-shaping skill text.

**Next Action**
Run the explicit skill request test for `handoff`, then push the branch.
```
