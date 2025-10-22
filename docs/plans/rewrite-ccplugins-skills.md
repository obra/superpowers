# Rewrite CCPlugins Skills Implementation Plan

**Date**: 2025-10-22
**Branch**: New branch from consolidate-repositories
**Context**: See docs/skills-quality-review.md for detailed analysis
**Standards**: skills/writing-skills/SKILL.md + anthropic-best-practices.md

## Overview

Rewrite 3 CCPlugins-derived skills to meet superpowers quality standards using RED-GREEN-REFACTOR methodology from writing-skills.

**Critical Context**: These skills were originally **commands** (workflow automation with first-person voice) that were converted to skills without proper restructuring. They need fundamental rewrites, not just edits.

## Prerequisites

**REQUIRED READING** before starting:
1. `skills/writing-skills/SKILL.md` - Complete methodology
2. `skills/writing-skills/anthropic-best-practices.md` - Anthropic's official guidance
3. `docs/skills-quality-review.md` - Detailed problem analysis

**Key Principle**: Follow RED-GREEN-REFACTOR cycle - test baseline WITHOUT skill, write minimal skill, test WITH skill, refactor to close loopholes. See writing-skills for complete process.

## Skills to Rewrite

1. `skills/documentation-management/SKILL.md` - ~700 words → <500 target
2. `skills/predict-issues/SKILL.md` - ~350 words (good length, wrong structure)
3. `skills/code-and-project-cleanup/SKILL.md` - ~800 words → <500 target

## Common Issues Across All Three

### 1. Frontmatter Violations

**Problem**: Using unsupported fields (`when_to_use`, `version`)

**Fix Pattern**:
```yaml
# ❌ WRONG (current)
name: Documentation Management
description: Holistic documentation management - updates README, CHANGELOG...
when_to_use: after implementing features, fixing bugs...
version: 1.0.0

# ✅ CORRECT (target)
name: documentation-management
description: Use when documentation is outdated after code changes - systematically updates README, CHANGELOG, API docs, and guides based on actual implementation changes
```

**Rules**:
- Only `name` and `description` fields supported
- `name`: lowercase-with-hyphens
- `description`: Third-person, starts with "Use when...", includes BOTH trigger conditions AND what it does
- Remove `when_to_use` and `version` entirely

### 2. Voice Violations (CRITICAL)

**Problem**: First-person narrative instead of imperative instructions

**Wrong (first-person)**:
- "I'll analyze your codebase..."
- "I need to consider..."
- "I'll help clean up..."
- "Based on this analysis framework, I'll use..."

**Correct (imperative)**:
- "Analyze codebase..."
- "Consider..."
- "Clean up..."
- "Use Grep tool to search..."

**Pattern**: Remove ALL instances of "I", "I'll", "I need", "you", "your". Convert to commands/instructions.

### 3. Structure Violations

**Problem**: `<think>` blocks and non-standard sections

**`<think>` blocks are internal monologue** - inappropriate for skills. Convert valuable content to proper sections:
- `<think>` → "Analysis Framework" or "Strategic Approach" section
- Keep only actionable points
- Convert questions to imperatives

**Missing standard sections**:
- Every skill needs: Overview, When to Use (or inline flowchart)
- Technique skills need: Implementation, Common Mistakes

### 4. Verbosity

**Target word counts**:
- documentation-management: <500 (currently 700)
- predict-issues: <500 (currently 350 - acceptable)
- code-and-project-cleanup: <500 (currently 800)

**Cutting strategies**:
- Remove marketing copy ("Smart Features", "Quality Checks")
- Remove redundant sections (multiple explanations of same concept)
- Consolidate similar techniques into one clear process
- Cut examples to one excellent example (not multiple mediocre ones)
- Remove "Team Collaboration" type sections (too specific)

## Skill-Specific Instructions

### Skill 1: documentation-management

**File**: `skills/documentation-management/SKILL.md`
**Current Issues**: Frontmatter, some voice problems, heavy verbosity (700 words), marketing sections
**Target**: <500 words, imperative voice, clear structure

**Specific Fixes**:

1. **Frontmatter** - Follow common pattern above
2. **Voice** - Change "Intelligently manage..." to "Update project documentation..."
3. **Structure Changes**:
   - Keep: Techniques 1-4 (but consolidate)
   - Remove: "Team Collaboration" (150 words of fluff)
   - Remove: "Smart Features" (marketing copy)
   - Condense: "Quality Checks" into "Completion Protocol"
4. **Consolidate 4 Techniques** into clearer process:
   - When: After code changes (overview mode), during session (sync mode)
   - How: Read all docs, compare to code, update systematically
   - What: README, CHANGELOG, API docs, guides
5. **Cut from 700 → <500 words** (30% reduction target)

**Key Content to Preserve**:
- The 4 core techniques (but make more concise)
- ALWAYS/NEVER rules (concise version)
- CHANGELOG version bump logic (good pattern)

**RED-GREEN-REFACTOR Testing**:
- Baseline: Give agent code changes, see if they update docs comprehensively
- With skill: Verify they update ALL relevant docs, not just README
- Refactor: Add counters for common rationalizations ("just README is enough")

### Skill 2: predict-issues

**File**: `skills/predict-issues/SKILL.md`
**Current Issues**: Frontmatter, SEVERE voice violations (entirely first-person), `<think>` block, wrong structure
**Target**: <500 words, imperative voice, proper structure

**Specific Fixes**:

1. **Frontmatter** - Follow common pattern above
2. **COMPLETE VOICE OVERHAUL** - Every sentence in first-person must be rewritten:
   - Remove: "I'll analyze", "I'll examine", "I'll ask", "I will NEVER"
   - Change to imperatives: "Analyze", "Examine", "Ask user", "Never"
3. **Remove `<think>` block** (68 lines):
   - Convert to "Risk Assessment Framework" section
   - Keep only the 4 key frameworks (Pattern Recognition, Risk Assessment, Problem Categories, Prediction Strategy)
   - Make imperative: "Consider these patterns..." not "I need to consider..."
4. **Add Missing Sections**:
   - Overview: What is predictive analysis? Core principle in 1-2 sentences
   - When to Use: After implementation, before deployment, during reviews
5. **Structure Risk Framework** as table:
   ```markdown
   | Dimension | Assessment |
   |-----------|-----------|
   | Likelihood | How probable is this issue? |
   | Impact | How severe would consequences be? |
   | Timeline | When might this become a problem? |
   | Effort | How hard to fix now vs later? |
   ```
6. **Cut from 350 → ~300 words** (minimal cutting needed, mostly restructuring)

**Key Content to Preserve**:
- Risk assessment framework (Likelihood × Impact × Timeline × Effort)
- Problem categories (Performance, Maintainability, Security, Scalability)
- The strategic thinking approach (convert from `<think>` to proper instructions)

**RED-GREEN-REFACTOR Testing**:
- Baseline: Give agent codebase, see if they spot common problems proactively
- With skill: Verify they use risk assessment framework systematically
- Refactor: Add counters for skipping likelihood/impact assessment

### Skill 3: code-and-project-cleanup

**File**: `skills/code-and-project-cleanup/SKILL.md`
**Current Issues**: Frontmatter, voice violations, `<think>` block (68 lines), severe verbosity (800 words)
**Target**: <500 words, imperative voice, concise structure

**Specific Fixes**:

1. **Frontmatter** - Follow common pattern above
2. **Voice Changes**:
   - Remove: "I'll help clean up...", "I'll create...", "I'll verify..."
   - Change to: "Clean up...", "Create...", "Verify..."
3. **Remove `<think>` block** (68 lines):
   - Convert to "Safety Analysis" section (15 lines max)
   - Keep only: What to check before cleanup, common pitfalls
4. **Consolidate Sections**:
   - Merge: "Core Principles" + "Safety First" + "Value Preservation" → "Overview" (50 words)
   - Keep: "Code Cleanup Technique" + "Project Cleanup Technique" (condense)
   - Condense: "Red Flags and Common Pitfalls" from 40 lines → 15 lines
   - Remove: "Expected Outcome" (obvious)
5. **Cut from 800 → <500 words** (40% reduction required)

**Cutting Strategy**:
- `<think>` block: 68 lines → 15 lines key points
- Red Flags section: 40 lines → 15 lines most critical
- Remove redundant safety warnings (repeated 3+ times)
- One good comment example instead of multiple
- Consolidate Protected Directories with Safe Deletion Process

**Key Content to Preserve**:
- Comment assessment (WHY vs WHAT distinction)
- Git checkpoint safety pattern
- Protected directories list
- Safe deletion process (condensed)

**RED-GREEN-REFACTOR Testing**:
- Baseline: Give agent messy code, see if they remove valuable comments
- With skill: Verify they preserve WHY comments, remove WHAT comments
- Refactor: Add explicit counters for common mistakes (removing TODOs, FIXMEs)

## Implementation Process

### Phase 1: Setup and Planning

**Task 1**: Create new branch from consolidate-repositories
```bash
git checkout consolidate-repositories
git checkout -b rewrite-ccplugins-skills
```

**Task 2**: Read all prerequisite materials
- skills/writing-skills/SKILL.md (complete read)
- skills/writing-skills/anthropic-best-practices.md
- docs/skills-quality-review.md

**Task 3**: Choose skill order
Recommended: Start with predict-issues (smallest, clearest fixes) → documentation-management → code-and-project-cleanup (most complex)

### Phase 2: RED-GREEN-REFACTOR for Each Skill

**Follow writing-skills methodology exactly:**

#### RED: Baseline Testing (BEFORE rewrite)

1. **Create test scenario** without the skill loaded
2. **Run with subagent** to see natural behavior
3. **Document rationalizations** agents use (verbatim)
4. **Identify gaps** - what did they miss?

Example for predict-issues:
```
Scenario: "Analyze this codebase for potential future problems"
Without skill: Agent provides surface-level observations
Document: What frameworks did they NOT use? Did they assess risk systematically?
```

#### GREEN: Minimal Skill (AFTER rewrite)

1. **Rewrite skill** following patterns in this plan
2. **Run same scenario** with skill present
3. **Verify compliance** - agent should now follow framework
4. **Document success** - what improved?

#### REFACTOR: Close Loopholes

1. **Find new rationalizations** - how do agents skip parts?
2. **Add explicit counters** to skill
3. **Re-test** until bulletproof
4. **Iterate** as needed

### Phase 3: Quality Verification

**After each skill rewrite**:

1. **Word count check**:
   ```bash
   wc -w skills/[skill-name]/SKILL.md
   # Target: <500 words
   ```

2. **Frontmatter validation**:
   - Only `name` and `description` fields
   - `name` is lowercase-with-hyphens
   - `description` starts with "Use when..." in third person

3. **Voice check**:
   ```bash
   grep -E "I'll|I will|I need|you should|your" skills/[skill-name]/SKILL.md
   # Should return ZERO results
   ```

4. **Structure validation**:
   - Has Overview section
   - Has When to Use section (or flowchart)
   - No `<think>` blocks
   - No unsupported sections

5. **Test with subagent**: Verify skill works as intended

### Phase 4: Completion

**Task 1**: Update consolidation summary
- Update docs/consolidation-summary.md with rewrite completion
- Note that skills now meet standards

**Task 2**: Create commit
```bash
git add skills/documentation-management/SKILL.md \
        skills/predict-issues/SKILL.md \
        skills/code-and-project-cleanup/SKILL.md

git commit -m "refactor: rewrite CCPlugins skills to meet writing-skills standards

All 3 skills rewritten following RED-GREEN-REFACTOR methodology:
- Fix frontmatter: remove unsupported fields, proper description format
- Fix voice: imperative instructions instead of first-person narrative
- Fix structure: remove <think> blocks, add proper sections
- Reduce verbosity: documentation-management 700→<500, cleanup 800→<500
- Add testing: baseline and compliance testing for each

Skills now meet writing-skills and anthropic-best-practices standards."
```

**Task 3**: Verify no regressions
```bash
# Check all skills still have proper frontmatter
grep -r "^name:" skills/*/SKILL.md | wc -l  # Should match skill count
grep -r "^description:" skills/*/SKILL.md | wc -l  # Should match skill count

# Verify no first-person in new skills
grep -E "I'll|I will|I need" skills/documentation-management/SKILL.md skills/predict-issues/SKILL.md skills/code-and-project-cleanup/SKILL.md
# Should return ZERO results
```

**Task 4**: Merge back to consolidate-repositories
```bash
git checkout consolidate-repositories
git merge rewrite-ccplugins-skills
```

## Acceptance Criteria

Each skill must pass ALL checks:

- [ ] Frontmatter has only `name` and `description` fields
- [ ] Description starts with "Use when..." in third person
- [ ] Name is lowercase-with-hyphens
- [ ] Zero first-person pronouns (I, I'll, I need, you, your)
- [ ] Word count <500 words
- [ ] Has Overview section
- [ ] Has "When to Use" section or flowchart
- [ ] No `<think>` blocks
- [ ] Imperative voice throughout
- [ ] RED-GREEN-REFACTOR testing completed
- [ ] Subagent successfully uses skill

## Time Estimate

- **Per skill**: 30-45 minutes (including testing)
- **Total**: 2-3 hours for all three
- **Plus**: 30 minutes for testing and verification

## Success Metrics

**Before**: 3 skills violate writing-skills standards (100% failure rate)
**After**: 3 skills meet writing-skills standards (100% compliance)

**Quantitative**:
- documentation-management: 700 → <500 words (30% reduction)
- predict-issues: 350 → ~300 words (restructuring, minimal cut)
- code-and-project-cleanup: 800 → <500 words (40% reduction)
- First-person pronouns: Many → 0
- Frontmatter violations: 3 → 0

**Qualitative**:
- Skills can be loaded into every conversation without burning context
- Agents understand and follow instructions without confusion
- Skills teach technique, don't narrate workflow

## Reference Examples

**Good skills to reference** (already meet standards):
- skills/test-driven-development/SKILL.md - Clear structure, imperative voice
- skills/condition-based-waiting/SKILL.md - Concise, excellent examples
- skills/systematic-debugging/SKILL.md - Proper frontmatter, clear process

**Compare**:
- Read one of these skills
- Notice: imperative voice, concise structure, clear sections
- Apply same patterns to CCPlugins rewrites

## Common Pitfalls to Avoid

1. **Don't just edit** - These need fundamental rewrites, not surface fixes
2. **Don't skip testing** - RED-GREEN-REFACTOR is mandatory per writing-skills
3. **Don't preserve first-person** - "We" is also wrong, use imperatives
4. **Don't keep `<think>` blocks** - Convert to proper sections
5. **Don't exceed word counts** - Be ruthless cutting fluff
6. **Don't add unsupported frontmatter** - Only name and description

## Notes

- This is a rewrite, not an edit. Start fresh with the good content.
- Follow writing-skills methodology exactly - it exists to prevent problems
- When in doubt, check a good existing skill for the pattern
- Test each skill thoroughly before moving to the next

---

**Ready to start**: Read prerequisites, create branch, begin with predict-issues (simplest).
