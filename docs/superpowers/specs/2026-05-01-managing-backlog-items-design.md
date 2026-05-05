# Managing Backlog Items — Design

**Date:** 2026-05-01
**Status:** Approved (awaiting plan)
**Author:** Brainstormed with human partner, written by agent
**Target:** Personal skill in `joeshirey/superpowers` fork (not upstream); installed across multiple harnesses (Claude Code, OpenCode, Gemini CLI, Antigravity)

## Problem

Coding agents routinely surface incidental work mid-session — a TODO comment, an out-of-scope bug, a refactor opportunity, missing test coverage — and have only two unattractive responses: silently drop it, or silently expand the current task to handle it. Both are bad. Dropping loses real work the human partner cared about; expanding causes scope sprawl and tangled commits.

The human partner has been using a paste-in prompt to capture these items into a markdown backlog file with a structured procedure (check duplicates, confirm priority, draft entry, show before write). It works but requires manually pasting the prompt every time, and the procedure is not enforced — agents skip steps under time pressure or when the item "seems obvious."

A complementary problem: when items get completed during a normal working session, they accumulate as stale checked boxes in the open backlog instead of being moved to a Done section with a summary of what shipped, why it mattered, and how it was done. There is no skill that handles this transition.

## Goals

1. Provide a single trigger surface — both agent-initiated ("I noticed X while doing Y") and user-initiated ("add this to the backlog") — that forces a stop-and-decide rather than silent drop or silent scope expansion.
2. Enforce the structured capture procedure (duplicate check, priority decision, full template, show-before-write) every time, not just when the human partner remembers to paste it.
3. Handle the complete-and-move flow in the same session, so the human partner does not need a separate skill or workflow to maintain the Done section.
4. Keep storage decisions explicit and reversible: choose between local-only (`.local/BACKLOG.md`, gitignored) and tracked (`BACKLOG.md` at repo root) on first use; never silently modify gitignore; never auto-stage the backlog file.
5. Produce honest effort estimates (T-shirt sizes XS–XXL) without pestering the human partner for confirmation, while flagging XXL items as "decompose first" and disagreement-between-signals as a warning.

## Non-Goals

- **Backlog grooming.** Reviewing the backlog, reprioritizing across items, picking the next item to work on, bulk operations, or stale-item detection. These belong in a sibling `grooming-the-backlog` skill (see Future Work).
- **Cross-project unified backlog.** Each repo gets its own backlog file. No global "all my backlogs" view.
- **Time tracking, burndown charts, or velocity.** This is a markdown file, not a project-management system.
- **Replacing GitHub Issues / Linear / Jira.** This is for capture during agent sessions, not a primary issue tracker.
- **Upstream contribution.** This skill encodes the human partner's specific workflow (priority taxonomy with emojis, exact field structure, `.local/` directory convention). It would not pass `anomalyco/superpowers`'s "general-purpose only" bar. It lives in the fork and the human partner's personal skills directory.
- **Auto-staging or auto-committing the backlog file.** The human partner controls when (and whether) it gets committed.

## High-Level Design

One skill, `managing-backlog-items`, following the discipline-skill template used by `verification-before-completion` and `committing-work`. Pure SKILL.md, no scripts, no external dependencies.

```
skills/managing-backlog-items/SKILL.md
```

The skill defines two procedures (Capture and Complete) that share storage detection, file format, and show-before-write discipline. Both procedures are triggered by symptom-based language in the description so the agent recognizes them organically, not just on explicit user request.

**Boundary contract:** the skill never writes to the backlog file without an approved draft, never modifies `.gitignore` without asking, never stages the backlog file. The human partner controls every persistent change.

## Skill: `managing-backlog-items`

### Frontmatter

```yaml
---
name: managing-backlog-items
description: Use when noticing a tangential issue mid-session — a TODO, an out-of-scope bug, a refactor opportunity, missing test coverage — or when the human partner explicitly says to add to the backlog or mark a backlog item done. Forces a stop-and-decide: capture, do now, or drop.
---
```

The description names symptoms (the kinds of things the agent might notice) and the explicit verbal triggers, but does NOT summarize the procedure. Per `writing-skills` CSO guidance, summarizing workflow in the description causes agents to follow the description instead of reading the skill body.

### Two Triggers, One Skill

| Trigger | Source | Entry point |
|---|---|---|
| Capture | Agent-initiated (notices tangential issue) OR human-initiated ("add this to backlog") | Procedure A |
| Complete | Human-initiated ("we just finished X — move it to done" / "mark X done") | Procedure B |

### Storage Resolution (shared by both procedures)

Run before any read or write to the backlog file.

```
1. Look for existing backlog file in priority order:
   a. .local/BACKLOG.md  (local-only, gitignored)
   b. BACKLOG.md         (repo root, tracked)

2. Decide:
   - Exactly one exists  → use it.
   - Neither exists      → first-use prompt (below).
   - Both exist          → ambiguity prompt: "Found both .local/BACKLOG.md
                           and BACKLOG.md. Which should I use for this
                           operation? I will only read and write to the
                           one you pick; the other stays untouched."
```

**First-use prompt:**

> No backlog file found in this project. Where should I create it?
>
> 1. **`.local/BACKLOG.md`** — local-only, gitignored, private to your machine. (Recommended for personal task tracking and sensitive notes.)
> 2. **`BACKLOG.md`** at repo root — tracked in git, synced to GitHub, visible to collaborators.
>
> Pick 1 or 2.

**On `.local/` choice:**
- Create `.local/` directory if missing.
- Create `.local/BACKLOG.md` with the starter template (below).
- Check `.gitignore` for `.local/` (or equivalent pattern). If absent, **ask** the human partner: *"`.local/` is not in `.gitignore` — should I add it?"* Never modify `.gitignore` silently.

**On repo-root choice:**
- Create `BACKLOG.md` with the starter template.
- Do not modify `.gitignore`.
- Do not stage the file.

### Starter File Template

Written on first use. The legend lives in an HTML comment so it stays out of rendered markdown but is visible to any agent reading the file later.

```markdown
# Backlog

<!-- Managed by the managing-backlog-items skill.

     Priority legend:
       🔴 CRITICAL — actively breaks production / data loss / silent corruption
       🟠 HIGH     — significantly degrades reliability, observability, or DX
       🟡 MED      — meaningful improvement, no immediate pain
       🟢 LOW      — nice-to-have, polish

     Effort sizing: XS / S / M / L / XL / XXL based on complexity, LOC, and
     wall-clock time. XXL items should be decomposed before adding — break
     them into smaller items.
-->

## 🔴 CRITICAL

## 🟠 HIGH

## 🟡 MED

## 🟢 LOW

## Done
```

### Procedure A: Capture an Item

```
1. STOP-AND-ASK (agent-initiated trigger only)

   "I noticed <issue> while working on <current task>. This is tangential
    to what we're doing. Should I:
      (1) handle it now,
      (2) add it to the backlog,
      (3) drop it (not worth tracking)?"

   For human-initiated trigger ("add this to backlog"), skip step 1
   — the human partner has already decided.

2. RESOLVE STORAGE LOCATION
   Run the storage resolution flow above. On first use, prompt and
   create the file with the starter template.

3. CHECK FOR DUPLICATES
   Read the backlog file. Scan all four open-priority sections AND
   the Done section. Look for overlap by:
     - title (semantic similarity, not just substring)
     - code location (file paths, module names)
     - symptom (what's wrong from the outside)
   If a possible match is found, show it to the human partner and ask:
     update existing / supersede / proceed as new / cancel.

4. ESTIMATE PRIORITY AND EFFORT (silently, no confirmation prompt)

   Priority: pick one of 🔴 / 🟠 / 🟡 / 🟢 from the legend based on
   the issue's actual impact. The human partner confirms in step 6.

   Effort: estimate a T-shirt size using the guidelines below.
     - If estimate = XXL: STOP. Do not proceed to draft. Ask the
       human partner: "This looks XXL — bigger than a backlog item.
       Should we open a brainstorming session and spec it instead?"
     - If the three signals (complexity / LOC / time) disagree
       sharply, note the disagreement in the justification line.

5. DRAFT THE ENTRY (full markdown, no abbreviation)
   Use the open-item template below. If any field cannot be filled
   confidently, ASK the human partner before writing — never invent.

6. SHOW BEFORE WRITE
   Print the full drafted entry and the chosen priority section.
   Wait for the human partner's response: "yes" / "change X" / "cancel".

7. APPEND
   On approval, append the entry under the chosen priority section.
   Preserve existing items. Do not reorder. Do not stage the file.
```

### Procedure B: Mark an Item Done

```
1. LOCATE THE ITEM
   Resolve storage location. Read the backlog file. Search all
   open-priority sections for the item the human partner described.
   If the only match is in the Done section, surface that immediately:
   "Found <title> already in Done — did you mean to update its
   outcome, or did you finish a different item?"
     - Exactly one open match → confirm: "Found <title> under <priority>.
                                          Move to Done?"
     - Multiple open matches  → show all candidates, ask which.
     - No open match, only
       Done match             → as above (already-done check).
     - No match anywhere      → ask the human partner to clarify;
                                offer to create a fresh Done entry
                                from scratch if the work was completed
                                without ever being on the backlog.

2. DRAFT THE DONE ENTRY
   Use the Done template below. Carry forward:
     - Original title, with the same severity bubble preserved.
     - Today's date.
   Fill in:
     - What: what actually shipped (1–3 sentences).
     - Why: carry from the original 'Why it matters' field.
     - How: approach taken, key files / commits / PRs touched,
            anything surprising.

3. SHOW BEFORE WRITE
   Print the drafted Done entry and confirm the move.
   Wait for "yes" / "change X" / "cancel".

4. PERFORM THE MOVE
   On approval:
     - Remove the item (entire entry including the <details> block)
       from its current priority section.
     - Append the new Done entry to the Done section.
     - Do not stage the file.
```

### Templates

**Open backlog item:**

```markdown
- [ ] **<Short imperative title — 5-10 words>**

  <details>
  <summary>Context</summary>

  **Where**: <file:line or module path; concrete enough to grep>

  **Symptom**: <what's wrong, observed from outside the code>

  **Why it matters**: <user/operator/cost impact in concrete terms — not "for cleanliness">

  **Proposed fix**: <approach, with code sketch if non-trivial>

  **Acceptance**: <how we'll know it's done — usually 1-3 testable criteria>

  **Effort**: <XS | S | M | L | XL | XXL> — <one-sentence justification covering complexity / LOC / time>

  </details>
```

**Done entry** (severity bubble preserved from the original):

```markdown
- [x] 🟠 **<original title>** — <YYYY-MM-DD>

  <details>
  <summary>Outcome</summary>

  **What**: <what actually shipped, 1–3 sentences>

  **Why**: <carried from original 'Why it matters'>

  **How**: <approach taken, key files / commits / PRs touched, anything surprising>

  </details>
```

### Effort Sizing Guidelines

The agent estimates silently using these guidelines. The human partner confirms or pushes back during the show-before-write step — no separate confirmation prompt.

| Size | Complexity | LOC (rough) | Wall-clock | Examples |
|------|-----------|-------------|-----------|----------|
| **XS** | Trivial. One file, one obvious change. No new concepts. | < 20 | < 30 min | Typo, rename a variable, tweak a config value, add a missing log line. |
| **S** | Localized. 1–3 files, well-understood pattern. May add a single test. | 20–100 | 30 min – 2 hr | Small bug with clear repro, add a CLI flag, extract a small helper, missing null-check + test. |
| **M** | Moderate. Multiple files in one subsystem. Touches a real boundary. New tests required. | 100–400 | Half-day to 1 day | New endpoint with handler + validation + tests, refactor a single module, swap a library in a contained area. |
| **L** | Substantial. Crosses subsystem boundaries. Requires design thinking. Likely multiple PRs. Migration / rollout considerations. | 400–1,200 | 2–5 days | New feature spanning UI + API + storage, non-trivial refactor across 3+ modules, schema change with backfill. |
| **XL** | Large. Touches architecture. Many consumers. Needs a written design doc and probably a plan. Real unknowns. | 1,200–3,000 | 1–2 weeks | New service or module, framework upgrade with breaking changes, replacing a major dependency. |
| **XXL** | Project-scale. **Should be decomposed before being added to the backlog.** | > 3,000 | > 2 weeks | New product surface, rewriting a subsystem, multi-quarter migrations. |

**Two guardrails:**

1. **Signals must agree.** If complexity says M but LOC says XL and time says S, the estimate is wrong or the item is mis-scoped. Note the disagreement in the justification.
2. **XXL = decompose first.** When the agent's estimate lands on XXL, STOP. Do not proceed to draft. Recommend a brainstorming session instead.

### Priority Legend (verbatim)

- 🔴 **CRITICAL** — actively breaks production runs or causes data loss / silent corruption
- 🟠 **HIGH** — significantly degrades reliability, observability, or developer experience
- 🟡 **MED** — meaningful improvement, no immediate pain
- 🟢 **LOW** — nice-to-have, polish

### Red Flags — STOP if you find yourself doing any of these

- Writing to the backlog file before the human partner approved the draft
- Auto-staging the backlog file (`git add`)
- Adding to `.gitignore` without asking
- Skipping the duplicate check because the item "seems obviously new"
- Inventing field values when you don't have the information — ASK instead
- Silently expanding scope (just doing the tangential work) instead of asking capture / do-now / drop
- Drafting an XXL entry instead of recommending decomposition
- Reordering existing items in the backlog
- Modifying items other than the one being captured or completed
- Telling the human partner "I added X to the backlog" without first showing the draft and getting approval

### Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "This item is obviously new — duplicate check is a waste of time" | The whole point of the duplicate check is that "obvious" is wrong half the time. Read the file. |
| "The user said 'add to backlog' so I can skip the show-before-write step" | The verbal trigger replaces step 1 of capture. It does NOT replace step 6. Always show the draft. |
| "I'll just fix this little tangential thing while I'm here" | That's silent scope expansion. Stop. Ask: do-now / backlog / drop. |
| "I don't have enough info for the Where field, but the rest is good" | Don't invent. Ask. Missing-info shortcuts produce backlog entries that can't be acted on. |
| "Estimating effort takes too long, I'll skip the size" | The size is required. Pick one based on the guidelines and move on. |
| "This is XL or XXL but I'll just write it up anyway" | XXL means decompose first. XL is allowed but should be flagged as needing a real design pass before work starts. |
| "I'll just stage the backlog file so the user doesn't have to" | No. The human partner controls when the file is committed. |
| "`.gitignore` is missing `.local/` — I'll just add it" | No. Ask first. |

### What This Skill Is NOT

- **A grooming tool.** No reprioritization, no "what should I work on next?", no bulk review, no stale-item cleanup. Future sibling skill.
- **A primary issue tracker.** GitHub Issues / Linear / Jira are still where formal issues live. This is a quick capture file for incidental work surfaced during agent sessions.
- **A cross-project view.** One backlog file per repo.
- **A status-tracking system.** Items are either open (with a priority section) or done. No "in progress," no assignees, no due dates.

### Integration

**Pairs with:**
- `brainstorming` — XXL items get routed here instead of becoming backlog entries.
- `committing-work` — when the human partner finishes a backlog item and commits, this skill handles the move-to-done in the same session.

**Distinct from:**
- `writing-plans` — this skill captures lightweight items, not multi-step implementation plans.
- (Future) `grooming-the-backlog` — review, reprioritization, picking next item.

## Future Work

A separate sibling skill, tentatively `grooming-the-backlog`, will handle:
- Bulk review of open items.
- Reprioritization across items.
- Stale-item detection ("this has been LOW for six months — drop or promote?").
- Picking the next item to work on, with context about other open items.
- Bulk operations (move all `🟢 LOW` items into a `LATER.md` archive, etc.).

That skill will be brainstormed and built separately, after `managing-backlog-items` has been used in real sessions for long enough to know what grooming actually needs to handle.

## Open Questions

None. All design decisions confirmed during brainstorming.
