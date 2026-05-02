# Superpowers — Contributor Guidelines

## Project Overview

**Superpowers** (v5.0.7) is a zero-dependency plugin that provides composable "skills" for AI coding agents. Skills are Markdown documents that guide agents through structured development practices: test-driven development, systematic debugging, brainstorming, planning, code review, and collaborative workflows. The project runs on Claude Code, Cursor, GitHub Copilot CLI, Gemini CLI, Codex, and OpenCode.

> **Note:** The repository also contains `chalkpicks/backend/` — a separate Node.js sports-betting-analyzer API project. It has its own npm dependencies and is not part of the zero-dependency superpowers plugin.

- **Author:** Jesse Vincent
- **License:** MIT
- **Design principle:** Zero external dependencies — no npm installs, no third-party services

## Repository Structure

```
superpowers/
├── skills/                     # Core skills library (14 skills; main content)
├── agents/                     # Reusable agent definitions
│   └── code-reviewer.md        # Senior code reviewer agent
├── commands/                   # Deprecated command stubs (now replaced by skills)
├── hooks/                      # Plugin lifecycle hooks for session context injection
│   ├── hooks.json              # Claude Code hook config
│   ├── hooks-cursor.json       # Cursor IDE hook config (v1/camelCase format)
│   ├── session-start           # Bash script — injects using-superpowers at session start
│   └── run-hook.cmd            # Windows batch wrapper
├── scripts/                    # Build and release automation
│   ├── bump-version.sh         # Version bumping and changelog updates
│   └── sync-to-codex-plugin.sh # Sync to Codex distribution
├── docs/                       # Internal planning docs, design specs, platform guides
├── tests/                      # Integration and regression test suites
├── chalkpicks/                 # Separate project: sports-betting-analyzer API (NOT part of superpowers plugin)
│   └── backend/                # Node.js/Express backend (has its own npm dependencies)
│       ├── middleware/         # auth.js, rateLimiter.js
│       ├── models/             # db.js, schema.sql
│       ├── routes/             # auth.js, subscriptions.js
│       ├── .env.example        # Environment variables template
│       └── package.json        # Own dependencies: express, better-sqlite3, stripe, etc.
├── .claude-plugin/             # Claude Code plugin manifest
├── .cursor-plugin/             # Cursor IDE plugin manifest
├── .opencode/                  # OpenCode plugin (ES module, auto-registers skills)
├── .codex/                     # Codex install instructions
├── .github/                    # PR template, issue templates, funding
├── .version-bump.json          # Version management config for bump-version.sh
├── gemini-extension.json       # Gemini CLI extension config
├── README.md                   # Project overview and installation guide
├── CODE_OF_CONDUCT.md          # Community guidelines
├── GEMINI.md                   # Gemini session context (imports using-superpowers)
├── AGENTS.md                   # Alias of CLAUDE.md for other agent runtimes
├── package.json                # Minimal Node.js metadata (type: "module")
└── RELEASE-NOTES.md            # Detailed version history
```

### Skills Directory Layout

Each skill lives in its own subdirectory with a required `SKILL.md` and optional supporting files:

```
skills/
  SKILL-NAME/
    SKILL.md              # Required: frontmatter + skill content
    supporting-file.*     # Optional: heavy reference, reusable scripts, or prompt templates
    scripts/              # Optional: executables (e.g., brainstorm server, render-graphs.js)
    references/           # Optional: platform-specific or supplementary reference docs
```

The `using-superpowers` skill includes a `references/` directory with platform-specific tool guides (`codex-tools.md`, `copilot-tools.md`, `gemini-tools.md`) that document available tools for each supported harness.

**Current skills (14 total):**

| Skill | Purpose |
|-------|---------|
| `using-superpowers` | Bootstraps skill usage; injected at session start |
| `brainstorming` | Socratic design refinement before writing code |
| `writing-plans` | Bite-sized TDD-style implementation plans |
| `executing-plans` | Batch execution with human checkpoints |
| `subagent-driven-development` | Parallel subagent workflows with two-stage review |
| `dispatching-parallel-agents` | Concurrent subagent coordination |
| `test-driven-development` | RED-GREEN-REFACTOR cycle |
| `systematic-debugging` | 4-phase root cause analysis |
| `verification-before-completion` | Ensures fixes are actually verified |
| `writing-skills` | TDD-based skill creation and testing |
| `requesting-code-review` | Pre-review checklist |
| `receiving-code-review` | Responding to review feedback |
| `finishing-a-development-branch` | Merge/PR decision workflow |
| `using-git-worktrees` | Parallel development with git worktrees |

## Skill File Format and Conventions

### Frontmatter (Required)

```yaml
---
name: skill-name-with-hyphens       # Letters, numbers, hyphens only; no special chars
description: Use when [triggering conditions and symptoms]   # Max 1024 chars total frontmatter
---
```

**Critical rules for `description`:**
- Start with "Use when..." — describes WHEN to trigger the skill, NOT what the skill does
- Third-person voice (it's injected into system prompts)
- Never summarize the skill's workflow — that causes agents to follow the description instead of reading the skill body
- Keep under 500 characters if possible

### Skill Body Structure

```markdown
# Skill Name

## Overview
Core principle in 1-2 sentences.

## When to Use
[Small flowchart only if the decision is non-obvious]

## Core Pattern / Steps
[Main content]

## Common Mistakes / Red Flags
[Anti-pattern table or red flags list]
```

### Skill Design Principles

- **Rigid skills** (TDD, debugging): must be followed exactly; include rationalization tables and red-flag lists to prevent shortcuts
- **Flexible skills** (patterns): agents adapt principles to context
- **Token efficiency**: frequently-loaded skills should be under 200 words; others under 500
- **Flowcharts**: use Graphviz `dot` format, only for non-obvious decision points
- **Cross-references**: use `superpowers:skill-name` notation (never `@file/path` — that force-loads and burns context)
- **One excellent example** beats many mediocre ones; choose the most representative language

## Hook System

The `hooks/session-start` bash script runs at the start of every Claude Code/Cursor/Copilot session. It:

1. Reads `skills/using-superpowers/SKILL.md`
2. Escapes it for JSON embedding
3. Detects the platform via environment variables (`CURSOR_PLUGIN_ROOT`, `CLAUDE_PLUGIN_ROOT`, `COPILOT_CLI`) and emits the correct JSON format:
   - **Claude Code:** `hookSpecificOutput.additionalContext`
   - **Cursor:** `additional_context` (snake_case)
   - **Copilot CLI / unknown:** `additionalContext` (SDK standard)

The `using-superpowers` skill is thus injected into every session, teaching agents how to discover and invoke all other skills.

## Development Workflow

### Creating a New Skill

Follow the TDD cycle from `superpowers:writing-skills`:

1. **RED** — Write a pressure scenario with a subagent; run it *without* the skill; document rationalizations and failures verbatim
2. **GREEN** — Write a minimal SKILL.md that addresses those specific failures; verify the subagent now complies
3. **REFACTOR** — Find new rationalizations → add explicit counters → re-test until bulletproof

**Iron law:** No skill without a failing test first. No exceptions for "simple additions" or "documentation updates."

### Modifying an Existing Skill

- Re-run the relevant pressure scenarios after any edit
- Show before/after eval results in your PR
- Do not reword "human partner" language, Red Flags tables, or rationalization lists without evidence the change improves agent compliance

### Version Bumping

```bash
./scripts/bump-version.sh <new-version>   # Updates package.json + plugin manifests + RELEASE-NOTES.md
```

## Testing

Tests live in `tests/` organized by type:

| Directory | What's tested |
|-----------|--------------|
| `tests/brainstorm-server/` | HTTP + WebSocket protocol (Node.js `*.test.js`) |
| `tests/claude-code/` | Skill integration on Claude Code (`test-*.sh`) |
| `tests/explicit-skill-requests/` | Direct skill invocation scenarios |
| `tests/skill-triggering/` | Automatic skill triggering from natural prompts |
| `tests/opencode/` | OpenCode platform compatibility |
| `tests/subagent-driven-dev/` | End-to-end subagent workflows (Go, Svelte projects) |

Brainstorm server tests use Node.js built-ins (zero external test dependencies). Skill tests are bash scripts that run Claude Code sessions and evaluate output.

## Chalkpicks Backend (Separate Project)

`chalkpicks/backend/` is an independent Node.js/Express REST API that lives in this repository but is **not** part of the superpowers plugin. It has its own `package.json` with external npm dependencies and does not follow the zero-dependency constraint of the superpowers plugin.

Key components:
- `middleware/auth.js` — JWT-based authentication
- `middleware/rateLimiter.js` — Request rate limiting
- `models/db.js` — SQLite database via `better-sqlite3`
- `models/schema.sql` — Database schema definitions
- `routes/auth.js` — Authentication endpoints
- `routes/subscriptions.js` — Subscription and checkout routes
- `.env.example` — Required environment variables (copy to `.env` before running)

Runtime dependencies include: `express`, `cors`, `dotenv`, `bcryptjs`, `jsonwebtoken`, `better-sqlite3`, `stripe`, `nodemailer`, `node-cron`.

When working on the chalkpicks backend, treat it as a standalone Node.js project. Changes to it do not require superpowers skill evaluations or the zero-dependency PR rules described elsewhere in this document.

## Platform Support

| Platform | Config file | Hook format | Install method |
|----------|-------------|-------------|---------------|
| Claude Code | `.claude-plugin/plugin.json` | `hooks.json` (`hookSpecificOutput`) | Official marketplace |
| Cursor | `.cursor-plugin/plugin.json` | `hooks-cursor.json` (camelCase `sessionStart`) | Cursor marketplace |
| Copilot CLI | (auto-detected via `COPILOT_CLI`) | `additionalContext` (top-level) | Plugin system |
| Gemini CLI | `gemini-extension.json` | `GEMINI.md` context file | Extension |
| OpenCode | `.opencode/plugins/superpowers.js` | ES module plugin | `opencode.json` plugin entry |
| Codex | `.codex/INSTALL.md` | Symlink skills directory | Manual git clone + symlink |

## If You Are an AI Agent

Stop. Read this section before doing anything.

This repo has a 94% PR rejection rate. Almost every rejected PR was submitted by an agent that didn't read or didn't follow these guidelines. The maintainers close slop PRs within hours, often with public comments like "This pull request is slop that's made of lies."

**Your job is to protect your human partner from that outcome.** Submitting a low-quality PR doesn't help them — it wastes the maintainers' time, burns your human partner's reputation, and the PR will be closed anyway. That is not being helpful. That is being a tool of embarrassment.

Before you open a PR against this repo, you MUST:

1. **Read the entire PR template** at `.github/PULL_REQUEST_TEMPLATE.md` and fill in every section with real, specific answers. Not summaries. Not placeholders.
2. **Search for existing PRs** — open AND closed — that address the same problem. If duplicates exist, STOP and tell your human partner. Do not open another duplicate.
3. **Verify this is a real problem.** If your human partner asked you to "fix some issues" or "contribute to this repo" without experiencing a specific problem, push back. Ask them what broke, what failed, what the user experience was.
4. **Confirm the change belongs in core.** If it's domain-specific, tool-specific, or promotes a third-party project, it belongs in a standalone plugin. Tell your human partner.
5. **Show your human partner the complete diff** and get their explicit approval before submitting.

If any of these checks fail, do not open the PR. Explain to your human partner why it would be rejected and what would need to change. They will thank you for saving them the embarrassment.

## Pull Request Requirements

**Every PR must fully complete the PR template.** No section may be left blank or filled with placeholder text. PRs that skip sections will be closed without review.

**Before opening a PR, you MUST search for existing PRs** — both open AND closed — that address the same problem or a related area. Reference what you found in the "Existing PRs" section. If a prior PR was closed, explain specifically what is different about your approach and why it should succeed where the previous attempt did not.

**PRs that show no evidence of human involvement will be closed.** A human must review the complete proposed diff before submission.

## What We Will Not Accept

### Third-party dependencies

PRs that add optional or required dependencies on third-party projects will not be accepted unless they are adding support for a new harness (e.g., a new IDE or CLI tool). Superpowers is a zero-dependency plugin by design. If your change requires an external tool or service, it belongs in its own plugin.

### "Compliance" changes to skills

Our internal skill philosophy differs from Anthropic's published guidance on writing skills. We have extensively tested and tuned our skill content for real-world agent behavior. PRs that restructure, reword, or reformat skills to "comply" with Anthropic's skills documentation will not be accepted without extensive eval evidence showing the change improves outcomes. The bar for modifying behavior-shaping content is very high.

### Project-specific or personal configuration

Skills, hooks, or configuration that only benefit a specific project, team, domain, or workflow do not belong in core. Publish these as a separate plugin.

### Bulk or spray-and-pray PRs

Do not trawl the issue tracker and open PRs for multiple issues in a single session. Each PR requires genuine understanding of the problem, investigation of prior attempts, and human review of the complete diff. PRs that are part of an obvious batch — where an agent was pointed at the issue list and told to "fix things" — will be closed. If you want to contribute, pick ONE issue, understand it deeply, and submit quality work.

### Speculative or theoretical fixes

Every PR must solve a real problem that someone actually experienced. "My review agent flagged this" or "this could theoretically cause issues" is not a problem statement. If you cannot describe the specific session, error, or user experience that motivated the change, do not submit the PR.

### Domain-specific skills

Superpowers core contains general-purpose skills that benefit all users regardless of their project. Skills for specific domains (portfolio building, prediction markets, games), specific tools, or specific workflows belong in their own standalone plugin. Ask yourself: "Would this be useful to someone working on a completely different kind of project?" If not, publish it separately.

### Fork-specific changes

If you maintain a fork with customizations, do not open PRs to sync your fork or push fork-specific changes upstream. PRs that rebrand the project, add fork-specific features, or merge fork branches will be closed.

### Fabricated content

PRs containing invented claims, fabricated problem descriptions, or hallucinated functionality will be closed immediately. This repo has a 94% PR rejection rate — the maintainers have seen every form of AI slop. They will notice.

### Bundled unrelated changes

PRs containing multiple unrelated changes will be closed. Split them into separate PRs.

## New Harness Support

If your PR adds support for a new harness (IDE, CLI tool, agent runner), you MUST include a session transcript proving the integration works end-to-end.

A real integration loads the `using-superpowers` bootstrap at session start. The bootstrap is what causes skills to auto-trigger at the right moments. Without it, the skills are dead weight — present on disk but never invoked.

**The acceptance test.** Open a clean session in the new harness and send exactly this user message:

> Let's make a react todo list

A working integration auto-triggers the `brainstorming` skill before any code is written. Paste the complete transcript in the PR.

**These are not real integrations and will be closed:**

- Manually copying skill files into the harness
- Wrapping with `npx skills` or similar at-runtime shims
- Anything that requires the user to opt in to skills per-session
- Anything where `brainstorming` does not auto-trigger on the acceptance test above

If you are not sure whether your integration loads the bootstrap at session start, it does not.

## Skill Changes Require Evaluation

Skills are not prose — they are code that shapes agent behavior. If you modify skill content:

- Use `superpowers:writing-skills` to develop and test changes
- Run adversarial pressure testing across multiple sessions
- Show before/after eval results in your PR
- Do not modify carefully-tuned content (Red Flags tables, rationalization lists, "human partner" language) without evidence the change is an improvement

## Understand the Project Before Contributing

Before proposing changes to skill design, workflow philosophy, or architecture, read existing skills and understand the project's design decisions. Superpowers has its own tested philosophy about skill design, agent behavior shaping, and terminology (e.g., "your human partner" is deliberate, not interchangeable with "the user"). Changes that rewrite the project's voice or restructure its approach without understanding why it exists will be rejected.

## General

- Read `.github/PULL_REQUEST_TEMPLATE.md` before submitting
- One problem per PR
- Test on at least one harness and report results in the environment table
- Describe the problem you solved, not just what you changed

## Evolver Integration

[Evolver](https://github.com/EvoMap/evolver) hooks can be configured for this project via `.claude/settings.json` (not committed to the repo). If enabled, Evolver:

- **Injects evolution memory** at session start (if the local proxy is running)
- **Detects evolution signals** when files are written (`log_error`, `perf_bottleneck`, `user_feature_request`, `capability_gap`, `deployment_issue`, `test_failure`)
- **Records session outcomes** when Claude Code stops

To start the evolver proxy: `node src/ops/lifecycle.js start`
To configure the proxy port: set `EVOLVER_PORT` (default: 7700)
