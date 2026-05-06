---
name: managing-backlog-items
description: "Use when noticing a tangential issue mid-session — a TODO, an out-of-scope bug, a refactor opportunity, missing test coverage — or when the human partner explicitly says to add to the backlog or mark a backlog item done. Forces a stop-and-decide: capture, do now, or drop."
---

# Managing Backlog Items

## Overview

Capture incidental work surfaced during agent sessions into a structured `BACKLOG.md`, and move completed items to a Done section in the same session. Two triggers, one skill: **capture** (agent-noticed or human-requested) and **complete** (human-requested).

**Core principle:** Never silently drop incidental work. Never silently expand scope. Always show the draft before writing.

**Announce at start:** "I'm using the managing-backlog-items skill to <capture this | move this to done>."

## Iron Law

```
NO WRITE TO THE BACKLOG FILE WITHOUT AN APPROVED DRAFT
```

**Violating the letter of this rule is violating the spirit of this rule.**

## When to Use

**Use when:**
- You notice something tangential while working on the current task (a TODO, an out-of-scope bug, a refactor opportunity, missing test coverage, a stale comment, an obvious-but-not-in-scope improvement).
- The human partner explicitly says "add this to the backlog" / "backlog this" / equivalent.
- The human partner says they just finished a backlog item and wants it moved to Done ("mark X done", "we just finished X").

**Do NOT use for:**
- Bulk reprioritization or "what should I work on next?" — that's grooming, future skill.
- Items that are firmly inside the current task's scope — just do them.
- Tracking work that already lives in GitHub Issues / Linear / Jira — this is for incidental capture during agent sessions, not a primary issue tracker.

## Storage Resolution (run before any read or write)

```
1. Look in priority order:
   a. .local/BACKLOG.md   (local-only, gitignored)
   b. BACKLOG.md          (repo root, tracked)

2. Decide:
   - Exactly one exists  → use it.
   - Neither exists      → first-use prompt (below).
   - Both exist          → ambiguity prompt (below).
```

**First-use prompt** (when neither file exists):

> No backlog file found in this project. Where should I create it?
>
> 1. **`.local/BACKLOG.md`** — local-only, gitignored, private to your machine. (Recommended for personal task tracking and sensitive notes.)
> 2. **`BACKLOG.md`** at repo root — tracked in git, synced to GitHub, visible to collaborators.
>
> Pick 1 or 2.

**Ambiguity prompt** (when both files exist):

> Found both `.local/BACKLOG.md` and `BACKLOG.md`. Which should I use for this operation? I will only read and write to the one you pick; the other stays untouched.

**On `.local/` choice:**
- Create `.local/` directory if missing.
- Create `.local/BACKLOG.md` with the starter template (below).
- Check `.gitignore` for `.local/`. If absent, **ASK** the human partner: *"`.local/` is not in `.gitignore` — should I add it?"* Never modify `.gitignore` silently.

**On repo-root choice:**
- Create `BACKLOG.md` with the starter template.
- Do not modify `.gitignore`.
- Do not stage the file.

## Starter File Template

```markdown
# Backlog

<!-- Managed by the managing-backlog-items skill.

     Priority legend:
       - 🔴 **CRITICAL** — actively breaks production runs or causes data loss / silent corruption
       - 🟠 **HIGH** — significantly degrades reliability, observability, or developer experience
       - 🟡 **MED** — meaningful improvement, no immediate pain
       - 🟢 **LOW** — nice-to-have, polish

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

## Procedure A: Capture an Item

```
1. STOP-AND-ASK (agent-initiated trigger only)
   "I noticed <issue> while working on <current task>. This is tangential
    to what we're doing. Should I:
      (1) handle it now,
      (2) add it to the backlog,
      (3) drop it (not worth tracking)?"
   For human-initiated trigger ("add to backlog"), skip step 1.

2. RESOLVE STORAGE LOCATION (see above)

3. CHECK FOR DUPLICATES
   Read the backlog file. Scan all four open-priority sections AND
   the Done section. Look for overlap by:
     - title (semantic similarity, not just substring — e.g. a grep for "timeout" misses an entry titled "Hung connections in HTTP client")
     - code location (file paths, module names)
     - symptom (what's wrong from the outside)
   If a possible match: show it to the human partner and ask:
     update existing / supersede / proceed as new / cancel.

4. ESTIMATE PRIORITY AND EFFORT (silently — no confirmation prompt)
   Priority: pick from 🔴 / 🟠 / 🟡 / 🟢 based on impact.
   Effort: estimate using the table below.
     - If estimate = XXL: STOP. Do not proceed to draft. Recommend a
       brainstorming session instead.
     - If signals (complexity / LOC / time) disagree sharply: note
       the disagreement in the justification line.

5. DRAFT THE ENTRY (full markdown, no abbreviation)
   Use the open-item template. If any field cannot be filled
   confidently: ASK the human partner before drafting. Never invent,
   AND never write "TBD", "needs profiling", "to be determined", or
   similar placeholders. Placeholder-filled entries cannot be acted
   on later — ASK now while the context is fresh.

6. SHOW THE DRAFT AND GET EXPLICIT APPROVAL BEFORE WRITING
   Print the full drafted entry and the chosen priority section.
   Wait for the human partner's response: "yes" / "change X" / "cancel".

7. APPEND
   On approval, append under the chosen priority section. Preserve
   existing items. Do not reorder. Do not stage the file.
```

## Procedure B: Mark an Item Done

```
1. LOCATE THE ITEM
   Resolve storage. Read the file. Search open sections for the item.
   If only match is in Done: "Found <title> already in Done — did you
   mean to update its outcome, or did you finish a different item?"
     - Exactly one open match → confirm: "Found <title> under <priority>.
                                          Move to Done?"
     - Multiple open matches  → show all, ask which.
     - No match anywhere      → ask to clarify; offer to create a fresh
                                Done entry from scratch.

2. DRAFT THE DONE ENTRY
   Use the Done template below. The Done entry MUST include:
     - The original severity bubble (🔴/🟠/🟡/🟢) preserved on the title
     - Today's date stamped on the title line
     - A `<details>` block containing What / Why / How
   Field content:
     - Title: original title verbatim
     - What: what actually shipped (1–3 sentences)
     - Why: carry from the original 'Why it matters' field
     - How: approach taken, key files / commits / PRs touched, anything surprising

3. SHOW THE DRAFT AND GET EXPLICIT APPROVAL BEFORE WRITING
   Print the drafted Done entry. Wait for "yes" / "change X" / "cancel".

4. PERFORM THE MOVE
   On approval:
     - Remove the entire entry (including <details> block) from its
       current priority section.
     - Append the new Done entry to the Done section.
     - Do not stage the file.
```

## Templates

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

**Done entry** (severity bubble preserved from original):

```markdown
- [x] <severity bubble> **<original title>** — <YYYY-MM-DD>

  <details>
  <summary>Outcome</summary>

  **What**: <what actually shipped, 1–3 sentences>

  **Why**: <carried from original 'Why it matters'>

  **How**: <approach taken, key files / commits / PRs touched, anything surprising>

  </details>
```

## Effort Sizing Guidelines

Estimate silently. The human partner sees the size during show-before-write and pushes back if they disagree.

| Size | Complexity | LOC (rough) | Wall-clock | Examples |
|------|-----------|-------------|-----------|----------|
| **XS** | Trivial. One file, one obvious change. No new concepts. | < 20 | < 30 min | Typo, rename a variable, tweak a config value. |
| **S** | Localized. 1–3 files, well-understood pattern. May add a single test. | 20–100 | 30 min – 2 hr | Small bug with clear repro, add a CLI flag, extract a small helper. |
| **M** | Moderate. Multiple files in one subsystem. New tests required. | 100–400 | Half-day to 1 day | New endpoint with handler + validation + tests, refactor a module. |
| **L** | Substantial. Crosses subsystem boundaries. Multiple PRs / multi-day. Migration considerations. | 400–1,200 | 2–5 days | Feature spanning UI + API + storage, schema change with backfill. |
| **XL** | Large. Touches architecture. Many consumers. Needs design doc. | 1,200–3,000 | 1–2 weeks | New service, framework upgrade with breaking changes. |
| **XXL** | Project-scale. **Decompose before adding.** | > 3,000 | > 2 weeks | New product surface, rewriting a subsystem. |

**Two guardrails:**
1. **Signals must agree.** If complexity says M but LOC says XL and time says S, the estimate is wrong. Note the disagreement in the justification.
2. **XXL = decompose first.** Don't draft an XXL entry. Recommend brainstorming and decomposition into smaller items.

## Priority Legend

- 🔴 **CRITICAL** — actively breaks production runs or causes data loss / silent corruption
- 🟠 **HIGH** — significantly degrades reliability, observability, or developer experience
- 🟡 **MED** — meaningful improvement, no immediate pain
- 🟢 **LOW** — nice-to-have, polish

## Red Flags — STOP if you find yourself doing any of these

- Writing to the backlog file without first showing the draft and getting explicit approval
- Auto-staging the backlog file (`git add` on it as part of any operation)
- Adding to `.gitignore` without asking
- Skipping the duplicate check because the item "seems obviously new"
- Inventing field values when you don't have the information — **ASK** instead
- Filling unknown fields with "TBD" / "needs profiling" / "to be determined" placeholders instead of asking — placeholders produce backlog entries that cannot be acted on later
- Treating an "obvious" or "simple" capture request as exempt from the procedure — every backlog write goes through the full procedure (storage check, duplicate check, structured template, show-before-write). There is no fast path
- Silently expanding scope (just doing the tangential work) instead of asking capture / do-now / drop
- Drafting an XXL entry instead of recommending decomposition
- Reordering existing items in the backlog
- Modifying items other than the one being captured or completed
- Telling the human partner "I added X to the backlog" without first showing the draft and getting explicit approval
- Moving an item to Done without showing the draft and getting explicit approval
- Stripping the `<details>` block, severity bubble, or date from a Done entry "because the PR has the history" — the Done block IS the canonical context, captured by someone who just did the work; future-you will not have the PR open in another tab

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "This item is obviously new — duplicate check is a waste of time" | The whole point of the duplicate check is that "obvious" is wrong half the time. Read the file. |
| "At several hundred lines, reading the whole thing to add one item would be a waste — a targeted grep is sufficient" | A grep for "timeout" misses entries titled "Hung connections in HTTP client" — those are obvious semantic duplicates that substring search will not find. The duplicate check requires SEMANTIC scanning of titles, code locations, and symptoms. Read the file. |
| "The human said 'add to backlog' so I can skip the show-before-write step" | The verbal trigger replaces step 1 of capture. It does NOT replace step 6. Always show the draft and get explicit approval before writing. |
| "I'll just fix this little tangential thing while I'm here" | That's silent scope expansion. Stop. Ask: do-now / backlog / drop. |
| "I don't have enough info for the Where field, but the rest is good — I'll just write something plausible" | Don't invent. Ask. Backlog entries with invented fields can't be acted on later. |
| "Estimating effort takes too long, I'll skip the size" | The size is required. Pick one based on the guidelines and move on. |
| "This is XXL but I'll just write it up anyway — better captured than lost" | XXL means decompose first. Recommending a brainstorming session IS capturing — it captures the right way. |
| "I'll just `git add` the backlog file so the human doesn't have to" | No. The human partner controls when the file is committed. |
| "`.gitignore` is missing `.local/` — I'll just add it, it's clearly what they want" | No. ASK first. Even if they said 'set it up however' earlier — gitignore changes deserve their own confirmation. |
| "I have all the info to mark this done — I'll just move it without confirming" | No. Show the drafted Done entry. The human partner may want to adjust the What/Why/How. |
| "I'm being asked to be efficient — confirmations slow things down" | The confirmations ARE the efficiency. They prevent backlog churn from wrong entries. |
| "Done items don't need the full context — the PR has the history" | The Done `<details>` block IS the context, captured at the moment by someone who just did it. Future-you reading the backlog three months later will not have the PR open in another tab. Always preserve What / Why / How and the severity bubble. |
| "This is a straightforward request with all the details given — invoking the skill would be overhead" | The Iron Law applies regardless of how simple the request seems. There is no fast path. Run the full procedure. |
| "The skill would just confirm the obvious decision is 'capture' — I can skip ahead" | Step 1 of Procedure A is one of seven. Skipping ahead is not the savings you think it is — the duplicate check, structured template, and show-before-write all matter even when the do-now / backlog / drop choice is obvious. |
| "I'll fill the unknown fields with TBD — that captures honest uncertainty" | TBD-filled entries are dead on arrival. Future-you cannot act on a backlog item where Where=TBD, Symptom=TBD, Acceptance=TBD. ASK now while the context is fresh, before drafting. |

**All of these mean: STOP. Run the procedure as written.**

## What This Skill Is NOT

- **A grooming tool.** No reprioritization, no "what should I work on next?", no bulk review, no stale-item cleanup. Future sibling skill.
- **A primary issue tracker.** GitHub Issues / Linear / Jira are still where formal issues live. This is a quick capture file for incidental work.
- **A cross-project view.** One backlog file per repo.
- **A status-tracking system.** Items are open (with a priority section) or done. No "in progress," no assignees, no due dates.

## Integration

**Pairs with:**
- `brainstorming` — XXL items get routed there instead of becoming backlog entries.
- `committing-work` — when the human partner finishes a backlog item and commits, this skill handles the move-to-done in the same session.

**Distinct from:**
- `writing-plans` — this skill captures lightweight items, not multi-step implementation plans.
- (Future) `grooming-the-backlog` — review, reprioritization, picking next item.
