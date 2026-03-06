Use Superpowers skills for coding tasks.

Rules:
- Select workflow with `adaptive-workflow-selector` before technical execution.
- Use `context-management` when session context gets long/noisy.
- Follow TDD (`test-driven-development`) and root-cause debugging (`systematic-debugging`).
- Verify with evidence before completion claims (`verification-before-completion`).

Additional specialized skills are available and orchestrated through this workflow:
- `senior-engineer` for complex or architectural tasks.
- `security-reviewer` for security-focused code review.
- `testing-specialist` for advanced testing strategy.
- `frontend-craftmanship` for production-grade UI/UX work.
- `prompt-optimizer` and `claude-md-creator` for improving prompts and repository-level agent context.

Claude Code (optional, if available):
- Use the native task tools (`TaskCreate`, `TaskUpdate`, `TaskList`) as described in the skills to mirror plan tasks into Claude’s TaskList for dependency tracking and progress visibility.
- In your project’s `.claude/settings.json`, you may choose to deny `EnterPlanMode` so that Superpowers skills manage planning and execution flow instead of Claude Code’s automatic Plan mode.
