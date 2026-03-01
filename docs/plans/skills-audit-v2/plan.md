# Skills Audit v2 — Implementation Plan

> See [design](design.md) for context and rationale.
> **For Claude:** Use `superpowers:subagent-driven-development` to execute this plan.

**Goal:** Apply 27 surgical edits across 16 files — E2E consistency fixes, fork innovations, and upstream gap coverage.

**Architecture:** All changes are markdown/bash edits to existing skill files and hooks. No code, no tests, no builds. Verification is via grep/read confirmation that changes are correct and consistent.

**Note:** These are all small, independent edits to different files. Serial execution with subagent-driven-development is appropriate (1 specialist domain). Tasks are ordered by priority (high → low) within each layer.

---

## Tasks

1. Task 1: Fix code-reviewer placeholder mismatch (CX-7)
2. Task 2: Add verification/review cross-references (W1-2, W5-1)
3. Task 3: Fix spec-reviewer prompts (CX-4/19, CX-5, CX-18)
4. Task 4: Fix subagent-driven-development consistency (CX-13, CX-15, W3-1)
5. Task 5: Fix agent-team-driven-development (CX-15, L3 cross-task)
6. Task 6: Fix writing-skills references (CX-9, W6-1)
7. Task 7: Fix dispatching-parallel-agents (CX-17, L2 sequential)
8. Task 8: Fix brainstorming (CX-11, L2 plan mode, L3 quick mode, user confirmation gates)
9. Task 9: Fix writing-plans (CX-14, W2-1, L2 plan mode, L2 plan status)
10. Task 10: Fix executing-plans (CX-20, W2-1, L2 plan mode, L2 plan status, L3 plan verify)
11. Task 11: Expand red flags table (L2 expanded red flags)
12. Task 12: Add worktree env guidance + fix hooks (L3 env files, L3 hook fixes)

## Verification Strategy

Since these are markdown/bash files with no test suite, verification for each task is:
1. `grep` for the old content (should be gone)
2. `grep` for the new content (should be present)
3. Read the modified section to confirm it reads correctly in context

## Test Expectations Summary

| Task | What to verify | Expected before | Expected after |
|------|---------------|-----------------|----------------|
| 1 | `{PLAN_REFERENCE}` gone from code-reviewer.md | Present on line 18 | Replaced with `{PLAN_OR_REQUIREMENTS}` |
| 2 | Integration section in verification, "Pairs with" in both review skills | Missing | Present |
| 3 | Spec-reviewer uses general-purpose, no bias language | `superpowers:code-reviewer`, "suspiciously quickly" | `general-purpose`, neutral language |
| 4 | Announce/freshness/REQUIRED callouts in subagent skill | Missing or unclear | Present and clear |
| 5 | Announce + cross-task check in agent-team skill | Missing | Present |
| 6 | Correct reference names in writing-skills | "designing-before-coding", illustrative ref | "brainstorming", functional ref |
| 7 | Integration section + sequential note in dispatching | Missing | Present |
| 8 | Announce + plan mode block + quick mode + confirmation gates in brainstorming | Missing | Present |
| 9 | Header-last + worktree handoff + plan mode block + plan status in writing-plans | Unclear or missing | Present |
| 10 | Escalation + worktree handoff + plan mode block + plan status + plan verify in executing-plans | Missing | Present |
| 11 | 12 red flag entries in using-superpowers (up from 5) | 5 entries | 12 entries |
| 12 | Env file section in worktree skill + hook fixes in session-start | Missing / buggy | Present / fixed |
