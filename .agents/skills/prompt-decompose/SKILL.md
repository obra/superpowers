---
name: prompt-decompose
description: "Decompose a verbose agent definition into an always-in-context body (rules + flow skeleton) plus on-demand procedure docs loaded via Read at the step they apply. Use when an agent def's body exceeds ~400 lines and carries long procedural sections needed at only one phase of a run."
---

# Prompt Decomposition

Agent prompts carry long procedural sections that are only needed at one phase
of a run, yet sit in the always-in-context body on every turn. That is where
verbosity lives. This skill decomposes a verbose agent def into an
**always-in-context body** (rules + flow skeleton) plus **on-demand procedure
docs** loaded via `Read` at the step they apply. Cuts always-present tokens
without touching a single rule.

**Decomposition never changes `tools:`.** `Read` is universal, so no agent
gains a tool and no guarded `tools:` edit is needed. **Decomposition adds no
skills-list entries** — extracting to docs leaves every agent's always-present
skills list untouched (the cost a skills-based extraction via
`.agents/skills/` + `Skill` would have paid).

**Both claims are about decomposition, and only about decomposition.**
Extracting a *shared capability* into a skill — one several agents invoke, so
its home is `.agents/skills/` rather than a procedure doc — is a different
operation that this skill does not govern. That operation legitimately adds a
skill, and legitimately changes `tools:` for any agent that must invoke it by
name. Do not read the two claims above as forbidding it; read them as the
reason decomposition is the cheaper move when either would serve.

## Thresholds

The tunable constants; change them here, not inline. The body references these
by name.

- **`BODY_LINE_THRESHOLD` = 400 lines** — an agent def over this qualifies for
  decomposition; under it, overhead exceeds savings. **When a def crosses it
  again after an earlier pass, extract a *larger* section next time — never
  re-extract one that was folded back.** A section is folded back for being
  under `KEEP_MIN_LINES`, so extracting it again re-triggers the fold on the
  next pass and the two thresholds oscillate against each other. Crossing the
  threshold is a reason to look for a new candidate, not to revisit a settled
  one.
- **`EXTRACT_MIN_LINES` = 60 lines** — a section over this is an extraction
  candidate (procedural, one phase, whose "how" is unneeded elsewhere).
- **`KEEP_MIN_LINES` = 30 lines** — a section under this stays in the body
  (overhead exceeds savings); the keep-floor counterpart to
  `EXTRACT_MIN_LINES`.
- **`DOCS_MAX` = 5** — the pollution budget: a **ceiling** on the docs one
  extraction may create. If more than `DOCS_MAX` sections qualify, merge
  related same-phase sections into one doc until the count is at or under it.
- **`DOCS_MIN` = 3 is a guide, not a floor.** Under three docs, ask whether the
  extraction was worth doing at all — but **never create or retain a doc merely
  to reach it**. A doc that falls below `KEEP_MIN_LINES` is folded back into
  the body and deleted, whether it was under the threshold at extraction time
  or fell under it later as content moved out of it; the doc count must not
  prevent that fold. Count the doc's own preamble and the body's pointer to it
  as the overhead they are when making that call.

## When to use

- An agent definition (`agents/*.md (thin shells) and AGENTS.md`) exceeds `BODY_LINE_THRESHOLD`.
- The body carries procedural sections over `EXTRACT_MIN_LINES` needed at only one phase
  of a run, whose "how" is unneeded outside that step.
- The user asks to reduce an agent prompt's verbosity, or `improve-agents`
  proposes a decomposition pass after a review round.

## When NOT to use

- The agent def is under `BODY_LINE_THRESHOLD` — overhead exceeds savings.
- The verbosity is rules, not procedure — rules must stay in the body (see the
  classification rule below). Decomposition relocates procedure; it does not
  edit rules.
- The target is `CLAUDE.md`, `docs/agent_invariants.md`, or any `docs/` file —
  those are shared invariants, not single-agent prompts.
- The target is a `SKILL.md` file — skills are already loaded on demand.

## Classification rule — the core judgment

Classify each top-level section of the agent def into KEEP or EXTRACT.

- **KEEP in body:** rules the agent must check at *any* step (Constraints,
  Provenance, Merge authorization, What you do NOT do, When to use / NOT to
  use, Out of scope, Memory, Status reporting); the **flow skeleton** — each
  step's title + one-line purpose + the pointer to its doc; anything under
  `KEEP_MIN_LINES` (overhead exceeds savings); anything the agent must hold *while*
  executing another section (it cannot load two contexts mid-decision).
- **EXTRACT to doc:** procedural detail needed at *one* phase, over `EXTRACT_MIN_LINES`,
  whose "how" is unneeded outside that step. The step's *purpose + trigger*
  stays in the body; the step's *procedure* moves to the doc.

**Cap + merge:** at most `DOCS_MAX` docs per prompt; merge related moment-specific
sections into one doc (e.g. dispatch + handback as one
`<agent>-dispatch-handback.md`) to stay under budget. Extracting 10+ docs
trades body tokens for more pointers and fragments the flow.

## Doc-home convention

- **Doc home:** `.agents/skills/*/procedures/<agent>-<section>.md` — co-located
  with the agent defs, agent-scoped, not `docs/` invariant territory. Markdown,
  **no frontmatter** (these are not skills).
- **Pointer (body replacement):** the step keeps its title + one-line purpose
  + `Read .agents/skills/*/procedures/<name>.md for the full procedure`. One
  line replaces the extracted block.
- **Cross-ref rewiring:** an extracted doc may *name* a body rule by its
  heading ("per the Constraints bullet on tree provenance") but must **not**
  duplicate rule text — the body owns rules, the doc owns procedure (single
  source of truth). Body references to extracted detail become pointers.
- **Self-contained numbering:** an extracted doc **renumbers its own steps from
  1** and opens with a short preamble naming which parent steps it expands
  ("Expands Delegation-loop steps 9 and 10 of `code-coordinator.md`, numbered 1
  and 2 here"). A doc that inherits the parent's numbers — opening at step 7, or
  step 9 — reads as broken the moment it is opened standalone, which is the only
  way it is ever read.
- **File-qualified cross-references:** every step reference that crosses a file
  boundary **names that file** — `coordinator-review-gate.md section 1d`,
  `code-coordinator.md step 11`. A bare `step N` is allowed only when it is
  doc-local, or when it names another *agent's* own step (that agent's def is
  the unambiguous referent).
- **Portable paths:** no extracted doc hardcodes a user-specific absolute path.
  For the main checkout root the portable form is
  `dirname "$(git rev-parse --git-common-dir)"`, which resolves correctly from a
  worktree too. **The exception, so this is not over-applied:** a location that
  genuinely *is* user-specific — the per-user auto-memory directory under
  `~/.claude/projects/<project>/memory/` is the standing example — is correct as
  an absolute path, because there is no repo-relative form of it.

## Operating model — whole-plan, then apply

The skill reads the full prompt, emits one decomposition **plan table**, the
user reviews it per-row, then it applies in one pass. Fewest round-trips;
cross-references are visible before anything is cut.

### Plan table

```
Section (lines) | Keep/Extract | Doc name | Pointer text (body replacement) | Cross-refs to rewire | Reason
```

Header reports:
- body lines before / after
- number of docs created
- `tools:` changes (expected: none)

**These counts are recorded at plan time, to size the decision — they need not
be carried into a write-up of a completed pass.** The plan table is a live
instrument, filled in while the choice is still open; a finished record is the
one place a count sits unread until it is wrong, with no gate able to catch it.
A historical example that names its sections without line figures still
conforms to this format.

## Procedure

1. **Read the full agent def.** Count lines. Identify top-level sections (`##`
   headings) with their line ranges.

2. **Classify each section** per the classification rule. For each EXTRACT
   candidate, identify the phase it applies to (e.g. "gate time", "ticket
   creation", "spawn/handback") and the one-line purpose + trigger that stays
   in the body.

3. **Apply the cap + merge budget.** If more than `DOCS_MAX` sections qualify for
   extraction, merge related same-phase sections into one doc until the count is
   at or under `DOCS_MAX`. Document the merge in the Reason column. Do not pad
   the other way to reach `DOCS_MIN` — it is a guide, not a floor.

4. **Emit the plan table.** Present it to the user for review. Do not apply
   anything until approved. The plan table is the only output of this step.

5. **On approval, apply in one pass:**
   - Create each procedure doc at `.agents/skills/*/procedures/<agent>-<section>.md`
     with the extracted content. No frontmatter. Renumber its steps from 1, open
     it with the preamble naming which parent steps it expands, and use the
     portable form for any path — all three per Doc-home convention.
   - Rewrite the body: replace each extracted block with its title + one-line
     purpose + `Read .agents/skills/*/procedures/<name>.md for the full procedure`.
   - Rewire cross-refs: scan the body for references to extracted detail and
     replace with pointers; scan each doc for references to body rules and
     replace with heading names (not duplicated text).

6. **Run validation checks** (below) and report results.

## Validation

After apply, verify and report each:

- **Frontmatter byte-identical.** The agent def's `name:`, `description:`, and
  `tools:` lines are unchanged. Diff before/after — any change is a failure.
- **Every pointer resolvable.** Each `Read .agents/skills/*/procedures/<name>.md`
  in the body points to a file that exists and is non-empty.
- **No content lost.** Every line of an extracted section is present in its doc
  (whitespace-tolerant diff: compare with `diff -w` or equivalent).
- **Word-count delta.** Body words before / after, and total words including
  docs. The body should shrink; the total should be approximately equal (the
  procedure moved, it was not deleted).
- **Flow skeleton intact.** Every step title from the original body is still
  present in the rewritten body, each with its one-line purpose.
- **No dangling references.** Grep the body for references to extracted content
  that was not rewired to a pointer. Grep each doc for rule text duplicated from
  the body (single source of truth).
- **No hardcoded user-specific paths.** Grep each extracted doc and the
  rewritten body for an absolute path under a user home directory. Every hit is
  a failure unless it is the deliberately user-specific exception named under
  Doc-home convention; report which, and replace the rest with
  `dirname "$(git rev-parse --git-common-dir)"`.
- **Numbering self-contained.** Each doc's steps start at 1, its preamble names
  which parent steps it expands, and every step reference crossing a file
  boundary names its file. Grep each doc for a bare `step N` and confirm each
  remaining one is doc-local or names another agent's own step.

## Hard guardrails

- **Frontmatter guardrails live in `improve-agents/SKILL.md` ("Hard guardrails on
  editing these files") — read that section before writing frontmatter.**
- **Never change `tools:` during a decomposition.** `Read` is universal; no
  agent gains a tool. Diff the `tools:` line byte-for-byte before and after.
  (Scoped deliberately: a separate shared-capability extraction may change it —
  see the note under the intro.)
- **Never edit rules.** Decomposition relocates procedure; it does not edit,
  weaken, or remove any rule. Rules stay in the body, verbatim.
- **Never change `docs/agent_invariants.md` or `CLAUDE.md`.** Those are shared
  invariants, not single-agent prompts.
- **The agent def is git-tracked, so revert is `git checkout <path>`.** State
  this before apply so the user knows the escape hatch.

## Worked example: code-coordinator.md (the reference case)

The coordinator (`code-coordinator.md`) was the first application
and the validation case. Running this skill on it produced this 3-doc plan:

| Section | Keep/Extract | Doc name | Pointer text | Cross-refs to rewire | Reason |
|---|---|---|---|---|---|
| Decomposition | Extract, later folded back | — | (now inlined in the body) | Steps 2, 5, 6 in the delegation loop reference decomposition outputs (slug, labels, severity) | Loaded only at ticket creation; see the fold-back note below |
| Delegation loop steps 7–8 | Extract | `coordinator-dispatch-handback.md` | `Read .agents/skills/orchestrated-delivery/procedures/dispatch-handback.md for the full procedure` | Step 8a (test-writer) references the dispatch tier; step 9 references the hand-back shape | Loaded only at spawn/handback; the how is unneeded during decomposition/review |
| Step 9 + step 10 sub-steps 1–4 | Extract | `coordinator-review-gate.md` | `Read .agents/skills/orchestrated-delivery/procedures/review-gate.md for the full procedure` | Steps 10.5–10.11 reference verdict shapes; step 11 references blocked state | Loaded only at gate time; the single biggest block |

**Result:** the body more than halved, into 3 docs, under the cap. No
`tools:` change. Every load-bearing rule (Constraints, Provenance, Merge
authorization, What you do NOT do) stays in the body verbatim. The flow
skeleton (step titles + one-line purposes) stays intact, each pointing to its
doc where one exists.

**Fold-back note.** The Decomposition doc did not survive. Once ticket creation
moved out into a skill of its own, what remained was coordinator judgment too small to
pay for a file, so it fell below `KEEP_MIN_LINES` and was folded back into the
body. Two docs is the right number here; padding back to three to satisfy
`DOCS_MIN` would have restored exactly the overhead the fold removed. This is
the case that `DOCS_MIN` is a guide, not a floor, was written for.

The sections that stay in the body: When to use, When NOT to use, Pre-flight
(the skeleton — short, and needed before any step), Ticket lifecycle, Status
reporting, Memory, Constraints, Provenance of relayed input, Merge
authorization, What you do NOT do, Out of scope. These are rules or short
skeletons the agent checks at any step.