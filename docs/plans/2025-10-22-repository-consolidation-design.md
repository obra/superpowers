# Repository Consolidation Design

## Purpose

Consolidate features from five repositories into the superpowers plugin. Evaluate each feature systematically to keep only what fills gaps or improves existing implementations. Maintain architectural consistency while eliminating bloat and ambiguity.

## Source Repositories

1. superpowers-skills
2. CCPlugins
3. claude-codex-settings
4. superclaude
5. SuperClaude_Framework

All located at `/Users/jacob.hurlburt/repos/claude/`

## Design Principles

**Fill critical gaps** - Add capabilities superpowers lacks

**Minimize bloat** - Keep instructions tight, following writing-skills guidelines

**Replace or refine** - Better implementations replace or improve existing features per writing-skills best practices

**Eliminate ambiguity** - One clear skill per use case

**Preserve dependencies** - Trace skill references before modifying to prevent breakage

**Convert to first-class primitives** - Scripts become hooks, agents become skills, tools become commands

**Justify aggressively** - Replacements require concrete reasoning

## Process

### Per-Repository Workflow

Process repositories sequentially in the order listed above. For each repository:

1. **Inventory** - List all features with brief descriptions
2. **Evaluate** - Analyze features one by one using the template below
3. **Decide** - User reviews findings and chooses Keep/Reject/Request More Analysis
4. **Implement** - Convert kept features to first-class primitives, document rejections
5. **Commit** - Git commit after each decision

### Evaluation Template

Each feature receives structured analysis:

**Feature Name**: `[name]`
**Source**: `[repo]/[path]`
**Type**: `[skill/command/hook/agent/script/other]`

**What It Does**:
Core functionality in 2-3 sentences

**Gap Analysis**:
- Superpowers has equivalent? Yes/No
- If Yes: How do they compare?
- If No: What gap does this fill?

**Quality Assessment**:
- Documentation: clear/minimal/missing
- Code: clean/complex/messy
- Instructions: tight/verbose/ambiguous

**Dependencies**:
- Outbound: What this references
- Inbound: What references this
- Impact: What breaks if modified

**Integration Path**:
- Convert to: [skill/command/hook/agent]
- Effort: [low/medium/high]
- Required changes: specific steps

**Recommendation**: KEEP or REJECT
**Justification**: Concrete reasoning

### Between Repositories

Brief retrospective on patterns learned, adjust process if needed

## Conversion Standards

### Script → Hook
Extract core logic into appropriate trigger (SessionStart, PromptSubmit, etc.). Follow existing hook naming conventions.

### Agent/Custom Tool → Skill
Extract instructions into SKILL.md with frontmatter. Use imperative voice. Apply writing-skills guidelines for tight instructions. Place in appropriate category directory.

### Command → Command
Keep if distinct from existing commands. Convert to thin wrapper activating corresponding skill.

### Standalone Script
Convert to skill if reusable pattern. Reject if one-off utility.

### Quality Bar
All integrated features must have clear documentation, tight instructions, and clear value proposition.

## Handling Replacements

### Decision Framework

1. Identify feature X from source repo vs existing superpowers feature Y
2. Compare: What makes X better? (clearer instructions, better workflow, tighter scope)
3. Check dependencies: Grep for references to Y across all skills/commands/hooks
4. Determine approach:
   - **Full replacement**: X has fundamentally better architecture → replace Y entirely, update all references
   - **Refinement**: X has specific improvements → modify Y incorporating X's strengths per writing-skills
   - **Merge**: Both have strengths → combine best elements into improved Y

### Implementation

Replacement commits include dependency updates in same atomic commit. Verify all dependent features still reference correctly after modification.

## Documentation

### Rejected Features Log

File: `docs/rejected-features.md`

Structure:
```markdown
## [Repository Name]

### Feature: [name]
- **Source**: [repo]/[path]
- **Type**: [skill/command/etc]
- **Why Rejected**: Brief explanation
- **Evaluated**: [date]
```

### Git Commits

- Integrations: `Add [feature-name] from [repo]: [one-line purpose]`
- Rejections: `Document rejection of [feature-name] from [repo]`
- Modifications: `Update [existing-feature] with [improvement] from [repo]`

### Progress Tracking

Use TodoWrite to track current repository and feature count. Update after each commit.

### After Consolidation

Create `docs/consolidation-summary.md` with statistics. Update main README.md if new capabilities warrant it.

## Success Criteria

**Complete when**:
- All 5 repositories inventoried and evaluated
- Every feature integrated or documented in rejected-features.md
- All commits clean with clear justifications
- No broken dependencies
- docs/consolidation-summary.md exists

**Quality gates**:
- Each integrated feature has clear documentation
- No ambiguous skill overlap
- Instructions follow writing-skills guidelines
- All existing superpowers workflows function

**Risk mitigation**:
- Git history provides rollback capability
- Feature-by-feature commits allow surgical reverts
- Dependency checking prevents cascading breaks
- rejected-features.md preserves context for revisiting decisions

## Expected Outcomes

Superpowers plugin contains best-in-class features from all repositories. Minimal bloat through gap-filling and superior implementations only. Clear, unambiguous skill library. Comprehensive rejected-features.md for future reference. Clean git history showing deliberate evolution.
