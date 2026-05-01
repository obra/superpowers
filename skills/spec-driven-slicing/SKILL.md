---
name: spec-driven-slicing
description: Use when executing a prompt-pack-style spec-driven build — one slice at a time, with hard gates against scope creep and skipped tests. Triggered by phrases like "build slice S0X", "run the next slice", "execute this prompt pack", or any directory matching the pack-shape contract.
---

# Spec-Driven Slicing

<EXTREMELY-IMPORTANT>
ONE INVOCATION = ONE SLICE. Read one slice spec, implement it, run tests, write the Slice Implementation Report, STOP. Do not advance to the next slice in the same invocation. The user re-invokes when ready.
</EXTREMELY-IMPORTANT>

## What this skill does

This skill executes one slice from a spec-driven prompt pack: read the slice spec, state acceptance criteria, implement against frozen scope, run tests, emit a Slice Implementation Report, then STOP. It refuses to expand scope, skip tests, or advance to the next slice without a fresh invocation.

A "prompt pack" is a directory of master prompts + numbered specs + per-slice spec files. See the "Worked example" section below for a canonical reference pack.

## Pack-shape contract

A directory is a "spec-driven pack" if and only if it contains:

**Required:**
1. A `MASTER_BUILD_PROMPT.md` (or any file matching `*MASTER_BUILD*.md`) anywhere in the tree — the read-order and rules anchor.
2. A `slices/` directory (any depth) containing one file per slice.
3. Every file inside `slices/` has these required H2 headings, verbatim:
   - `## Objective`
   - `## Non-goals`
   - `## Files to create or modify`
   - `## Acceptance criteria`

**Recognized but optional:**
- Project rules file (`*PROJECT_RULES*.md`, `*RULES*.md`)
- Numbered top-level dirs (`00_*`, `01_*`, …) — purely organizational
- Per-milestone acceptance checklists (`*MILESTONE*.md`)
- ADR templates, agent personas, runtime configs

**Slice naming:** any filename under `slices/` is a candidate. Lexicographic order of basename is the tiebreaker.

**Detection:** walk up from cwd looking for the first ancestor that satisfies the required clauses. If none found within 5 levels, abort with a structured error pointing the user at the worked-example reference below.

**Why so strict on H2 headings:** the agent mechanically reads them to (a) state acceptance criteria back to the user, (b) freeze scope to the declared file list, (c) detect malformed slice specs before code is written.

## The slice loop (rigid)

```
1. DETECT pack root from cwd (walk up ≤ 5 levels)
2. READ master prompt + project rules in full
3. PICK slice (3 deterministic rules — see below)
4. READ slice spec in full
5. STATE acceptance criteria back to the user, verbatim
6. IF slice has testable behavior:
       handoff to superpowers:test-driven-development for tests-first
   ELSE:
       state explicitly why no tests
7. IMPLEMENT, restricted to slice's `## Files to create or modify`
8. RUN tests; capture commands + verdicts
9. WRITE Slice Implementation Report (contract below)
10. STOP — do NOT advance to next slice
```

## Hard gates

These are non-negotiable. Each gate must pass before the next step.

**Gate 1 — Spec read in full before any code.** The slice spec is short. Read it before writing or modifying any file. Why: scope creep starts when you skim.

**Gate 2 — Acceptance criteria stated back to the user.** Restate every bullet from the slice spec's `## Acceptance criteria` section. The user can correct misreadings before code is written.

**Gate 3 — Tests written before implementation when applicable.** If the slice has testable behavior, hand off to `superpowers:test-driven-development` for the test-first portion. Don't reinvent TDD discipline here.

**Gate 4 — Scope frozen to "Files to create or modify".** The slice spec lists files. Do not touch others. If during implementation you discover a needed change outside that list, STOP — that's the next slice or an out-of-scope discovery to surface to the user.

**Gate 5 — Slice Implementation Report emitted before STOP.** The report is the slice's evidence. No report = the slice is not done.

## Slice picker (deterministic, 3 rules)

First match wins.

**Rule 1 — Explicit user instruction.** If the user named a slice in this turn ("run S03", "execute S03_event_log", "build slice 7"), normalize and use it. Match on the `S\d+` prefix (case-insensitive). If multiple files share the prefix, abort with a structured error listing them.

**Rule 2 — Master-prompt build order.** If `MASTER_BUILD_PROMPT.md` contains a `## Build order` section listing slices, pick the first slice in that list whose Slice Implementation Report does not yet exist. Parse bare slice tokens (`S00`, `S01`, ...). If unparseable, fall through to Rule 3.

**Rule 3 — Lexicographic.** Pick the lexicographically-first slice file in `slices/` whose Slice Implementation Report does not yet exist.

**"Report does not yet exist" detection:** check `<consumer-repo>/progress/slice-reports/<slice-stem>.md`. Absent → open. Present → done. No git history parsing.

**Termination:** when all slices have reports, emit a "pack complete" message naming the highest slice and exit without selecting one. The user may re-invoke with an explicit slice name to re-run.

## Slice Implementation Report contract

Path: `<consumer-repo>/progress/slice-reports/<slice-stem>.md`

Required structure (H2 headings verbatim, in order):

```markdown
# Slice Implementation Report — <SXX> <Title>

## Summary
[2–4 sentences. What was built, in plain language.]

## Files Changed
[Bulleted list of paths touched. One line each. Use git status output.]

## Tests Run
[Command + verdict for each test invocation. Example:
 - `cargo test -p ao-core` → 12 passed, 0 failed
 - `cargo test --doc` → 3 passed
 If a test was not run, state EXACTLY why under "Known Gaps".]

## Acceptance Criteria Status
[Restate every bullet from the slice spec's `## Acceptance criteria` section
 verbatim, each followed by ✅ DONE / ❌ NOT DONE / ⚠ PARTIAL — one line each.
 Hard rule: every criterion in the spec must appear here.]

## Known Gaps
[Anything not done, deferred, or skipped. Empty section is acceptable but the
 heading must be present. If "Tests Run" mentions a skipped test, the reason
 lives here.]

## Next Recommended Slice
[Either the next slice in the master prompt's build order, or a one-line
 justification for picking a different one.]
```

**Hard rules:**

1. All six headings, in this exact order. Otherwise → invalid → skill refuses to STOP.
2. `## Acceptance Criteria Status` must restate every spec criterion. The skill reads `## Acceptance criteria` from the slice spec and asserts every bullet appears.
3. No silent skipped tests. Empty `## Tests Run` requires a sentence in `## Known Gaps` starting "Tests skipped because...".
4. Files outside the spec's `## Files to create or modify` get listed in `## Files Changed` AND explained under `## Known Gaps`. Flag this as an anti-pattern in your closing message.

The `progress/slice-reports/` directory is the source of truth for slice progress. Commit it.

## Anti-patterns

These thoughts mean STOP — you're rationalizing:

| Thought | Reality |
|---------|---------|
| "I'll just also fix this related thing" | That's the next slice or out of scope. STOP. |
| "Tests will come in the next slice" | No. Tests for THIS slice OR document why under Known Gaps. |
| "I'll skip the report, the diff speaks for itself" | No. Report is the evidence. |
| "I'll batch S03 + S04 since they're related" | No. Separate invocations. |
| "The acceptance criterion is wrong, I'll just change it" | Stop and surface that to the user. Don't silently rewrite scope. |
| "This slice is too small to need tests" | If it's testable, test it. If not, document why under Known Gaps. |

## Worked example

A canonical example pack is the **AO Runtime prompt pack** — a 22-slice spec-driven bundle for a local-first agent orchestrator (Codex CLI / Claude Code CLI / Hermes / OpenClaw / MCP / A2A). The pack is not bundled with this skill due to licensing constraints; obtain it from the author and place it (or symlink it) into your consumer repo.

When working with any pack, read in this order:

1. `00_START_HERE/README.md` (or whatever the pack uses as its top-level entry)
2. `<MASTER_BUILD>.md` (typically `01_master_prompts/MASTER_BUILD_PROMPT.md`)
3. The master prompt's `## Build order` section
4. The current slice spec under `slices/`

The AO pack's master prompt declares `## Build order` as `S00 → S01 → S02 → ...`, so Rule 2 of the slice picker walks that order automatically.

## Smoke test (manual)

To verify this skill works end-to-end:

```bash
# 1. Fresh consumer repo
git init /tmp/sds-smoke
cd /tmp/sds-smoke

# 2. Symlink your pack (replace <path-to-your-pack>)
ln -s <path-to-your-pack> ./pack

# 3. Invoke this skill (e.g., user prompt: "use spec-driven-slicing")
#    Expect: skill picks S00 (or whatever the first slice is), reads spec,
#    states criteria, implements, runs tests, writes
#    /tmp/sds-smoke/progress/slice-reports/<S00-stem>.md, STOPS without
#    advancing to S01.

# 4. Verify the report shape
cat progress/slice-reports/<S00-stem>.md

# 5. Re-invoke. Expect: S01 (or the next un-reported slice).
```

## Handoffs

- **Mid-slice (test-first):** invoke `superpowers:test-driven-development` for tests-first work. Don't re-derive TDD discipline here.
- **After report:** STOP. The user decides whether to invoke again for the next slice.
- **Pack-shape failures:** if pack detection fails, abort with a structured error. Don't try to "guess" — point the user at the "Worked example" section as the reference.

## Red flags

These thoughts mean STOP and re-read this skill:

- "This slice is too small to need tests."
- "I'll just commit this without a report — the user can read the diff."
- "S03 and S04 are basically the same slice, I'll do both."
- "The spec's acceptance criteria are wrong, I'll fix them."
- "I'll skip Gate 2 because the slice is obvious."

## Skill priority

When multiple skills could apply:

1. **brainstorming** first if the project hasn't been designed yet — this skill assumes a pack already exists.
2. **systematic-debugging** if a slice fails repeatedly — debug the slice before forcing through.
3. **spec-driven-slicing** to execute one slice.
4. **test-driven-development** during the slice's test-first phase.
5. **verification-before-completion** before claiming the slice is done — verifies the Slice Implementation Report shape.
