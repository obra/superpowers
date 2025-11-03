---
name: Enhancing Superpowers
description: Use when adding external concepts to this superpowers/claude-settings project - requires checking existing 33 skills first, using worktrees for exploration, following SKILL.md conventions, and ensuring philosophy alignment before integration
---

# Enhancing Superpowers

## Overview

Project-specific guide for integrating external concepts into the superpowers/claude-settings skills library.

**Core principle:** Enhance existing skills before creating new ones. Extract patterns, not architectures.

**Announce at start:** "I'm using the enhancing-superpowers skill to integrate this concept properly."

## When to Use

Use when:

- Analyzing external projects for superpowers enhancements
- User says "add pattern X from project Y"
- Considering new capabilities for skills library
- Evaluating whether concept fits superpowers philosophy

Skip when:

- Making simple typo fixes
- Updating documentation only
- Changes don't involve external concepts

## Critical First Steps

### Step 1: Check Existing Skills (MANDATORY)

**Before proposing anything new, check if already covered:**

```bash
# List all 33+ existing skills
ls skills/

# Search for related concepts
grep -r "keyword" skills/*/SKILL.md

# Check specific skills that might already cover it:
# - test-driven-development (TDD workflows)
# - systematic-debugging (debugging approaches)
# - brainstorming (design processes)
# - writing-plans / executing-plans (planning workflows)
# - using-git-worktrees (isolated workspaces)
# - documentation-management (docs approaches)
# And 27+ others...
```

**Common mistake:** Creating new skill when existing skill just needs enhancement.

### Step 2: Decision Tree

```
Found in existing skill?
├─ YES → Enhance existing skill (update SKILL.md)
│   └─ Test with subagents per writing-skills
└─ NO → New concept?
    ├─ Fits skills philosophy? (auto-activate, TDD, systematic)
    │   ├─ YES → Create new skill
    │   │   └─ Follow writing-skills skill (TDD approach)
    │   └─ NO → Consider different approach
    │       ├─ Infrastructure? → Add to .claude/tools/
    │       ├─ Documentation? → Add to docs/
    │       ├─ Convention? → Update CLAUDE.md
    │       └─ Philosophy? → Create philosophy doc
    └─ Already have 33+ skills?
        └─ High bar for new skills (avoid proliferation)
```

### Step 3: Use Worktrees (REQUIRED)

**ALWAYS use worktrees for exploration:**

```bash
# Follow using-git-worktrees skill
# 1. Check for .worktrees/ directory
ls -la .worktrees/

# 2. Verify .gitignore
grep "^\.worktrees/$" .gitignore

# 3. Create worktree
git worktree add .worktrees/amplifier-integration -b feature/amplifier-integration

# 4. Work in isolation
cd .worktrees/amplifier-integration
```

**Why:** Prevents polluting main branch during exploration.

**REQUIRED SUB-SKILL:** Use superpowers:using-git-worktrees for complete workflow.

## Superpowers Project Structure

**Know where things go:**

```
claude-settings/
├── skills/                    # 33+ skills, auto-activate
│   ├── skill-name/
│   │   └── SKILL.md          # Main skill file
│   └── ...
├── .claude/
│   ├── commands/             # Slash commands
│   ├── tools/                # Hooks and utilities
│   └── settings.json         # Project config
├── docs/                      # Documentation
├── CLAUDE.md                  # Project conventions
├── CHANGELOG.md               # Change history
└── README.md                  # User-facing docs
```

**File naming conventions:**

- Skills: lowercase-with-hyphens
- Commands: lowercase-with-hyphens.md
- Tools: snake_case.py or kebab-case.sh
- Docs: UPPERCASE.md or lowercase.md

## Integration Approaches by Type

### Type 1: Knowledge Management Pattern

**Example:** DISCOVERIES.md, decision tracking

**Approach:**

1. Create template/documentation
2. Integrate with existing skills (reference from systematic-debugging, when-stuck)
3. Add to SessionStart reminder if needed

**Avoid:** Creating new skill just for using a template

### Type 2: Workflow Pattern

**Example:** Artifact-driven phases, approval gates

**Approach:**

1. Check existing workflow skills (writing-plans, executing-plans)
2. Enhance those skills with new patterns
3. Test integration with existing workflows

**Avoid:** Creating parallel workflow system

### Type 3: Infrastructure

**Example:** Hooks, transcript system, status line

**Approach:**

1. Add to .claude/tools/
2. Update .claude/settings.json if hooks
3. Create slash command if user-facing
4. Document in README.md

**Avoid:** Putting infrastructure in skills/

### Type 4: New Skill (High Bar)

**Example:** New capability not covered by 33 existing skills

**Approach:**

1. **REQUIRED:** Follow superpowers:writing-skills (TDD for skills)
2. Run baseline tests WITHOUT skill
3. Write minimal skill addressing baseline failures
4. Test WITH skill until bulletproof
5. Deploy with confidence

**Criteria for new skill:**

- Not covered by existing 33+ skills
- Broadly applicable (not project-specific)
- Auto-activatable (clear triggering conditions)
- Follows TDD/systematic philosophy
- Worth maintaining long-term

### Type 5: Philosophy/Principles

**Example:** Implementation philosophy, modular design principles

**Approach:**

1. Create docs/ file
2. Reference from relevant skills
3. Add to SessionStart context if foundational

**Avoid:** Creating skill for every principle

### Type 6: Decision Documentation

**Example:** Deciding to add/reject external patterns

**Approach:**

1. Check if project uses ADR pattern:
   ```bash
   test -d docs/decisions && echo "ADR available"
   ```
2. **If exists**: Create ADR documenting integration decision with context, rationale, alternatives
3. **Otherwise**: Use `mem add "Integration decision: [what] because [why]. Alternatives: [rejected options]" --tags "decision,integration"`
4. Reference in related skills or documentation

**Avoid:** Making major decisions without documenting rationale

## Philosophy Alignment Checklist

**Superpowers values:**

- ✅ Test-Driven Development (write tests first, always)
- ✅ Systematic over ad-hoc (process over guessing)
- ✅ Complexity reduction (simplicity as primary goal)
- ✅ Evidence over claims (verify before declaring success)
- ✅ Auto-activation (skills activate automatically when relevant)
- ✅ Integrated workflows (skills work together seamlessly)

**Before integrating, ask:**

- [ ] Does this align with TDD philosophy?
- [ ] Does this make things simpler or more complex?
- [ ] Can this auto-activate or requires explicit invocation?
- [ ] Does this integrate with existing skills or create parallel system?
- [ ] Will users adopt this or is it too heavyweight?
- [ ] Does this solve a real problem we've experienced?

**Red flags:**

- ❌ Requires explicit invocation (conflicts with auto-activation)
- ❌ Adds significant complexity
- ❌ Creates parallel system to existing skills
- ❌ Heavyweight workflow for simple tasks
- ❌ Speculative feature (no proven need)

## SKILL.md Format Requirements

**When creating/editing skills, follow exact format:**

```markdown
---
name: Skill-Name-With-Hyphens
description: Use when [triggering conditions] - [what it does, third person, under 500 chars]
---

# Skill Name

## Overview

Core principle in 1-2 sentences.

## When to Use

Bullet list with symptoms and use cases
When NOT to use

## Core Pattern

Before/after comparison

## Quick Reference

Table for common operations

## Common Mistakes

What goes wrong + fixes

## Integration

Which skills this pairs with
```

**Frontmatter rules:**

- Only `name` and `description` fields (max 1024 chars total)
- name: letters, numbers, hyphens only (no parens, special chars)
- description: Start with "Use when...", third person, specific triggers

**CSO (Claude Search Optimization):**

- Use concrete triggers not abstractions
- Include error messages, symptoms, tool names
- Technology-agnostic unless skill is tech-specific

**REQUIRED SUB-SKILL:** Use superpowers:writing-skills for complete format guide.

## Testing Requirements

**For new/modified skills:**

1. **RED Phase:** Run baseline WITHOUT skill
2. **GREEN Phase:** Add skill, verify compliance
3. **REFACTOR Phase:** Close loopholes

**REQUIRED SUB-SKILL:** Use superpowers:testing-skills-with-subagents.

**Test every skill:** Untested skills have issues.

## Quick Reference

| Task               | Approach            | Skills to Use                                 |
| ------------------ | ------------------- | --------------------------------------------- |
| Check existing     | `ls skills/` + grep | N/A                                           |
| Enhance skill      | Update SKILL.md     | writing-skills, testing-skills-with-subagents |
| New skill          | Full TDD cycle      | writing-skills, testing-skills-with-subagents |
| Add infrastructure | .claude/tools/      | N/A                                           |
| Add docs           | docs/               | N/A                                           |
| Exploration        | Worktree required   | using-git-worktrees                           |

## Common Mistakes

### Skipping Existing Skills Check

**Problem:** Create new skill when could enhance existing
**Fix:** Always check all 33+ skills first with grep

### Wrong Directory

**Problem:** Put infrastructure in skills/, docs in .claude/
**Fix:** Use structure table above

### No Worktree

**Problem:** Work directly in main branch
**Fix:** ALWAYS use worktrees for exploration

### Format Violations

**Problem:** Wrong SKILL.md format, breaks auto-activation
**Fix:** Follow exact format from writing-skills

### Skipping Tests

**Problem:** Deploy untested skill, breaks in production
**Fix:** Full RED-GREEN-REFACTOR cycle, no exceptions

### Philosophy Drift

**Problem:** Add explicit-invocation features to auto-activation project
**Fix:** Check philosophy alignment before integrating

### Skill Proliferation

**Problem:** Create many niche skills, hard to discover
**Fix:** High bar for new skills, enhance existing when possible

## Red Flags - STOP

- Creating new skill without checking existing 33+
- Working in main branch instead of worktree
- Infrastructure in skills/ or skills in .claude/tools/
- No testing plan
- "Port their system" without adaptation
- Explicit invocation in auto-activation project
- Adding complexity without clear benefit

**All of these mean: Step back, follow the systematic process.**

## Integration Workflow

### Full Workflow (New Feature from External Project)

1. **Analysis** (in worktree)
   - Use extracting-patterns-from-projects skill
   - Create comprehensive write-up
   - Get user approval on approach

2. **Check Existing** (mandatory)
   - List all skills
   - Grep for related concepts
   - Decide: enhance existing or create new

3. **Implementation** (in worktree)
   - If enhancing: Update SKILL.md + test
   - If new skill: Full writing-skills TDD cycle
   - If infrastructure: Add to .claude/tools/
   - If docs: Add to docs/

4. **Testing** (in worktree)
   - Run tests per testing-skills-with-subagents
   - Verify integration with existing skills
   - Check philosophy alignment

5. **Deployment** (from worktree)
   - Commit in worktree
   - Test in worktree
   - Merge to main when ready
   - Use finishing-a-development-branch

## Real-World Example

From amplifier integration (2025-10-23):

1. ✅ Used extracting-patterns-from-projects for analysis
2. ✅ Created worktree (.worktrees/amplifier-integration)
3. ✅ Comprehensive write-up (docs/amplifier-analysis.md)
4. ✅ Identified 18+ patterns with three-tier priorities
5. ❌ Initially created worktree in wrong location (caught by user)
6. ✅ Fixed by following using-git-worktrees skill
7. → Now writing these two skills to prevent future issues

**Lessons:**

- Follow existing skills even when you think you know
- User caught mistake because skill wasn't there yet
- These skills will prevent this in 7th, 8th, 9th attempts

## Integration

**Required skills:**

- **extracting-patterns-from-projects** - For analysis phase
- **using-git-worktrees** - For isolation
- **writing-skills** - For creating/modifying skills
- **testing-skills-with-subagents** - For validation

**Pairs with:**

- **brainstorming** - For design decisions
- **writing-plans** - After approval
- **finishing-a-development-branch** - For cleanup
