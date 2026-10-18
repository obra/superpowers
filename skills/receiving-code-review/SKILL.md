---
name: receiving-code-review
description: Use when acting on code review feedback from a person or an external reviewer, before implementing it.
---

# Receiving Code Review

Feedback is a claim about the code. Verify each item against the codebase before you change anything.

- Ask about every unclear item at once, before changing anything.
- Your human partner's feedback is trusted. Implement it once you understand it.
- For any other reviewer, check that the suggestion is right for this codebase, keeps existing behavior, and holds on every supported platform. If it fails, push back with the reasoning and the code or test that shows it. If it conflicts with your human partner's decision, take it to them first.
- Search for callers before you accept that something is unused.
- A finding about one site is a finding about the pattern. Search for the same defect, then fix every match in the same push, or list each one left and why. Your reply names the siblings, or the search that found none.

## Replying on GitHub

Reply inside the review comment's thread, not as a top-level PR comment:

```
gh api repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies -f body='...'
```
