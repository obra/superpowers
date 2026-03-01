# Upstream Forks Survey — obra/superpowers

**Date:** 2026-03-01
**Total forks:** 5,111
**Forks with stars/activity:** ~95
**Forks with meaningful divergence:** 6

## Notable Forks

### 1. pcvelz/superpowers (227 stars, 9 forks, 97 commits ahead)

**Description:** "An agentic skills framework & software development methodology that works - CC task management support"

**Key innovations:**
- **Plan mode prohibition:** `EnterPlanMode`/`ExitPlanMode` explicitly blocked in brainstorming, writing-plans, and executing-plans with detailed rationale ("traps the session in plan mode where Write/Edit are restricted")
- **Task persistence via .tasks.json:** executing-plans saves task state to `<plan-path>.tasks.json`, loads on cold start, recreates native tasks from JSON including blockedBy dependencies
- **Plan status frontmatter:** Plans have `status: pending` YAML frontmatter, changed to `status: executed` on completion
- **Expanded red flags table:** 12 rationalization patterns vs our 5 in using-superpowers
- **Stronger enforcement language:** "IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT."
- **Synchronous SessionStart hook:** Ensures using-superpowers loads before first turn

**Ideas to adopt:**
- Plan mode prohibition is critical — we should add this
- .tasks.json persistence complements our state.yml approach
- Plan status frontmatter is a good lightweight status tracking
- Expanded red flags table is useful

### 2. BryanHoo/superpowers-ccg (65 stars)

**Description:** "Claude Code superpowers: core skills library" (Chinese + English)

**Key innovations:**
- **`coordinating-multi-model-work` skill:** Routes tasks to Codex (backend) and Gemini (frontend) via MCP tools. Has fail-closed gate — if routing says use external model, MUST get output or STOP. Includes routing decision framework, evidence format, and invocation templates.
- **`EVALUATION.md`:** Structured evaluation scenarios for EVERY skill. Each has query + context + expected_behavior as JSON. Provides a test framework for skill effectiveness.
- **Checkpoint protocol (CP1/CP2/CP3):** Forced evaluation blocks at key points — before first task tool use, during execution, and before completion/verification.
- **Multi-model routing rules:** Semantic routing framework deciding when to delegate to Codex vs Gemini vs Claude.

**Ideas to adopt:**
- EVALUATION.md concept — we should have structured evaluation scenarios for each skill
- Multi-model coordination concept — relevant as more MCP-based models emerge
- Checkpoint protocol could inform our verification gates

### 3. markelz0r/superpowers-codex (1 star, 22 commits ahead)

**Description:** Codex-specific adaptation

**Key changes:**
- Made parallel agents skill sequential for Codex (Codex can't parallel dispatch)
- Adapted subagent workflow for Codex limitations
- Updated TDD skill applicability for Codex
- Softened skill announcements and worktree usage
- Codex subagent prompt templates

**Ideas to adopt:**
- Platform-specific behavior adaptation — our multi-platform notes could go further
- Sequential fallback for platforms without parallel dispatch is important

### 4. kyrosle/superpowers (3 stars, 8 commits ahead)

**Description:** Chinese fork with Kimi Code integration

**Key changes:**
- Kimi Code integration (Chinese AI coding tool)
- TDD made optional (not enforced for all tasks)
- Simplified execution flow
- Removed forced worktree and commit logic

**Ideas to adopt:**
- TDD optionality is a legitimate design choice — some codebases/tasks don't suit TDD
- Platform expansion to more AI coding tools

### 5. Ayagikei/superpowers (13 commits ahead)

**Key changes:**
- Mobile diff review requirement for code review of mobile changes
- Unattended mode blocker workflow

**Ideas to adopt:**
- Platform-specific review requirements (mobile, web, etc.)
- Unattended/autonomous mode considerations

### 6. Planetes1mal/superpowers-zh (8 commits ahead)

Chinese translation of superpowers. No structural changes.

## Summary of Adoptable Ideas

| Priority | Idea | Source Fork | Effort |
|----------|------|-------------|--------|
| P0 | Plan mode prohibition (block EnterPlanMode) | pcvelz | Small — add constraint to 3 skills |
| P0 | Expanded red flags table | pcvelz | Small — update using-superpowers |
| P1 | EVALUATION.md — structured test scenarios | BryanHoo | Medium — write scenarios for all skills |
| P1 | Task persistence (.tasks.json) | pcvelz | Medium — add to executing-plans |
| P1 | Plan status frontmatter | pcvelz | Small — add to writing-plans + executing-plans |
| P2 | Sequential fallback for Codex | markelz0r | Small — note in dispatching-parallel-agents |
| P2 | Multi-model coordination concept | BryanHoo | Large — new skill |
| P2 | TDD optionality | kyrosle | Small — soften language |
| P3 | Checkpoint protocol | BryanHoo | Medium — extend verification gates |
| P3 | Mobile-specific review | Ayagikei | Small — extend requesting-code-review |
