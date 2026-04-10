# Subagent-Driven Development — Example Workflow

```
You: I'm using Subagent-Driven Development to execute this plan.

[Read plan file once: docs/plans/feature-plan.md]
[Extract all 5 tasks with full text and context]
[Create TodoWrite with all tasks]

Task 1: Hook installation script

[Get Task 1 text and context (already extracted)]
[Dispatch implementation subagent with full task text + context]

Implementer: "Before I begin - should the hook be installed at user or system level?"

You: "User level (~/.config/sspower/hooks/)"

Implementer: "Got it. Implementing now..."
[Later] Implementer:
  - Implemented install-hook command
  - Added tests, 5/5 passing
  - Self-review: Found I missed --force flag, added it
  - Committed

[Dispatch spec compliance reviewer]
Spec reviewer: ✅ Spec compliant - all requirements met, nothing extra

[Get git SHAs, dispatch code quality reviewer]
Code reviewer: Strengths: Good test coverage, clean. Issues: None. Approved.

[Mark Task 1 complete]

Task 2: Recovery modes

[Get Task 2 text and context (already extracted)]
[Dispatch implementation subagent with full task text + context]

Implementer: [No questions, proceeds]
Implementer:
  - Added verify/repair modes
  - 8/8 tests passing
  - Self-review: All good
  - Committed

[Dispatch spec compliance reviewer]
Spec reviewer: ❌ Issues:
  - Missing: Progress reporting (spec says "report every 100 items")
  - Extra: Added --json flag (not requested)

[Implementer fixes issues]
Implementer: Removed --json flag, added progress reporting

[Spec reviewer reviews again]
Spec reviewer: ✅ Spec compliant now

[Dispatch code quality reviewer]
Code reviewer: Strengths: Solid. Issues (Important): Magic number (100)

[Implementer fixes]
Implementer: Extracted PROGRESS_INTERVAL constant

[Code reviewer reviews again]
Code reviewer: ✅ Approved

[Mark Task 2 complete]

...

[After all tasks]
[Dispatch final code-reviewer]
Final reviewer: All requirements met, ready to merge

Done!
```

## Advantages

**vs. Manual execution:**
- Subagents follow TDD naturally
- Fresh context per task (no confusion)
- Parallel-safe (subagents don't interfere)
- Subagent can ask questions (before AND during work)

**vs. Executing Plans:**
- Same session (no handoff)
- Continuous progress (no waiting)
- Review checkpoints automatic

**Efficiency gains:**
- No file reading overhead (controller provides full text)
- Controller curates exactly what context is needed
- Subagent gets complete information upfront
- Questions surfaced before work begins (not after)

**Quality gates:**
- Self-review catches issues before handoff
- Two-stage review: spec compliance, then code quality
- Review loops ensure fixes actually work
- Spec compliance prevents over/under-building
- Code quality ensures implementation is well-built

**Cost:**
- More subagent invocations (implementer + 2 reviewers per task)
- Controller does more prep work (extracting all tasks upfront)
- Review loops add iterations
- But catches issues early (cheaper than debugging later)

---

## Example: Codex Engine Workflow

```
You: I'm using Subagent-Driven Development with Codex to execute this plan.

[Read plan file, extract all 3 tasks]
[Create TodoWrite with all tasks]

Task 1: API endpoint (complex, unfamiliar library → pick Codex)

[Write prompt to /tmp/sdd-task-1.md using codex-implementer-prompt.md template]
[Run: codex-bridge.mjs implement --write --cd ./project --prompt @/tmp/sdd-task-1.md]

Codex returns:
{
  "status": "DONE",
  "summary": "Implemented /api/users endpoint with validation...",
  "files_changed": ["src/routes/users.ts", "src/routes/users.test.ts"],
  "tests": {"ran": true, "passed": 4, "failed": 0, "details": "vitest pass"},
  "self_review": "Clean implementation, follows existing route patterns",
  "concerns": [],
  "questions": [],
  "blocked_reason": ""
}

[Write spec review prompt to /tmp/sdd-spec-review-1.md]
[Run: codex-bridge.mjs spec-review --cd ./project --prompt @/tmp/sdd-spec-review-1.md]

Codex spec reviewer returns:
{
  "verdict": "non-compliant",
  "missing": [{"requirement": "Rate limiting", "evidence": "No rate limit middleware found", "file": "src/routes/users.ts", "line": 0}],
  "extra": [],
  "misunderstandings": [],
  "summary": "Missing rate limiting requirement from spec"
}

[Resume Codex thread for fix]
[Run: codex-bridge.mjs resume --session-id {SESSION_ID_FROM_IMPLEMENT} --prompt "Add rate limiting..."]

Codex fixes and returns DONE.

[Re-run spec review → compliant]

[Run: codex-bridge.mjs review --cd ./project --prompt @/tmp/sdd-quality-1.md]

Quality reviewer returns:
{
  "verdict": "approve",
  "strengths": ["Good test coverage", "Follows existing patterns"],
  "issues": [],
  "assessment": "Clean implementation, ready to proceed"
}

[Mark Task 1 complete]

Task 2: Simple utility (pick Claude subagent — quick and interactive)

[Dispatch Claude subagent as usual — existing flow unchanged]
...

Task 3: Database migration (complex → pick Codex)

[Same Codex flow as Task 1]
...

[After all tasks: final code review + finishing-branch]
```

**Key difference from Claude-only workflow:**
- Codex is one-shot — no mid-task questions, all context front-loaded
- Fix loops use `resume --session-id` (targets the implementer thread, not the last session)
- Capture `[codex:session] <id>` from stderr during implement — needed for resume
- Mixing engines per task is normal — pick the best tool for each job
- Structured contracts are identical — controller logic doesn't change
