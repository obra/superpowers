# Superpowers

Superpowers is a complete software development workflow for coding agents, built from composable skills plus a small runtime layer that makes the agent actually use them. In this repository, the active runtime package targets Codex and GitHub Copilot local installs.

## Provenance

The core project in this fork started from upstream Superpowers: https://github.com/obra/superpowers

This fork keeps that core workflow and extends it with additional skill structure, review flow, and runtime patterns adapted from gstack: https://github.com/garrytan/gstack

## How it works

It starts from the moment you fire up your coding agent. As soon as it sees that you're building something, it *doesn't* just jump into trying to write code. Instead, it steps back and asks you what you're really trying to do.

The entrypoint for that behavior is the `using-superpowers` skill. It is discovered natively by the harness, checks whether another skill applies before the agent responds, and routes the session into the right workflow. Product work usually goes into the spec and planning pipeline; bugs, code-review feedback, and completion checks trigger different skills instead of forcing the same path every time.

Once it's teased a spec out of the conversation, it shows it to you in chunks short enough to actually read and digest.

After that written spec exists, your agent runs a CEO or founder review pass to challenge the scope, tighten the reasoning, and make sure the spec is worth building.

Then your agent puts together an implementation plan that's clear enough for an enthusiastic junior engineer with poor taste, no judgement, no project context, and an aversion to testing to follow. It emphasizes true red/green TDD, YAGNI (You Aren't Gonna Need It), and DRY.

Before implementation begins, that written plan gets its own engineering review pass so architecture, testing, failure modes, and rollout details are locked in.

Next up, once you say "go", implementation follows one of two execution paths: *subagent-driven-development* when same-session isolated-agent workflows are available, or *executing-plans* when the work should proceed in a separate session. In both cases, execution starts from an engineering-approved current plan, runs a workspace-readiness preflight, then executes the plan task by task, reviews before completion, and hands off through the normal branch-finishing flow. Workspace preparation is the user's responsibility; invoke `using-git-worktrees` manually when you want isolated workspace management. It's not uncommon for a well-grounded coding agent to be able to work autonomously for a couple hours at a time without deviating from the plan you put together.

There's a bunch more to it, but that's the core of the system. And because the skills trigger automatically, you don't need to do anything special. Your coding agent just has Superpowers.


## Installation

Superpowers uses a single shared checkout for its supported runtime surfaces. Codex and GitHub Copilot local installs both point at `~/.superpowers/install`; only the discovery links differ.

Shared runtime layout:

- `~/.superpowers/install` - canonical checkout
- `~/.agents/skills/superpowers -> ~/.superpowers/install/skills`
- `Unix-like: ~/.codex/agents/code-reviewer.toml -> ~/.superpowers/install/.codex/agents/code-reviewer.toml`
- `~/.copilot/skills/superpowers -> ~/.superpowers/install/skills`
- `Unix-like: ~/.copilot/agents/code-reviewer.agent.md -> ~/.superpowers/install/agents/code-reviewer.md`

On Unix-like installs, the Codex reviewer agent is symlinked to the shared checkout.

On Windows, the Codex reviewer agent is copied from the shared checkout and must be refreshed after updates.

On Unix-like installs, the Copilot agent is symlinked to the shared checkout.

On Windows, the Copilot agent is copied from the shared checkout and must be refreshed after updates.

### Codex

Tell Codex:

```
Fetch and follow instructions from https://raw.githubusercontent.com/dmulcahey/superpowers/refs/heads/main/.codex/INSTALL.md
```

**Detailed docs:** [docs/README.codex.md](docs/README.codex.md)

### GitHub Copilot Local Installs

Tell GitHub Copilot:

```
Fetch and follow instructions from https://raw.githubusercontent.com/dmulcahey/superpowers/refs/heads/main/.copilot/INSTALL.md
```

**Detailed docs:** [docs/README.copilot.md](docs/README.copilot.md)

### Migrating Existing Platform-Specific Installs

If you already have `~/.codex/superpowers` or `~/.copilot/superpowers`, migrate them into the single shared checkout with:

```bash
tmpdir=$(mktemp -d)
git clone --depth 1 https://github.com/dmulcahey/superpowers.git "$tmpdir/superpowers"
"$tmpdir/superpowers/bin/superpowers-migrate-install"
rm -rf "$tmpdir"
```

If `~/.superpowers/install` already exists, run `~/.superpowers/install/bin/superpowers-migrate-install` instead.

**Windows (PowerShell):**
```powershell
if (Test-Path "$env:USERPROFILE\.superpowers\install") {
  & "$env:USERPROFILE\.superpowers\install\bin\superpowers-migrate-install.ps1"
} else {
  $tmpRoot = Join-Path $env:TEMP "superpowers-migrate"
  $tmpDir = Join-Path $tmpRoot ([guid]::NewGuid().ToString())
  git clone --depth 1 https://github.com/dmulcahey/superpowers.git (Join-Path $tmpDir "superpowers")
  & (Join-Path $tmpDir "superpowers\bin\superpowers-migrate-install.ps1")
  Remove-Item -Recurse -Force $tmpDir
}
```

After migrating, finish the normal platform setup:

- Codex: create or refresh `~/.agents/skills/superpowers`
- Codex: create or refresh `~/.codex/agents/code-reviewer.toml`
- GitHub Copilot: create or refresh `~/.copilot/skills/superpowers`
- GitHub Copilot: create or refresh `~/.copilot/agents/code-reviewer.agent.md`

### Verify Installation

Start a new session in your chosen platform and ask for something that should trigger a skill (for example, "help me plan this feature" or "let's debug this issue"). The agent should automatically invoke the relevant superpowers skill.

### Runtime State and Automation

Runtime state lives in `~/.superpowers/`.

- Preferences live in `~/.superpowers/config.yaml`
- Session-awareness markers live in `~/.superpowers/sessions/`
- Contributor field reports live in `~/.superpowers/contributor-logs/`
- Project-scoped QA handoff artifacts live in `~/.superpowers/projects/`
- Update-check cache, snooze, and just-upgraded markers live under the same state root

All 18 checked-in `skills/*/SKILL.md` files are generated from adjacent `SKILL.md.tmpl` sources. Regenerate them with `node scripts/gen-skill-docs.mjs` and validate freshness with `node scripts/gen-skill-docs.mjs --check`.

The shipped reviewer agent artifacts are generated from `agents/code-reviewer.instructions.md`. Regenerate them with `node scripts/gen-agent-docs.mjs` and validate freshness with `node scripts/gen-agent-docs.mjs --check`.

When changing the generated skill runtime, run `node scripts/gen-skill-docs.mjs --check` before `bash tests/codex-runtime/test-runtime-instructions.sh`, `bash tests/codex-runtime/test-workflow-enhancements.sh`, and `bash tests/codex-runtime/test-workflow-sequencing.sh`.

To enable contributor mode for the installed runtime, run `~/.superpowers/install/bin/superpowers-config set superpowers_contributor true`.

Windows (PowerShell): `& "$env:USERPROFILE\.superpowers\install\bin\superpowers-config.ps1" set superpowers_contributor true`

If you disable update notices, re-enable them with `~/.superpowers/install/bin/superpowers-config set update_check true`.

Windows (PowerShell): `& "$env:USERPROFILE\.superpowers\install\bin\superpowers-config.ps1" set update_check true`

## What Actually Runs

- `skills/` contains the 18 public Superpowers skills. `using-superpowers` is the entry skill; `brainstorming`, `plan-ceo-review`, `writing-plans`, and `plan-eng-review` form the default planning chain.
- `scripts/gen-skill-docs.mjs` renders every checked-in `SKILL.md` from its template and injects the shared runtime preamble used across the skill library.
- `bin/superpowers-migrate-install` consolidates legacy platform-specific installs into the single shared checkout and recreates compatibility links when needed.
- `bin/superpowers-config` and `bin/superpowers-update-check` manage local runtime state, contributor mode, and per-session upgrade notices under `~/.superpowers/`.
- `superpowers-upgrade/SKILL.md` is the inline upgrade workflow the generated preambles hand off to when a newer runtime version is available.
- `review/TODOS-format.md` and `review/checklist.md` are the shared review references used by the planning and code-review workflows.
- `qa/references/issue-taxonomy.md` and `qa/templates/qa-report-template.md` are the shared QA references used by `qa-only`.
- `agents/code-reviewer.instructions.md` is the shared reviewer source that generates `agents/code-reviewer.md` for GitHub Copilot and `.codex/agents/code-reviewer.toml` for Codex.

## The Basic Workflow

Default pipeline: `brainstorming -> plan-ceo-review -> writing-plans -> plan-eng-review -> implementation`

That is the default path for new feature and product work. Other task types take their own first-class routes: `systematic-debugging` handles bugs and failing tests, `receiving-code-review` handles incoming review feedback before you implement it, and `verification-before-completion` gates any claim that work is done or passing.

1. **brainstorming** - Activates before writing code. Refines rough ideas through questions, explores alternatives, presents design in sections for validation. Saves the written spec.

2. **plan-ceo-review** - Activates after the spec is written. Runs a founder-mode review of the written spec before implementation planning.

3. **writing-plans** - Activates with an approved spec. Breaks work into bite-sized tasks (2-5 minutes each). Every task has exact file paths, complete code, verification steps.

4. **plan-eng-review** - Activates after the plan is written. Reviews the full written plan before implementation starts.

5. **implementation** - `subagent-driven-development` or `executing-plans` start from an engineering-approved current plan, run workspace-readiness checks, and execute the plan. The completion flow then runs `requesting-code-review`, may offer `qa-only` before landing, and may offer `document-release` before final branch cleanup or PR handoff. If the user wants an isolated workspace, invoke `using-git-worktrees` manually before execution.

**The agent checks for relevant skills before any task.** These are mandatory workflows, not suggestions.

## What's Inside

### Skills Library

The public runtime currently exposes 18 skills.

**Testing**
- **test-driven-development** - RED-GREEN-REFACTOR cycle (includes testing anti-patterns reference)

**Debugging**
- **systematic-debugging** - 4-phase root cause process (includes root-cause-tracing, defense-in-depth, condition-based-waiting techniques)
- **verification-before-completion** - Ensure it's actually fixed

**Collaboration** 
- **brainstorming** - Socratic design refinement
- **plan-ceo-review** - CEO/founder-mode spec review before implementation planning
- **writing-plans** - Detailed implementation plans
- **plan-eng-review** - Engineering review of the written plan before implementation
- **qa-only** - Report-only browser QA with shared health scoring and artifacts
- **executing-plans** - Separate-session plan execution
- **dispatching-parallel-agents** - Concurrent subagent workflows
- **requesting-code-review** - Code-review dispatch and triage
- **receiving-code-review** - Responding to feedback
- **document-release** - Post-implementation documentation and changelog cleanup
- **using-git-worktrees** - Optional isolated workspace setup
- **finishing-a-development-branch** - Merge/PR decision workflow
- **subagent-driven-development** - Fast iteration with two-stage review (spec compliance, then code quality)

**Meta**
- **writing-skills** - Create new skills following best practices (includes testing methodology)
- **using-superpowers** - Introduction to the skills system

## Philosophy

- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success

Read more: [Superpowers background](https://blog.fsck.com/2025/10/09/superpowers/)

## Contributing

Skills and runtime helpers live directly in this repository. The editable source for generated skills is `skills/*/SKILL.md.tmpl`; the checked-in `SKILL.md` files are generated artifacts. To contribute:

1. Fork the repository
2. Create a branch for your skill or runtime change
3. Edit the relevant `SKILL.md.tmpl` or runtime file
4. Regenerate generated skill docs with `node scripts/gen-skill-docs.mjs`
5. Follow the `writing-skills` skill for creating and testing new skills
6. Submit a PR

See `skills/writing-skills/SKILL.md` for the complete guide.

## Updating

Update the shared checkout used by both supported platforms:

```bash
git -C ~/.superpowers/install pull
```

If you are migrating from old per-platform clones, run `~/.superpowers/install/bin/superpowers-migrate-install` after updating so legacy paths keep resolving to the shared checkout. In PowerShell, use `& "$env:USERPROFILE\.superpowers\install\bin\superpowers-migrate-install.ps1"`.

Every generated skill preamble runs `bin/superpowers-update-check` from the active install root. New sessions will announce `UPGRADE_AVAILABLE` or `JUST_UPGRADED` when the local runtime state says you should act.

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: https://github.com/dmulcahey/superpowers/issues
- **Repository**: https://github.com/dmulcahey/superpowers
