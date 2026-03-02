# Hartye-Superpowers

Hartye-Superpowers is a fork of [Jesse Vincent's Superpowers](https://github.com/obra/superpowers) — a complete software development workflow for coding agents, built on composable "skills" and initial instructions that ensure your agent uses them. This fork adds **agent team support** (multi-agent peer-to-peer coordination) and other enhancements on top of the original.

> **Original project:** [obra/superpowers](https://github.com/obra/superpowers) by [Jesse Vincent](https://blog.fsck.com/2025/10/09/superpowers/)
> **This fork:** [ehartye/Hartye-superpowers](https://github.com/ehartye/Hartye-superpowers) maintained by Eric Hartye

## How it works

It starts from the moment you fire up your coding agent. As soon as it sees that you're building something, it *doesn't* just jump into trying to write code. Instead, it steps back and asks you what you're really trying to do. 

Once it's teased a spec out of the conversation, it shows it to you in chunks short enough to actually read and digest. 

After you've signed off on the design, your agent puts together an implementation plan that's clear enough for an enthusiastic junior engineer with poor taste, no judgement, no project context, and an aversion to testing to follow. It emphasizes true red/green TDD, YAGNI (You Aren't Gonna Need It), and DRY. 

Next up, once you say "go", it launches a *subagent-driven-development* process, having agents work through each engineering task, inspecting and reviewing their work, and continuing forward. It's not uncommon for Claude to be able to work autonomously for a couple hours at a time without deviating from the plan you put together.

There's a bunch more to it, but that's the core of the system. And because the skills trigger automatically, you don't need to do anything special. Your coding agent just has Superpowers.


## Sponsorship

If Superpowers has been useful to you and you'd like to support the original author's open-source work, consider [sponsoring Jesse Vincent](https://github.com/sponsors/obra).


## Installation

**Note:** Installation differs by platform. Claude Code has a built-in plugin system. Codex and OpenCode require manual setup.

### Claude Code (via Plugin Marketplace)

In Claude Code, register the marketplace first:

```bash
/plugin marketplace add ehartye/Hartye-superpowers
```

Then install the plugin:

```bash
/plugin install h-superpowers@Hartye-superpowers
```

### Verify Installation

Start a new session and tell Claude: **"I want to add a dark mode toggle to my app."** Claude should pause, ask clarifying questions about your design (brainstorming skill), rather than immediately writing code. That's the signal it's working.

### Codex

Tell Codex:

```
Fetch and follow instructions from https://raw.githubusercontent.com/ehartye/Hartye-superpowers/refs/heads/main/.codex/INSTALL.md
```

**Detailed docs:** [docs/README.codex.md](docs/README.codex.md)

### OpenCode

Tell OpenCode:

```
Fetch and follow instructions from https://raw.githubusercontent.com/ehartye/Hartye-superpowers/refs/heads/main/.opencode/INSTALL.md
```

**Detailed docs:** [docs/README.opencode.md](docs/README.opencode.md)

## The Basic Workflow

1. **brainstorming** - Activates before writing code. Refines rough ideas through questions, explores alternatives, presents design in sections for validation. Saves design document.

2. **using-git-worktrees** - Activates after design approval. Creates isolated workspace on new branch, runs project setup, verifies clean test baseline.

3. **writing-plans** - Activates with approved design. Breaks work into bite-sized tasks (2-5 minutes each). Every task has exact file paths, complete code, verification steps.

4. **subagent-driven-development**, **team-driven-development**, or **executing-plans** - Activates with plan. Dispatches fresh subagent per task with two-stage review (spec compliance, then code quality), uses collaborative agent teams with inter-agent communication for complex coordinated work, or executes in batches with human checkpoints.

5. **test-driven-development** - Activates during implementation. Enforces RED-GREEN-REFACTOR: write failing test, watch it fail, write minimal code, watch it pass, commit. Deletes code written before tests.

6. **requesting-code-review** - Activates between tasks. Reviews against plan, reports issues by severity. Critical issues block progress.

7. **finishing-a-development-branch** - Activates when tasks complete. Verifies tests, presents options (merge/PR/keep/discard), cleans up worktree.

**The agent checks for relevant skills before any task.** Mandatory workflows, not suggestions.

## Your First Session

Here's what a typical first feature looks like with Superpowers active:

**You:** "I want to add a dark mode toggle to my app."

**Claude (brainstorming):** Asks 3–5 clarifying questions — Where should the toggle live? Should it persist across sessions? Which components need to respect the theme?

**You:** Answer the questions. Claude presents the design back in readable sections. You approve.

**Claude (using-git-worktrees):** Creates a new branch (`feature/dark-mode`) and an isolated worktree so your main branch is untouched.

**Claude (writing-plans):** Produces a step-by-step implementation plan — exact files, code snippets, test commands. Asks which execution style you want:
- **Subagent-driven** (this session, fast, Claude handles each task with automated review)
- **Team-driven** (parallel agents for complex coordinated work, experimental)
- **Parallel session** (you open a new session and use executing-plans with the plan file)

**You:** "Subagent-driven."

**Claude:** Dispatches a fresh subagent per task. Each task is reviewed for spec compliance and code quality before moving on. You watch progress or walk away.

**Claude (finishing-a-development-branch):** When tasks complete, runs tests, then presents exactly four options: merge locally, open a PR, keep the branch, or discard. You choose; Claude executes.

The whole thing — design through PR — typically runs without you touching code.

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
- **subagent-driven-development** - Fast iteration with two-stage review (spec compliance, then code quality)
- **team-driven-development** - Collaborative agent teams with direct inter-agent communication for coordinated work (experimental, Opus 4.6+)

**Meta**
- **writing-skills** - Create new skills following best practices (includes testing methodology)
- **using-superpowers** - Introduction to the skills system

## Philosophy

- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success

Read more about the original project: [Superpowers for Claude Code](https://blog.fsck.com/2025/10/09/superpowers/) by Jesse Vincent.

## Contributing

Skills live directly in this repository. To contribute:

1. Fork [ehartye/Hartye-superpowers](https://github.com/ehartye/Hartye-superpowers)
2. Create a branch for your skill
3. Follow the `writing-skills` skill for creating and testing new skills
4. Submit a PR

See `skills/writing-skills/SKILL.md` for the complete guide.

## Updating

Skills update automatically when you update the plugin:

```bash
/plugin update h-superpowers
```

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: https://github.com/ehartye/Hartye-superpowers/issues
- **Upstream project**: https://github.com/obra/superpowers
