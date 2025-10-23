# Superpowers

Give Claude Code superpowers with a comprehensive skills library of proven techniques, patterns, and workflows.

## What You Get

- **Testing Skills** - TDD, async testing, anti-patterns
- **Debugging Skills** - Systematic debugging, root cause tracing, verification
- **Collaboration Skills** - Brainstorming, planning, code review, parallel agents
- **Development Skills** - Git worktrees, finishing branches, subagent workflows
- **Meta Skills** - Creating, testing, and sharing skills

Plus:
- **Slash Commands** - `/superpowers:brainstorm`, `/superpowers:write-plan`, `/superpowers:execute-plan`
- **Automatic Integration** - Skills activate automatically when relevant
- **Consistent Workflows** - Systematic approaches to common engineering tasks

## Learn More

Read the introduction: [Superpowers for Claude Code](https://blog.fsck.com/2025/10/09/superpowers/)

## Installation

### Via Plugin Marketplace (Recommended)

```bash
# In Claude Code
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

### Verify Installation

```bash
# Check that commands appear
/help

# Should see:
# /superpowers:brainstorm - Interactive design refinement
# /superpowers:write-plan - Create implementation plan
# /superpowers:execute-plan - Execute plan in batches
```

## Orchestration Mode

As of v3.3.0, superpowers includes an orchestration system that automatically delegates tasks to specialist agents.

### How It Works

When superpowers plugin is installed, orchestration mode is **active by default**:

1. **You make a request** → Main Claude (orchestrator) receives it
2. **Orchestrator checks registry** → Matches your request to appropriate specialist agent
3. **Specialist executes skill** → Expert agent applies the relevant skill systematically
4. **Report returns** → Orchestrator receives structured report and decides next steps
5. **Workflow continues** → Orchestrator may call additional specialists or present results

### Benefits

- **Context preservation:** Orchestrator stays focused on workflow management, specialists handle execution details
- **Systematic skill application:** Every specialist follows proven skill methodology exactly
- **Performance:** Only relevant skills load (not all 20 skills per session)
- **Reliability:** Clear delegation rules prevent ad-hoc "I'll do it myself" shortcuts

### The Specialist Agents

Each of the 20 superpowers skills has a corresponding specialist agent:

- `brainstorming-specialist` - Design refinement before coding
- `systematic-debugging-specialist` - 4-phase debugging framework
- `test-driven-development-specialist` - RED-GREEN-REFACTOR cycle
- `writing-plans-specialist` - Detailed implementation plans
- `executing-plans-specialist` - Batch execution with checkpoints
- ... (15 more specialists)

Full list: `lib/agent-registry.json`

### Project-Specific Configuration

Projects can customize orchestration via `CLAUDE.md`:

```markdown
## Custom Orchestration Rules

- Skip brainstorming for minor bug fixes under 10 lines
- Always use test-driven-development for API endpoints
- Require code review before merging features
```

The orchestrator respects project-specific rules while enforcing core delegation principles.

### Regenerating Specialists

When skills are updated, regenerate specialist agents:

```bash
./lib/generate-specialists.sh
```

This rebuilds all 20 `agents/*-specialist.md` files and `lib/agent-registry.json` from current skill content.

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
