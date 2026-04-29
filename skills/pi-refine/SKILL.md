---
name: pi-refine
description: Use when iteratively refining a design doc, plan, or specification through repeated pi reviews until quality converges
---

# Pi Refine

Iteratively refine a document through repeated `reviewer` subagent reviews until it converges on quality.

**Core principle:** Review → filter → fix → re-review → repeat until clean.

## Default Model

The `reviewer` builtin agent defaults to `openai-codex/gpt-5.5`. If the user does not specify a model, use the builtin default. To override, pass `model` to the subagent call or set a persistent override in `.pi/settings.json`:

```json
{
  "subagents": {
    "agentOverrides": {
      "reviewer": {
        "model": "deepseek/deepseek-v4-pro"
      }
    }
  }
}
```

## When to Use

- When you want a design doc or plan polished through iterative external review
- After drafting a doc and before implementing it
- When a doc needs thorough vetting but you want the process automated

## Invocation

The user may say things like "refine this doc with pi", "iterate on this plan", etc.

## The Iteration Loop

For each iteration (max 5):

### Step 1: Dispatch Reviewer Subagent

Send the document to the `reviewer` agent with fresh context and capture output:

```typescript
subagent({
  agent: "reviewer",
  task: `Below is the full text of a document to review. Review ONLY this text.

Identify:
1. Gaps, missing steps, or incorrect assumptions
2. Logic errors, contradictions, or ordering problems
3. Security, privacy, or authorization concerns
4. Unclear or ambiguous sections

Reference section/task/step numbers from the document. Organize by severity: critical, important, minor.`,
  reads: [filePath],
  output: `/tmp/pi-refine-iter-${iteration}.md`,
});
```

Then read `/tmp/pi-refine-iter-${iteration}.md`.

### Step 2: Triage Findings

Categorize each finding into one of:

**Fix** — Implement the change:

- Genuine gaps, missing steps, or incorrect information
- Logic errors, contradictions, or broken ordering
- **Security concerns**: authentication, authorization, input validation, injection risks, secret handling
- **Privacy concerns**: data exposure, logging PII, missing access controls, data retention issues
- **Authorization concerns**: missing permission checks, privilege escalation paths, role boundary violations
- Unclear sections that would confuse readers

**Ignore** — Skip silently (do not ask the user):

- **Hallucinations**: References to files, APIs, libraries, or features that don't exist in the project
- **Trivial nits**: Formatting preferences, naming bikeshedding, stylistic opinions
- **Scale-only concerns**: Rate limiting, sharding, horizontal scaling, load balancing, caching layers, distributed locking, high-availability patterns — anything only relevant at multi-user/SaaS scale. This is an internal product with a handful of users.
- **Over-engineering**: Suggestions to add abstraction layers, plugin architectures, feature flags, or other complexity not justified by the current user base
- **Redundant with prior iterations**: Issues already addressed in a previous iteration that the reviewer is re-raising

**Ask the user** — When a finding is borderline:

- It might be valid but you're not sure if it applies to this project
- It's a design tradeoff where user preference matters
- It suggests a significant architectural change that may or may not be wanted
- Security/privacy concern that seems theoretical rather than practical for an internal tool

Use `AskUserQuestion` for borderline items. Present the finding and your assessment, and let the user decide fix or ignore.

### Step 3: Implement Fixes

Apply all "Fix" changes to the document using Edit/Write tools. Make targeted, minimal edits — don't rewrite sections that aren't flagged.

### Step 4: Check Convergence

Converge eagerly. Exit the loop if **any** of these hold:

1. **No fixes applied this iteration** — all findings were ignored or trivial.
2. **Findings are language-only** — this iteration's findings are all wording/clarification/phrasing issues, with no new implementation gaps, logic errors, missing steps, security/privacy/authorization concerns, or test-adequacy concerns. Language polish has diminishing returns; once the reviewer stops surfacing real implementation issues, stop.
3. **Diminishing returns signal** — findings are substantively similar to the prior iteration (same class of nit, different wording), even if technically new.

**How to decide (#2):** For each finding, ask: "Would a reader acting on the current spec build the wrong thing, or just write prose a reviewer might phrase differently?" If every finding falls in the latter bucket, you're done. A single real implementation finding is enough to keep iterating; a stack of wording suggestions is not.

When converging under #2 or #3, you may still apply one or two high-value findings before exiting (e.g., removing a leaked identifier, noting a version requirement) — the criterion is about _stopping the loop_, not _rejecting every remaining suggestion_. But don't apply the whole set of clarifications; that's the trap this rule exists to break.

Otherwise, increment iteration counter and go back to Step 1.

### Step 5: Update Plan Status

If the document has a YAML-style header or metadata section, add or update a `Status: Refined` line in it. If the document has no clear header/metadata area, add a status line near the top of the document after the title:

```
**Status:** Refined
```

### Step 6: Report Summary

After the loop ends (converged or hit 5-iteration cap), report a comprehensive summary to the user covering everything that was found and what was done about it:

```
## Refinement Summary

**Iterations:** N
**Converged:** yes/no

### All Findings and Actions

For each iteration, list every finding with its disposition:

**Iteration 1:**
- [FIXED] <finding description> → <what was changed>
- [FIXED] <finding description> → <what was changed>
- [IGNORED: hallucination] <finding description>
- [IGNORED: scale-only] <finding description>
- [ASKED USER → fixed/ignored] <finding description> → <outcome>

**Iteration 2:**
- [FIXED] <finding description> → <what was changed>
- [IGNORED: nit] <finding description>
...

### Summary of Changes Made
- Bullet list of all substantive changes across all iterations

### Ignored (noise):
- [brief list of ignored items grouped by category with counts]

### Remaining (if hit cap):
- [any unresolved items from the final review]
```

## Important Notes

- Use a distinct output file per iteration (`/tmp/pi-refine-iter-1.md`, `-iter-2.md`, etc.) so you can reference earlier reviews.
- If the reviewer raises the same issue across iterations after you've already fixed it, it may be hallucinating the problem. Ignore on the second occurrence.
- The 5-iteration cap is a safety net. Most docs should converge in 1-2 iterations. If iteration 2 is producing only language polish, stop — the spec is done.
- This skill is for document refinement. For one-off code or document review, use `pi-review` directly.
- **Security/privacy/auth findings are always worth fixing** — even for internal tools, these protect against insider threats and accidental data exposure.
- **Scalability/SaaS patterns are noise** — don't add complexity for hypothetical growth. Internal tools with a handful of users don't need production-grade infrastructure patterns.
