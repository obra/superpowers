# Superpowers

Give Claude Code superpowers with a comprehensive skills library of proven techniques, patterns, and workflows.

## What You Get

- **Testing Skills** - TDD, async testing, anti-patterns
- **Debugging Skills** - Systematic debugging, root cause tracing, verification
- **Problem-Solving Skills** - Simplification, innovation, pattern recognition, assumption challenges
- **Research Skills** - Decision archaeology, knowledge lineage tracing
- **Collaboration Skills** - Brainstorming, planning, code review, parallel agents
- **Development Skills** - Git worktrees, finishing branches, subagent workflows, cleanup automation
- **Documentation Skills** - Holistic documentation management
- **Meta Skills** - Creating, testing, and sharing skills

Plus:

- **Slash Commands** - `/superpowers:brainstorm`, `/superpowers:write-plan`, `/superpowers:execute-plan`, `/superpowers:setup-knowledge-management`
- **Knowledge Management** - Opt-in [ADR](https://adr.github.io/) (Architecture Decision Records) and DISCOVERIES patterns for tracking decisions and non-obvious solutions
- **Automatic Integration** - Skills activate automatically when relevant
- **Consistent Workflows** - Systematic approaches to common engineering tasks

## Attribution

This is a personal fork of [obra/superpowers](https://github.com/obra/superpowers) with additional skills and enhancements borrowed from:

- [superpowers-skills](https://github.com/obra/superpowers-skills) - Problem-solving patterns
- [CCPlugins](https://github.com/brennercruvinel/CCPlugins) - Development workflow skills
- [claude-codex-settings](https://github.com/fcakyon/claude-codex-settings/tree/main) - Enhancement concepts
- [Microsoft Amplifier](https://github.com/microsoft/amplifier) - Tension management patterns

See [CHANGELOG.md](CHANGELOG.md) for detailed changes and additions.

## Installation

### Via Plugin Marketplace (Recommended)

```bash
# In Claude Code
/plugin marketplace add jthurlburt/claude-settings
/plugin install superpowers@jthurlburt-claude-plugins
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

**Testing**

- **test-driven-development** - RED-GREEN-REFACTOR cycle
- **condition-based-waiting** - Async test patterns
- **testing-anti-patterns** - Common pitfalls to avoid
- **testing-skills-with-subagents** - Validate skill quality

**Debugging**

- **systematic-debugging** - 4-phase root cause process (enhanced)
- **root-cause-tracing** - Find the real problem
- **verification-before-completion** - Ensure it's actually fixed
- **defense-in-depth** - Multiple validation layers

**Problem-Solving**

- **simplification-cascades** - Find unifying principles that eliminate components
- **collision-zone-thinking** - Force unrelated concepts together for innovation
- **meta-pattern-recognition** - Spot universal patterns across domains
- **inversion-exercise** - Flip assumptions to reveal alternatives
- **scale-game** - Test at extremes to expose fundamental truths
- **when-stuck** - Dispatch router to appropriate problem-solving technique
- **predict-issues** - Proactive problem identification with risk assessment (enhanced)

**Research & Architecture**

- **tracing-knowledge-lineages** - Understand technical decision evolution
- **preserving-productive-tensions** - Recognize when to preserve multiple approaches
- **extracting-patterns-from-projects** - Systematic analysis methodology for external projects

**Collaboration**

- **brainstorming** - Socratic design refinement (enhanced)
- **writing-plans** - Detailed implementation plans (enhanced)
- **executing-plans** - Batch execution with checkpoints (enhanced)
- **dispatching-parallel-agents** - Concurrent subagent workflows
- **requesting-code-review** - Pre-review checklist
- **receiving-code-review** - Responding to feedback (enhanced)
- **subagent-driven-development** - Fast iteration with quality gates

**Development Workflow**

- **using-git-worktrees** - Parallel development branches
- **finishing-a-development-branch** - Merge/PR decision workflow (enhanced)
- **documentation-management** - Holistic documentation maintenance
- **code-and-project-cleanup** - Safe cleanup of code and project artifacts

**Meta**

- **writing-skills** - Create new skills following best practices
- **sharing-skills** - Contribute skills back via branch and PR
- **using-superpowers** - Introduction to the skills system
- **enhancing-superpowers** - Project-specific integration guide for superpowers

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

See `skills/writing-skills/SKILL.md` for the complete guide.

## Updating

Skills update automatically when you update the plugin:

```bash
/plugin update superpowers@jthurlburt/claude-settings
```

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: https://github.com/obra/superpowers/issues
- **Marketplace**: https://github.com/obra/superpowers-marketplace
