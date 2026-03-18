# Ultrapowers

Ultrapowers is a research-driven software development workflow for coding agents. It extends [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent with a **research-first pipeline** that ensures agents always work with current, verified knowledge before writing code.

## Attribution

Ultrapowers is a fork of [Superpowers](https://github.com/obra/superpowers) by [Jesse Vincent (obra)](https://blog.fsck.com) and the team at [Prime Radiant](https://primeradiant.com). The original Superpowers workflow is brilliant — Ultrapowers builds on top of it. If Superpowers has helped you, consider [sponsoring Jesse's work](https://github.com/sponsors/obra).

Original license: MIT (see LICENSE file).

## What's Different from Superpowers

Ultrapowers adds a **research-driven knowledge pipeline** between brainstorming and implementation:

```
Brainstorming → Deep Research → Skills Audit → Skills Creation → Planning → Implementation
```

After the brainstorming phase gathers context and user answers, Ultrapowers:

1. **Deep Research** — researches the current state of the art for every unfamiliar technology or pattern involved. Uses context7, WebSearch, and documentation to capture what's current.
2. **Skills Audit** — audits all available supporting skills (outside ultrapowers) against the research findings. Classifies each competency as Covered, Stale, Missing, or External.
3. **Skills Creation** — creates new or updates existing supporting skills to fill gaps identified by the audit.
4. **Audited Implementation** — every implementation step (except deep-research) is audited against the skills and plan for compliance.

The rest of the Superpowers workflow (writing-plans, TDD, subagent-driven-development, code-review, etc.) runs unchanged, with the addition that each step is audited for quality.

## The Full Workflow

1. **brainstorming** — Refines ideas through questions, explores alternatives, presents design for validation.
2. **deep-research** — Captures current state of the art for all technologies/patterns in the spec.
3. **skills-audit** — Checks existing skills against research findings, identifies gaps.
4. **skills-creation** — Creates/updates skills to fill audit gaps.
5. **using-git-worktrees** — Creates isolated workspace on new branch.
6. **writing-plans** — Breaks work into tasks with skill annotations on each step.
7. **subagent-driven-development** or **executing-plans** — Dispatches agents per task with audited review.
8. **test-driven-development** — RED-GREEN-REFACTOR enforced during implementation.
9. **requesting-code-review** — Reviews against plan with audit checks.
10. **finishing-a-development-branch** — Verifies tests, presents merge/PR options.

## Skills Library

**Research Pipeline** (new in Ultrapowers)
- **deep-research** — State-of-the-art research before implementation
- **skills-audit** — Gap analysis of existing skills vs. requirements
- **skills-creation** — Create/update skills from research findings

**Testing**
- **test-driven-development** — RED-GREEN-REFACTOR cycle

**Debugging**
- **systematic-debugging** — 4-phase root cause process
- **verification-before-completion** — Ensure it's actually fixed

**Collaboration**
- **brainstorming** — Socratic design refinement
- **writing-plans** — Detailed implementation plans with skill annotations
- **executing-plans** — Batch execution with checkpoints
- **dispatching-parallel-agents** — Concurrent subagent workflows
- **requesting-code-review** — Pre-review checklist
- **receiving-code-review** — Responding to feedback
- **using-git-worktrees** — Parallel development branches
- **finishing-a-development-branch** — Merge/PR decision workflow
- **subagent-driven-development** — Fast iteration with audited two-stage review

**Meta**
- **writing-skills** — Create new skills following best practices
- **using-ultrapowers** — Introduction to the skills system

## Installation

### Claude Code

```bash
/plugin install ultrapowers@ennio-datatide
```

### From Source

```bash
git clone https://github.com/ennio-datatide/ultrapowers.git
```

## Philosophy

- **Research before implementation** — Never build on assumptions when you can verify
- **Knowledge compounds** — Skills capture learning for future sessions
- **Audit everything** — Every step (except research itself) gets audited
- **Test-Driven Development** — Write tests first, always
- **Systematic over ad-hoc** — Process over guessing
- **Evidence over claims** — Verify before declaring success

## Companion Repos

- **[ultrapowers-dev](https://github.com/ennio-datatide/ultrapowers-dev)** — Development skills: language best practices, framework patterns, agentic patterns, architecture
- **[ultrapowers-business](https://github.com/ennio-datatide/ultrapowers-business)** — Non-dev skills: marketing, compliance, finance, communication

## License

MIT License — see LICENSE file for details.

## Credits

- **Original Superpowers** by [Jesse Vincent (obra)](https://github.com/obra) and [Prime Radiant](https://primeradiant.com)
- **Ultrapowers fork** by [Datatide](https://github.com/ennio-datatide)
