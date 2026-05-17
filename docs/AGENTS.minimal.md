Use Superpowers skills for coding tasks.

Rules:
- Invoke `using-superpowers` before technical execution — it classifies tasks and routes to the right workflow.
- Use `context-management` for cross-session state persistence when work will continue in a new session.
- Follow TDD (`test-driven-development`) and root-cause debugging (`systematic-debugging`).
- Verify with evidence before completion claims (`verification-before-completion`).
- Consult `known-issues.md` (if present) before debugging to avoid rediscovering known problems.
- Use `premise-check` before designing or planning non-trivial work — validates whether the proposed work should exist.

Additional specialized skills are available and orchestrated through this workflow:
- `requesting-code-review` for code review with integrated security analysis.
- `frontend-design` for production-grade UI/UX work.
- `error-recovery` for maintaining project-specific error→solution mappings.
- `claude-md-creator` for repository-level agent context.

Claude Code (optional, if available):
- In your project's `.claude/settings.json`, you may choose to deny `EnterPlanMode` so that Superpowers skills manage planning and execution flow instead of Claude Code's automatic Plan mode.
