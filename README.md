# Hyperpowers

Hyperpowers is a complete software development workflow for your coding agents, built on top of a set of composable "skills" and some initial instructions that make sure your agent uses them.

## How it works

It starts from the moment you fire up your coding agent. As soon as it sees that you're building something, it _doesn't_ just jump into trying to write code. Instead, it steps back and asks you what you're really trying to do.

Once it's teased a spec out of the conversation, it shows it to you in chunks short enough to actually read and digest.

After you've signed off on the design, your agent puts together an implementation plan that's clear enough for an enthusiastic junior engineer with poor taste, no judgement, no project context, and an aversion to testing to follow. It emphasizes true red/green TDD, YAGNI (You Aren't Gonna Need It), and DRY.

Next up, once you say "go", it launches a _subagent-driven-development_ process, having agents work through each engineering task, inspecting and reviewing their work, and continuing forward. It's not uncommon for Claude to be able to work autonomously for a couple hours at a time without deviating from the plan you put together.

There's a bunch more to it, but that's the core of the system. And because the skills trigger automatically, you don't need to do anything special. Your coding agent just has Hyperpowers.

## Sponsorship

If Hyperpowers has helped you do stuff that makes money and you are so inclined, I'd greatly appreciate it if you'd consider [sponsoring my opensource work](https://github.com/sponsors/bradwindy).

Thanks!

- Bradley

## Installation

**Note:** Installation differs by platform. Claude Code has a built-in plugin system. Codex and OpenCode require manual setup.

### Claude Code

#### Option 1: Direct Git Installation

Execute this command to install directly from the repository:

```bash
/plugin install --git https://github.com/bradwindy/hyperpowers
```

#### Option 2: Marketplace Installation

This approach requires two steps. First, register the marketplace source:

```bash
/plugin marketplace add bradwindy/hyperpowers
```

Then proceed with the installation:

```bash
/plugin install hyperpowers@hyperpowers-marketplace
```

#### Option 3: Local Development

Clone the repository locally, then add and install from that location:

```bash
git clone https://github.com/bradwindy/hyperpowers.git
/plugin marketplace add ./hyperpowers
/plugin install hyperpowers@hyperpowers-marketplace
```

#### Verify Installation

Check that commands appear:

```bash
/help
```

```
# Should see:
# /hyperpowers:brainstorm - Interactive design refinement
# /hyperpowers:write-plan - Create implementation plan
```

### Codex

Tell Codex:

```
Fetch and follow instructions from https://raw.githubusercontent.com/bradwindy/hyperpowers/refs/heads/main/.codex/INSTALL.md
```

**Detailed docs:** [docs/README.codex.md](docs/README.codex.md)

### OpenCode

Tell OpenCode:

```
Fetch and follow instructions from https://raw.githubusercontent.com/bradwindy/hyperpowers/refs/heads/main/.opencode/INSTALL.md
```

**Detailed docs:** [docs/README.opencode.md](docs/README.opencode.md)

## The Basic Workflow

1. **brainstorming** - Activates before writing code. Refines rough ideas through questions, explores alternatives, presents design in sections for validation. Saves design document.

2. **using-git-worktrees** - Activates after design approval. Creates isolated workspace on new branch, runs project setup, verifies clean test baseline.

3. **writing-plans** - Activates with approved design. Breaks work into bite-sized tasks (2-5 minutes each). Every task has exact file paths, complete code, verification steps.

4. **subagent-driven-development** - Activates with plan. Dispatches fresh subagent per task with two-stage review (spec compliance, then code quality).

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
- **dispatching-parallel-agents** - Concurrent subagent workflows
- **requesting-code-review** - Pre-review checklist
- **receiving-code-review** - Responding to feedback
- **using-git-worktrees** - Parallel development branches
- **finishing-a-development-branch** - Merge/PR decision workflow
- **subagent-driven-development** - Fast iteration with two-stage review (spec compliance, then code quality)

**Meta**

- **writing-skills** - Create new skills following best practices (includes testing methodology)
- **using-hyperpowers** - Introduction to the skills system

## Improvements Over Superpowers

Hyperpowers includes significant enhancements over the original Superpowers project. Key improvements include:

**Enhanced Planning Workflow**
- **Phase 0 Clarification**: New preliminary phase that asks clarifying questions before context gathering, preventing incomplete planning
- **Three-Phase Context Gathering**: Parallel subagent exploration across codebase, documentation, and best practices
- **Iron Law Enforcement**: Strict gates preventing agents from skipping context gathering with rationalization tables and red flags

**Subagent Communication**
- **File-Based Handoffs**: Structured `docs/handoffs/` directory for subagent communication, reducing token usage
- **Progress Tracking**: Gitignored state file for session resumability
- **Context Curation Guidelines**: Best practices for minimal, focused context passing

**Skill Strengthening**
- **Allowed-Tools Enforcement**: New frontmatter field restricting tools per skill phase (e.g., brainstorming is read-only)
- **Anti-Pattern Documentation**: Explicit warnings in TDD, debugging, and verification skills
- **Anti-Performative-Agreement**: Code review skills require verification, not automatic acceptance

**Cost & Speed Optimization**
- **Model Selection**: Haiku for validation tasks (reviews), Sonnet/Opus for implementation
- **Token Optimization**: Core skills compressed without losing essential behavior

**Testing Infrastructure**
- **Comprehensive Test Suite**: Context gathering, clarification, and enforcement language tests
- **Case-Insensitive Assertions**: Robust pattern matching for LLM output variance

For complete details on all 111 commits since forking, see [IMPROVEMENTS.md](IMPROVEMENTS.md).

## Philosophy

- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success

## Contributing

Skills live directly in this repository. To contribute:

1. Fork the repository
2. Create a branch for your skill
3. Follow the `writing-skills` skill for creating and testing new skills
4. Submit a PR

See `skills/writing-skills/SKILL.md` for the complete guide.

## Updating

Skills update automatically when you update the plugin:

```bash
/plugin update hyperpowers
```

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: https://github.com/bradwindy/hyperpowers/issues
- **Marketplace**: https://github.com/bradwindy/hyperpowers-marketplace

## Attribution

Hyperpowers is a fork of [Superpowers](https://github.com/obra/superpowers), originally created by [Jesse Vincent](https://github.com/obra).

The original Superpowers project is licensed under the MIT License. This fork maintains the same license terms.

We gratefully acknowledge Jesse Vincent's work in creating the original project that made this fork possible.
