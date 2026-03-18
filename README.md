# Ultrapowers

Ultrapowers is a research-driven software development workflow for your coding agents. It extends [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent with a **research-first pipeline** that ensures agents always work with current, verified knowledge before writing code.

## How it works

It starts the same way Superpowers does — your agent doesn't just jump into code. It steps back and asks what you're really trying to do.

But then Ultrapowers goes further. After brainstorming, it **researches the current state of the art** for every technology and pattern involved. It audits your existing skills against what it finds, creates or updates skills to fill gaps, and only then moves into planning and implementation.

Every implementation step gets audited against the research findings and your plan. The result: agents that build on verified knowledge, not assumptions.

The rest of the Superpowers workflow — TDD, subagent-driven development, code review, worktrees — runs unchanged, with the addition that each step is audited for quality.

Another key difference: **you stay in control**. Ultrapowers does not auto-commit plans, does not auto-commit code, and does not auto-push. You decide when to commit and when to push. Plans are working documents, not git artifacts — commit them if you want to, or don't.

## Attribution

Ultrapowers is a fork of [Superpowers](https://github.com/obra/superpowers) by [Jesse Vincent (obra)](https://blog.fsck.com) and the team at [Prime Radiant](https://primeradiant.com). The original Superpowers workflow is brilliant — Ultrapowers builds on top of it. If Superpowers has helped you, consider [sponsoring Jesse's work](https://github.com/sponsors/obra).

## Installation

### Claude Code (via Ultrapowers Marketplace)

Register the marketplace first:

```bash
/plugin marketplace add ennio-datatide/ultrapowers
```

Then install:

```bash
/plugin install ultrapowers@ultrapowers
```

### From Source

```bash
git clone https://github.com/ennio-datatide/ultrapowers.git
```

### Verify Installation

Start a new session and ask for something that should trigger a skill (for example, "help me plan this feature" or "let's debug this issue"). The agent should automatically invoke the relevant skill.

## The Research-Driven Workflow

1. **brainstorming** — Refines rough ideas through questions, explores alternatives, presents design in sections for validation.

2. **deep-research** — Captures the current state of the art for all technologies and patterns in the spec. Uses context7, WebSearch, and documentation.

3. **skills-audit** — Audits all available skills against research findings. Classifies each as Covered, Stale, Missing, or External.

4. **skills-creation** — Creates new or updates existing skills to fill gaps identified by the audit.

5. **using-git-worktrees** — Creates isolated workspace on new branch, runs project setup, verifies clean test baseline.

6. **writing-plans** — Breaks work into bite-sized tasks (2-5 minutes each) with skill annotations on each step.

7. **subagent-driven-development** or **executing-plans** — Dispatches fresh subagent per task with audited two-stage review (spec compliance, then code quality).

8. **test-driven-development** — Enforces RED-GREEN-REFACTOR: write failing test, watch it fail, write minimal code, watch it pass, commit.

9. **requesting-code-review** — Reviews against plan with audit checks. Critical issues block progress.

10. **finishing-a-development-branch** — Verifies tests, presents options (merge/PR/keep/discard), cleans up worktree.

**The agent checks for relevant skills before any task.** Mandatory workflows, not suggestions.

## What's Inside

### Research Pipeline (new in Ultrapowers)

- **deep-research** — State-of-the-art research before implementation
- **skills-audit** — Gap analysis of existing skills vs. requirements
- **skills-creation** — Create/update skills from research findings

### Testing

- **test-driven-development** — RED-GREEN-REFACTOR cycle

### Debugging

- **systematic-debugging** — 4-phase root cause process
- **verification-before-completion** — Ensure it's actually fixed

### Collaboration

- **brainstorming** — Socratic design refinement
- **writing-plans** — Detailed implementation plans with skill annotations
- **executing-plans** — Batch execution with checkpoints
- **dispatching-parallel-agents** — Concurrent subagent workflows
- **requesting-code-review** — Pre-review checklist
- **receiving-code-review** — Responding to feedback
- **using-git-worktrees** — Parallel development branches
- **finishing-a-development-branch** — Merge/PR decision workflow
- **subagent-driven-development** — Fast iteration with audited two-stage review

### Meta

- **writing-skills** — Create new skills following best practices
- **using-ultrapowers** — Introduction to the skills system

## Companion Plugins

Ultrapowers focuses on the core workflow. Domain-specific skills live in companion plugins:

- **[ultrapowers-dev](https://github.com/ennio-datatide/ultrapowers-dev)** — Development skills: language best practices, framework patterns, agentic patterns, architecture
- **[ultrapowers-business](https://github.com/ennio-datatide/ultrapowers-business)** — Business skills: marketing, compliance, finance, communication

Install from the same marketplace:

```bash
/plugin install ultrapowers-dev@ultrapowers
/plugin install ultrapowers-business@ultrapowers
```

## Philosophy

- **You own the workflow** — No auto-commits, no auto-pushes. You decide when code is ready to commit and when to push. Plans stay as working documents unless you choose to commit them
- **Research before implementation** — Never build on assumptions when you can verify
- **Knowledge compounds** — Skills capture learning for future sessions
- **Audit everything** — Every step (except research itself) gets audited
- **Test-Driven Development** — Write tests first, always
- **Systematic over ad-hoc** — Process over guessing
- **Evidence over claims** — Verify before declaring success

## Updating

```bash
/plugin update ultrapowers
```

## Contributing

Skills live directly in this repository. To contribute:

1. Fork the repository
2. Create a branch for your skill
3. Follow the `writing-skills` skill for creating and testing new skills
4. Submit a PR

## License

MIT License — see LICENSE file for details.

## Community

Ultrapowers is built by [Ennio Maldonado](https://www.enniomaldonado.com) at [Datatide](https://www.datatide.com), extending the work of [Jesse Vincent](https://blog.fsck.com) and [Prime Radiant](https://primeradiant.com).

- **Issues**: https://github.com/ennio-datatide/ultrapowers/issues
- **Superpowers Discord**: [Join the community](https://discord.gg/Jd8Vphy9jq)
