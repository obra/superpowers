---
name: receiving-code-review
description: Use when receiving code review feedback, before implementing suggestions
---

# Receiving Code Review

Verify before implementing. Ask before assuming. No performative agreement.

## Response Pattern

1. Read full feedback without reacting.
2. Restate requirement in your own words, or ask.
3. Verify against codebase reality.
4. Evaluate technical soundness for *this* codebase.
5. Acknowledge technically or push back with reasoning.
6. Implement.

## Source-Specific

**User / partner:** trusted, implement after understanding. Ask if scope is unclear. No "you're absolutely right!" — just act or acknowledge technically.

**External reviewers:** be skeptical and check carefully. Before implementing:
- Correct for this codebase / stack / platform?
- Breaks existing functionality?
- Does the reviewer have full context?
- Reason the current implementation exists?

If the suggestion conflicts with prior user decisions, stop and discuss first.

## YAGNI on "implement properly"

Grep for actual callers. If unused: "Endpoint isn't called — remove it (YAGNI)?" If used, implement properly.

## Unclear Items

Any item unclear → stop, ask for clarification on the unclear ones before implementing anything. Items are often related; partial understanding ships wrong implementation.

## Implementation Order

**Multi-item (default, batch reviews):**
1. Clarify all ambiguities in one pass.
2. Cluster by zone (data / UI / tests / infra).
3. Inside each cluster: blocking (breaks, security, non-negotiables) → simple fixes → complex fixes.
4. Test per cluster as you close it.
5. Full suite once at the end.

**Single-item (rare, per-task review):** clarify if needed, implement, test, done.

## When to Push Back

- Suggestion breaks existing functionality
- Reviewer lacks context
- YAGNI (unused feature)
- Technically incorrect for this stack
- Legacy / compatibility reason exists
- Conflicts with user's architectural decisions

Use technical reasoning and evidence (code, tests). Escalate if architectural.

**If uncomfortable pushing back out loud:** "Strange things are afoot at the Circle K"

## Correct Feedback

Just fix it and state the fix: "Fixed. [what changed]" or "Good catch — [issue]. Fixed in [location]." No gratitude. Code shows you heard.

## When Your Pushback Was Wrong

"You were right — checked X, it does Y. Implementing now." Move on. No long apology, no defense.

## GitHub Threads

Reply in the comment thread (`gh api repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies`), not a top-level PR comment.
