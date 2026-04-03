# Superpowers for Codex

Superpowers is a Codex-native workflow layer that turns repeatable software work into explicit skills, specs, plans, review loops, and verification steps.

This fork is intentionally Codex-only. It preserves the original Superpowers workflow philosophy while rewriting the product surface for OpenAI Codex.

## Why This Fork Exists

Upstream Superpowers evolved as a cross-platform project with heavy non-Codex assumptions. This fork removes the translation layer and speaks to Codex directly.

## Installation

Tell Codex:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/Jo-Atom/superpowers-codex/refs/heads/main/.codex/INSTALL.md
```

For manual installation and troubleshooting, see `docs/README.codex.md`.

## Workflow

1. `brainstorming` turns an idea into an approved design.
2. `writing-plans` turns the design into a detailed implementation plan.
3. `using-git-worktrees` isolates the work when needed.
4. `subagent-driven-development` or `executing-plans` carries out the plan.
5. `requesting-code-review` and `verification-before-completion` keep quality gates explicit.
6. `finishing-a-development-branch` closes the loop.

## Skill Library

- Planning: `brainstorming`, `writing-plans`, `executing-plans`
- Execution: `subagent-driven-development`, `dispatching-parallel-agents`
- Quality: `requesting-code-review`, `receiving-code-review`, `verification-before-completion`
- Engineering discipline: `test-driven-development`, `systematic-debugging`
- Git isolation: `using-git-worktrees`, `finishing-a-development-branch`
- Meta: `using-superpowers`, `writing-skills`

## Validation

Run the Codex-only checks described in `docs/testing.md` before considering the reorganization complete.

## Contributing

This fork accepts Codex-first improvements only. If a change exists only to support another platform, it does not belong in this repository.

## License

MIT License. See `LICENSE`.
