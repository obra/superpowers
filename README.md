# Toolbelt

A software development methodology for coding agents, built from composable skills plus a bootstrap that makes sure the agent actually uses them.

Short skills written for current models, two harnesses, and a delivery pipeline that carries work from an idea through a merged PR. It installs globally and assumes nothing about the project it lands in.

## How it works

It starts the moment you fire up your coding agent. As soon as it sees you're building something, it *doesn't* jump into writing code — it steps back and asks what you're actually trying to do.

Once the conversation has produced a design you've approved, it writes that into a spec, gates the spec with you and a reviewer from a different model family, then turns it into an implementation plan detailed enough that a subagent with no project context can execute it.

Then it runs the plan: a fresh subagent per task, each one reviewed before the next begins, with a broad review gating the whole slice before it becomes a pull request. It's not unusual for this to run autonomously for a couple of hours without drifting from the plan.

The skills trigger themselves, so there's nothing to remember.

## Installation

Install once per harness; the plugin is global and every project picks it up.

### Claude Code

```bash
/plugin marketplace add mlk1278/toolbelt
/plugin install toolbelt@toolbelt-dev
```

Start a fresh session afterward — the session-start hook registers on load.

### Codex

```bash
/plugins
```

Search for `toolbelt` and select `Install Plugin`. Subagent dispatch needs multi-agent support, so make sure `~/.codex/config.toml` has:

```toml
[features]
multi_agent = true
```

Codex does not run hooks shipped inside plugins, so project agent routing needs one more step. From a clone of this repository, run `scripts/setup-codex-routing` once per machine, then trust the new SessionStart hook when Codex next starts. Without it, Codex sessions use the bundled routing defaults.

## Per-project configuration

Nothing is required. Each is optional and read only when present:

| File | Purpose |
|---|---|
| `.toolbelt/routing/<harness>.md` | Plain-English agent routing per orchestrating harness (`claude.md`, `codex.md`), read from the main checkout |
| `.toolbelt/pr-policy.md` | Which review providers to await, complexity lanes, timeouts |
| `.toolbelt/worktree-policy.md` | Port ranges, sidecar containers, and per-worktree resources so parallel worktrees don't collide |
| `docs/REVIEW-GUIDANCE.md` | Project review conventions; implementers follow them and reviewers check against them |
| `AGENTS.md` | Entry-point summary — copy from [docs/AGENTS-SNIPPET.md](docs/AGENTS-SNIPPET.md) |

Scratch lands in `.toolbelt/`; add it to `.gitignore`. See [docs/ADOPTING-IN-A-PROJECT.md](docs/ADOPTING-IN-A-PROJECT.md) for the adoption checklist and how to verify a project resolves its routes.

## The Basic Workflow

1. **brainstorming** - Activates before writing code. Refines rough ideas through questions, explores alternatives, presents the design in sections for approval.

2. **writing-specs** - Activates with an approved design, or directly when you ask for a spec. Writes and commits the spec, then gates it with your review and a review from a different harness.

3. **writing-plans** - Activates with an approved spec. Splits the work into PR-sized boundaries and reviewable tasks with exact files, interfaces, tests, and verification; the implementer writes the code. Reviewed on a different harness, then waits for your approval.

4. **delivery** - Activates with an approved plan. Per PR boundary: creates a worktree, runs subagent-driven-development, then hands the branch to a pr-monitor that owns CI, review, fixes, and merge.

5. **subagent-driven-development** - Run by delivery. A fresh implementer per task (test-first), a review after each task with up to two fix rounds, then a whole-branch review.

6. **finishing-a-development-branch** - Run by the pr-monitor, or directly when you finish work by hand. Verifies tests, then merges, opens a PR, keeps, or discards the branch.

**quick-task** covers small, already-decided changes: a one-task plan straight into delivery.

**The agent checks for relevant skills before any task.** Mandatory workflows, not suggestions.

## What's Inside

### Skills Library

**Testing**
- **test-driven-development** - RED-GREEN-REFACTOR cycle (includes testing anti-patterns reference)

**Debugging**
- **systematic-debugging** - 4-phase root cause process (includes root-cause tracing and condition-based waiting)
- **verification-before-completion** - Audit every claim against a tool result before reporting

**Collaboration** 
- **brainstorming** - Socratic design refinement
- **writing-specs** - Spec documents and their review gates
- **interactive-design** - Frontend-first prototyping against fixture-backed API contracts
- **writing-plans** - Detailed implementation plans
- **dispatching-parallel-agents** - Concurrent subagent workflows
- **requesting-code-review** - Pre-review checklist
- **receiving-code-review** - Verify feedback against the code before acting on it
- **using-git-worktrees** - Parallel development branches
- **finishing-a-development-branch** - Merge/PR decision workflow
- **subagent-driven-development** - Fast iteration with two-stage review (spec compliance, then code quality)

**Delivery**
- **quick-task** - Small decision-complete changes, straight to one merged PR
- **orchestrating** - What the session agent reads, dispatches, and rules on; nothing else enters its context
- **delivery** - An approved plan through one coherent slice to a merged PR
- **agent-routing** - Resolves logical roles to concrete agent routes
- **ux-gate** - UX review for new flows, material UI changes, or explicit requests; scripted smoke checks for rendering tasks
- **pr-monitor** - PR publication, CI, review providers, fix loops, and merge

**Meta**
- **writing-skills** - Create new skills following best practices (includes testing methodology)
- **writing-for-agents** - Editorial rules for any agent-consumed document
- **using-toolbelt** - Introduction to the skills system

## Philosophy

- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success

## Working on this

See [CLAUDE.md](CLAUDE.md) for how skills are structured and what not to break, and `skills/writing-skills/SKILL.md` for the full guide to writing them.

`scripts/token-audit <session.jsonl>` reports where a session and its subagents spent their tokens; it reads Codex rollouts and Claude Code transcripts.

Plugin-infrastructure tests live in `tests/` and run via the relevant `run-*.sh`. Skill-behavior evals use an external drill harness cloned into `evals/`, which is gitignored and not included here.

## Credit

Toolbelt began as a fork of [Superpowers](https://github.com/obra/superpowers) by [Jesse Vincent](https://blog.fsck.com) and [Prime Radiant](https://primeradiant.com). The methodology and much of the original skill content came from there. It has since diverged and is maintained independently.

The `writing-for-agents` skill and the review smell baseline are adapted from [Matt Pocock's skills](https://github.com/mattpocock/skills) (MIT).

## License

MIT License - see LICENSE file for details
