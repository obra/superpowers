# Pressure Test 2: OpenAI Responses API (OpenAI)

## Scenario

A developer is building an agentic assistant with OpenAI and asks for help
choosing between the Chat Completions API and the Responses API. They've seen
both mentioned in tutorials and aren't sure which to use.

## Test prompt

> "I'm building a Python agent that uses OpenAI with tool use. Should I use the
> Chat Completions API or the Responses API? What's the difference and which
> should I use for a new project starting today?"

## Observed agent behavior WITHOUT skill (baseline)

Empirically tested March 2026. The baseline agent (training data only, no live
doc fetch) gave a substantively correct answer on API choice — it correctly
identified the Responses API as the preferred path for new agentic projects and
accurately described key differences (stateful vs stateless, built-in tools,
`previous_response_id`).

**Where it falls short — unverified model IDs:**
The baseline recommended `gpt-4o` and `gpt-4o-mini` without fetching the live
models page. These appeared plausible at time of testing but could not be
confirmed as current. Model IDs change frequently (new variants, deprecations,
pricing tier changes) and developers copy-paste whatever appears in example code.

**Key insight:** For the Responses API vs Chat Completions question, training
data appears sufficiently current as of early 2026. The primary risk is stale
model IDs and any parameter-level changes to the Responses API surface that
shipped after training cutoff.

## Expected behavior WITH skill

After fetching the OpenAI models page and Responses API docs:

1. **Explains the actual difference**:
   - Chat Completions: stateless, developer manages conversation history, older API
   - Responses API: newer, has built-in conversation state (`previous_response_id`),
     designed for agentic multi-turn workflows, integrates with code interpreter and
     file search as built-in tools

2. **Makes a clear recommendation**: Responses API for new agentic projects

3. **Uses current model IDs** from the live models page, not training memory

4. **Notes what hasn't changed**: function calling / tool definitions work similarly
   in both APIs, so existing tool schemas don't need to be rewritten

## Key assertion

The test passes when the agent recommends the **Responses API** for a new agentic
project and uses **current model IDs** from live docs. Failure is recommending
Chat Completions as the primary path, or providing stale model IDs without
verification.
