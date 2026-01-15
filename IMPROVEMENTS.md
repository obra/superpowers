# Improvements Since Fork

This document details all significant improvements made to Hyperpowers since forking from [Superpowers](https://github.com/obra/superpowers) (commit `80643c2`).

**Total Commits Since Fork:** 111
**Date Range:** December 22, 2025 - January 10, 2026

---

## Table of Contents

- [1. Enhanced Planning Workflow (writing-plans)](#1-enhanced-planning-workflow-writing-plans)
- [2. Subagent-Driven Development Improvements](#2-subagent-driven-development-improvements)
- [3. Skill Strengthening & Enforcement](#3-skill-strengthening--enforcement)
- [4. Model Selection Optimization](#4-model-selection-optimization)
- [5. Upstream Merges](#5-upstream-merges)
- [6. Test Infrastructure](#6-test-infrastructure)
- [7. Fork Setup & Rebranding](#7-fork-setup--rebranding)
- [8. Research Skill](#8-research-skill)
- [9. Knowledge Management & Specialized Review](#9-knowledge-management--specialized-review)
- [10. Context Fork Integration](#10-context-fork-integration)
- [11. Issue Tracking Abstraction](#11-issue-tracking-abstraction)
- [12. Issue Context Preservation](#12-issue-context-preservation)
- [13. Skill Instruction Following Improvements](#13-skill-instruction-following-improvements)

---

## 1. Enhanced Planning Workflow (writing-plans)

The most substantial improvements focus on the planning workflow, transforming it from a basic planning skill into a comprehensive context-gathering and synthesis system.

### Phase 0: Request Clarification

Added a new preliminary phase that prevents agents from rushing into planning with incomplete information.

**Key Features:**
- **Clarification Gate**: Before any context gathering begins, the system now asks clarifying questions on ambiguous requests
- **Exploration Subagent**: Dispatches a lightweight (haiku) subagent to perform quick 30-second codebase exploration before asking questions
- **Rationalization Counters**: Explicit guards against "seems clear enough" shortcuts - requires verification that ALL six planning questions are unambiguously answered
- **Clarification Context Synthesis**: Feeds clarification answers into the context synthesis phase

**Commits:** `e284a86`, `9b54fd7`, `21b9815`, `49743cd`, `558320a`, `5ac7b98`, `c492fa5`, `e33733d`, `4810e1a`, `78a7475`, `3d634f8`, `28787c2`, `406f05e`, `5cc6b80`, `de553fa`

### Phase 1: Enhanced Context Gathering

Completely redesigned context gathering with parallel subagent exploration across three dimensions.

**Three-Phase Context Gathering:**

1. **Codebase Exploration** - Parallel subagents examine:
   - Relevant source files and patterns
   - Existing architecture and conventions
   - Dependencies and integration points

2. **Documentation Exploration** - Parallel subagents examine:
   - README files and inline documentation
   - API documentation
   - Configuration guides

3. **Best Practices & Examples** - Web-enabled subagents research:
   - Industry best practices for the technology stack
   - Similar implementations and patterns
   - Potential pitfalls and anti-patterns

**Supporting Infrastructure:**
- **Handoff Files**: Subagents write findings to `docs/handoffs/` directory for structured communication
- **Context Synthesis Template**: Orchestrator synthesizes all findings into actionable summary
- **Plan Header References**: Generated plans reference the context sources used
- **Automatic Cleanup**: All handoff files are deleted after plan completion to prevent stale artifacts

**Commits:** `dbe73e2`, `1348245`, `2a999a7`, `060cd60`, `1eabdc9`, `da55f15`, `d2f1232`, `5932d44`, `a5dc79a`, `09c0605`, `de3cf3e`, `5673820`, `d287f00`, `376e64b`, `2d4c1dd`

### Iron Law Enforcement

Added strict enforcement mechanisms to prevent skipping context gathering.

**Enforcement Features:**
- **Iron Law**: "You CANNOT write a plan until all three context gathering phases complete"
- **Pre-Plan Writing Gate Checklist**: Required verification before plan writing begins
- **Rationalization Table**: Documents common excuses and why they're invalid
- **Red Flags Checklist**: Lists warning signs that context gathering is being skipped
- **Enforcement Language in Announcements**: Explicit non-negotiable statements

**Commits:** `a5780f1`, `27e0a8d`, `c958c2f`, `5217776`, `cf11701`, `12a1983`, `75ebb7c`

### Workflow Improvements

- **User Instructions for Completion**: Clear guidance on using `/compact` and `/hyperpowers:execute-plan`
- **Subagent Pattern Consistency**: Unified approach where Explore subagents are read-only and orchestrator writes handoff files
- **Workflow Diagram Updates**: Visual representation of all phases and gates

**Commits:** `f96dc93`, `3ad803b`

---

## 2. Subagent-Driven Development Improvements

Major enhancements to how the orchestrator communicates with and manages subagents.

### File-Based Communication Protocol

Replaced inline context passing with structured file-based communication.

**Components:**
- **Progress Tracking File** (`docs/current-progress.md`): Gitignored file for agent state management with status flags (PENDING, IN_PROGRESS, READY_FOR_SPEC_REVIEW, etc.)
- **Handoff Files** (`docs/handoffs/task-N-impl.md`): Implementers write completion reports here; reviewers read from these files
- **Handoffs Directory**: Dedicated directory with `.gitkeep` for subagent communication

**Benefits:**
- Reduced token usage by avoiding redundant context sharing
- Better resumability across sessions
- Clear audit trail of subagent work

**Commits:** `8d2bca5`, `d8c6576`, `753b099`, `37a6113`, `ec70df7`, `f191a27`

### Context Curation Guidelines

Added best practices for what context to provide to subagents.

**Guidelines:**
- **Always Include**: Task text, exact file paths, working directory
- **Never Include**: Full plan contents, unrelated code context, previous task details
- **Minimal Context Principle**: Fresh subagents with only what they need
- **Context Handoff Patterns**: Structured format for passing information
- **Context Pollution Warning**: Explicit guidance against overloading subagents

**Commits:** `5a2c558`

### Review Process Improvements

- **Spec Reviewer Updates**: Now reads from handoff files instead of receiving inline reports
- **Code Quality Reviewer Updates**: Same file-based reading pattern
- **Agent Tool Permissions**: Explicit whitelist prevents inheriting unnecessary tools
- **Override Preamble**: Counteracts semantic inference bugs in Claude

**Commits:** `07d1ae0`

---

## 3. Skill Strengthening & Enforcement

Comprehensive improvements to prevent agents from cutting corners or rationalizing away required workflows.

### Allowed-Tools Enforcement

New frontmatter field restricts what tools a skill can use.

**Implementations:**
- **brainstorming**: Read-only tools (no code changes during design phase)
- **verification-before-completion**: Verification tools only (no modifications)
- **requesting-code-review**: Review tools only

**Commits:** `62ccffd`, `9b60cc1`

### Anti-Pattern Documentation

Each core skill now includes explicit warnings about failure modes.

**test-driven-development:**
- Circular validation warning (primary failure mode)
- Phase gate checklists prevent skipping steps
- Phase gates: RED requires failing test, GREEN requires minimal implementation

**Commits:** `90d0619`

**systematic-debugging:**
- Hypothesis-driven approach emphasis (over random fixes)
- Observability requirements
- Butterfly effect warning for cascading breakage

**Commits:** `38e2c9c`

**brainstorming:**
- Explicit violations list for premature implementation
- Required spec.md deliverable before any coding
- Leverages allowed-tools for read-only enforcement

**Commits:** `eba2629`

**verification-before-completion:**
- Explicit evidence checklist with required items
- Red flags for premature claims
- Fresh verification requirement (no stale evidence)
- Based on research showing only 3.8% achieve low hallucinations + high confidence

**Commits:** `07f7a2b`

**receiving-code-review:**
- Anti-performative-agreement enforcement
- Explicit warning against automatic acceptance
- Verification requirement after each change
- Valid response patterns documented

**Commits:** `1dbc69a`

**requesting-code-review:**
- Two-stage pattern clarification (spec compliance → quality)
- Structured review request format
- Git range specification for focused review

**Commits:** `3dacc9b`

### Workflow Skill Improvements

**dispatching-parallel-agents:**
- Clear decision criteria for parallel vs sequential
- Warning against forced parallelism
- Structured output requirements for synthesis

**Commits:** `a42e470`

**using-git-worktrees:**
- Explicit lifecycle documentation (create → work → cleanup)
- Naming conventions and directory structure
- Warning against overlapping parallel work

**Commits:** `16889e8`

**finishing-a-development-branch:**
- Verification gate before options (tests + build + lint)
- Integrated worktree cleanup for relevant options
- Corrected cleanup scope consistency (Options 1 & 4 only)

**Commits:** `27414ae`, `264c063`

**subagent-driven-development:**
- Context handoff patterns
- Strict model selection table
- Context pollution warning

**Commits:** `5a2c558`

### Description Optimization

Removed workflow summaries from skill descriptions per Anthropic discovery guidelines.

**Rationale:** Descriptions should contain ONLY triggering conditions. Claude may follow description instead of reading full skill when workflow is summarized.

**Commits:** `f7a6c31`

### Token Optimization

Reduced using-hyperpowers skill from 581 to 155 words while preserving essential mandate.

**Commits:** `db66851`

---

## 4. Model Selection Optimization

Added explicit guidance for using appropriate models for different tasks.

### Haiku for Validation Tasks

Based on Anthropic's multi-agent guidance, validation tasks now specify Haiku for speed and cost efficiency.

**Updated Skills/Agents:**
- `code-reviewer` agent: `model: haiku` in frontmatter
- `dispatching-parallel-agents`: Haiku guidance for parallel investigation
- `subagent-driven-development`: Haiku for spec and code quality reviewers
- `requesting-code-review`: Haiku for review validation

**Implementation Details:**
- Implementer retains orchestrator model (Sonnet/Opus) for coding intelligence
- Reviewers use Haiku for speed
- Clarification exploration uses Haiku for quick queries

**Commits:** `b61837b`, `92f474e`, `0f91f2f`, `c9b71dc`, `2aeef13`

---

## 5. Upstream Merges

Cherry-picked improvements from the original Superpowers repository.

### Merged Features

- **Strengthen using-hyperpowers for explicit skill requests** (`8a51c4f` from upstream `3dac35e`)
  - "Check for skills" → "Invoke relevant or requested skills"
  - Added reassurance: wrong skill invocations are okay
  - New red flag: "I know what that means"

- **Make slash commands user-only** (`0403d17` from upstream `9baedaa`)
  - Removed: `disable-model-invocation` was causing issues and has been removed
  - Claude can invoke underlying skills directly

- **Automation-over-documentation guidance** (`feba88d` from upstream `66a2dbd`)
  - Mechanical constraints should be automated, not documented

- **GitHub thread reply guidance** (`3fe5829` from upstream `1455ac0`)
  - Use `gh api` thread endpoint for inline review comments

- **Git check-ignore for worktree verification** (`4327c0a` from upstream `c037dcb`)
  - Respects full Git ignore hierarchy

- **Clarify Skill tool behavior** (`73fa8c7` from upstream `a7a8c08`)
  - Skill content is loaded directly, no need to Read

---

## 6. Test Infrastructure

Significant improvements to the testing system for skills.

### New Test Files

- `test-writing-plans-context-gathering.sh`: Verifies context gathering phases
- `test-writing-plans-clarification.sh`: Tests Phase 0 clarification behavior
- Enforcement language verification tests

### Test Framework Improvements

- **Case-insensitive assertions**: `assert_contains`, `assert_not_contains`, `assert_count`, and `assert_order` now use `-i` flag
- **macOS compatibility**: Use `gtimeout` when available via test-helpers.sh
- **Extended timeouts**: Increased from 30s to 60s for complex queries
- **Pattern flexibility**: Added variations to match valid Claude response formats

### Test Coverage

- Context gathering phase structure verification
- Synthesis file references between phases
- Plan header "Context Gathered From" section
- Handoffs cleanup verification
- Clarification pressure tests

**Commits:** `3bd5c1c`, `0abdeb3`, `5932d44`, `2d4c1dd`, `5ac7b98`, `c492fa5`, `e33733d`, `12a1983`, `4bce26a`, `5b38074`, `a0beb32`, `4424599`

---

## 7. Fork Setup & Rebranding

Complete rebranding from Superpowers to Hyperpowers.

### Renamed Components

- All `superpowers` → `hyperpowers` references throughout codebase
- `using-superpowers` directory → `using-hyperpowers`
- Config files: `plugin.json`, `marketplace.json`, `package.json`
- Platform integrations: Codex, OpenCode, session hooks
- All skill cross-references to use `hyperpowers:` namespace
- Test files and assertions

### New Documentation

- Attribution section crediting Jesse Vincent as original author
- Updated installation instructions with three options (Direct Git, Marketplace, Local)
- Fork/rename notice in release notes
- Updated GitHub funding configuration

### Project Structure

- `CLAUDE.md` added for Claude Code guidance
- Skills index README for discoverability
- Updated allowed-tools documentation

**Commits:** `3788e40`, `3eaf117`, `3b2fbfa`, `86d11d5`, `940dc37`, `15b665a`, `1eb2127`, `b25ded8`, `3c56c7b`, `3294f70`, `1c828e6`, `a6abd17`, `675ba88`, `82e47ca`, `4039875`, `b4c6ec8`, `37cc6d4`, `f2b123f`, `13c4c45`, `70be5ac`, `1cf605f`

---

## 8. Research Skill

Deep technical research capability that gathers comprehensive context before planning.

### 4 Parallel Research Agents

The research skill dispatches specialized agents simultaneously to analyze different aspects of a problem:

**Agents:**
- **codebase-analyst**: Architecture patterns, similar implementations, naming conventions, dependencies
- **git-history-analyzer**: Code evolution, past decisions via commit messages, contributor expertise
- **framework-docs-researcher**: Official documentation, API details, version-specific considerations
- **best-practices-researcher**: Current community patterns, security considerations, performance optimizations, common pitfalls

**Key Features:**
- All agents use haiku model for cost efficiency
- Parallel execution via Task tool (not sequential)
- Each agent has specialized methodology and tool constraints
- Output standardization in consistent markdown structure

### Persistent Research Documents

Research findings are saved for reference during implementation:
- Location: `docs/research/YYYY-MM-DD-<topic-slug>.md`
- Contains synthesized findings from all 4 agents
- Structured sections: Executive Summary, Codebase Analysis, Git History Insights, Framework & Documentation, Best Practices, Edge Cases & Gotchas, Open Questions

### Planning Integration

Writing-plans skill automatically incorporates research:
- Checks for existing research in `docs/research/` before planning
- If found: uses findings to inform task structure, references in plan header
- If not found: offers choice to run research first (recommended) or proceed in degraded mode
- Research clarification phase prevents incomplete planning

**Files Created:**
- `skills/research/SKILL.md`
- `agents/research/codebase-analyst.md`
- `agents/research/git-history-analyzer.md`
- `agents/research/framework-docs-researcher.md`
- `agents/research/best-practices-researcher.md`

---

## 9. Knowledge Management & Specialized Review

Comprehensive knowledge capture and specialized code review capabilities.

### Compound Skill (Knowledge Capture)

Auto-captures solutions from debugging sessions into searchable knowledge base.

**Features:**
- Auto-triggers on resolution phrases ("it's fixed", "that worked")
- Filters for non-trivial problems (doesn't capture trivial fixes)
- 9 solution categories: build-errors, test-failures, runtime-errors, performance-issues, database-issues, security-issues, ui-bugs, integration-issues, logic-errors
- Pattern detection (alerts when 3+ similar issues in category)

**Files Created:**
- `skills/compound/SKILL.md`
- `docs/solutions/{9 categories}/.gitkeep`

### Specialized Code Review

Replaced single code-reviewer with 4 parallel specialized agents.

**Review Agents:**
- **security-reviewer**: Injection, auth, secrets, input validation, cryptography
- **performance-reviewer**: N+1 queries, memory leaks, scaling, caching
- **style-reviewer**: Naming, organization, patterns, formatting
- **test-reviewer**: Coverage gaps, edge cases, test quality

**Features:**
- All 4 agents use haiku for fast, focused analysis
- Severity-based synthesis (Critical -> Warning -> Suggestion)
- Integration with docs/solutions/ for known issue links

**Files Created:**
- `agents/review/security-reviewer.md`
- `agents/review/performance-reviewer.md`
- `agents/review/style-reviewer.md`
- `agents/review/test-reviewer.md`

### Knowledge Discovery Integration

Systematic debugging now searches existing solutions before fresh investigation.

**Features:**
- Pre-Phase-1 solution search in docs/solutions/
- If prior solution found, try it first before investigating
- Integrates with compound skill for capture after resolution

**Files Modified:**
- `skills/systematic-debugging/SKILL.md`
- `skills/requesting-code-review/SKILL.md`
- `skills/writing-plans/SKILL.md`

---

## 10. Context Fork Integration

New skill infrastructure feature that allows skills to run in isolated forked context for token efficiency.

### Systematic Debugging Context Fork Integration

Systematic-debugging now runs investigations in isolated forked context:

- **Investigation isolation**: Phases 1-3 run in forked context for token efficiency
- **Mandatory Investigation Summary**: Structured return preserves learning value
- **Fresh TDD subagents**: Phase 4 implementation continues using fresh subagents
- **Token efficiency**: 40-50% reduction for verbose investigations
- **Parallel hypothesis testing**: 3 problems in time of 1

**Key insight:** Teaching value isn't lost—it's captured in structured summaries that document the *why* and *how*, not just the *what*.

**Commits:**
- `feat(skills-core): extract context field from skill frontmatter`
- `feat(systematic-debugging): add context: fork for isolated investigation`
- `feat(systematic-debugging): require Investigation Summary return`
- `docs(systematic-debugging): document context fork behavior`

---

## 11. Issue Tracking Abstraction

System-agnostic issue tracking integration across all workflow skills.

**Commits:** `25333e8`, `b23f38c`, `b95479d`, `da16ebd`, `7ee0341`, `d3edcae`, `3f7b27d`, `f57f26b`, `38fe86e`, `39ec7a0`, `42c9dcf`

### Problem

Previous implementation hardcoded beads (`bd`) commands throughout skills, making Hyperpowers unusable for projects using GitHub Issues, Jira, or other trackers.

### Solution: Issue-Tracking Agent

Created a new agent that abstracts tracker operations behind a unified interface.

**Agent Structure:**
- `agents/issue-tracking/AGENT.md` - Main agent definition with 4 operations
- `agents/issue-tracking/beads-adapter.md` - Beads/bd CLI integration
- `agents/issue-tracking/github-adapter.md` - GitHub Issues via `gh` CLI
- `agents/issue-tracking/jira-adapter.md` - Jira via MCP tools

**Detection Priority:**
1. CLAUDE.md mentions (beads/bd/GitHub/Jira keywords)
2. `.beads/` directory exists
3. `gh auth status` succeeds
4. Jira MCP tools available
5. Fallback: No tracking available

**4 Operations:**
1. `discover` - Find ready-to-work issues (unblocked, high priority)
2. `update_status` - Change issue status (in_progress, blocked, etc.)
3. `track_discovered` - Create issue for work discovered during session
4. `close_offer` - Offer to close issues upon completion

### Skill Integrations

**Research Skill:**
- Added "Related Issues" section at end of research documents
- Dispatches issue-tracking agent during research phase
- Links findings to existing issues for context

**Writing-Plans Skill:**
- Added Phase 0.5 "Issue Context" after research check
- Extracts related issues from research document if available
- Falls back to agent discovery in degraded mode
- Issues included in plan header for implementer reference

**Subagent-Driven-Development Skill:**
- Added "Pre-Implementation Offers" checkpoint before any coding
- Offers to create issues for plan sections with dependencies
- User approval required before proceeding

**Verification-Before-Completion Skill:**
- Removed hardcoded `bd update` commands
- Added issue-tracking step to verification checklist
- Dispatches agent for status updates

**Finishing-Branch Skill:**
- Added close timing: "Offer during Close" before merge/PR
- PR descriptions include issue references with close keywords
- Merge commits reference closed issues

**CLAUDE.md:**
- Replaced beads-specific enforcement with skill-based guidance
- Points to issue-tracking agent for all tracker operations
- Still uses beads as example workflow for bd-enabled projects

### Design Principles

**User Approval Required:**
- All issue operations require explicit user consent
- Never automatically creates, updates, or closes issues
- Batched at natural checkpoints to minimize interruption

**Checkpoint-Based Offers:**
- Session start: Discovery offers (what's ready to work on?)
- Pre-implementation: Track discovered work
- Verification: Status updates
- Finish: Close offers

**Graceful Degradation:**
- If no tracker detected, workflows continue without issue integration
- Skills adapt behavior based on tracker availability
- No failures when working on untracked projects

---

## 12. Issue Context Preservation

**Commits:** `a294bf6`, `7050af2`, `2a1e31f`, `baad00d`, `1cb9f63`, `c206339`, `7e068f8`, `d982e29`

### Problem

Original issue requirements get diluted as work progresses through brainstorm → research → plan → develop cycle. By the time implementers work on tasks, subtle requirements and acceptance criteria have been abstracted away.

### Solution

Entry-point skills capture and preserve full issue context throughout the entire workflow chain:

**Context Capture:**
- Brainstorming, research, and writing-plans skills extract full issue body at start
- New `get-issue-body` operation added to issue-tracking agent
- Issue context stored in "Original Issue" block format

**Verbatim Preservation:**
- Each skill copies "Original Issue" block verbatim to output documents
- No re-summarization or abstraction—exact context preserved
- Research docs, specs, and plans all carry forward complete issue context

**Implementer Context:**
- Writing-plans generates implementer prompt template with issue context section
- Subagent-driven-development forwards issue context to implementer subagents
- Implementers receive original requirements, not just abstracted tasks

**Verification Integration:**
- Verification-before-completion checks acceptance criteria for Authoritative issues
- Authoritative vs Reference Only classification prevents misuse of vague tickets
- End-to-end test traces requirement from issue through entire chain

### Key Features

**Authoritative vs Reference Only:**
Issues with concrete acceptance criteria are marked "Authoritative" and used for verification. Vague or discovery-phase issues are marked "Reference Only" to prevent false compliance claims.

**COMPULSORY Gates:**
Skills enforce that issue context is included at each stage:
- Research skill: COMPULSORY "Original Issue" section in research doc
- Writing-plans: COMPULSORY issue context in plan header
- Subagent-driven-dev: COMPULSORY issue forwarding to implementers

**End-to-End Test:**
`tests/claude-code/test-issue-context-preservation-e2e.sh` traces requirement preservation:
1. Mock issue with specific acceptance criteria
2. Brainstorm captures and includes criteria
3. Research carries forward verbatim
4. Plan preserves in header
5. Implementer receives full context
6. Verification checks against criteria

### Files Created/Modified

**New Files:**
- `tests/claude-code/test-issue-context-preservation-e2e.sh` - End-to-end test

**Modified Files:**
- `agents/issue-tracking/AGENT.md` - Added `get-issue-body` operation
- `skills/brainstorming/SKILL.md` - Added issue context capture phase
- `skills/research/SKILL.md` - Added issue context carry-forward
- `skills/writing-plans/SKILL.md` - Added issue context extraction and inclusion
- `skills/subagent-driven-development/SKILL.md` - Added issue context forwarding
- `skills/verification-before-completion/SKILL.md` - Added acceptance criteria verification

---

## 13. Skill Instruction Following Improvements

Applied 8 research-backed patterns to all 17 hyperpowers skills based on Stanford/ACL 2024 "Lost in the Middle" findings and Anthropic Claude 4 best practices.

**Commits:** See `feature/skill-instruction-following` branch

### The Problem

Skills were not being followed precisely:
- Research skill: Required 8 parallel agents but Claude often dispatched only 4-5 (~50-60% compliance)
- Reinforcement language ineffective: MUST/CRITICAL/COMPULSORY keywords treated as suggestions
- Mid-skill instructions missed: Instructions in skill middles skipped 15-20% more often

### The 8 Improvement Patterns

| # | Pattern | What It Does |
|---|---------|--------------|
| 1 | **Beginning-End Anchoring** | Place critical requirements at BOTH start AND end to combat "Lost in the Middle" phenomenon |
| 2 | **Logical Statements** | Replace MUST/CRITICAL with consequence statements - Claude 4.x evaluates logical necessity, not caps |
| 3 | **Pre-Action Verification** | Move checklists BEFORE actions (not after where they're too late) |
| 4 | **Numbered Items** | "# Agent 1 of 8" pattern makes counts explicit and harder to skip |
| 5 | **XML Tags** | `<requirements>`, `<verification>` tags for critical sections (Claude trained on XML) |
| 6 | **Show Don't Tell** | Full examples over descriptions - examples beat prose by 30%+ |
| 7 | **Length Reduction** | Target <400 lines per skill - comprehension drops ~12% per 100 words beyond 500 |
| 8 | **Reinforcement Reduction** | ~3-4 instances per skill (down from ~12) - reserve for true non-negotiables |

### Infrastructure Created

**Shared Patterns Library** (`skills/shared-patterns.md`):
- 7 validated pattern definitions extracted from writing-skills
- Single source of truth for gate structure, red flags tables, etc.
- Skills reference this instead of duplicating patterns

**Skill Linter** (`tools/lint-skill.sh`):
- Pre-commit validation for all SKILL.md files
- Validates: YAML frontmatter, name format, description format, line count, reinforcement frequency, gate structure
- Integrated into git pre-commit hook

### Results

| Metric | Before | After |
|--------|--------|-------|
| Average skill lines | 380 | 290 |
| MUST/CRITICAL instances | ~12 per skill | ~3-4 per skill |
| Gate compliance | ~60% | Target >90% |
| Lint errors | N/A | 0 across all skills |

### Skills Refactored (17 total)

All 17 skills received the 8-pattern treatment:
- **Priority skills** (4): research, brainstorming, systematic-debugging, test-driven-development
- **Process skills** (7): writing-plans, verification-before-completion, subagent-driven-development, feedback, finishing-a-development-branch, dispatching-parallel-agents, batch-development
- **Review skills** (2): receiving-code-review, requesting-code-review
- **Utility skills** (3): using-git-worktrees, compound, using-hyperpowers
- **Meta-skill** (1): writing-skills (now references shared-patterns.md)

### Key Changes Per Skill

| Skill | Lines Before → After | Key Change |
|-------|---------------------|------------|
| research | 400 → 399 | Numbered "Agent 1 of 8" through "Agent 8 of 8" |
| systematic-debugging | 486 → 286 | Removed 200 lines of verbose explanations |
| test-driven-development | 442 → 312 | Condensed redundant TDD diagrams |
| writing-skills | 972 → 353 | Extracted patterns to shared-patterns.md |
| subagent-driven-development | 568 → 297 | Condensed verbose DOT diagrams |

### Research Sources

- [Lost in the Middle - Stanford/ACL 2024](https://arxiv.org/abs/2307.03172)
- [Claude 4 Best Practices - Anthropic](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices)
- [Context Rot Research - Chroma](https://research.trychroma.com/context-rot)
- [Claude Code GitHub Issues #2544, #6120, #742](https://github.com/anthropics/claude-code/issues)

---

## Summary Statistics

| Category | Commits | Impact |
|----------|---------|--------|
| Writing Plans Enhancements | ~40 | Major workflow overhaul |
| Subagent Development | ~10 | Token efficiency, resumability |
| Skill Strengthening | ~15 | Reduced corner-cutting |
| Model Selection | ~5 | Cost and speed optimization |
| Upstream Merges | ~6 | Feature parity |
| Test Infrastructure | ~12 | Quality assurance |
| Fork/Rebranding | ~23 | Independent identity |
| Research Skill | ~8 | Deep context gathering before planning |
| Knowledge Management & Review | ~9 | Solution capture, specialized review |
| Context Fork Integration | ~4 | Token efficiency for verbose skills |
| Issue Tracking Abstraction | ~11 | System-agnostic tracker support |
| Issue Context Preservation | ~8 | Requirements preserved through workflow chain |
| Skill Instruction Following | ~20 | Research-backed pattern application to all skills |

---

## Future Improvements

When making further improvements to Hyperpowers, please update this document following the process documented in `CLAUDE.md`.
