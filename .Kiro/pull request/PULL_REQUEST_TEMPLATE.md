# Add Kiro IDE Support for Superpowers

All skills have been translated and adapted for Kiro IDE. This adds native Kiro power support alongside the existing Claude Code, Codex, and OpenCode integrations.

To use it in Kiro, head over to Kiro Powers and install it by "Add Custom Power" using the `.kiro/` directory.

## Motivation and Context

Kiro is a popular AI-powered IDE that uses a "Powers" system for extending functionality. This change makes Superpowers available to Kiro users by:

1. **Adapting skills to Kiro's steering system** - Converting the original skills to Kiro's steering file format
2. **Creating proper power structure** - Adding POWER.md with YAML frontmatter and clean directory structure
3. **Maintaining skill functionality** - All core Superpowers workflows (brainstorming, TDD, planning, subagent-driven development, etc.) work identically in Kiro
4. **Expanding platform support** - Kiro joins Claude Code, Codex, and OpenCode as supported platforms

This addresses the gap for Kiro users who want to use the systematic development workflows that Superpowers provides.

## How Has This Been Tested?

- ✅ **Power installation tested** - Successfully imports as Kiro power without validation errors
- ✅ **Steering files validated** - All 8 core skills load properly in Kiro's steering system
- ✅ **Workflow integration tested** - Skills activate automatically based on context (brainstorming → planning → TDD → subagent execution)
- ✅ **Cross-platform compatibility** - Original platform integrations remain unchanged and functional

**Test scenarios covered:**
- Power installation via "Add Custom Power" 
- Automatic skill triggering (brainstorming activates when describing features)
- TDD workflow enforcement (RED-GREEN-REFACTOR cycles)
- Subagent-driven development with quality reviews
- Git worktree management for feature isolation

## Breaking Changes

**None.** This is purely additive:
- All existing platform integrations (Claude Code, Codex, OpenCode) remain unchanged
- Original skill files in `skills/` directory are untouched
- No modifications to existing installation or usage patterns

## Types of changes

- [x] New feature (non-breaking change which adds functionality)
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [x] Documentation update

## Checklist

- [x] My code follows the repository's style guidelines
- [x] New and existing tests pass locally (no tests broken, Kiro integration is isolated)
- [x] I have added appropriate error handling (power validation, steering file format compliance)
- [x] I have added or updated documentation as needed (README updated with Kiro installation instructions)

## Additional context

**Implementation approach:**
- **Clean separation**: Kiro integration lives in `.kiro/` directory, doesn't interfere with existing platforms
- **Skill adaptation**: Original skills converted to Kiro steering format with proper YAML frontmatter
- **Power structure**: Follows Kiro's power specification (POWER.md + steering/*.md files only)
- **Automatic activation**: Skills trigger based on context, maintaining the "automatic superpowers" philosophy

**Files added:**
```
.kiro/
├── POWER.md                           # Kiro power definition with YAML frontmatter
├── README.md                          # Kiro-specific installation and usage guide
└── steering/                          # Skills adapted for Kiro steering system
    ├── brainstorming.md
    ├── test-driven-development.md
    ├── writing-plans.md
    ├── subagent-driven-development.md
    ├── systematic-debugging.md
    ├── git-worktrees.md
    ├── code-review.md
    └── getting-started.md
```

**Design decisions:**
1. **Steering vs MCP**: Used Kiro's steering system rather than MCP servers since skills are guidance/workflow rather than tools
2. **Always-active skills**: Most skills use `inclusion: always` to maintain automatic triggering behavior
3. **Manual getting-started**: Getting started guide uses `inclusion: manual` so users can access it via `#getting-started` when needed
4. **Preserved skill content**: Core skill logic and workflows remain identical to original, only format adapted

This maintains Superpowers' core value proposition - systematic, test-driven development workflows - while making it accessible to Kiro's growing user base.