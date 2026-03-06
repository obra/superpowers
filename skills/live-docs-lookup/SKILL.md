---
name: live-docs-lookup
description: >
  Use when building with any AI SDK or API — Anthropic, OpenAI, or Google.
  Fetches current documentation in real time before answering, so stale
  training data doesn't cause bugs. Trigger on: model selection, tool use,
  function calling, streaming, prompt caching, batch processing, SDK setup,
  or any AI API integration, planning, debugging, or code review.
---

## Why this skill exists

AI platforms change constantly: model IDs get renamed, parameters get
deprecated, new features launch behind flags, entire APIs get replaced. Your
training data has a cutoff — this skill fetches live docs before you advise on
any AI SDK integration, catching the gap between what you remember and what's
actually current.

A 30-second doc check prevents hours of wasted implementation effort.

---

## Step 1: Detect which provider is in scope

Check imports, environment variables, model names, or the user's stated intent:

| Signal | Provider |
|--------|----------|
| `import anthropic`, `from anthropic import`, `ANTHROPIC_API_KEY`, model names like `claude-*`, `opus`, `sonnet`, `haiku` | **Anthropic** |
| `from openai import`, `import openai`, `OPENAI_API_KEY`, model names like `gpt-*`, `o1`, `o3`, `chatgpt-*` | **OpenAI** |
| `import google.generativeai`, `import vertexai`, `GOOGLE_API_KEY`, model names like `gemini-*` | **Google** |

If multiple providers are in scope (e.g. a multi-provider app), fetch docs for each.
If unclear, ask the user which SDK they're targeting before fetching.

---

## Step 2: Fetch the relevant live docs

Use your web fetching tool (WebFetch, web_search, browse, or equivalent).

**Always fetch the models page first** — model IDs are the most common source
of outdated guidance, and the user will copy-paste whatever you put in example
code. Stale IDs produce confusing "model not found" errors.

**If a URL fails or returns a redirect/404**, don't stop — search for it instead.
Use web search with the doc topic and provider name (e.g. "anthropic adaptive thinking docs"
or "openai responses API reference") to find the current URL, then fetch that.
Doc URLs move; the information is always findable.

Fetch only what's relevant to the task. Three parallel fetches is ideal; don't
flood context with docs the user doesn't need.

### Anthropic

| Feature | URL |
|---------|-----|
| **Model IDs** *(always fetch)* | `https://platform.claude.com/docs/en/about-claude/models/overview.md` |
| Messages API | `https://platform.claude.com/docs/en/api/messages` |
| Tool use / function calling | `https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview.md` |
| Streaming | `https://platform.claude.com/docs/en/build-with-claude/streaming.md` |
| Extended / adaptive thinking | `https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking.md` |
| Prompt caching | `https://platform.claude.com/docs/en/build-with-claude/prompt-caching.md` |
| Computer use | `https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use.md` |
| Batch processing | `https://platform.claude.com/docs/en/build-with-claude/batch-processing.md` |
| Files API | `https://platform.claude.com/docs/en/build-with-claude/files.md` |
| Code execution tool | `https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool.md` |
| Structured outputs | `https://platform.claude.com/docs/en/build-with-claude/structured-outputs.md` |
| SDK setup | `https://platform.claude.com/docs/en/api/client-sdks` |
| Rate limits | `https://platform.claude.com/docs/en/api/rate-limits.md` |

### OpenAI

| Feature | URL |
|---------|-----|
| **Model IDs** *(always fetch)* | `https://platform.openai.com/docs/models` |
| Chat completions | `https://platform.openai.com/docs/api-reference/chat` |
| Responses API | `https://platform.openai.com/docs/api-reference/responses` |
| Function calling / tools | `https://platform.openai.com/docs/guides/function-calling` |
| Streaming | `https://platform.openai.com/docs/api-reference/streaming` |
| Structured outputs | `https://platform.openai.com/docs/guides/structured-outputs` |
| Assistants API | `https://platform.openai.com/docs/api-reference/assistants` |
| Batch API | `https://platform.openai.com/docs/api-reference/batch` |
| Rate limits | `https://platform.openai.com/docs/guides/rate-limits` |

### Google / Gemini

| Feature | URL |
|---------|-----|
| **Model IDs** *(always fetch)* | `https://ai.google.dev/gemini-api/docs/models` |
| Text generation | `https://ai.google.dev/gemini-api/docs/text-generation` |
| Function calling | `https://ai.google.dev/gemini-api/docs/function-calling` |
| Streaming | `https://ai.google.dev/gemini-api/docs/text-generation#streaming` |
| Structured outputs | `https://ai.google.dev/gemini-api/docs/structured-output` |
| File API | `https://ai.google.dev/gemini-api/docs/files` |

---

## Step 3: Surface a brief summary

Present only what's relevant and potentially surprising given your training
data. Aim for 5–10 bullet points, not a wall of text:

**Current recommended models:** [list the relevant current model IDs]

**Key API details for [features in scope]:** [params, headers, syntax that matters]

**Watch out for:** [deprecations, gotchas, recently changed behavior — omit if nothing notable]

If the docs confirm what you'd expect:
*"Docs confirm current expected behavior. Recommended model: `claude-opus-4-6`."*

---

## Step 4: Proceed with the original task

Carry the grounded context forward into all code, tests, plans, and reviews.
The correct model IDs, parameter names, and feature knowledge should flow
through naturally — don't repeat the summary, just use it.

**If invoked before a superpowers skill:** proceed to invoke that skill next.
The live context is now loaded — carry it forward.

---

## Common things to verify

Things that change often and are most likely to be wrong in training data:

### Anthropic
- **`budget_tokens`** — deprecated on Opus 4.6 and Sonnet 4.6; use `thinking: {type: "adaptive"}`
- **`output_format`** — deprecated; use `output_config: {format: {...}}`
- **Prefill on Opus 4.6** — not supported; use structured outputs or system prompt
- **Model ID suffixes** — never construct date-suffixed IDs from memory; always verify exact alias from models page
- **Files API beta header** — still requires `anthropic-beta: files-api-2025-04-14`
- **Compaction beta header** — requires `anthropic-beta: compact-2026-01-12`, Opus 4.6 only
- **Docs base URL** — `docs.anthropic.com` now redirects to `platform.claude.com/docs/en/`

### OpenAI
- **Responses API vs Chat Completions** — Responses API is newer and preferred for agentic use cases; they are not interchangeable
- **Model ID naming** — `o1`, `o3`, `o3-mini`, `gpt-4o` variants change frequently; always verify from models page
- **SDK v1 breaking changes** — the openai Python SDK v1 was a complete rewrite from v0; code written for v0 will break
- **Structured outputs vs JSON mode** — structured outputs are newer and more reliable; JSON mode is an older pattern

### Google
- **Gemini API vs Vertex AI** — two different SDKs and endpoint structures; clarify which the user is targeting before advising
- **Model names** — `gemini-2.0-flash`, `gemini-1.5-pro`, etc. change frequently; always verify

---

## Superpowers integration

Live doc lookup is most valuable before any planning, implementation, testing,
debugging, or review of AI SDK work — catching stale assumptions before they
get baked into a plan or test suite.

| Superpowers skill | Why live docs matter |
|------------------|-----------------------|
| **brainstorming** | Architecture decisions bake in model choices and API patterns |
| **writing-plans** | Plans contain model IDs, API call patterns, parameter names |
| **test-driven-development** | Tests depend on exact response formats, param names, stop reasons |
| **systematic-debugging** | Debugging API errors needs current known behavior, not assumptions |
| **executing-plans** | Plans may not have had live doc grounding at write time |
| **subagent-driven-development** | Subagents write code independently; they need accurate API context upfront |
| **dispatching-parallel-agents** | Same — agents need correct params from the start |
| **requesting-code-review** | Reviewers need current docs to spot stale patterns |
| **verification-before-completion** | Verifying AI API code requires knowing current expected behavior |
