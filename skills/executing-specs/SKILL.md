---
name: executing-specs
description: Use when executing an approved small-scope spec directly, without an implementation plan - produces a single commit at the end.
---

# Executing Specs

Execute an approved spec directly: implementer subagent(s), one whole-diff
review, a fix loop, verification, then a single squashed commit.

This is the light-tier terminal skill, reached via brainstorming's tier
triage - for small, single-subsystem changes where a plan document and
per-task review gates would be pure overhead. It is not a shortcut you pick
on your own; brainstorming decides the tier from concrete signals and
confirms with the user before routing here.

**Core principle:** the spec, including its Implementation notes section,
is the whole brief. There is no plan document, no task briefs, no per-task
review gates, no progress ledger. One implementer thread (sequential
dispatches if the spec needs more than one), one final review, one commit.

## The Process

### 1. Setup

Record the base SHA before any changes: `git rev-parse HEAD`. Same branch
rule as subagent-driven-development: never start implementation on
main/master without explicit user consent.

### 2. Implement

Dispatch implementer subagent(s) sequentially, using
[implementer-prompt.md](implementer-prompt.md) as the template. The spec
file - including its Implementation notes section - is the brief; hand the
subagent its path directly.

Each implementer follows minipowers:test-driven-development for the code it
writes.

Checkpoint commits are allowed and encouraged during execution: they give
rollback points if a later step goes wrong, and let the review diff use a
commit range instead of an uncommitted working-tree diff. They are not the
final commit - the whole dispatch gets squashed into one commit at the end
(see Squash below).

If the spec's Implementation notes describe work that needs more than one
dispatch, dispatch them sequentially and summarize each prior dispatch's
outcome in the context of the next.

Handle non-DONE statuses as in subagent-driven-development's Handling
Implementer Status section: read and address concerns, provide missing
context and re-dispatch, or escalate.

### 3. Review

One final reviewer subagent over the whole diff (the base SHA from Setup
`..` HEAD), checking spec compliance and code quality with the same rubric
as subagent-driven-development's final whole-branch review
([code-reviewer.md](../subagent-driven-development/code-reviewer.md)).

Generate the diff with SDD's review-package script, referenced from the SDD
skill directory: `../subagent-driven-development/scripts/review-package
BASE HEAD` - it prints the file path it wrote. Hand the reviewer that path
instead of pasting the diff into your own context.

Also pass a findings file path -
`.minipowers/sdd/review-findings-BASE..HEAD.md` - and require the
reviewer to append each finding as it confirms it (see
code-reviewer.md's Findings File section). Long reviews get interrupted
or exhaust context; the file survives when the reviewer does not. If a
dispatch ends without a report, read the file first, then re-dispatch
only for what it does not cover, handing the file over to be amended.

### 4. Fix Loop

If the reviewer finds Critical or Important issues, dispatch one fix
subagent with the complete findings list - not one fixer per finding - then
regenerate the review package for the same range and re-review. Repeat
until the reviewer reports no open Critical/Important issues.

Pass the fixer the findings file path rather than pasting findings inline.

### 5. Verify

Run the minipowers:verification-before-completion gate before squashing:
full test suite green, evidence before any completion claim.

### 6. Squash

Collapse the whole dispatch into one commit:

```
git reset --soft <base SHA from Setup>
git commit -m "<type>: <description>"
```

The spec file is not committed separately - stage it alongside the code
changes so it lands in this same commit (see brainstorming's Tier Triage
and Documentation guidance). Conventional Commits subject line, no body.

### 7. Wrap-up

If work happened on a branch, ask the user about branch disposition (merge
locally / push + PR / leave as-is) - the same question
subagent-driven-development asks at the end. If work happened directly on
the base branch by explicit user consent from Setup, there's nothing
further to ask.

## Explicitly Absent

By design, none of the following exist on this path:

- Progress ledger
- Kickoff docs commit (the spec isn't committed separately at all - see Squash)
- Task-brief files
- Per-task report files
- Per-task review gates

## Model Selection

Same policy as subagent-driven-development: implementers and fix subagents
run on Sonnet, reviewers run on Opus. Always specify the model explicitly
when dispatching a subagent - an omitted model silently inherits your
session's model, often the most expensive one available. If a Sonnet
implementer reports BLOCKED for reasoning depth, re-dispatch that task on
Opus.

## Escalation Valve

If implementation reveals the scope was misjudged - file count ballooning
past the light-tier criteria, or interface ambiguity between components
emerging that the spec didn't anticipate - STOP. Do not push through or
improvise a plan mid-execution.

Report to the user what changed since the spec was written, and offer to
route the remaining work through writing-plans and
subagent-driven-development instead. Checkpoint commits from the Implement
step make this safe: the work already done is committed and recoverable.
Do NOT run the Squash step before escalating - squashing collapses the very
checkpoints that make the handoff clean.

## Never

- Start implementation on main/master without explicit user consent
- Dispatch implementer subagents in parallel
- Dispatch a reviewer without a findings file path
- Re-dispatch a reviewer from scratch after an interrupted review without
  first reading the file
- Squash before the reviewer reports no open Critical/Important issues
- Squash before resolving (or escalating) a scope-ballooned dispatch
- Skip the verification gate before squashing
