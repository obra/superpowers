# Production-Tested Improvements

This fork of [obra/superpowers](https://github.com/obra/superpowers) adds mechanical enforcement and safety gates developed through real-world usage.

## Compatibility

All existing Superpowers workflows, commands, and skills work unchanged. Users familiar with the original can maintain their existing workflows.

## Key Improvements

### 1. Writing-Plans Automation Framework

Enhances the existing `writing-plans` skill with executable wrapper scripts that enforce plan creation through lock files and git pre-commit hooks.

- **Lock file mechanism** ensures plans exist before coding begins
- **Git pre-commit hooks** prevent commits without corresponding implementation plans
- **Shifts from documentation to mechanical constraints** - addresses incidents where agents rationalized away requirements

### 2. Automation Over Documentation Framework

A new guidance document establishing when to use code vs. documentation for skill requirements.

- **Clear decision criteria**: objective, programmatically detectable requirements should trigger automation
- **Reduces documentation churn** - when violations are 100% detectable, use automation
- **Framework for future skill development** - establishes pattern for similar enforcement needs

### 3. PR Creation Safety Gate

Adds mandatory user preview and approval before pull request creation in the `finishing-a-development-branch` skill.

- **Defense-in-depth approach**: skill-level approval gate + permission rules + system prompts
- **Preview-then-confirm pattern** prevents bypassing approval workflows through rationalization
- **Follows pattern from `jira-publisher` skill** - proven safety-critical workflow

### 4. Continuous Execution Pattern

Removes artificial 3-task batching checkpoints from `executing-plans`, allowing uninterrupted workflow through multiple tasks.

- **Improved development velocity** - no artificial pauses
- **Only genuine blockers cause pauses** - maintains quality gates
- **Preserves all safety checks** - verification still runs at appropriate times

### 5. Writing-Skills Governance

Strengthens skill modification governance with enhanced discoverability and rationalization counters.

- **Enhanced discoverability** of the writing-skills meta-skill
- **Rationalization counters** against "just adding a section" shortcuts
- **Clear guidance on TDD treatment vs. quick updates** - when skills need full testing methodology

## Philosophy

**Automation over documentation** for objective constraints, while preserving judgment-based guidance for subjective decisions. Skills are TDD for documentation—we test first, then write documentation that makes tests pass, iterating to close loopholes where agents rationalize around requirements.

---

[View upstream project](https://github.com/obra/superpowers)
