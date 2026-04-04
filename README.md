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

Documented install surfaces in this fork are Codex CLI on macOS, Linux, WSL, and native Windows PowerShell. Codex App remains best-effort and secondary.
Native Windows PowerShell is supported for installation and repo-root instruction loading only. Bundled POSIX shell helper workflows remain POSIX/WSL-first.

For manual installation, global skill symlink setup, and troubleshooting, see `docs/README.codex.md`.

## Workflow

1. `brainstorming` turns an idea into an approved design.
2. `writing-plans` turns the design into a detailed implementation plan.
3. `using-git-worktrees` isolates the work when needed.
4. `subagent-driven-development` or `executing-plans` carries out the plan.
5. `test-driven-development` keeps red-green-refactor explicit during implementation rather than treating tests as cleanup work.
6. `requesting-code-review` and `verification-before-completion` keep quality gates explicit.
7. `finishing-a-development-branch` closes the loop.

If Codex multi-agent tools are unavailable in your current environment or configuration, treat `executing-plans` as the default execution path.

## Skill Library

- Planning: `brainstorming`, `writing-plans`, `executing-plans`
- Execution: `subagent-driven-development`, `dispatching-parallel-agents`
- Quality: `requesting-code-review`, `receiving-code-review`, `verification-before-completion`
- Engineering discipline: `test-driven-development`, `systematic-debugging`
- Git isolation: `using-git-worktrees`, `finishing-a-development-branch`
- Meta: `using-superpowers`, `writing-skills`

## Validation

Run the Codex-only checks described in `docs/testing.md` before considering the reorganization complete.
The automated suite currently exercises the POSIX/bash execution path of the current checkout; shell-script-based helper workflows are not yet automatically verified on native Windows.

## Contributing

This fork accepts Codex-first improvements only. If a change exists only to support another platform, it does not belong in this repository.

## License

MIT License. See `LICENSE`.
