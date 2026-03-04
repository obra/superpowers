# Superpowers

A complete software development workflow for coding agents, built on composable skills that trigger automatically.

> Maintained fork of [obra/superpowers](https://github.com/obra/superpowers) by [@cameronsjo](https://github.com/cameronsjo).

Superpowers starts from the moment you fire up your coding agent. Instead of jumping straight into code, it steps back and asks what you're really trying to do. It teases out a spec, shows it in digestible chunks, builds an implementation plan emphasizing TDD and YAGNI, then executes autonomously — often for hours without deviating from the plan.

Skills trigger automatically. You don't need to do anything special.

## Installation

```bash
/plugin marketplace add cameronsjo/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

## The Basic Workflow

1. **brainstorming** - Activates before writing code. Refines rough ideas through questions, explores alternatives, presents design in sections for validation. Saves design document.

2. **using-git-worktrees** - Activates after design approval. Creates isolated workspace on new branch, runs project setup, verifies clean test baseline.

3. **writing-plans** - Activates with approved design. Breaks work into bite-sized tasks (2-5 minutes each). Every task has exact file paths, complete code, verification steps.

4. **executing-plans** or **agent-teams** - Activates with plan. Executes tasks in batches with human checkpoints, or coordinates parallel teammates for cross-layer work.

5. **test-driven-development** - Activates during implementation. Enforces RED-GREEN-REFACTOR: write failing test, watch it fail, write minimal code, watch it pass, commit. Deletes code written before tests.

6. **requesting-code-review** - Activates between tasks. Reviews against plan, reports issues by severity. Critical issues block progress.

7. **finishing-a-development-branch** - Activates when tasks complete. Verifies tests, presents options (merge/PR/keep/discard), cleans up worktree.

**The agent checks for relevant skills before any task.** Mandatory workflows, not suggestions.

## What's Inside

### Skills Library

**Testing**
- **test-driven-development** - RED-GREEN-REFACTOR cycle (includes testing anti-patterns reference)

**Debugging**
- **systematic-debugging** - 4-phase root cause process (includes root-cause-tracing, defense-in-depth, condition-based-waiting techniques)
- **verification-before-completion** - Ensure it's actually fixed

**Collaboration** 
- **brainstorming** - Socratic design refinement
- **writing-plans** - Detailed implementation plans
- **executing-plans** - Batch execution with checkpoints
- **agent-teams** - Coordinate parallel Claude Code sessions with shared task lists
- **requesting-code-review** - Pre-review checklist
- **receiving-code-review** - Responding to feedback
- **using-git-worktrees** - Parallel development branches
- **finishing-a-development-branch** - Merge/PR decision workflow

**Meta**
- **writing-skills** - Create new skills following best practices (includes testing methodology)
- **using-superpowers** - Introduction to the skills system

## Philosophy

- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success

Read more: [Superpowers for Claude Code](https://blog.fsck.com/2025/10/09/superpowers/)

## Contributing

PRs welcome. Follow the `writing-skills` skill for creating and testing new skills.

## License

MIT License - see LICENSE file for details.

## Support

- **Issues**: https://github.com/cameronsjo/superpowers/issues
- **Upstream**: https://github.com/obra/superpowers
