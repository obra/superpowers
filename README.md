<p align="center">
  <img src="docs/assets/logo.png" alt="EverydayAI" width="200" />
</p>

<h1 align="center">Superpowers — SDLC Orchestration Fork</h1>

<p align="center">
  An <a href="https://github.com/EAIconsulting">EAIconsulting</a> fork of <a href="https://github.com/obra/superpowers">obra/superpowers</a><br/>
  Adds a full SDLC orchestration pipeline on top of the Superpowers skills system for Claude Code.
</p>

---

## What This Fork Adds

**Pipeline v3** turns Claude Code into an autonomous software development organization. Five departments — Product, Design, Engineering, Quality, and Marketing — run in parallel within token-budgeted iterations, coordinated by an Orchestrator agent and governed by a Founder agent at Integration Points.

The pipeline takes a product idea from discovery through shipping code:

```
PI Planning → Iteration 1 (Foundation) → Iteration 2 (Build) → Iteration 3 (Harden) → Ship
```

Each iteration runs all active department teams concurrently. Integration Points fire between iterations for cross-department sync and Founder decisions.

### Commands

| Command | Description |
|---------|-------------|
| `/orchestration` | Run the full Pipeline v3 SDLC — PI Planning through ship |
| `/scaffold` | Generate project scaffolding from YAML templates |
| `/pm-discover` | Standalone PM discovery (personas, journeys, stories, PRD, spec) |

### Organization: 5 Departments, 22 Agents

```
Founder (opus) — final decision maker
│
├── Product Department
│   ├── Product Lead (opus)
│   ├── Domain Researcher · Market Researcher · UX Researcher
│   ├── Onboarding Designer · Artifact Generator
│
├── Design Department
│   ├── Design Lead (opus)
│   └── Visual Designer
│
├── Engineering Department
│   ├── Engineering Lead (opus)
│   ├── Implementers (subagent-driven) · Code Reviewers
│   └── UX Reviewer
│
├── Quality Department
│   ├── Quality Lead (opus)
│   ├── Verifier · Browser Tester · Security Reviewer
│   └── Release Readiness Reviewer
│
├── Marketing Department (optional)
│   ├── Marketing Lead (opus)
│   ├── Content Marketer · Growth Marketer · SEO Specialist
│
└── Staff
    ├── Orchestrator (opus)
    └── Humanizer
```

### Key Features

- **Parallel iterations** — all teams work concurrently within each iteration
- **Token-budgeted timeboxes** — teams get token budgets enforced by hooks
- **Dual-trigger Integration Points** — syncs fire when artifacts exist OR budgets exhaust
- **Hook-automated coordination** — 6 shell hooks handle state management at zero orchestrator token cost
- **Structured memory** — cross-project learnings compound via `knowledge-compounding` skill
- **SAFe alignment** — Epic/Capability/Feature/Story hierarchy, WSJF prioritization, PI Planning

---

## Upstream Superpowers

All original [Superpowers](https://github.com/obra/superpowers) skills remain available. The fork extends but does not modify the upstream skills system.

### Skills Library

**Testing**
- **test-driven-development** — RED-GREEN-REFACTOR cycle

**Debugging**
- **systematic-debugging** — 4-phase root cause process
- **verification-before-completion** — Ensure it's actually fixed

**Collaboration**
- **brainstorming** — Socratic design refinement
- **writing-plans** — Detailed implementation plans
- **executing-plans** — Batch execution with checkpoints
- **dispatching-parallel-agents** — Concurrent subagent workflows
- **requesting-code-review** / **receiving-code-review** — Code review workflow
- **using-git-worktrees** — Parallel development branches
- **finishing-a-development-branch** — Merge/PR decision workflow
- **subagent-driven-development** — Fast iteration with two-stage review

**Meta**
- **writing-skills** — Create new skills following best practices
- **using-superpowers** — Introduction to the skills system

### Installation

This fork is designed for use as a Claude Code plugin. See the upstream [obra/superpowers](https://github.com/obra/superpowers) README for standard installation instructions.

---

## Philosophy

- **Judgment before tools** — severity gates surface decisions that matter
- **Research before ask** — exhaust automated research before asking the human
- **Verify before trust** — anti-rationalization verification at every stage
- **Don't reinvent** — evaluate existing solutions before building custom
- **Leads resist** — department Leads push back on mediocre work
- **Compound intelligence** — every pipeline run makes the next one smarter

---

## Credits

Built on top of [Superpowers](https://github.com/obra/superpowers) by [Jesse Vincent (obra)](https://github.com/obra). If Superpowers has helped you, consider [sponsoring Jesse's open source work](https://github.com/sponsors/obra).

## License

MIT License — see LICENSE file for details.

## Support

- **Issues**: https://github.com/EAIconsulting/superpowers/issues
