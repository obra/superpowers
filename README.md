# Superpowers for Letta Code

A comprehensive software development workflow for Letta Code agents, built on composable "skills" that guide your agent through systematic development practices.

> **Note:** This is a Letta Code adaptation of [obra/superpowers](https://github.com/obra/superpowers) by Jesse Vincent. The original project supports Claude Code, Cursor, GitHub Copilot CLI, and other platforms. This fork is specifically adapted for Letta Code.

## How it works

When your Letta Code agent starts working on a task, it doesn't just jump into writing code. Instead, it steps back and asks what you're really trying to accomplish.

Once it has a design, it presents it in digestible chunks for your review. After approval, it creates a detailed implementation plan clear enough for an enthusiastic junior engineer to follow—emphasizing TDD, YAGNI, and DRY.

When you say "go", it launches a subagent-driven development process, working through each task, reviewing work, and continuing forward autonomously for hours at a time.

## Installation

Copy the skills to your project's `.skills/` directory:

```bash
# Clone this repository
git clone <your-fork-url> /tmp/superpowers-letta

# Copy skills to your project
mkdir -p .skills
cp -r /tmp/superpowers-letta/skills/* .skills/
```



## The Basic Workflow

1. **brainstorming** - Refines rough ideas through questions, explores alternatives, presents design in sections for validation.

2. **using-git-worktrees** - Creates isolated workspace on new branch, runs project setup, verifies clean test baseline.

3. **writing-plans** - Breaks work into bite-sized tasks (2-5 minutes each). Every task has exact file paths, complete code, verification steps.

4. **subagent-driven-development** or **executing-plans** - Dispatches fresh subagent per task with single reviewer and file-based artifacts, or executes in batches with human checkpoints.

5. **test-driven-development** - Enforces RED-GREEN-REFACTOR: write failing test, watch it fail, write minimal code, watch it pass, commit.

6. **requesting-code-review** - Reviews against plan, reports issues by severity. Critical issues block progress.

7. **finishing-a-development-branch** - Verifies tests, presents options (merge/PR/keep/discard), cleans up worktree.

## Skills Library

### Testing
- **test-driven-development** - RED-GREEN-REFACTOR cycle with testing anti-patterns reference

### Debugging
- **systematic-debugging** - 4-phase root cause process
- **verification-before-completion** - Ensure it's actually fixed

### Collaboration
- **brainstorming** - Socratic design refinement with Visual Companion
- **writing-plans** - Detailed implementation plans
- **executing-plans** - Batch execution with checkpoints
- **dispatching-parallel-agents** - Concurrent subagent workflows
- **requesting-code-review** - Pre-review checklist
- **receiving-code-review** - Responding to feedback
- **using-git-worktrees** - Parallel development branches
- **finishing-a-development-branch** - Merge/PR decision workflow
- **subagent-driven-development** - Per-task dispatch with single reviewer, file-based artifacts, and progress ledger
- **releasing** - Create releases with pre-flight checklist and version management

### Meta
- **skill-authoring-tdd** - Create new skills using TDD methodology
- **using-superpowers** - Introduction to the skills system

## Philosophy

- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success

## Differences from Original

This Letta Code adaptation includes:

- Task tool syntax updated for Letta Code's `Task({ subagent_type, description, prompt })` format
- Removed platform-specific files (hooks, plugin configs)
- Updated tool mapping references (see `skills/using-superpowers/references/letta-code-tools.md`)
- Visual Companion adapted for Letta Code with per-session key auth, auto-reconnect, and just-in-time offering
- Code review skill uses general-purpose subagent type (no custom agent definition needed)
- SDD review system uses single reviewer with file-based artifacts and progress ledger
- Writing-plans includes Global Constraints, per-task Interfaces, and Task Right-Sizing
- Forge-neutral language across all skills (adapted for Letta Code conventions)

## Contributing

This is a port of the original Superpowers project. For contributions:

1. **Upstream changes** - Submit PRs to [obra/superpowers](https://github.com/obra/superpowers)
2. **Letta Code-specific adaptations** - Submit issues/PRs to this repository

See `skills/skill-authoring-tdd/SKILL.md` for the complete skill authoring guide.

## Updating

```bash
# Pull latest from your fork
cd /tmp/superpowers-letta && git pull

# Re-copy skills
cp -r /tmp/superpowers-letta/skills/* .skills/
```

## License

MIT License - see LICENSE file for details.

## Credits

- **Original Project**: [Superpowers](https://github.com/obra/superpowers) by [Jesse Vincent](https://blog.fsck.com)
- **Letta Code Adaptation**: Ported with modifications for Letta Code compatibility

## Community

- **Original Discord**: [Join the Superpowers community](https://discord.gg/35wsABTejz)
- **Letta Community**: [Letta Discord](https://discord.gg/letta)
