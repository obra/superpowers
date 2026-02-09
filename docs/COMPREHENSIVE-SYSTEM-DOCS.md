# Superpowers + Amplifier: Comprehensive System Documentation

This document provides a comprehensive overview of the integrated **Superpowers** development framework and **Amplifier** agent ecosystem, including the **Git-based memory** and coordination architecture.

---

## 🚀 The Superpowers Framework

**Superpowers** is an agentic skills framework and software development methodology designed for high-quality, reliable, and maintainable software construction.

### Core Principles
- **TDD (Test-Driven Development)**: Every feature starts with a failing test.
- **YAGNI (You Ain't Gonna Need It)**: Implement only what is necessary; ruthlessly prune scope.
- **Bite-Sized Tasks**: Break complex work into 2-5 minute actionable steps.
- **Verification Gates**: Every task is verified by spec compliance and code quality reviews.
- **Context Hygiene**: Frequent commits and isolated worktrees keep the codebase clean.

---

## ⚡ Amplifier Integration

**Amplifier** provides a suite of 30+ specialized agents, each a domain expert. Superpowers integrates these agents directly into the development workflow.

### Specialist Selection
Tasks in an implementation plan are assigned to specific Amplifier agents based on the domain:
- **Architecture**: `zen-architect`
- **Implementation**: `modular-builder`
- **Testing**: `test-coverage`
- **Security**: `security-guardian`
- **Debugging**: `bug-hunter`
- **Database**: `database-architect`
- **Frontend/UI**: `component-designer`

For the full mapping and selection rules, see [AMPLIFIER-AGENTS.md](../AMPLIFIER-AGENTS.md).

### Integrated Workflow
1. **Brainstorming**: Collaborative design phase using the `brainstorming` skill. Identifies required specialists and routes to the right execution path.
2. **Planning**: The `writing-plans` skill creates a detailed roadmap, assigning each task to an appropriate Amplifier agent.
3. **Execution**: The `subagent-driven-development` skill dispatches the assigned specialists to execute tasks in isolation, ensuring expert implementation for every component.

---

## 🧠 Git-Based Memory & Coordination

To maintain context and coordinate across multiple agents and sessions, the system uses a **Git-based memory approach**.

### How it Works
- **Storage**: Uses `git-notes` to store architectural decisions, patterns, and session context directly in the repository's metadata without polluting the file tree.
- **Persistence**: Memory travels with the code. If you push/pull, the "brain" of the project moves with it.
- **Coordination**: Multiple agents can read from and write to the same coordination ref, allowing for complex handoffs and shared understanding.

### Memory Tools
- `memorize`: Records a new decision or finding to the project memory.
- `recall`: Retrieves relevant past decisions or context.
- `snapshot-memory`: Generates a human-readable Markdown snapshot (like [docs/memory/SNAPSHOT.md](./memory/SNAPSHOT.md)) of the current project "brain".

---

## 🛠️ Operational Guide

### Starting a Session
Always start with `brainstorming`. It's the hub that gathers context, consults memory, and plans the agent allocation.

### Standard Workflow
1.  **Brainstorm**: `superpowers:brainstorming` -> Design doc + Agent Allocation.
2.  **Setup**: `superpowers:using-git-worktrees` -> Isolated workspace.
3.  **Plan**: `superpowers:writing-plans` -> Implementation plan with `Agent:` fields.
4.  **Execute**: `superpowers:subagent-driven-development` -> Dispatches specialists + reviews.
5.  **Finish**: `superpowers:finishing-a-development-branch` -> Merge and cleanup.

### Quality Gates
Each task execution involves:
1.  **Specialist Implementation**: Domain expert builds the feature.
2.  **Spec Compliance Review**: `test-coverage` agent verifies requirements are met.
3.  **Code Quality Review**: `zen-architect` (REVIEW mode) verifies architectural standards.

---

## 📚 Reference Links
- [Amplifier Agent Mapping](../AMPLIFIER-AGENTS.md)
- [Implementation Plans](./plans/)
- [Memory Snapshots](./memory/)
