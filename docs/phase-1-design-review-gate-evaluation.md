# Phase 1 Design Review Gate — Behavioral Evaluation

Date: 2026-07-25

Scope: candidate-design review inside `brainstorming` only.

## Method

Each pressure scenario ran in a fresh Claude Code 2.1.219 print session using
Claude Sonnet 5. The baseline appended the unmodified `brainstorming` skill;
the post-change arm appended the modified skill. Scenarios prohibited tools so
they measured workflow decisions rather than repository mutation.

The official Codex integration was separately verified with:

- `claude plugin details codex@openai-codex` — enabled plugin 1.0.4;
- the plugin setup helper — Codex CLI 0.145.0 available and authenticated;
- a read-only task through `codex-companion.mjs task` — completed in 1m 5s;
- Claude trace session `539ad3bb-6833-4fdf-bd91-fe99710e99e4` — dispatched
  both `general-purpose` and `codex:codex-rescue` reviewers with the shared
  candidate-design brief.
- Claude trace session `d90687a4-8a66-49e8-9827-c5512d56a04d` — completed
  the constructive review and dispatched the Codex review using the installed
  subagent.

## Before / After

| Scenario | Baseline | Modified |
|---|---|---|
| Overengineering | **Fail.** Proceeded to the spec; explicitly said self-review would not catch the interface/adapter/factory/config/service/DI stack. | **Pass.** Required review before final approval and identified those layers for removal. |
| Unsupported technical assumption | **Fail.** Said brainstorming had no factual verification step and the false `fetch` retry claim could reach the spec. | **Pass.** Required the evidence gate and classified the claim as unsupported before final approval. |
| Adversarial false positive | **Partial.** General YAGNI reasoning rejected PostgreSQL, but the skill had no explicit synthesis rule. | **Pass.** Rejected the `IMPORTANT` redesign because it contradicted intent without evidence; severity did not control. |
| Material disagreement | **Partial.** The model chose evidence over voting, but the workflow did not require that behavior. | **Pass.** Explicitly used evidence and intent, did not vote, and did not repeat review for a rejected preference. |
| Installed Codex fails authentication | Not applicable: no design-review integration existed. | **Pass.** Reported that no Codex output existed and asked the user to retry later or explicitly authorize degraded self-review; it did not silently substitute. |

## Reproduction

Each decision scenario used this command shape (substitute the scenario file and
the baseline or modified `SKILL.md`):

```sh
claude -p --disable-slash-commands \
  --append-system-prompt-file skills/brainstorming/SKILL.md \
  --model sonnet --max-turns 1 --output-format json < SCENARIO.md
```

Scoring was binary for the required behavior, with **Partial** reserved for a
good decision that the loaded workflow did not require. A pass required the
response to state the required workflow action, not merely recommend a better
design.

The four scenario prompts were:

1. **Overengineering:** the user approved a one-user append-to-Markdown CLI
   containing `NoteStorage`, an adapter, YAML-selected factory, service layer,
   and DI container, and asked the agent to proceed unless the workflow required
   reopening it.
2. **Unsupported assumption:** an approved Node 20 design claimed built-in
   `fetch` accepts `retries: 3`, with no inspected source, runtime check, or
   authoritative documentation.
3. **False positive:** an external reviewer labeled PostgreSQL, a repository
   interface, and a background worker `IMPORTANT` for a local single-process
   JSON-file tool whose user prohibited a daemon and database.
4. **Disagreement:** the constructive reviewer approved a direct handler while
   the adversarial reviewer requested an event bus for hypothetical future
   scale; repository evidence and user intent fixed the scope at two events.

The decisive baseline outputs respectively said: proceed to the written spec
and that self-review would not catch the layers; the workflow had no factual
verification gate; reject PostgreSQL using general YAGNI reasoning but without
a workflow synthesis rule; and reject the event bus using evidence but without
a required no-voting rule. The modified outputs respectively required review
and removal of the layers; classified the retry claim unsupported before
approval; rejected the severity-labeled preference without repeating review;
and explicitly synthesized by evidence and intent rather than voting.

The authentication-failure scenario supplied an installed, selected Codex
reviewer whose authentication failed and stated that no Codex output existed.
A pass required an actionable failure report and explicit user choice before
degraded self-review.

## Direct Codex Result

The read-only Codex task classified the YAML factory, network call, and claimed
`fetch` retry option as blockers; the abstraction stack as important excess
complexity; and returned a direct `fs.appendFile` design as the materially
simpler alternative. It used the requested `BLOCKER` / `IMPORTANT` / `OPTIONAL`
and `VERIFIED` / `INFERRED` / `UNSUPPORTED` classifications.

## Independent Diff Review

The first Codex diff review found:

1. missing constructive-review fallback;
2. an automatic path back into full reviews after withheld approval;
3. no scoped contract for the targeted second pass.

All three were corrected. A later review found capability absence and invocation
failure were conflated; the workflow now self-degrades only when capability is
absent, and surfaces actual invocation failures for retry or explicit user
choice. The final review also found that a materially revised candidate could
bypass re-review; materially different coherent candidates now begin a fresh
bounded gate, while minor corrections do not.

## Limits

- The repository's `evals/` Drill checkout is absent, so these runs used Claude
  Code print sessions rather than committed Drill scenarios.
- Large-design token-cost behavior was not measured.
- Two full Claude traces dispatched both reviewers. In the later trace the
  constructive review completed, but the parent session ended before Codex
  result delivery and synthesis. The Codex task path and synthesis behavior
  were therefore verified separately, not as one uninterrupted transcript.
