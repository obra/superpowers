---
name: humanizing-prose
description: "Use when about to write prose for a human reader: markdown files, PR descriptions, commit bodies, READMEs, doc pages, release notes, blog posts, or chat replies longer than a couple of sentences. Catches AI-sounding writing (significance inflation, em dash overuse, rule of three, hedging, sycophancy) before it gets sent or committed."
---

# Humanizing Prose

## Overview

Most prose an agent produces reads as obviously AI-generated. It puffs up significance, leans on em dashes, builds rule-of-three lists, hedges with "could potentially," opens with "Let's dive in," and ends with "the future looks bright."

The fix is not to remember the patterns. The fix is to recognize when prose is about to be produced for a human reader, load the `humanizer` reference catalog at that moment, run the silent self-check, and ship the revised version.

This skill is the trigger. The 29-pattern catalog lives in `humanizer`, which this skill loads on demand.

## When to Fire (always)

Run this skill before producing prose in any of these contexts:

| Context | Why |
|---|---|
| Writing or editing `.md` / `.mdx` files | Persisted prose, usually for a human reader |
| PR description / PR body | Read by reviewers, often by the public |
| Commit message **body** (not subject) | Persisted, searched, read by future agents |
| READMEs | High-visibility, sets project tone |
| Files under `docs/` | Documentation, by definition for humans |
| Release notes, changelogs, blog posts | Public-facing prose |
| Design docs and specs (`docs/superpowers/specs/`) | The thing future agents will read for context |

## When to Fire (chat replies)

For chat replies to the human partner: fire when the reply will exceed roughly **30 words of natural-language prose** (about two sentences). Below that, skip the check. Quick acknowledgments, "running it now," short answers to direct questions, and one-sentence status updates do not need humanizing.

The 30-word threshold is a guideline, not a counter. The agent estimates as it drafts; if the reply is going to be more than a quick one-liner, the check fires.

**What counts toward the 30 words:** only natural-language prose intended for the human partner to read. Code blocks, tool output the agent is relaying, structured tables, JSON, command output, and direct quotes do not count. A reply that is mostly a code block with a one-sentence framing is below threshold even if total characters are large. A reply that is three short prose paragraphs interleaved with code is above threshold; the prose paragraphs get humanized and the code stays untouched.

## When NOT to Fire (always skip)

| Context | Why |
|---|---|
| Code (any language) | Different conventions; humanizer rules cause harm |
| Code comments | Often should be terse, declarative, passive; humanizer would degrade them |
| Commit message **subject lines** | Need to stay imperative and short |
| Error messages, stack traces, tool output being relayed | Not the agent's prose |
| Short chat replies (under ~30 words of prose) | Cost not worth it |
| Direct quotes of someone else's writing | Quoting verbatim is the point |
| Structured output: JSON, YAML, tables, config files | Not prose |
| Terminal command output being shown back to the human partner | Not the agent's prose |
| Issue/PR titles | Same reasoning as commit subject lines |

## Procedure

```
1. RECOGNIZE THE TRIGGER
   Before producing prose, check: does this fall into a fire context?
   - File extension or path matches the always-fire list, OR
   - Output destination is a PR/commit body, release note, etc., OR
   - This is a chat reply that will exceed ~30 words of prose.

   If yes → continue. If no → write normally, skip this skill.

2. LOAD THE HUMANIZER REFERENCE
   Invoke the `humanizer` skill via the skill tool. This pulls in the
   29-pattern catalog, the personality/voice section, and the
   self-check workflow. Do not try to humanize from memory; patterns
   evolve and the reference is the source of truth.

3. DRAFT THE PROSE
   Write a first version of the prose, applying the patterns from the
   humanizer reference as you go.

4. SELF-CHECK BEFORE SENDING
   Apply the self-check workflow defined in the humanizer skill (see
   the humanizer's "Self-Check Workflow" section). The workflow is:
     - Read the draft back as if a human wrote it. Does it sound natural?
     - Scan against the 29-pattern catalog. Note every match.
     - Pay extra attention to the highest-frequency tells: em dashes,
       "stands as / serves as," rule of three, "let's dive in," "the
       future looks bright," inline-header bold lists, sycophantic openers.
     - Revise the spots that fail.

5. SHIP THE REVISED VERSION
   Only the post-check version goes to the file, the PR body, or the
   chat reply. The pre-check draft is throwaway.
```

## Red Flags — STOP if you find yourself doing any of these

- Writing a PR description or doc page without invoking the humanizer reference
- Telling yourself "I know the patterns, I don't need to load the reference"
- Skipping the self-check because the prose "feels fine"
- Applying humanizer rules to code or code comments
- Rewriting a commit subject line to "make it less AI-sounding"
- Humanizing a direct quote of someone else's writing
- Padding short chat replies up to 30 words to trigger the check (the threshold is a ceiling-style trigger, not a target)
- Loading the humanizer reference on every short message "just in case"

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "It's just a one-line README change" | One-line changes set the tone of the file. Check it. |
| "PR descriptions are throwaway" | They are searched, linked, quoted, and read by reviewers. Not throwaway. |
| "I'll humanize it later if the human partner complains" | The human partner will complain by closing the PR. Check it now. |
| "The humanizer reference is too long to load every time" | The trigger is specifically designed so it only loads when the cost is worth it. |
| "This is technical writing, the AI patterns don't apply" | Technical writing is where significance inflation and rule-of-three thrive. Especially apply it here. |
| "The human partner reads everything I write anyway" | The point is to not waste their time editing your prose. |
| "I already did one pass, that's good enough" | The humanizer's self-check is a second pass on purpose. Do it. |

## What This Skill Is NOT

- **A code-style enforcer.** Code conventions are different. Use a linter.
- **A grammar checker.** The humanizer catches a specific class of AI tells, not general writing problems.
- **A length limiter.** Long prose is fine. AI-sounding prose is not.
- **A blocker.** Nothing prevents the agent from shipping un-humanized prose if the trigger doesn't fire. The skill is opt-in by context, not enforced by tooling.

## Integration

**Pairs with:**
- `humanizer` — the heavyweight reference this skill loads on demand.
- `committing-work` — fires when the agent is about to write the commit body (not the subject).
- `writing-plans` and `brainstorming` — both produce specs and design docs; both are in-scope artifacts.

**Distinct from:**
- Code-quality skills (`test-driven-development`, `verification-before-completion`) — those govern code; this governs prose.
- `humanizer` itself — the humanizer is *what* to do; this skill is *when* to do it.
