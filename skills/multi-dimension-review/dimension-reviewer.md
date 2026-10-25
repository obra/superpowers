# Dimension Reviewer Dispatch Template

Fill every placeholder, then dispatch as a `general-purpose` subagent.
Never add a `model:` field — subagents inherit the session's model.

---
Subagent (general-purpose)
description: {DIMENSION} review of {LABEL}
prompt: |
  You are the {DIMENSION} reviewer seat for a code review. Work from files
  only.

  Read first:
  - {WS}/package.diff (unified, -U10)
  - {WS}/package.stat, {WS}/package.log, {WS}/package.files
  - Instruction files in {WS}/ (*-CLAUDE.md, *-AGENTS.md)
  {EXTRA_READS}

  Your brief: {DIMENSION_BRIEF}

  Write every finding to {WS}/findings-{DIM}.md, one block per finding:

  ## F<n>: <title>
  - file:line: <path>:<line>
  - dimension: {DIMENSION}
  - severity (proposed): Critical | Important | Minor
  - evidence: <diff excerpt, or the command you ran plus its output>

  Rules:
  - The repository working tree under review is your current working
    directory — read from it freely, never modify it.
  - A finding without file:line plus evidence is self-rejected — do not
    write it.
  - Do not report what a linter, typechecker, or compiler would catch.
  - You may run read-only commands (grep, git log/blame, tests) for
    evidence.
  - Do not spawn subagents. Do not modify the repo.

  Final message, at most 15 lines:
  Status: DONE | DONE_WITH_CONCERNS | BLOCKED
  Findings: <n> (Critical <c>, Important <i>, Minor <m>)
  Top findings: one line each, at most 5
  Findings file: {WS}/findings-{DIM}.md
---
