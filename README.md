# Ultrapowers

Ultrapowers is a research-driven software development workflow for your coding agents. It extends [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent with a **research-first pipeline** that ensures agents always work with current, verified knowledge before writing code.

**[Documentation](https://www.datatide.com/ultrapowers)** · **[GitHub](https://github.com/ennio-datatide/ultrapowers)** · **[Issues](https://github.com/ennio-datatide/ultrapowers/issues)**

## How it works

It starts the same way Superpowers does — your agent doesn't just jump into code. It steps back and asks what you're really trying to do.

But then Ultrapowers goes further. After brainstorming, it **researches the current state of the art** for every technology and pattern involved. It audits your existing skills against what it finds, creates or updates skills to fill gaps, and only then moves into planning and implementation.

Every implementation step gets audited against the research findings and your plan. The result: agents that build on verified knowledge, not assumptions. Knowledge compounds across sessions — your agent gets smarter over time.

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

1. **brainstorming** — Your agent steps back and asks what you're really trying to do. Refines rough ideas through questions, explores alternatives, presents design in sections for validation.

2. **deep-research** — Researches the current state of the art for all technologies and patterns in the spec. Uses documentation, web search, and context to capture what's current — not what was true six months ago.

3. **skills-audit** — Audits all available skills against research findings. Classifies each as Covered, Stale, Missing, or External. Identifies exactly what needs to be created or updated.

4. **skills-creation** — Creates new or updates existing skills to fill gaps identified by the audit. Knowledge is captured for future sessions.

5. **using-git-worktrees** — Creates isolated workspace on new branch, runs project setup, verifies clean test baseline. Your main branch stays untouched.

6. **writing-plans** — Breaks work into bite-sized tasks (2-5 minutes each) with skill annotations on each step. Clear enough for any agent to follow.

7. **subagent-driven-development** or **executing-plans** — Dispatches fresh subagent per task with audited two-stage review (spec compliance first, then code quality).

8. **test-driven-development** — Enforces RED-GREEN-REFACTOR: write failing test, watch it fail, write minimal code, watch it pass, commit. Deletes code written before tests.

9. **requesting-code-review** — Reviews against plan with audit checks. Critical issues block progress. No rubber-stamping.

10. **finishing-a-development-branch** — Verifies all tests pass, presents options (merge/PR/keep/discard), cleans up worktree. You decide what happens next.

**The agent checks for relevant skills before any task.** Mandatory workflows, not suggestions.

## Example

> "Build me a real-time notification system using WebSockets."

Ultrapowers brainstorms the design with you, researches current WebSocket best practices and libraries, audits your existing skills to find gaps, creates any missing skills, then plans and implements with TDD — all audited against the research. You review the code and commit when you're satisfied.

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

- **[ultrapowers-dev](https://github.com/ennio-datatide/ultrapowers-dev)** — 52 development skills: language best practices for 13 languages, 12 framework patterns, 7 agentic patterns, and architecture fundamentals
- **[ultrapowers-business](https://github.com/ennio-datatide/ultrapowers-business)** — 38 business skills: marketing, SEO, copywriting, conversion optimization, compliance, finance, and sales enablement

Install from the same marketplace:

```bash
/plugin install ultrapowers-dev@ultrapowers
/plugin install ultrapowers-business@ultrapowers
```

## Philosophy

- **You own the workflow** — No auto-commits, no auto-pushes. You decide when code is ready to commit and when to push. Plans stay as working documents unless you choose to commit them
- **Research before implementation** — Never build on assumptions when you can verify. Every session starts with research to capture what's current
- **Knowledge compounds** — Skills capture learning for future sessions. The audit-create cycle means your agent improves with every project
- **Audit everything** — Every step (except research itself) gets audited against the plan and findings. Spec compliance before code quality
- **Test-Driven Development** — Write tests first, always. Code written before tests gets deleted
- **Systematic over ad-hoc** — Process over guessing
- **Evidence over claims** — Verify before declaring success. If it's not tested, it's not done

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

- **Docs**: https://www.datatide.com/ultrapowers
- **Issues**: https://github.com/ennio-datatide/ultrapowers/issues
- **Superpowers Discord**: [Join the community](https://discord.gg/Jd8Vphy9jq)
