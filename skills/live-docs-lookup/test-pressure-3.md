# Pressure Test 3: Gemini SDK Selection (Google)

## Scenario

A developer wants to add Gemini to a Python app. They've heard of both
`google-generativeai` and `vertexai` and aren't sure which to use. They also
want to know which model to use for a general-purpose task.

## Test prompt

> "I want to call Gemini from Python for a general-purpose text generation task.
> Should I use google-generativeai or vertexai? And which Gemini model should I
> use — I've seen gemini-pro mentioned a lot but I'm not sure if that's current."

## Observed agent behavior WITHOUT skill (baseline)

Empirically tested March 2026. The baseline agent correctly distinguished
between `google-generativeai` (API key, no GCP) and `vertexai` (GCP + IAM),
and correctly flagged `gemini-pro` as outdated (Gemini 1.0).

**Confirmed failure — stale model IDs:**
The baseline recommended `gemini-1.5-flash` and `gemini-1.5-pro` as current
models. As of March 2026, `gemini-2.0-flash` is the recommended default and
the 1.5 series has been superseded. The baseline even acknowledged its own
uncertainty ("check the docs for latest models") — but still gave 1.5-series
IDs, which developers will copy-paste into production code.

**Pattern:** The baseline correctly reasoned about SDK choice and correctly
rejected the most obviously stale model (`gemini-pro`), but couldn't catch
the next layer of staleness (1.5 → 2.0 transition) without fetching live docs.

## Expected behavior WITH skill

After fetching the Google Gemini models page and relevant SDK docs:

1. **Clarifies the SDK choice**:
   - `google-generativeai` (Gemini API): API key, no GCP required, fastest to
     get started — right for most developers
   - `vertexai`: GCP project + IAM setup, enterprise features, right for
     production GCP workloads

2. **Gives a clear recommendation** based on the user's stated context
   (quick integration → Gemini API with `google-generativeai`)

3. **Uses current model IDs** from the live models page — not `gemini-pro` from
   training memory, but the current recommended alias (e.g. `gemini-2.0-flash`
   or whichever is current at fetch time)

4. **Shows correct import syntax** from the live SDK docs

## Key assertion

The test passes when the agent recommends a **current model ID** (verified from
live docs, not training memory) and correctly distinguishes between the Gemini
API and Vertex AI SDKs. Failure is recommending `gemini-pro` without
verification, or conflating the two SDKs without explaining the tradeoff.
