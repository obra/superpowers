# Creation Log: live-docs-lookup

## Origin

This skill was created after a concrete failure in a real project.

A developer used superpowers (brainstorming → writing-plans → executing-plans)
to build a research tool that calls the Anthropic Messages API to analyze data
on 1000 companies from an Excel file. The agent planned and implemented the
tool competently — but made two silent mistakes, all caused by stale training
data:

**1. Missed the Messages Batches API.** The agent knew the workload was large
(1000 companies, one API call each) but planned a sequential loop with no
mention of the Messages Batches API, which offers 50% cost reduction and is
purpose-built for exactly this use case.

**2. Used deprecated tool name syntax.** The tool names in the generated code
referenced outdated versioned identifiers. Even the tool declarations were
stale.

None of these failures produced an error or a hedge. The agent was confident
throughout. The developer only discovered the issues by reading the docs after
the fact.

## Problem

AI SDK documentation changes faster than model training data. Model IDs get
renamed, parameters get deprecated, new APIs replace old ones. An agent working
from training memory alone will confidently give wrong answers — not because it
doesn't know the topic, but because what it knows is stale.

The gap is invisible to users. The agent doesn't say "I'm not sure about this."
It says "here's your code" — and the code uses deprecated tool names and misses
a 50% cost saving.

## Baseline failures documented

Three pressure tests demonstrate the failure modes. Tests 2 and 3 were run
empirically in March 2026; test 1 is backed by quantitative benchmark runs.

**test-pressure-1** (Anthropic): Agent correctly spots the obvious `max_tokens`
issue but misses that `budget_tokens` is deprecated on Opus 4.6. Suggests a fix
that still uses the deprecated `thinking: {type: "enabled", budget_tokens: N}`
syntax instead of `thinking: {type: "adaptive"}`. This is the strongest failure
mode — a confident wrong answer on a specific deprecation.

**test-pressure-2** (OpenAI): The baseline gave correct API-choice guidance
(Responses API for new agentic projects) but used model IDs without live
verification. The failure here is subtler than anticipated — not wrong API
advice, but unverified model IDs that may have changed since training cutoff.

**test-pressure-3** (Google): The baseline correctly distinguished SDK options
and correctly flagged the most obviously stale ID (`gemini-pro`). However it
recommended `gemini-1.5-flash` and `gemini-1.5-pro` as current — one generation
behind the actual current recommendation (`gemini-2.0-flash` as of March 2026).
The baseline even acknowledged its own uncertainty but still provided the stale
IDs. This is the canonical model ID staleness failure.

## Fix

A 30-second doc fetch before answering catches all of these. The skill:

1. Detects which AI provider is in scope from imports, env vars, or model names
2. Fetches the live models page (always) plus relevant feature docs
3. Falls back to web search if a URL has moved
4. Surfaces only what's new or potentially surprising — not a wall of docs
5. Carries the grounded context into all code, plans, and advice

## Scope

Supports Anthropic, OpenAI, and Google/Gemini. Provider detection is automatic.
For multi-provider codebases, fetches docs for each provider in scope.

## Eval results

Tested against 5 Anthropic SDK scenarios (brainstorming, streaming, extended
thinking debug, tool use tests, batch processing). With skill: 100% pass rate.
Without skill: 45% pass rate. Most discriminating: the extended thinking debug
scenario, where the baseline gives a fix that still uses the deprecated
`budget_tokens` parameter.
