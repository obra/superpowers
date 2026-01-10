# Context Fork Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use hyperpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Integrate Claude Code 2.1's `context: fork` feature into Hyperpowers skills to improve context management, reduce handoff file overhead, and enable more efficient research/exploration workflows.

**Architecture:** Adopt a hybrid approach - use `context: fork` for research/exploration skills that benefit from full context access, while preserving file-based handoffs for structured data exchange (implementation reports, review findings). This balances context efficiency with the cache optimization and explicit API semantics that file handoffs provide.

**Tech Stack:** Claude Code 2.1+, YAML frontmatter, existing skill infrastructure

**Context Gathered From:**
- `docs/handoffs/context-codebase-summary.md` - Current subagent dispatch and handoff patterns
- `docs/handoffs/context-docs-summary.md` - Claude Code 2.1 context:fork feature documentation
- `docs/handoffs/context-web-summary.md` - Best practices and community feedback

---

## Task 1: Add context:fork to writing-plans Skill

**Files:**
- Modify: `skills/writing-plans/SKILL.md`

**Step 1: Write the failing test**

Create test case in `tests/claude-code/skills/` to verify writing-plans properly uses context:fork for exploration phases.

```bash
# Test file: tests/claude-code/skills/writing-plans-context-fork.test.md
```

Test scenario:
- Given a planning request requiring extensive exploration
- When the writing-plans skill dispatches exploration subagents
- Then exploration should use forked context (returns brief result, discards exploration noise)

**Step 2: Run test to verify it fails**

Run: `./tests/claude-code/run-skill-tests.sh writing-plans-context-fork`
Expected: FAIL - skill doesn't mention context:fork

**Step 3: Update SKILL.md with context:fork guidance**

Add to the "Context Engineering for Subagent Dispatch" section:

```markdown
### Using context: fork for Exploration Skills

For Phase 1-3 exploration subagents, consider using `context: fork` in skill frontmatter:

```yaml
---
name: codebase-explorer
description: Explore codebase for planning context
context: fork
---
```

**When to use context: fork:**
- Research and exploration that needs full conversation context
- Multi-step operations that would clutter main thread
- Context window optimization

**When NOT to use:**
- Implementation subagents (need fresh context per task)
- Review subagents (need structured context, not full history)
```

**Step 4: Run test to verify it passes**

Run: `./tests/claude-code/run-skill-tests.sh writing-plans-context-fork`
Expected: PASS

**Step 5: Commit**

```bash
git add skills/writing-plans/SKILL.md tests/claude-code/skills/writing-plans-context-fork.test.md
git commit -m "feat(writing-plans): add context:fork guidance for exploration phases"
```

---

## Task 2: Add context:fork to brainstorming Skill

**Files:**
- Modify: `skills/brainstorming/SKILL.md`

**Step 1: Write the failing test**

Test scenario: Brainstorming exploration should use forked context to keep main thread focused on decisions.

**Step 2: Run test to verify it fails**

Run: `./tests/claude-code/run-skill-tests.sh brainstorming-context-fork`
Expected: FAIL

**Step 3: Update SKILL.md**

Add guidance that brainstorming research phases can use `context: fork`:

```markdown
### Context Management

When dispatching research subagents for exploration:
- Use `context: fork` for extensive codebase exploration
- Returns only synthesized findings to main thread
- Keeps main conversation focused on decision-making

This prevents verbose exploration output from polluting the brainstorming conversation.
```

**Step 4: Run test to verify it passes**

Run: `./tests/claude-code/run-skill-tests.sh brainstorming-context-fork`
Expected: PASS

**Step 5: Commit**

```bash
git add skills/brainstorming/SKILL.md tests/claude-code/skills/brainstorming-context-fork.test.md
git commit -m "feat(brainstorming): add context:fork for research phases"
```

---

## Task 3: Update subagent-driven-development with Context Guidance

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md`

**Step 1: Write the failing test**

Test scenario: SDD skill should explicitly document when NOT to use context:fork (implementers need fresh context, reviewers need structured context).

**Step 2: Run test to verify it fails**

Run: `./tests/claude-code/run-skill-tests.sh sdd-context-guidance`
Expected: FAIL

**Step 3: Update SKILL.md Context Engineering section**

Add new subsection after "Minimal Context Principle":

```markdown
### context:fork vs Fresh Subagents

**Do NOT use context: fork for implementer subagents:**
- Implementers need FRESH context per task (our core principle)
- Full conversation history causes "anchoring bias"
- Fresh starts enable independent verification

**Do NOT use context: fork for reviewer subagents:**
- Reviewers need STRUCTURED context (architecture docs, conventions)
- They should NOT get author's implementation chat history
- This prevents bias while maintaining architectural awareness

**Hybrid pattern for reviews:**
- Structured handoff file for task-specific info
- CLAUDE.md for project conventions
- Fresh execution context to prevent bias

**When context: fork IS appropriate:**
- Research subagents exploring documentation
- Exploratory debugging needing full error history
- Integration tasks requiring understanding of full trajectory
```

**Step 4: Run test to verify it passes**

Run: `./tests/claude-code/run-skill-tests.sh sdd-context-guidance`
Expected: PASS

**Step 5: Commit**

```bash
git add skills/subagent-driven-development/SKILL.md tests/claude-code/skills/sdd-context-guidance.test.md
git commit -m "docs(sdd): clarify when to use context:fork vs fresh subagents"
```

---

## Task 4: Update dispatching-parallel-agents Skill

**Files:**
- Modify: `skills/dispatching-parallel-agents/SKILL.md`

**Step 1: Write the failing test**

Test scenario: Parallel dispatch skill should document context isolation for concurrent subagents.

**Step 2: Run test to verify it fails**

Run: `./tests/claude-code/run-skill-tests.sh parallel-agents-context`
Expected: FAIL

**Step 3: Update SKILL.md**

Add new section on context management for parallel agents:

```markdown
## Context Management for Parallel Agents

Each parallel subagent receives its own isolated 200K-token context window.

### Context Isolation Pattern

```yaml
# Each parallel agent gets minimal, focused context
Task tool (Explore):
  description: "Explore aspect: [specific-aspect]"
  model: haiku
  prompt: |
    ## Your Specific Focus
    [Only this aspect - not full plan]

    ## Return Format
    [Structured findings - not verbose exploration]
```

### When to Use context: fork in Parallel

**Use context: fork when:**
- Parallel research tasks that need conversation history
- Each agent needs awareness of what we're building

**Use fresh context when:**
- Independent investigation of separate concerns
- Tasks don't need prior conversation context
- Default for parallel exploration

### Aggregation with Forked Context

When using context: fork for parallel agents:
- Each fork sees full parent context
- Returns only brief result to main
- Orchestrator synthesizes across all forks
- Discarded fork context doesn't pollute main thread
```

**Step 4: Run test to verify it passes**

Run: `./tests/claude-code/run-skill-tests.sh parallel-agents-context`
Expected: PASS

**Step 5: Commit**

```bash
git add skills/dispatching-parallel-agents/SKILL.md tests/claude-code/skills/parallel-agents-context.test.md
git commit -m "feat(parallel-agents): add context:fork guidance for parallel dispatch"
```

---

## Task 5: Update requesting-code-review Skill

**Files:**
- Modify: `skills/requesting-code-review/SKILL.md`

**Step 1: Write the failing test**

Test scenario: Code review skill should document structured context isolation (architecture context yes, author chat history no).

**Step 2: Run test to verify it fails**

Run: `./tests/claude-code/run-skill-tests.sh code-review-context`
Expected: FAIL

**Step 3: Update SKILL.md**

Add context management section:

```markdown
## Context for Code Reviewers

### Structured Context Isolation

Reviewers need a specific type of context - NOT the full conversation.

**What reviewers SHOULD have:**
- Architectural context (diagrams, module boundaries)
- Dependency information (which services call what)
- Team conventions and style guides (via CLAUDE.md)
- The specific code being reviewed (via git diff)

**What reviewers should NOT have:**
- Author's brainstorming/implementation chat history
- Causes bias contamination
- Prevents fresh-perspective review

### Fresh Perspective Value

Research shows fresh-perspective reviewers catch oversights the original author missed. The pattern:

1. Author writes code (full implementation context)
2. Fresh-perspective reviewer (isolated + architecture docs)
3. Orchestrator integrates feedback

### Do NOT Use context: fork for Reviews

Code reviewers should NOT use `context: fork` because:
- Full history causes reviewer to inherit author's blind spots
- Reviewers need STRUCTURED system context, not chat history
- Fresh execution context enables independent verification

Instead, provide reviewers with:
- Explicit architectural context in prompt
- Handoff file with implementation summary
- CLAUDE.md for conventions
```

**Step 4: Run test to verify it passes**

Run: `./tests/claude-code/run-skill-tests.sh code-review-context`
Expected: PASS

**Step 5: Commit**

```bash
git add skills/requesting-code-review/SKILL.md tests/claude-code/skills/code-review-context.test.md
git commit -m "docs(code-review): document structured context isolation for reviewers"
```

---

## Task 6: Create context-fork-guide Reference Document

**Files:**
- Create: `skills/writing-skills/context-fork-guide.md`

**Step 1: Write the failing test**

Test scenario: Writing-skills should reference a context-fork guide for skill authors.

**Step 2: Run test to verify it fails**

Run: `./tests/claude-code/run-skill-tests.sh context-fork-guide`
Expected: FAIL

**Step 3: Create context-fork-guide.md**

```markdown
# Context Fork Guide for Skill Authors

## Overview

Claude Code 2.1 introduced `context: fork`, which allows skills to execute in an isolated sub-agent context while preserving access to full parent conversation history.

## Syntax

Add to skill YAML frontmatter:

```yaml
---
name: my-research-skill
description: Use when researching X
context: fork
---
```

## How It Works

1. **Fork current conversation** - Creates isolated context with full history
2. **Execute skill** - Runs in forked context
3. **Return brief result** - Only confirmation returns to main
4. **Discard forked context** - Keeps main conversation clean

## Decision Matrix

| Skill Type | Use context: fork? | Rationale |
|------------|-------------------|-----------|
| Research/Exploration | YES | Needs history, returns summary |
| Implementation | NO | Needs fresh context per task |
| Code Review | NO | Needs structured, not full context |
| Brainstorming | MAYBE | Research phases yes, decisions no |
| Planning | MAYBE | Exploration yes, plan writing no |
| Utility/Logging | YES | Fire-and-forget with context |

## Anti-Patterns

**DON'T use context: fork when:**
- Fresh perspective needed (code review)
- Task independence required (TDD implementers)
- Sequential dependencies with tight state sharing

**DON'T confuse with:**
- Fresh subagents (clean slate, task-focused)
- Handoff files (structured data exchange)

## Best Practices

1. **Use for exploration, not implementation**
2. **Return only synthesized findings**
3. **Combine with handoff files for structured data**
4. **Preserve fresh subagent pattern for TDD**

## Token Efficiency

- Forked context maintains full history (higher token cost)
- But discards after execution (no main context pollution)
- Trade-off: Higher per-execution cost, cleaner main thread
```

**Step 4: Run test to verify it passes**

Run: `./tests/claude-code/run-skill-tests.sh context-fork-guide`
Expected: PASS

**Step 5: Commit**

```bash
git add skills/writing-skills/context-fork-guide.md tests/claude-code/skills/context-fork-guide.test.md
git commit -m "docs(writing-skills): add context-fork guide for skill authors"
```

---

## Task 7: Update writing-skills SKILL.md

**Files:**
- Modify: `skills/writing-skills/SKILL.md`

**Step 1: Write the failing test**

Test scenario: Writing-skills should mention context:fork as an option for skill authors.

**Step 2: Run test to verify it fails**

Run: `./tests/claude-code/run-skill-tests.sh writing-skills-fork`
Expected: FAIL

**Step 3: Update SKILL.md**

Add to the YAML frontmatter options section:

```markdown
### Optional Frontmatter Fields

- **context: fork** - Run skill in isolated forked context
  - Skill gets full parent conversation history
  - Returns only brief result to main thread
  - Use for: research, exploration, utility tasks
  - See: `./context-fork-guide.md` for decision matrix
```

Add to the skill design considerations:

```markdown
## Context Management

When designing skills that dispatch subagents:

1. **Research/exploration phases**: Consider `context: fork`
2. **Implementation tasks**: Use fresh subagents (no fork)
3. **Review tasks**: Provide structured context, not full history

See `./context-fork-guide.md` for detailed guidance.
```

**Step 4: Run test to verify it passes**

Run: `./tests/claude-code/run-skill-tests.sh writing-skills-fork`
Expected: PASS

**Step 5: Commit**

```bash
git add skills/writing-skills/SKILL.md
git commit -m "docs(writing-skills): add context:fork guidance for skill authors"
```

---

## Task 8: Update IMPROVEMENTS.md

**Files:**
- Modify: `IMPROVEMENTS.md`

**Step 1: Write the failing test**

Test scenario: IMPROVEMENTS.md should document context:fork integration.

**Step 2: Run test to verify it fails**

Run: `./tests/claude-code/run-skill-tests.sh improvements-fork`
Expected: FAIL

**Step 3: Update IMPROVEMENTS.md**

Add new section:

```markdown
## Context Fork Integration (Claude Code 2.1+)

### Added guidance for context:fork usage across skills

Skills now document when to use Claude Code 2.1's `context: fork` feature:

- **writing-plans**: Exploration phases use forked context for research
- **brainstorming**: Research phases fork to keep decisions focused
- **subagent-driven-development**: Explicitly documents why NOT to fork for implementers/reviewers
- **dispatching-parallel-agents**: Context isolation patterns for concurrent agents
- **requesting-code-review**: Structured context isolation (architecture yes, chat history no)
- **writing-skills**: Context-fork guide for skill authors

### Key Principles

1. **Use context:fork for research/exploration** - Full history access, discarded after execution
2. **Preserve fresh subagents for implementation** - Core TDD pattern unchanged
3. **Structured context for reviews** - Architecture docs yes, author history no
4. **Hybrid approach** - Combine context:fork with handoff files for structured data

### Commits

- `feat(writing-plans): add context:fork guidance for exploration phases`
- `feat(brainstorming): add context:fork for research phases`
- `docs(sdd): clarify when to use context:fork vs fresh subagents`
- `feat(parallel-agents): add context:fork guidance for parallel dispatch`
- `docs(code-review): document structured context isolation for reviewers`
- `docs(writing-skills): add context-fork guide for skill authors`
```

**Step 4: Run test to verify it passes**

Run: `./tests/claude-code/run-skill-tests.sh improvements-fork`
Expected: PASS

**Step 5: Commit**

```bash
git add IMPROVEMENTS.md
git commit -m "docs: document context:fork integration in IMPROVEMENTS.md"
```

---

## Task 9: Final Validation and Integration Test

**Files:**
- Create: `tests/claude-code/integration/context-fork-integration.test.md`

**Step 1: Write integration test**

Create comprehensive test that validates:
1. Writing-plans mentions context:fork for exploration
2. SDD explicitly says NOT to use fork for implementers
3. Code review explicitly says NOT to use fork for reviewers
4. Parallel dispatch documents context isolation
5. Writing-skills references context-fork-guide

**Step 2: Run integration test**

Run: `./tests/claude-code/run-skill-tests.sh --integration context-fork-integration`
Expected: All checks pass

**Step 3: Commit**

```bash
git add tests/claude-code/integration/context-fork-integration.test.md
git commit -m "test: add context-fork integration test"
```

---

## Summary

This plan integrates Claude Code 2.1's `context: fork` feature into Hyperpowers using a **hybrid approach**:

| Skill | context: fork | Rationale |
|-------|--------------|-----------|
| writing-plans (exploration) | YES | Research needs history, returns synthesis |
| brainstorming (research) | YES | Keep decisions focused |
| subagent-driven-development | NO | Fresh context per task is core principle |
| requesting-code-review | NO | Structured context prevents bias |
| dispatching-parallel-agents | DOCUMENTED | Guidance for both patterns |
| **systematic-debugging** | **YES (investigation only)** | **Investigation in isolated context, TDD in fresh subagents** |

**Key insight from research:** Subagents with isolated context outperform context injection by 8x on quality (76% vs 9% signal ratio). The hybrid approach preserves this benefit while adding context:fork for appropriate use cases.
