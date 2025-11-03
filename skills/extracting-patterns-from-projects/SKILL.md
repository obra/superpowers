---
name: Extracting Patterns From Projects
description: Use when analyzing external projects for transferable concepts - prevents surface-level copying by requiring systematic analysis, pattern vs architecture distinction, three-tier prioritization, philosophy alignment, and risk assessment before recommendations
---

# Extracting Patterns From Projects

## Overview

Systematic methodology for analyzing external projects to extract transferable patterns while avoiding copy-paste mistakes.

**Core principle:** Extract patterns and principles, not architectures. Assess fit before recommending.

**Announce at start:** "I'm using the extracting-patterns-from-projects skill to systematically analyze this project."

## When to Use

Use when:

- Asked to "see what we can use from project X"
- Comparing projects for inspiration
- Evaluating whether to adopt practices from elsewhere
- Researching how others solved similar problems

Skip when:

- Simple feature copying is appropriate
- Projects are too different to compare meaningfully
- You're implementing, not researching

## Core Pattern

### ❌ Surface-Level Approach (Baseline Failure)

```markdown
Analysis: Project X has these features:

- Agents system
- Hook scripts
- Configuration files

Recommendation: Add all of these to our project.
```

**Problems:**

- No depth (what makes agents valuable?)
- Copy-paste mentality (architecture, not patterns)
- No prioritization (boil the ocean)
- No fit assessment (does this match our philosophy?)

### ✅ Pattern Extraction Approach

```markdown
Analysis of Project X:

## Pattern Categories

1. Knowledge Management (DISCOVERIES.md pattern)
   - Pattern: Living document for non-obvious solutions
   - Value: Prevents repeated problem-solving
   - Fit: High (aligns with our documentation focus)

2. Architecture (Agent-based invocation)
   - Pattern: Explicit specialized invocation
   - Value: Deep expertise per domain
   - Fit: Low (conflicts with our auto-activation approach)
   - **Recommendation: Extract agent patterns into our skills system**

## Three-Tier Priorities

**Tier 1 (4-6hrs)**: DISCOVERIES.md, decisions/
**Tier 2 (8-12hrs)**: Transcript hooks, workflow patterns
**Tier 3 (15-20hrs)**: New skills, advanced infrastructure

## Philosophy Alignment

✅ Matches: Simplicity, modularity, TDD
⚠️ Differs: Heavy workflows vs lightweight skills
❌ Conflicts: Agent invocation vs auto-activation

## Risks & Mitigation

- Risk: Scope creep → Start Tier 1 only
- Risk: Maintenance burden → Prefer docs over code
- Risk: Philosophy drift → Extract patterns, not architectures
```

## Systematic Analysis Process

### 1. Project Exploration (30-60min)

**For small projects** (< 50 files):

```bash
# Direct exploration
tree -L 3
cat README.md
ls -la .github/ .vscode/ docs/
```

**For large projects** (50+ files):
Use parallel read-only subagents:

```bash
# Set up read-only tools
RO_TOOLS="Read,Glob,Grep,Bash(fd:*),Bash(rg:*),Bash(tree:*),Bash(ls:*)"
DENIED_TOOLS="Write,Edit,Bash(git add:*),Bash(rm:*)"

# Launch specialized agents in parallel
claude -p "READ-ONLY: Analyze workflow systems (commands, hooks, automation)" \
  --output-format stream-json --allowedTools "$RO_TOOLS" --disallowedTools "$DENIED_TOOLS" &

claude -p "READ-ONLY: Analyze knowledge management (docs, decisions, discoveries)" \
  --output-format stream-json --allowedTools "$RO_TOOLS" --disallowedTools "$DENIED_TOOLS" &

wait
```

**Document structure:**

- Directory organization
- Key files and their purposes
- Configuration patterns
- Documentation approach

### 2. Pattern Identification (20-30min)

**Ask for each capability found:**

1. **What's the pattern?** (not just "they have X")
2. **What problem does it solve?** (why does this exist?)
3. **What's the mechanism?** (how does it work?)
4. **What are the trade-offs?** (costs vs benefits)

**Create pattern catalog:**

| Pattern          | Problem Solved             | Mechanism                           | Trade-offs                      |
| ---------------- | -------------------------- | ----------------------------------- | ------------------------------- |
| DISCOVERIES.md   | Repeated problem-solving   | Living doc with Date/Issue/Solution | Requires discipline to maintain |
| Agent invocation | Deep specialized expertise | Explicit context for each domain    | Heavier than auto-activation    |

### 3. Philosophy Alignment (15-20min)

**Compare on key dimensions:**

```markdown
| Dimension  | Source Project      | Target Project    | Alignment           |
| ---------- | ------------------- | ----------------- | ------------------- |
| Activation | Explicit invocation | Auto-activation   | ⚠️ Different        |
| Complexity | Feature-rich        | Ruthlessly simple | ⚠️ Filter needed    |
| Structure  | Agents (23)         | Skills (33)       | ⚠️ Extract patterns |
| Testing    | Integration-focused | TDD-focused       | ✅ Compatible       |
```

**Alignment levels:**

- ✅ **Strong**: Core values match, direct adoption possible
- ⚠️ **Moderate**: Different approaches, extract patterns not architectures
- ❌ **Weak**: Fundamental conflicts, learn but don't adopt

### 4. Priority System (20-30min)

**Three-tier classification:**

**Tier 1: Quick Wins** (4-6 hours total)

- High value, low effort
- No architectural changes needed
- Clear immediate benefit
- Example: Documentation patterns, simple templates

**Tier 2: High Value** (8-12 hours total)

- Significant value, moderate effort
- May require some integration work
- Clear benefits outweigh costs
- Example: Workflow enhancements, infrastructure

**Tier 3: Specialized** (15-20 hours total)

- Good value but high effort OR specialized use cases
- Consider based on actual need
- Implement only when needed
- Example: Advanced features, new capabilities

**For each item, document:**

- Estimated effort (hours)
- Expected value/impact
- Dependencies on other work
- Risk level

### 5. Risk Assessment (15-20min)

**Common risks:**

| Risk               | Indicators              | Mitigation                                            |
| ------------------ | ----------------------- | ----------------------------------------------------- |
| Scope creep        | "Let's add everything!" | Tier 1 only, validate before proceeding               |
| Maintenance burden | Many new files/scripts  | Prefer docs over code, simple over complex            |
| Philosophy drift   | Conflicts with values   | Extract patterns, reject architectures                |
| User adoption      | Complex new workflows   | Start with infrastructure that enhances existing work |
| Technical debt     | Quick hacks             | Follow existing quality standards                     |

### 6. Comprehensive Write-up (30-45min)

**Required sections:**

1. **Executive Summary**: Top recommendations, estimated impact
2. **Project Comparison**: Philosophy alignment table
3. **Category Analysis**: Group patterns by type (5-7 categories)
4. **Three-Tier Recommendations**: With effort estimates
5. **Risk Analysis**: Specific to recommendations
6. **Trade-off Tables**: For each major recommendation
7. **Implementation Sequences**: 2-3 different approaches
8. **File Change Summary**: What will be created/modified

**Total time for complete analysis:** 2.5-4 hours

**After write-up:**

Check if project uses ADR pattern:

```bash
test -d docs/decisions && echo "ADR available"
```

**If this is a major integration decision:**

- **If ADR available**: Create ADR documenting the decision to integrate (or not integrate) patterns
- **Otherwise**: Store decision rationale with `mem add "Pattern extraction decision: [what] because [why]" --tags "decision,patterns"`

Major integrations warrant formal decision documentation.

## Pattern vs Architecture Distinction

**Critical:** Distinguish patterns from architectures.

### Architecture (Avoid Copying)

- "They use an agent system with 23 specialized agents"
- "They have a 5-phase DDD workflow with state management"
- "They use MCP for service communication"

**Why not:** Target project has different architectural constraints.

### Pattern (Extract These)

- "Artifact-driven phases where each stage produces inputs for next"
- "Approval gates at key transitions"
- "Living documentation that updates before code"

**Why extract:** Patterns adapt to any architecture.

## Quick Reference

| Step                 | Time         | Output                          |
| -------------------- | ------------ | ------------------------------- |
| 1. Explore           | 30-60min     | Project structure, key files    |
| 2. Identify Patterns | 20-30min     | Pattern catalog with trade-offs |
| 3. Assess Philosophy | 15-20min     | Alignment table                 |
| 4. Prioritize        | 20-30min     | Three-tier recommendations      |
| 5. Assess Risks      | 15-20min     | Risk mitigation table           |
| 6. Write-up          | 30-45min     | Comprehensive document          |
| **Total**            | **2.5-4hrs** | **Complete analysis**           |

## Common Mistakes

### Surface-Level Analysis

**Problem:** Quick scan, shallow recommendations
**Fix:** Spend 30min+ in exploration, use parallel agents for large projects

### Copy-Paste Mentality

**Problem:** "Add their agents system"
**Fix:** Always ask "What's the pattern?" not "What's the feature?"

### No Prioritization

**Problem:** List 20 things without guidance
**Fix:** Force three-tier classification, estimate effort for each

### Missing Philosophy Check

**Problem:** Recommend conflicting approaches
**Fix:** Always create alignment table before recommending

### Ignoring Trade-offs

**Problem:** Present benefits without costs
**Fix:** Every recommendation needs trade-off table

### Boiling the Ocean

**Problem:** Try to implement everything
**Fix:** Recommend Tier 1 only, validate before proceeding

## Red Flags - STOP

- Recommending "add their system" without pattern extraction
- No three-tier priorities
- No philosophy alignment assessment
- No risk analysis
- No effort estimates
- Recommendations without trade-offs
- "Implement everything" approach

**All of these mean: Your analysis is incomplete. Follow the systematic process.**

## Integration

**Pairs with:**

- **using-git-worktrees** - REQUIRED for exploration work
- **brainstorming** - Use for designing integration approach
- **writing-plans** - After approval, create implementation plan

**Project-specific variants:**

- **enhancing-superpowers** - Superpowers-specific integration guidance
- Add your own for other projects

## Real-World Example

From amplifier analysis (2025-10-23):

- ✅ Used parallel read-only agents
- ✅ Distinguished patterns from architectures
- ✅ Three-tier priority system (Tier 1: 4-6hrs)
- ✅ Philosophy alignment section
- ✅ Risk assessment with mitigation
- ✅ Trade-off tables for each recommendation
- ✅ Multiple implementation sequences
- **Result:** User can make informed decisions without feature overwhelm
