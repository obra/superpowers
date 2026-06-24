# Superpowers Rails

Superpowers Rails brings [Superpowers](https://github.com/obra/superpowers) — Jesse Vincent's software development methodology for coding agents — to Rails. The methodology is his; Superpowers Rails layers Rails on top:

- **Eight Rails convention skills** (models, controllers, views, policies, jobs, migrations, Stimulus, testing), enforced by a PreToolUse hook that blocks Rails file edits until the matching convention skill is loaded
- **A Rails review stage** in the subagent review pipeline (spec compliance → Rails conventions → code quality), plus a `/codereview` command that runs the full pipeline on demand
- **A different planning philosophy**: plans are vertical slices — every slice ships a user-visible capability — written at intent level, with exact code reserved for fragile operations

The full delta against upstream is documented in [docs/fork-changes.md](docs/fork-changes.md); release history is in [RELEASE-NOTES.md](RELEASE-NOTES.md). Report issues at [fryga-io/superpowers-rails](https://github.com/fryga-io/superpowers-rails/issues), not upstream. Superpowers Rails is funded by [fryga](https://fryga.io).

Superpowers is a complete software development methodology for your coding agents, built on top of a set of composable skills and some initial instructions that make sure your agent uses them.

## Quickstart

Give your agent Superpowers: [Claude Code](#claude-code), [Factory Droid](#factory-droid), [Gemini CLI](#gemini-cli), [OpenCode](#opencode), [GitHub Copilot CLI](#github-copilot-cli). (Superpowers Rails is not published to the Codex or Cursor marketplaces — see those sections below.)

## How it works

It starts from the moment you fire up your coding agent. As soon as it sees that you're building something, it *doesn't* just jump into trying to write code. Instead, it steps back and asks you what you're really trying to do. 

Once it's teased a spec out of the conversation, it shows it to you in chunks short enough to actually read and digest. 

After you've signed off on the design, your agent puts together an implementation plan with bite-sized tasks describing what to build and where. It uses intent-level steps for routine work and exact code only for fragile operations like migrations. It emphasizes true red/green TDD, YAGNI (You Aren't Gonna Need It), and DRY.

Next up, once you say "go", it launches a *subagent-driven-development* process, having agents work through each engineering task, inspecting and reviewing their work, and continuing forward. It's not uncommon for Claude to be able to work autonomously for a couple hours at a time without deviating from the plan you put together.

There's a bunch more to it, but that's the core of the system. And because the skills trigger automatically, you don't need to do anything special. Your coding agent just has Superpowers.


## Sponsorship

Superpowers Rails is built on Jesse Vincent's Superpowers. If it has helped you do stuff that makes money and you are so inclined, consider [sponsoring his opensource work](https://github.com/sponsors/obra).


## Installation

Installation differs by harness. If you use more than one, install Superpowers separately for each one.

### Claude Code

- Register the Fryga marketplace:

  ```bash
  /plugin marketplace add fryga-io/claude-marketplace
  ```

- Install the plugin:

  ```bash
  /plugin install superpowers-rails@fryga
  ```

#### Migrating from the old plugin name (existing installs)

Before v5.1.2-rails this plugin was named `superpowers` and installed from this repo's own marketplace (`superpowers-dev`). Existing `superpowers@superpowers-dev` installs keep working unchanged — the marketplace keeps a deprecated `superpowers` entry frozen at 5.1.1-rails — but they receive no further updates.

Migrating is recommended but optional. Using the marketplace you already have:

```bash
/plugin marketplace update superpowers-dev
/plugin uninstall superpowers@superpowers-dev
/plugin install superpowers-rails@superpowers-dev
```

Or switch to the public `fryga` marketplace entirely: first `/plugin uninstall superpowers@superpowers-dev` so you are never running both plugins at once, then add the `fryga` marketplace and install from it (see [Claude Code](#claude-code) above).

### Codex CLI

The [official Codex plugin marketplace](https://github.com/openai/plugins) serves upstream [Superpowers](https://github.com/obra/superpowers), not Superpowers Rails. Installing `superpowers` there gets you upstream, without the Rails additions. Superpowers Rails is not published to the Codex marketplace.

### Codex App

Same as Codex CLI: the Codex plugin marketplace entry is upstream Superpowers, not Superpowers Rails.

### Factory Droid

Untested on this harness — these commands mirror upstream's git-based install, re-pointed at this repo.

- Register the marketplace:

  ```bash
  droid plugin marketplace add https://github.com/fryga-io/superpowers-rails
  ```

- Install the plugin:

  ```bash
  droid plugin install superpowers-rails@superpowers-rails
  ```

### Gemini CLI

Untested on this harness.

- Install the extension:

  ```bash
  gemini extensions install https://github.com/fryga-io/superpowers-rails
  ```

- Update later:

  ```bash
  gemini extensions update superpowers-rails
  ```

### OpenCode

OpenCode uses its own plugin install; install Superpowers Rails separately even if you
already use it in another harness.

- Tell OpenCode:

  ```
  Fetch and follow instructions from https://raw.githubusercontent.com/fryga-io/superpowers-rails/refs/heads/main/.opencode/INSTALL.md
  ```

- Detailed docs: [docs/README.opencode.md](docs/README.opencode.md)

### Cursor

The Cursor plugin marketplace entry for "superpowers" is upstream Superpowers, not Superpowers Rails. Superpowers Rails is not published to Cursor's marketplace.

### GitHub Copilot CLI

Untested on this harness — Copilot CLI consumes Claude-Code-style marketplaces, so the Fryga marketplace should work, but we have not verified it.

- Register the marketplace:

  ```bash
  copilot plugin marketplace add fryga-io/claude-marketplace
  ```

- Install the plugin:

  ```bash
  copilot plugin install superpowers-rails@fryga
  ```

## The Basic Workflow

1. **brainstorming** - Activates before writing code. Refines rough ideas through questions, explores alternatives, presents design in sections for validation. Saves design document.

2. **using-git-worktrees** - Activates after design approval. Creates isolated workspace on new branch, runs project setup, verifies clean test baseline.

3. **writing-plans** - Activates with approved design. Breaks work into bite-sized tasks (2-5 minutes each). Intent-level steps by default, exact code for migrations and fragile ops.

4. **subagent-driven-development** or **executing-plans** - Activates with plan. Dispatches fresh subagent per task with three-stage review (spec compliance, Rails conventions, code quality), or executes in batches with human checkpoints.

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
- **dispatching-parallel-agents** - Concurrent subagent workflows
- **requesting-code-review** - Pre-review checklist
- **receiving-code-review** - Responding to feedback
- **using-git-worktrees** - Parallel development branches
- **finishing-a-development-branch** - Merge/PR decision workflow
- **subagent-driven-development** - Fast iteration with three-stage review (spec, Rails conventions, quality)

**Rails**
- **rails-model/controller/view/policy/job/migration/stimulus/testing-conventions** - Eight convention skills, enforced by the `rails-conventions` PreToolUse hook

**Meta**
- **writing-skills** - Create new skills following best practices (includes testing methodology)
- **using-superpowers** - Introduction to the skills system

## Philosophy

- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success

Read [the original release announcement](https://blog.fsck.com/2025/10/09/superpowers/).

## Contributing

The general contribution process for Superpowers is below. Keep in mind that we don't generally accept contributions of new skills and that any updates to skills must work across all of the coding agents we support.

1. Fork the repository
2. Create a branch for your work from `main` (this repo has no `dev` branch)
3. Follow the `writing-skills` skill for creating and testing new and modified skills
4. Submit a PR, being sure to fill in the pull request template.

See `skills/writing-skills/SKILL.md` for the complete guide.

## Updating

Superpowers updates are somewhat coding-agent dependent, but are often automatic.

## License

MIT License - see LICENSE file for details

## Community

Superpowers is built by [Jesse Vincent](https://blog.fsck.com) and the rest of the folks at [Prime Radiant](https://primeradiant.com).

- **Discord**: [Join us](https://discord.gg/35wsABTejz) for community support, questions, and sharing what you're building with Superpowers
- **Issues** (Superpowers Rails): https://github.com/fryga-io/superpowers-rails/issues — upstream issues belong at https://github.com/obra/superpowers/issues
- **Release announcements** (upstream): [Sign up](https://primeradiant.com/superpowers/) to get notified about new versions
