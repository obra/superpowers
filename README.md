# Superpowers Rails

Superpowers Rails brings [Superpowers](https://github.com/obra/superpowers) — Jesse Vincent's software development methodology for coding agents — to Rails. The methodology is his; Superpowers Rails layers Rails on top:

- **Eight Rails convention skills** (models, controllers, views, policies, jobs, migrations, Stimulus, testing), enforced by a PreToolUse hook that blocks Rails file edits until the matching convention skill is loaded
- **A Rails review stage** in the subagent review pipeline (task review covering spec compliance + code quality, then Rails conventions), plus a `/codereview` command that runs the full pipeline on demand
- **A different planning philosophy**: plans are vertical slices — every slice ships a user-visible capability — written at intent level, with exact code reserved for fragile operations

The full delta against upstream is documented in [docs/fork-changes.md](docs/fork-changes.md); release history is in [RELEASE-NOTES.md](RELEASE-NOTES.md). Report issues at [fryga-io/superpowers-rails](https://github.com/fryga-io/superpowers-rails/issues), not upstream. Superpowers Rails is funded by [fryga](https://fryga.io). Marcin Ostrowski writes about building and using it — the Rails AI Harness — on real Rails work at [rubyonai.com](https://rubyonai.com).

Superpowers is a complete software development methodology for your coding agents, built on top of a set of composable skills and some initial instructions that make sure your agent uses them.


## Quickstart

Give your agent Superpowers: [Claude Code](#claude-code), [Antigravity](#antigravity), [Factory Droid](#factory-droid), [OpenCode](#opencode), [GitHub Copilot CLI](#github-copilot-cli), [Pi](#pi). (Superpowers Rails is not published to the Codex, Cursor, or Kimi Code marketplaces — see those sections below.)

## How it works

It starts from the moment you fire up your coding agent. As soon as it sees that you're building something, it *doesn't* just jump into trying to write code. Instead, it steps back and asks you what you're really trying to do. 

Once it's teased a spec out of the conversation, it shows it to you in chunks short enough to actually read and digest. 

After you've signed off on the design, your agent puts together an implementation plan with bite-sized tasks describing what to build and where. It uses intent-level steps for routine work and exact code only for fragile operations like migrations. It emphasizes true red/green TDD, YAGNI (You Aren't Gonna Need It), and DRY.

Next up, once you say "go", it launches a *subagent-driven-development* process, having agents work through each engineering task, inspecting and reviewing their work, and continuing forward. It's not uncommon for your agent to work autonomously for a couple hours at a time without deviating from the plan you put together.

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

### Antigravity

Untested on this harness — this mirrors upstream's git-based install, re-pointed at this repo.

- Install the plugin from this repository:

  ```bash
  agy plugin install https://github.com/fryga-io/superpowers-rails
  ```

Antigravity runs the plugin's session-start hook, so Superpowers is active from
the first message. Reinstall with the same command to update.

### Codex App

The [official Codex plugin marketplace](https://github.com/openai/plugins) serves upstream [Superpowers](https://github.com/obra/superpowers), not Superpowers Rails. Installing `superpowers` there gets you upstream, without the Rails additions. Superpowers Rails is not published to the Codex marketplace.

### Codex CLI

Same as Codex App: the Codex plugin marketplace entry is upstream Superpowers, not Superpowers Rails.

### Cursor

The Cursor plugin marketplace entry for "superpowers" is upstream Superpowers, not Superpowers Rails. Superpowers Rails is not published to Cursor's marketplace.

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

### Kimi Code

The Kimi Code plugin marketplace entry for "Superpowers" is upstream Superpowers, not Superpowers Rails. Untested on this harness — Kimi Code can also install directly from a repository:

```text
/plugins install https://github.com/fryga-io/superpowers-rails
```

- Detailed docs: [docs/README.kimi.md](docs/README.kimi.md) (upstream doc; substitute this repo's URL when installing)

### OpenCode

OpenCode uses its own plugin install; install Superpowers Rails separately even if you
already use it in another harness.

- Tell OpenCode:

  ```
  Fetch and follow instructions from https://raw.githubusercontent.com/fryga-io/superpowers-rails/refs/heads/main/.opencode/INSTALL.md
  ```

- Detailed docs: [docs/README.opencode.md](docs/README.opencode.md)

### Pi

Untested on this harness — this mirrors upstream's git-based install, re-pointed at this repo.

Install Superpowers Rails as a Pi package from this repository:

```bash
pi install git:github.com/fryga-io/superpowers-rails
```

For local development, run Pi with this checkout loaded as a temporary package:

```bash
pi -e /path/to/superpowers-rails
```

The Pi package loads the Superpowers skills and a small extension that injects the `using-superpowers` bootstrap at session startup and again after compaction. Pi has native skills, so no compatibility `Skill` tool is required. Subagent and task-list tools remain optional Pi companion packages.


## The Basic Workflow

1. **brainstorming** - Activates before writing code. Refines rough ideas through questions, explores alternatives, presents design in sections for validation. Saves design document.

2. **using-git-worktrees** - Activates after design approval. Creates isolated workspace on new branch, runs project setup, verifies clean test baseline.

3. **writing-plans** - Activates with approved design. Breaks work into bite-sized tasks (2-5 minutes each). Intent-level steps by default, exact code for migrations and fragile ops.

4. **subagent-driven-development** or **executing-plans** - Activates with plan. Dispatches fresh subagent per task with a task review (spec compliance + code quality) plus a Rails conventions review on Rails projects, or executes in batches with human checkpoints.

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
- **subagent-driven-development** - Fast iteration with task review (spec + quality) plus Rails conventions review

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

Skill-behavior tests use the drill eval harness from [superpowers-evals](https://github.com/prime-radiant-inc/superpowers-evals/), cloned into `evals/` — see `evals/README.md` for setup. Plugin-infrastructure tests live at `tests/` and run via the relevant `run-*.sh` or `npm test`.

See `skills/writing-skills/SKILL.md` for the complete guide.

## Updating

Superpowers updates are somewhat coding-agent dependent, but are often automatic.

## License

MIT License - see LICENSE file for details

## Visual companion telemetry

Because skills and plugins don't provide any feedback to creators, we have no idea how many of you are using Superpowers. By default, the Prime Radiant logo on brainstorming's optional visual companion feature is loaded from our website. It includes the version of Superpowers in use. It does not include any details about your project, prompt, or coding agent. We don't see your clicks or anything about what you're building. This helps us have a rough idea of how many folks are using Superpowers and which version of Superpowers they're using. It's 100% optional. To disable this, set the environment variable `SUPERPOWERS_DISABLE_TELEMETRY` to any true value. Superpowers also honors Claude Code's `DISABLE_TELEMETRY` and `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` opt-outs.

## Community

Superpowers is built by [Jesse Vincent](https://blog.fsck.com) and the rest of the folks at [Prime Radiant](https://primeradiant.com).

- **Discord**: [Join us](https://discord.gg/35wsABTejz) for community support, questions, and sharing what you're building with Superpowers
- **Issues** (Superpowers Rails): https://github.com/fryga-io/superpowers-rails/issues — upstream issues belong at https://github.com/obra/superpowers/issues
- **Release announcements** (upstream): [Sign up](https://primeradiant.com/superpowers/) to get notified about new versions
