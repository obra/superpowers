# Superpowers (Optimized Fork)

This repository is an **optimized fork** of the original [obra/superpowers](https://github.com/obra/superpowers) plugin. It keeps the same core promise — A complete software development workflow for your coding agents built from composable "skills" and strong initial instructions — but applies additional research-driven improvements to make the workflow **leaner, faster, and more robust** in modern agent IDEs.

Key changes include:
- **Reduced prompt overhead and context pollution**, guided by findings in `docs/plans/2026-03-05-agent-workflow-optimization.md` (e.g., concise skills, smaller always-on instructions, explicit context hygiene).
- An **adaptive workflow selector** and **context management** that choose between lightweight vs full workflows and actively prune noisy history.
- Integrated **specialist skills** (senior engineer, security reviewer, testing specialist, frontend craftsmanship, prompt optimizer, CLAUDE/AGENTS creator) that plug into the same Superpowers phases.
- A **hooks system** with proactive skill routing, edit tracking, stop reminders, and **safety guards** that block dangerous commands and protect secrets.
- **Discipline enforcement** via rationalization tables and red flags in critical skills (systematic-debugging, test-driven-development) — psychologically engineered to prevent LLM shortcuts.

## How it works

From the moment you fire up your coding agent, this fork follows the Superpowers approach: it first steps back to understand what you're really trying to do instead of jumping straight into code. It then collaborates with you to tease out a clear spec and shows it in chunks short enough to read and digest.

Once you approve the design, your agent puts together an implementation plan that an enthusiastic junior engineer with poor taste, no judgement, no project context, and an aversion to testing could follow. It emphasizes true red/green TDD, YAGNI (You Aren't Gonna Need It), and DRY, while this fork's optimizations keep the instructions focused and token‑efficient.

Next up, once you say "go", it launches either a *subagent-driven-development* process or *executing-plans*, having agents work through each engineering task with staged reviews (spec compliance, then code quality) and integrated specialists where useful (e.g., security-reviewer on sensitive changes, frontend-craftsmanship on UI work).

Because the skills trigger automatically and are optimized for smaller, more relevant context windows, you don't need to do anything special. Your coding agent just has **optimized Superpowers**.

## Why This Fork

This optimized version builds on the original [obra/superpowers](https://github.com/obra/superpowers) with targeted improvements:

| | Original | Optimized |
|---|---|---|
| **Workflow routing** | Manual skill selection | Automatic routing via `adaptive-workflow-selector` with micro/lightweight/full tiers |
| **Specialist skills** | Core workflow only | +6 specialists (senior-engineer, security-reviewer, testing-specialist, frontend-craftsmanship, prompt-optimizer, claude-md-creator) |
| **Discipline enforcement** | Instructional tone | Rationalization tables, red flags, iron laws, and forbidden phrases in critical skills |
| **Token efficiency** | No explicit controls | Always-on `token-efficiency` standard with context hygiene rules |
| **Hooks system** | None | 5 hooks: skill activator, edit tracker, stop reminders, dangerous command blocker, secrets protector |
| **Safety guards** | None | PreToolUse hooks block dangerous bash commands and protect sensitive files (3-tier: critical/high/strict) |
| **Cross-session state** | None | `context-management` persists durable state; code-reviewer agent retains learnings via `memory: user` |
| **Trigger reliability** | Generic descriptions | Assertive "MUST USE" descriptions with explicit trigger phrases |

The result: everything the original does, plus routing, specialists, discipline enforcement, safety hooks, and multi-platform support — in fewer tokens.

## Installation

**Note:** Installation differs by platform. Claude Code or Cursor have built-in plugin marketplaces. Codex and OpenCode require manual setup.


### Claude Code (via Plugin Marketplace)

In Claude Code, register the marketplace first:

```bash
/plugin marketplace add REPOZY/superpowers-optimized
```

Then install the plugin from this marketplace:

```bash
/plugin install superpowers@superpowers-optimized
```

### Cursor (via Plugin Marketplace)

In Cursor Agent chat, install from marketplace:

```text
/plugin-add superpowers-optimized
```

### Codex

Tell Codex:

```
Fetch and follow instructions from https://raw.githubusercontent.com/REPOZY/superpowers-optimized/refs/heads/main/.codex/INSTALL.md
```

**Detailed docs:** [docs/README.codex.md](docs/README.codex.md)

### OpenCode

Tell OpenCode:

```
Fetch and follow instructions from https://raw.githubusercontent.com/REPOZY/superpowers-optimized/refs/heads/main/.opencode/INSTALL.md
```

**Detailed docs:** [docs/README.opencode.md](docs/README.opencode.md)

### Verify Installation

Start a new session in your chosen platform and ask for something that should trigger a skill (for example, "help me plan this feature" or "let's debug this issue"). The agent should automatically invoke the relevant superpowers skill.

## The Basic Workflow

1. **adaptive-workflow-selector** - Activates first. Chooses `lightweight` vs `full` workflow path based on scope/risk.

2. **context-management** - Persists durable state to `state.md` for cross-session continuity.

3. **brainstorming** (full path) - Produces approved design before implementation changes.

4. **using-git-worktrees** - Creates isolated workspace on a feature branch and verifies clean baseline.

5. **writing-plans** - Creates executable implementation plan with exact paths and verification steps.

6. **subagent-driven-development** or **executing-plans** - Executes the plan with staged verification.

7. **test-driven-development** + **systematic-debugging** + **requesting-code-review** - Applied during execution for quality gates.

8. **verification-before-completion** + **finishing-a-development-branch** - Final evidence and branch integration/cleanup.

**The agent checks for relevant skills before any task.** Mandatory workflows, not suggestions.

## What's Inside

### Skills Library

**Testing**
- **test-driven-development** - RED-GREEN-REFACTOR cycle (includes testing anti-patterns: mock behavior, test-only methods, incomplete mocks, interface drift, and more)
- **testing-specialist** - Advanced test strategy and coverage design for complex or high-risk behavior

**Debugging**
- **systematic-debugging** - 4-phase root cause process (includes root-cause-tracing, defense-in-depth, condition-based-waiting techniques)
- **verification-before-completion** - Evidence gate for completion claims, including configuration change verification (verifies outcomes reflect intended changes, not just that operations succeeded)

**Collaboration**
- **brainstorming** - Socratic design refinement
- **writing-plans** - Detailed implementation plans
- **executing-plans** - Batch execution with checkpoints
- **dispatching-parallel-agents** - Concurrent subagent workflows
- **requesting-code-review** - Pre-review checklist
- **receiving-code-review** - Responding to feedback
- **using-git-worktrees** - Parallel development branches
- **finishing-a-development-branch** - Merge/PR decision workflow
- **subagent-driven-development** - Fast iteration with two-stage review (spec compliance, then code quality), blocked-task escalation protocol, and E2E process hygiene
- **senior-engineer** - Senior engineering collaborator for complex or architectural work
- **security-reviewer** - Structured security and quality review for sensitive changes
- **frontend-craftsmanship** - Production-grade, accessible frontend implementation standards with concrete checklist (semantic HTML, CSS tokens, focus-visible, prefers-reduced-motion, WCAG AA contrast, fluid typography)

**Hooks**
- **skill-activator** (UserPromptSubmit) - Proactively matches user prompts to relevant skills before Claude processes them, reinforcing the routing system
- **track-edits** (PostToolUse) - Logs all Edit/Write operations for downstream awareness (feeds stop-reminders)
- **stop-reminders** (Stop) - Reminds about untested changes and uncommitted work when Claude finishes a response
- **block-dangerous-commands** (PreToolUse) - Blocks destructive bash commands (rm -rf, force push, drop table, etc.) with 3-tier severity
- **protect-secrets** (PreToolUse) - Prevents reading, modifying, or exfiltrating sensitive files (.env, SSH keys, credentials, etc.)

**Agents**
- **code-reviewer** - Senior code review agent with persistent cross-session memory (`memory: user`)

**Meta**
- **writing-skills** - Create new skills following best practices (includes testing methodology)
- **using-superpowers** - Introduction to the skills system
- **adaptive-workflow-selector** - Select lightweight vs full process path
- **context-management** - Persist durable state to `state.md` for cross-session continuity
- **token-efficiency** - Always-on operational standard: concise responses, parallel tool batching, no redundant work. Invoked at every session start.
- **prompt-optimizer** - Optional pre-processing to refine vague or multi-part user requests
- **claude-md-creator** - Create lean, high-signal CLAUDE/AGENTS context files for repositories

## Philosophy

- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success

Read more: [Superpowers for Claude Code](https://blog.fsck.com/2025/10/09/superpowers/)

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
/plugin update superpowers-optimized
```

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: https://github.com/REPOZY/superpowers-optimized/issues
- **Original**: https://github.com/obra/superpowers
