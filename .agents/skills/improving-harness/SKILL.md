---
name: improving-harness
description: Review and apply pending instruction fixes to agent definitions (agents/*.md (thin shells) and AGENTS.md) and skills (.agents/skills/**/SKILL.md), gated on user approval. Use when the user asks to improve/update agent instructions, review agent feedback, run the self-improvement cycle, or invokes improving-harness.
---

# Agent & Skill Self-Improvement Cycle

Turns observed agent/skill failures into approved instruction edits. The queue lives at
`.agentic-engineering/lessons/LESSONS.md` **in the main checkout**.

## The loop

**Capture (continuous, silent).** When an agent or skill misbehaves in a way traceable to
its instructions, add an entry to the **Pending** section of `LESSONS.md` using the
template in that file — inserted at the end of **Pending**, immediately above the
`## Applied` heading. Never append to the end of the file: that lands the entry below
**Declined**, outside every section the review reads, and it silently never gets reviewed.
Tag each entry's **Scope** (`local` or `upstream` — see "Local vs upstream" below). Do this without interrupting the task in flight — the only exception
is a defect severe enough to affect work currently running, which you raise immediately.

**Review (on demand).** This skill. Read the queue, produce diffs, get approval, apply.

## Where the queue is — the worktree rule

The agents do not all run in one checkout. The coordinator runs in the main checkout (or
its own `coordinator_worktree`); code-implementers and reviewers run in isolated git
worktrees (`ticket_worktree_pattern`, see `docs/agent_invariants.md` → Project config). Each worktree has its own working
copy of tracked files, so a lesson appended to a worktree's copy strands there — the
Implementer commits only its ticket's explicit paths and would not carry the lesson back.

So: **always append to the main checkout's `LESSONS.md`, never your worktree's copy.**
Resolve the main checkout root portably (do not hardcode the user's home path):

```sh
dirname "$(git rev-parse --git-common-dir)"
```

That returns the shared `.git`'s parent — the main checkout root — from any worktree.
Append to `<that>/.agentic-engineering/lessons/LESSONS.md`. If you are the coordinator you are
already in the main checkout; the relative path `.agentic-engineering/lessons/LESSONS.md`
is correct.

The same rule covers the run-record and the index: append `RUNS.md` and regenerate
`INDEX.md` from the main checkout, never a worktree's stale copy.

Concurrent appends from two worktrees are possible but rare (lessons are infrequent); an
append is a small, self-contained edit, so the risk is acceptable.

## Capture bar

Only log a lesson that clears all four:

1. **Observed, not hypothetical.** Something actually went wrong this session. "This prompt
   could be clearer" is not a lesson.
2. **Traceable to instructions.** The fix is a change to an agent/skill file. A model mistake
   made under correct instructions is not an instruction defect — don't log it.
3. **Root cause, not symptom.** "The implementer said something wrong" is a symptom. "No rule
   tells the implementer to gate before self-review" is a root cause.
4. **Not already Declined.** Check the Declined section first. A rejected lesson is settled.

Before appending, grep **Pending** and `.agentic-engineering/lessons/INDEX.md` for the entry's target
file and its root-cause nouns. A near-hit appends a dated addendum under the existing
entry ("second instance: …") instead of a new entry — a repeat raises priority, it does
not duplicate. `--check` on
`python3 .agents/skills/improving-harness-metalearn/scripts/regen_index.py` tests index
freshness only — it does not answer did-it-land; grep the slug's anchor for that.

## Review procedure

1. **Read `LESSONS.md`.** First sweep the whole file for entries that sit outside the three
   sections — below **Declined**, or as bare `##` blocks — and move them into **Pending**;
   each one is a capture that missed the insertion point, and a review that reads only
   **Pending** would never see it. Record the count in the run-record. Then read
   **Declined** and drop any Pending entry that duplicates a declined one — that is a queue
   bug; note it and remove the entry.

2. **Verify each Pending entry against current state.** Index first, eyes second: look
   the entry's slug and target file up in `.agentic-engineering/lessons/INDEX.md`, and grep
   `grep -rn "lesson: <slug>" AGENTS.md agents/ .agents/skills/ skills/` for the anchor. Index
   hit → the lesson is applied; check the anchored rule still says what the entry
   claims and move on. Anchor absent from its indexed file → drift: re-verify against
   the file by hand and note the drift flag in the run-record. Neither → read the
   target file as before (the residual case: a rule applied before anchors existed, or
   reworded past recognition). If already fixed, move the entry straight to **Applied**
   with `superseded — fixed by hand` and skip it.

3. **Draft a surgical diff per lesson.** Constraints:
   - **Additive by default.** Prefer adding a rule block over rewriting existing prose.
   - **Match house style.** The agent files use plain `## <Topic>` sections and
     `### Step N —` subsections — no dated `(user decision YYYY-MM-DD)` blocks, so do not
     invent that convention. Behavioral rules land as a `## <Topic>` section matching the
     existing ones (e.g. `## Constraints (hard rules)`, `## What you do NOT do` in
     `code-implementer.md`); append to an existing section when the rule belongs there rather
     than creating a near-duplicate. A rule needed at only one phase of a run belongs in
     that phase's `procedures/*.md` file, not the always-in-context body. State the rule positively, then list what is *never*
     sufficient — the `## Merge authorization` block in `code-coordinator.md` is the
     reference shape.
   - **State the trigger.** A rule the agent can't tell when to apply is dead text.
   - **Rules land as rules, not war stories.** The applied diff states the rule, its
     trigger, and its reason in general form — never the incident that produced it. No
     "measured on this repo, X then happened" narration, no ticket/PR numbers, no counts
     of past failures or review rounds, no "the user called this out". Anecdotes bloat the
     prompt, rot as the codebase moves on, and carry no authority at run time. Generalize
     the consequence instead ("a truncated gate can read green while the untruncated
     re-run fails"). Keep what is operational: measured-behavior enumerations the agent
     must quote verbatim and generic failure shapes. The
     incident detail stays in the lesson's **Applied** entry — the index is the record,
     git is the archive, the prompt is the rule.
   - **No cross-file cascades in one lesson.** If a fix touches the coordinator *and* the implementer
     contract, split it into two entries so each can be approved independently.

4. **Present one lesson at a time.** For each: the observed failure in one line, the diff,
   and the cost of leaving it unfixed. Ask for approve / reject / edit. Do not batch —
   batched prompt changes are how contracts drift without anyone noticing.

5. **Apply approved edits**, then move the entry to **Applied** with a one-line summary.
   Move rejected entries to **Declined** with the user's stated reason, verbatim if given.
   Every applied hunk inserts its anchor on the line above the rule:
   `<!-- lesson: <slug> -->` (multi-hunk: `<slug>-2`, `-3`). The post-write
   verification extends to: anchor present, frontmatter still single-line. After the
   round's edits, regenerate the index
   (`python3 .agents/skills/improving-harness-metalearn/scripts/regen_index.py`) so the
   applied lessons are findable next round.

6. **Report** what landed, what was declined, and what remains queued.

7. **Size check — propose decomposition for oversized agent defs.** For each
   `agents/*.md (thin shells) and AGENTS.md` touched in this review round, count its lines. If it
   exceeds ~400 lines, propose a `prompt-decompose` pass as a follow-up: name
   the file, its line count, and the cap/merge budget (at most ~3–5 docs). Do
   **not** auto-run it — the user approves. State the invocation
   (`/prompt-decompose` or ask the skill directly) and leave the decision to
   the user. This step proposes; it does not execute.

8. **Record the round and evaluate the thresholds.** Append one block to
   `.agentic-engineering/lessons/RUNS.md`: date · reviewed/applied/declined counts · already-fixed
   hits · duplicates dropped · stranded entries recovered · drift flags · approval-gate
   slips (own them if they happened) · upstreamed · queue sizes before/after. Then propose `improving-harness-metalearn` by name if any
   threshold holds — uncompressed Applied backlog > 40, any drift flag, more than one
   duplicate append since the last improving-harness-metalearn run, any approval-gate slip, or a
   def over `BODY_LINE_THRESHOLD` that decomposition cannot shrink — naming the
   triggering metric and leaving the decision to the user. Never auto-run it.

9. **Propose the upstream PR.** If any lesson applied this round is scoped `upstream`,
   list them and propose a pull request to the template repository (`template_repo` in
   `docs/agent_invariants.md` → Project config) carrying each rule, its anchor, and its
   compressed **Applied** entry — so every project that later syncs from the template gets
   a consistent index. Do not open it without the user's go-ahead; this step proposes.

## Local vs upstream

This project's agents came from a shared template, and more than one project runs them. A
lesson belongs to one of two places, and routing it wrong either forks the shared agents
or pollutes them with one project's facts.

- **`local`** — a fact about *this* project: a command, a path, a stack-specific trap, a
  domain invariant, a tool gotcha. It lands in `docs/agent_invariants.md` (Project config,
  Gate commands, Blocking conditions, Mutation shapes, or Project tool rules) or in
  `CLAUDE.md` — never inside an agent or procedure file. The agent files read those
  sections at run time, so the fact reaches every agent without editing one.
- **`upstream`** — a defect in the generic instructions: a rule every project running these
  agents would want. It lands in the agent/procedure/skill file here as usual, AND is
  proposed back to the template (step 9).

The test: would this rule still be true, word for word, in a project with a different
language, framework, and domain? Yes → `upstream`. It names this project's stack, paths,
or domain → `local`. When unsure, ask the user; an ambiguous lesson is usually a generic
rule wearing a local example — split it: the rule upstream, the example local.

A local lesson that edits `docs/agent_invariants.md` or `CLAUDE.md` is still presented one
at a time and applied only on approval, exactly like any other lesson.

## Hard guardrails on editing these files

Breaking one of these silently disables an agent — the failure is invisible until someone
notices the agent never ran.

- **Frontmatter values MUST stay on a single line.** A multi-line `description:` causes the
  agent to be silently skipped at load. Use `\n` escapes if you need breaks. This applies to
  both `agents/*.md (thin shells) and AGENTS.md` and `SKILL.md` files.
- **Never edit the frontmatter `name:` field.** It is the invocation key. Renaming breaks
  every caller, including `subagent_type` references in other agent files and skills.
- **Never edit `description:` without checking callers.** It drives agent selection; a
  narrowed description can make an agent stop being chosen.
- **Never edit the `tools:` line without checking the role.** Adding/removing a tool changes
  what the agent can do at run time; the project's invariants (CLAUDE.md,
  `docs/agent_invariants.md`) assume specific tools are present or absent.
- **A `tools:` line is a request, not a guarantee, and never a record of what an agent got.**
  The session grants the actual set at spawn. Declared-but-ungranted is real and recurring:
  grants are often a strict subset of declarations — search tools withheld, a planning tool
  withheld, a messaging tool withheld from the coordinator, and a delegation tool arriving
  under the name `Agent` where the def declares `Task`. A declared-but-ungranted tool is
  **inert at load**: the agent loads and runs normally, and errors only when it calls the
  tool, which is recoverable — so it is **not** the silent-skip failure the multi-line-value
  rule above describes.
  **Before reading an absence as evidence about a declaration, verify the spawning checkout
  actually holds it.** The granted set tracks the spawning checkout's declared set, and a
  checkout's working tree and `HEAD` can diverge from `origin/<base_branch>` — so a
  implementer's `No such tool available` probe cannot distinguish "undeclared, consistent" from
  "declared, ungranted" until you check the spawning checkout's working tree and `HEAD`,
  never the remote branch. Two consequences, which is why this is written down rather than
  rediscovered:
  - **Do not delete a tool because an agent reported it unavailable.** Absence in one session
    is not evidence the name is wrong, and the runtime error does not distinguish a real tool
    that is disabled from a name that means nothing — so acting on it would strip names that
    are plainly correct. Route such a report to the user as a question, not an edit.
  - **Fix the assumption, not the declaration.** An agent that plans around a declared tool
    finds the gap at the moment it needs it, which is the worst time. The remedy belongs in
    the agent's prose: probe early, degrade to a named fallback, and surface the gap in the
    return shape rather than working around it silently. `code-implementer.md` Step 0 and its
    `toolGap` field are the worked example.
- **Verify after writing.** Re-read the frontmatter of any edited file and confirm it is
  still valid YAML with single-line values.
- **These files are prompts, not code.** Longer is not safer. If a new rule overlaps an
  existing one, amend the existing rule rather than appending a near-duplicate —
  contradictory instructions are worse than a missing one.

## Scope

In scope: `agents/*.md (thin shells) and AGENTS.md` (including `.agents/skills/*/procedures/*.md` — the
decomposed procedure docs are agent instructions), `.agents/skills/**/SKILL.md`.

Out of scope — route elsewhere:

- `CLAUDE.md` and `docs/agent_invariants.md` are in scope **only** for `local` lessons
  (see "Local vs upstream"), presented and approved one at a time. Everything else under
  `docs/` is the project's own documentation — a lesson that implies a change there is a
  project decision; surface it to the user.
- Deliberately personal material (a user's preferences toward the assistant, machine-local
  quirks) → the user's auto-memory. It is per-user and per-machine, and subagents do not
  load it — so anything shareable across the team and related to the agent workflow goes
  to the lessons queue instead, whatever its shape.
- Application code and configuration → not agent instructions; out of scope.

A lesson sometimes belongs in two places: the instruction file gets the *rule*, memory gets
the *recall hook*. That is fine — write both, and say so.

## Committing

Edits land uncommitted in the working tree, alongside the user's other `.claude/` changes.
Do not commit or open a PR unless asked. `agents/*.md (thin shells) and AGENTS.md` frequently carries uncommitted
hand edits — never revert or overwrite them; merge around them. When you do commit, stage
explicit paths only — never `git add -A`, and never anything in `secrets_files`.