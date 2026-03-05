# Agent Workflow Optimization (2026-03-05)

## Goal

Improve Superpowers reliability, speed, and token efficiency while preserving workflow discipline.

## Inputs

- AGENTS instruction design findings from `arXiv:2602.11988` (minimal requirements outperform overloaded prompts)
- Context-pollution findings from `arXiv:2602.24287` (assistant-generated text in context can degrade follow-up performance)

## Applied Changes

1. Reduced always-loaded bootstrap verbosity:
- Simplified `skills/using-superpowers/SKILL.md`.
- Updated `hooks/session-start` to inject SKILL body only (frontmatter stripped).
- Updated `.opencode/plugins/superpowers.js` to precompute bootstrap once per plugin load.

2. Converted core workflow skills to concise operational checklists:
- `brainstorming`, `writing-plans`, `executing-plans`, `subagent-driven-development`
- `test-driven-development`, `systematic-debugging`, `verification-before-completion`
- `using-git-worktrees`, `finishing-a-development-branch`
- `requesting-code-review`, `receiving-code-review`, `dispatching-parallel-agents`

3. Added explicit context hygiene in high-fanout skills:
- Subagent prompts now request only task-local constraints and evidence.
- Execution skills avoid long historical carryover unless required for correctness.

4. Hardened shared skills runtime:
- `lib/skills-core.js` now has more robust frontmatter parsing.
- Skill discovery skips hidden directories and avoids unnecessary deep traversal under skill roots.
- Update checks are cached and bounded to reduce repeated network-cost overhead.

5. Simplified skill authoring guidance:
- `skills/writing-skills/SKILL.md` now emphasizes trigger clarity, token budgets, and context hygiene.
6. Added adaptive and context-pruning skills:
- `skills/adaptive-workflow-selector/SKILL.md`
- `skills/context-management/SKILL.md`
- `skills/using-superpowers/SKILL.md` now routes through both.

## Expected Impact

- Lower prompt token overhead in every session.
- Fewer failures from instruction overload.
- Better subagent consistency via smaller, more relevant context windows.
- Faster startup behavior in plugin/update checks.

## Follow-Up Validation

- Run `tests/opencode/test-skills-core.sh` for parser/discovery behavior.
- Run trigger tests under `tests/skill-triggering/` in an environment with Claude CLI.
- Compare token usage using `tests/claude-code/analyze-token-usage.py` before/after representative sessions.
