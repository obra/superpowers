---
name: creating-tickets
description: "Create a GitHub issue ticket for this repo: slug the goal, check for duplicates, write the Overview/Scope/Acceptance criteria/Out of scope body, create the project:<slug> label, and choose a severity. Use whenever a ticket is filed — by the code-coordinator during decomposition, by the review gate filing an advisory, or directly by the user."
---

# Create a ticket

Universal ticket creation for this repo. Everything needed to go from a described unit of
work to a filed GitHub issue is here; no procedure doc has to be read alongside it.

This skill does **not** decide *how many* tickets a goal needs, or whether to subdivide —
that judgment belongs to whoever is calling it. It covers one ticket, from slug to filed
issue.

## 1. Slug the goal

Lowercase, dashes, ≤40 chars (e.g. `add-export-button`). Use this for the `project:<slug>`
label and the per-ticket worktree names (`ticket_worktree_pattern`, see
`docs/agent_invariants.md` → Project config).

**If this ticket belongs to a project already on record, reuse that project's slug rather
than minting a new one** — `gh label list` shows the `project:*` labels in use. This applies
whenever a ticket is filed mid-project: an advisory finding raised during review belongs to
the project whose review raised it. A freshly minted singleton slug drops the ticket out of
every `gh issue list --label "project:<slug>"` query that project runs, so it gets filed and
then never dispatched.

## 2. Check for existing issues

`gh issue list --label "project:<slug>" --state all`. Don't duplicate.

## 3. Write the ticket body

Each ticket is **one PR-sized unit** — small enough that a `code-implementer` can finish it in
one focused session. Use this body schema:

```markdown
# Background

[Optional — see below. The context a reader needs before the ticket makes sense: the prior
decision it follows from, the measurement that motivated it, the defect it came out of. The
reason the ticket exists falls out of this; do not state it separately.]

# Overview

[1–3 sentences. What this ticket entails.]

# Scope

- Files / areas to touch (with paths)
- Functions or modules to add or modify

# Acceptance criteria

- [ ] criterion 1
- [ ] criterion 2
- [ ] criterion 3

# Out of scope

- [What this ticket deliberately does NOT do]

# Depends on

- #N (only if this ticket is blocked on another)
```

**`# Background` is optional, and the default is to omit it.** Leave it out whenever the
`# Overview` and `# Scope` already make the ticket comprehensible on their own — which is the
common case, and includes every ticket that follows obviously from the goal that spawned it.
Include it only when a competent implementer reading the rest of the body would be missing
something needed to do the work correctly: a decision taken elsewhere, a measurement whose
number the criteria depend on, an earlier attempt that failed for a reason worth not
repeating. Restating the goal, repeating what `# Scope` already says, or arguing that the work
is worth doing is not background. The test: if deleting `# Background` would not change what
the implementer does, it should not be there.

Acceptance criteria are the definition of done. The implementer will be evaluated against them,
and the reviewer will check criteria-fit. Make them **checkable** — verbs, not adjectives.

**State the property that must hold, never the mechanism for observing it.** Write "a
stray ticket worktree does not appear as untracked in the main checkout", not "`/tkt-*/`
appears in `.gitignore`". Write "the committed lock file reproduces from a clean checkout",
not "the lock file records four entries". Write "do not release the marker unless the
credential is proven set", not "poll the session getter" or "check the timestamp moved". A
mechanism in a criterion is an unverified claim that the observable is *specific* to the
property — and the implementer will implement it faithfully, because you told it to, which
manufactures a proof of the thing the criterion was meant to prove. It also freezes a number
or a file path into the definition of done, and both go stale. If a mechanism is genuinely
useful, put it under a `# Notes for the implementer` heading marked unverified, and require the
Implementer to establish that nothing but the property can produce that observable before
building on it.

**An implementer or reviewer that refutes a criterion has succeeded.** Route the correction to the
user as a decision, amend the issue body, and never treat it as the implementer failing to comply.

**Never write a count, a date stamp, or a file inventory into a criterion.** "the suite
still passes" is checkable forever; "the suite reports 648 passed" is wrong after the next
ticket and fails nothing when it rots.

When a ticket picks among options, name the **non-chosen** options explicitly under
`# Out of scope` as deferred-and-tracked-here. An option left implicit gets re-discovered by
the reviewer and filed as a fresh ticket describing the parent's own body.

**Blocking-condition rule:** a ticket that touches a code path covered by any condition in
`docs/agent_invariants.md` → Blocking conditions states in `# Scope` which of those conditions
it touches. Name the condition by its bold lead phrase. This is what lets the implementer and
reviewer both know, before either starts, which blocking condition is in play, rather than
the reviewer discovering it by inspection.

## 4. Create the label, then file the issue

**Create the `project:<slug>` label before the first issue, then add it and `status:ready`
to each new issue.** The five `status:*` labels are repo-wide and set up once; a new
project's `project:<slug>` label does not exist yet, and `gh issue create --label` errors
with `could not add label: not found` on a label that isn't there yet — so creation has to
happen first, not just be handled as a denial fallback.

```sh
gh label list --json name --jq '.[].name' | grep -qx "project:<slug>" || \
  gh label create "project:<slug>" --color c5def5 --description "Part of the <slug> project."
gh issue create --label "project:<slug>,status:ready,severity:<high|medium|low>" --title "..." --body "..."
```

If creating the label is **denied** (as opposed to merely not yet existing), do not retry —
pick the closest existing `project:*` label from `gh label list`, use it, and say so in your
report.

## 5. Choose the severity label

**Choose the severity label by impact-if-unaddressed, not by effort:**

- `severity:high` — crash, silently wrong output, or a load-bearing invariant breach. Fix
  before lower-severity work.
- `severity:medium` — latent drift, a coverage gap on a load-bearing function, or structural
  debt with real but bounded impact.
- `severity:low` — pure cleanup, behaviour-preserving refactor, or convention. No behaviour or
  metric at risk.

The three `severity:*` labels are repo-wide and set up once, like `status:*`. Severity is
orthogonal to `status:*` — every ticket carries exactly one severity for its whole life; do
not change it as the ticket moves through the status state machine.
