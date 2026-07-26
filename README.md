# minipowers

A minimal fork of [obra/superpowers](https://github.com/obra/superpowers) for
Claude Code. Six skills survived the cut; a seventh (executing-specs) was
added in this fork. The hooks, the ports to other harnesses, and most of the
process scaffolding did not survive.

Forked from upstream **v6.1.1** (commit
[`d884ae0`](https://github.com/obra/superpowers/commit/d884ae04edebef577e82ff7c4e143debd0bbec99),
July 2026). Upstream history is preserved in this repo up to that commit.

Why each skill survived (and eight didn't): see [ANALYSIS.md](ANALYSIS.md).

## Skills

| Skill | What it does |
|---|---|
| **brainstorming** | Turn an ambiguous idea into an approved design spec through one-question-at-a-time dialogue, before any code. Ends with a tier triage that routes small changes to executing-specs and large ones to writing-plans. |
| **writing-plans** | Turn a spec into bite-sized tasks with exact file paths, interfaces, and test intent. Pinned requirements rather than pre-written code. Heavy tier only. |
| **executing-specs** | Execute a small-scope spec directly, with no plan document: implementer subagents work from the spec itself, one whole-diff review, then everything squashes into a single commit. Escalates to the heavy tier if scope balloons mid-flight. |
| **subagent-driven-development** | Execute a plan with a fresh implementer subagent per task, an adversarial reviewer per task, and a whole-branch review at the end. File-based handoffs (the `task-brief` and `review-package` scripts) keep the orchestrator's context small, and a progress ledger survives compaction. |
| **test-driven-development** | Red-green-refactor, with the step that matters spelled out: watch the test fail, for the right reason. Includes a debugging stop rule (three failed fixes means the problem is architectural). |
| **verification-before-completion** | No success claims without running the verification command in the same message. |
| **writing-skills** | TDD for process documentation: pressure-test a skill on subagents before trusting it. |

The flow is two-tier, forked by a triage step at the end of brainstorming:

- **Light** (small change, ~1-5 files, single subsystem):
  **brainstorming → executing-specs** - no plan document, no per-task
  gates, one squashed commit at the end.
- **Heavy** (many files, new interfaces, migrations):
  **brainstorming → writing-plans → subagent-driven-development** - full
  task decomposition, per-task review gates, a commit at every step.

Both tiers use TDD inside implementation and verification before every
completion claim. Subagent model policy is fixed: implementers run on
Sonnet, reviewers on Opus.

## Install

From a local clone:

```
/plugin marketplace add /path/to/minipowers
/plugin install minipowers@minipowers-dev
```

Or straight from GitHub:

```
/plugin marketplace add ipoeyke/minipowers
/plugin install minipowers@minipowers-dev
```

There is no SessionStart hook. Skills trigger through Claude Code's normal
description-based routing, or explicitly (`/minipowers:brainstorming`, etc.).

## What was cut from upstream

Eight skills, the SessionStart hook, and all the packaging for other
harnesses. Three of the eight (requesting-code-review, receiving-code-review,
systematic-debugging) were folded into the surviving skills rather than
deleted outright. The full list and per-skill rationale are in
[ANALYSIS.md](ANALYSIS.md).

## Credit

The good ideas here are Jesse Vincent's
([obra/superpowers](https://github.com/obra/superpowers), MIT). This fork
only takes things away.

Three questioning habits in the brainstorming skill (look up facts instead of
asking, attach a recommended answer to every question, resolve decisions in
dependency order) were adapted from Matt Pocock's
[grilling skill](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md) (MIT).
