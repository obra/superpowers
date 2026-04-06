---
name: codex-enrich
description: Enrich a user prompt by sending it to Codex for codebase-aware analysis. Codex scans the repo, validates assumptions against actual code, corrects inaccuracies, and returns a rich detailed prompt. Trigger whenever the user's message contains the word "enrich" — even casually like "enrich fix the auth bug" or "I want to enrich this request". Also trigger for "codex prompt", "make this prompt better", or "prompt enrichment".
user_invocable: true
allowed-tools: Bash, Read, Glob, Grep, Agent, Skill, AskUserQuestion
---

# Codex Enrich

Raw prompts often contain vague references ("fix the auth thing"), wrong assumptions ("the config is in src/config.ts" when it's actually at lib/config.mjs), or missing context that matters for correctness. This skill uses Codex as an independent codebase scanner to catch these gaps before you act on the prompt.

Codex has full repo access and a different model perspective — it spots things Claude might assume away.

## How It Works

1. The user's message contains "enrich" — strip that word out, the rest is the raw prompt
2. Build an enrichment task and send it to Codex via `/codex:rescue` in read-only mode
3. Codex scans the repo, validates the prompt against actual code, enriches it
4. Present the enriched prompt + context notes to the user
5. User approves, edits, or rejects before you act

## Execution

### Step 1: Extract the raw prompt

Remove the word "enrich" from the user's message. Everything else is the raw prompt.

Examples:
- "enrich fix the login bug" → raw prompt: "fix the login bug"
- "I want to refactor the auth, enrich" → raw prompt: "I want to refactor the auth"
- "enrich add rate limiting to the API" → raw prompt: "add rate limiting to the API"

If nothing remains after removing "enrich", ask: "What would you like me to enrich?"

### Step 2: Send to Codex

Invoke the `codex:rescue` skill with this task. Do NOT add `--write` — this is read-only analysis.

```
Analyze this user prompt against the current repository and produce an enriched version.

Raw prompt:
"""
{RAW_PROMPT}
"""

Your job:
1. Scan the repository — understand the architecture, file structure, key modules, and patterns
2. Find which files, functions, types, and modules are relevant to what the user is asking
3. Check every assumption in the prompt: does that file exist? Is that function real? Is the architecture what they think it is?
4. Correct anything wrong — use actual paths, actual function names, actual patterns from the code
5. Expand vague references into specifics — "the auth middleware" becomes "the JWT verification middleware in src/middleware/auth.ts (verifyToken function, line 42)"
6. Add context the user probably meant but didn't say — related files, dependencies, test files that would need updating
7. Preserve the user's original intent exactly — make it more precise, don't change what they're asking for

Return this exact format:

ENRICHED PROMPT:
<the enriched version — specific, detailed, grounded in actual code>

CONTEXT NOTES:
- <corrections made: what was wrong in the original and what's actually true>
- <key files identified: paths and why they matter>
- <dependencies and side effects: what else might be affected>
- <assumptions validated: things the user got right>
```

### Step 3: Present to the user

After Codex returns, parse the output and present it clearly:

```markdown
## Original
> {raw prompt}

## Enriched Prompt
{enriched prompt from Codex}

## What Codex Found
{context notes — corrections, files identified, dependencies}

---
Use this enriched prompt? **(yes / edit / no)**
```

Then ask the user with `AskUserQuestion`.

### Step 4: Act on the decision

- **yes** — Execute the enriched prompt as the task. Proceed as if the user had typed the enriched version directly.
- **edit** — The user provides a modified version. Use that.
- **no** — Discard. Return to normal conversation.

## If Codex Fails

If Codex errors out, times out, or returns garbage:
1. Tell the user what happened
2. Offer to proceed with the original prompt as-is
3. Don't silently fall back — the whole point is the user sees what they're working with
