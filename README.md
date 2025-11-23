# Superpowers

AI agents skip steps under time pressure. They bypass best practices when confident. They lack consistency across tasks.

**Superpowers fixes this.** Skills are mandatory instruction documents agents must follow. When a relevant skill exists, agents use it or fail the task.

## How It Works

Skills are markdown files with proven workflows. The system teaches agents: "You have skills. Use them." This creates compliance, not optional reference.

**Example:** The `test-driven-development` skill forces RED-GREEN-REFACTOR. No test-first? Delete the code and start over. The skill prevents rationalization.

## What's Inside

**Testing**
- test-driven-development, condition-based-waiting, testing-anti-patterns

**Debugging**
- systematic-debugging, root-cause-tracing, verification-before-completion, defense-in-depth

**Collaboration**
- brainstorming, writing-plans, executing-plans, dispatching-parallel-agents, requesting-code-review, receiving-code-review, using-git-worktrees, finishing-a-development-branch, subagent-driven-development

**Meta**
- writing-skills, sharing-skills, testing-skills-with-subagents, using-superpowers

**Plus:** Slash commands (`/superpowers:brainstorm`, `/superpowers:write-plan`, `/superpowers:execute-plan`) activate skills directly.

## The Workflow

**1. Brainstorm the design**
```
/superpowers:brainstorm
```
Refine rough ideas through Socratic questioning. Explore alternatives. Present design in sections, validate each. Output: design document.

**2. Write the implementation plan**
```
/superpowers:write-plan
```
Break design into bite-sized tasks (2-5 minutes each). Include exact file paths, complete code, test commands. Output: task-by-task plan.

**3. Execute with TDD**
```
/superpowers:execute-plan
```
Implement in batches with review checkpoints. Each task follows RED-GREEN-REFACTOR. Tests fail first, then pass. Frequent commits.

**4. Finish the branch**
Skills guide verification, decision (merge/PR/keep), and cleanup. Tests pass before merge. No broken windows.

## Philosophy

Test-driven development. Systematic over ad-hoc. Evidence over claims. Simplicity as primary goal.

Read more: [Superpowers for Claude Code](https://blog.fsck.com/2025/10/09/superpowers/)

## Installation

### Claude Code (via Plugin Marketplace)

In Claude Code, register the marketplace first:

```bash
/plugin marketplace add obra/superpowers-marketplace
```

Then install the plugin from this marketplace:

```bash
/plugin install superpowers@superpowers-marketplace
```

### Verify Installation

Check that commands appear:

```bash
/help
```

```
# Should see:
# /superpowers:brainstorm - Interactive design refinement
# /superpowers:write-plan - Create implementation plan
# /superpowers:execute-plan - Execute plan in batches
```

### Codex

Tell Codex:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md
```

**Detailed docs:** [docs/README.codex.md](docs/README.codex.md)

### OpenCode

Tell OpenCode:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md
```

**Detailed docs:** [docs/README.opencode.md](docs/README.opencode.md)

## Quick Start

### Using Slash Commands

**Brainstorm a design:**
```
/superpowers:brainstorm
```

**Create an implementation plan:**
```
/superpowers:write-plan
```

**Execute the plan:**
```
/superpowers:execute-plan
```

### Automatic Skill Activation

Skills activate automatically when relevant. For example:
- `test-driven-development` activates when implementing features
- `systematic-debugging` activates when debugging issues
- `verification-before-completion` activates before claiming work is done

## What's Inside

### Skills Library

**Testing** (`skills/testing/`)
- **test-driven-development** - RED-GREEN-REFACTOR cycle
- **condition-based-waiting** - Async test patterns
- **testing-anti-patterns** - Common pitfalls to avoid

**Debugging** (`skills/debugging/`)
- **systematic-debugging** - 4-phase root cause process
- **root-cause-tracing** - Find the real problem
- **verification-before-completion** - Ensure it's actually fixed
- **defense-in-depth** - Multiple validation layers

**Collaboration** (`skills/collaboration/`)
- **brainstorming** - Socratic design refinement
- **writing-plans** - Detailed implementation plans
- **executing-plans** - Batch execution with checkpoints
- **dispatching-parallel-agents** - Concurrent subagent workflows
- **requesting-code-review** - Pre-review checklist
- **receiving-code-review** - Responding to feedback
- **using-git-worktrees** - Parallel development branches
- **finishing-a-development-branch** - Merge/PR decision workflow
- **subagent-driven-development** - Fast iteration with quality gates

**Meta** (`skills/meta/`)
- **writing-skills** - Create new skills following best practices
- **sharing-skills** - Contribute skills back via branch and PR
- **testing-skills-with-subagents** - Validate skill quality
- **using-superpowers** - Introduction to the skills system

### Commands

All commands are thin wrappers that activate the corresponding skill:

- **brainstorm.md** - Activates the `brainstorming` skill
- **write-plan.md** - Activates the `writing-plans` skill
- **execute-plan.md** - Activates the `executing-plans` skill

## How It Works

1. **SessionStart Hook** - Loads the `using-superpowers` skill at session start
2. **Skills System** - Uses Claude Code's first-party skills system
3. **Automatic Discovery** - Claude finds and uses relevant skills for your task
4. **Mandatory Workflows** - When a skill exists for your task, using it becomes required

## Philosophy

- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success
- **Domain over implementation** - Work at problem level, not solution level

## Contributing

Skills live directly in this repository. To contribute:

1. Fork the repository
2. Create a branch for your skill
3. Follow the `writing-skills` skill for creating new skills
4. Use the `testing-skills-with-subagents` skill to validate quality
5. Submit a PR

See `skills/meta/writing-skills/SKILL.md` for the complete guide.

## Updating

Skills update automatically when you update the plugin:

```bash
/plugin update superpowers
```

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: https://github.com/obra/superpowers/issues
- **Marketplace**: https://github.com/obra/superpowers-marketplace
