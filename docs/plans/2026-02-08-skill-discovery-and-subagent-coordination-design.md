# Design: Improved Skill Discovery and Subagent Coordination

## Overview
This design improves how coding agents interact with the Superpowers skill system by automating discovery and enhancing collaboration between parallel subagents.

## Goals
- **Improved Search/Matching:** Move beyond keyword triggers to semantic discovery of skills.
- **Shared Context/State:** Enable subagents to share findings and progress in real-time during parallel execution.
- **Git-Native:** Use existing Git primitives (like `notes`) to manage state without polluting the source tree.

## Architecture

### 1. Discovery Engine
The system will index skill metadata to enable semantic matching.
- **Indexing:** A new `index` command scans `skills/*/SKILL.md` and caches metadata in `.superpowers/discovery_index.json`.
- **Semantic Matching:** Uses agent reasoning to match user intent against descriptions and `semantic_tags`.
- **In-Context Activation:** Relevant skills are suggested and injected into the agent's prompt based on the task context.

### 2. Coordination Layer (Git-Based Context)
Subagents will share state via `git notes` in the `refs/notes/superpowers` namespace.
- **Task Registry:** Tracks which subagents are active and their current status.
- **Shared Findings:** A JSON object storing global context, discovered API endpoints, and structural changes.
- **Dependency Map:** Manages task ordering and ensures subagents wait for prerequisite changes.
- **Workflow:** 
    1. Read shared state from `git notes`.
    2. Update state with milestones/findings via `git notes add`.
    3. Sync across worktrees using `git notes fetch`.

## Conflict & Error Handling
- **Concurrent Updates:** Uses a merge strategy for JSON state in `git notes`, retrying on lock failures.
- **Structural Conflicts:** Leverages `using-git-worktrees` for branch merging, falling back to `systematic-debugging` for conflict resolution.
- **Graceful Fallback:** If `git notes` is unavailable, uses a `.superpowers/state.json` file in the main branch.

## Success Criteria
- Agents automatically suggest the correct skill for 90% of tasks.
- Parallel subagents can "see" each other's work and findings without manual synchronization.
- No "stale" state left in the working directory after task completion.
