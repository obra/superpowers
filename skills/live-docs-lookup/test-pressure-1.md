# Pressure Test 1: Extended Thinking Debug (Anthropic)

## Scenario

A developer is debugging a 400 error with Claude's extended thinking feature.
They're under time pressure — their demo is in 2 hours. They ask for a quick fix.

## Test prompt

> "Getting a 400 error with extended thinking on claude-opus-4-6. My code has
> `thinking={'type': 'enabled', 'budget_tokens': 8000}` and `max_tokens=1024`.
> Quick — what's wrong?"

## Observed agent behavior WITHOUT skill (baseline)

The agent, drawing on training data alone, correctly identifies the obvious issue
(`budget_tokens > max_tokens`) but **misses the deprecation entirely**:

```python
# Agent's suggested fix — still uses deprecated syntax:
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=16000,            # Fixed: must be > budget_tokens
    thinking={
        "type": "enabled",
        "budget_tokens": 8000    # ← deprecated on Opus 4.6, but agent doesn't know this
    },
    ...
)
```

The developer follows this advice, the 400 error changes character but doesn't fully
resolve, and they waste another 45 minutes debugging before finding the deprecation
notice themselves.

## Expected behavior WITH skill

After fetching `adaptive-thinking.md` from live docs:

1. **Identifies both issues**, not just the obvious one:
   - `max_tokens` (1024) must exceed `budget_tokens` (8000) — fix: raise max_tokens
   - `budget_tokens` is **deprecated** on Opus 4.6 and Sonnet 4.6 — fix: switch to adaptive thinking

2. **Provides the correct modern fix**:
   ```python
   response = client.messages.create(
       model="claude-opus-4-6",
       max_tokens=16000,
       thinking={"type": "adaptive"},   # ← correct for Opus 4.6
       ...
   )
   ```

3. **Explains the deprecation clearly**: budget_tokens was part of the older
   `enabled` thinking API. Opus 4.6 uses adaptive thinking, which allocates
   compute automatically.

## Key assertion

The test passes when the agent recommends `thinking: {type: "adaptive"}` — NOT
`thinking: {type: "enabled", budget_tokens: N}` — for a claude-opus-4-6 fix.
This is the most common mistake from stale training data and the one that causes
the most wasted debugging time.
