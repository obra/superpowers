# Knowledge Management Integration Design

**Date**: 2025-11-03
**Status**: Approved for implementation
**Context**: Integrating ADR and DISCOVERIES patterns from Amplifier analysis (Tier 1)

---

## Goal

Add opt-in knowledge management system (Architecture Decision Records + DISCOVERIES pattern) to superpowers that complements personal `mem` system with project-level, git-tracked documentation.

## Architecture

### Core Components

1. **Slash Command** (`commands/setup-knowledge-management.md`)
   - Embedded templates (source of truth)
   - Pre-flight checks for conflicts
   - Graceful conflict handling
   - Creates structure in any project

2. **Documentation Structure** (`docs/`)
   ```
   docs/
   ├── decisions/
   │   ├── README.md                    # ADR template and guidelines
   │   └── NNN-description.md           # Individual decision records
   └── discoveries/
       └── DISCOVERIES.md                # Known issues and solutions
   ```

3. **Skill Integration** (9 skills updated)
   - Check for structure presence
   - Use when available
   - Fall back to `mem` when absent

### Design Decisions

**Decision: Embedded templates in command**
- Templates live in `commands/setup-knowledge-management.md`
- Plugin distribution only includes `commands/`, not `docs/`
- Single source of truth
- Command creates structure we use (dogfooding)

**Decision: Opt-in per project**
- Structure doesn't exist by default
- Skills check for presence before using
- Graceful fallback to `mem`
- No forcing on team projects

**Decision: Under docs/ directory**
- Clear visibility (documentation)
- Standard location for project docs
- Easy for teams to discover

## Data Flow

```
User runs /setup-knowledge-management
    ↓
Agent reads command (embedded templates)
    ↓
Pre-flight checks
    ↓
    ├─ Clean → Create structure
    │    ↓
    │  Write templates
    │    ↓
    │  Optional: Example ADR
    │    ↓
    │  Commit
    │
    └─ Conflicts → Report & ask
         ↓
       User decides
         ↓
       Execute choice
```

## Components Detail

### 1. Slash Command Structure

**File**: `commands/setup-knowledge-management.md`

**Sections**:
- Overview (what and why)
- Pre-flight checks (detect existing structure)
- Decision logic (handle conflicts)
- Setup steps (create files with embedded content)
- Verification steps (confirm success)

**Pre-flight checks**:
```bash
- Check: docs/decisions/ exists?
- Check: docs/discoveries/ exists?
- Check: docs/decisions/README.md exists?
- Check: docs/discoveries/DISCOVERIES.md exists?
```

**Conflict handling**:
If ANY exist → STOP, report, offer options:
1. Skip setup (keep existing)
2. Create only missing pieces
3. Show templates for manual review

### 2. Template Content

**ADR Template** (`docs/decisions/README.md`):
- When to create ADR vs use `mem`
- Template format (Status, Context, Decision, Rationale, Alternatives, Consequences, Review Triggers)
- Naming conventions (NNN-description.md)
- Examples

**DISCOVERIES Template** (`docs/discoveries/DISCOVERIES.md`):
- What discoveries are
- Template format (Issue, Root Cause, Solution, Prevention)
- When to use file vs `mem`
- Empty discoveries section

**Optional First ADR** (`docs/decisions/001-adopt-knowledge-management.md`):
- Documents decision to adopt this pattern
- Serves as example
- Ask user if they want it

### 3. Skill Integration

**Discovery-focused skills** (4):

1. **systematic-debugging** - Phase 4, after root cause found:
   ```markdown
   If docs/discoveries/DISCOVERIES.md exists:
     - Document Issue, Root Cause, Solution, Prevention
   Otherwise:
     - Use mem add for personal reference
   ```

2. **root-cause-tracing** - After tracing to source:
   ```markdown
   If docs/discoveries/DISCOVERIES.md exists:
     - Document trace path and root cause
   Otherwise:
     - Use mem add with discovery tag
   ```

3. **when-stuck** - Before dispatching:
   ```markdown
   Check docs/discoveries/DISCOVERIES.md for similar problems
   Otherwise: mem search semantic
   ```

4. **predict-issues** - Tracking predictions section:
   ```markdown
   Options include:
   - decisions/ for architectural choices
   - discoveries/ for known issues
   - mem for personal reference
   ```

**Decision-focused skills** (5):

1. **documentation-management** - Add to documentation types:
   ```markdown
   - ADR (decisions/): Architecture decisions (if exists)
   - DISCOVERIES (discoveries/): Known issues (if exists)
   ```

2. **writing-plans** - Survey existing patterns phase:
   ```markdown
   Check docs/decisions/ for relevant ADRs
   ```

3. **brainstorming** - Multiple integration points:
   - Prep: Check decisions/ during recon
   - Phase 1: Reference decisions/ for context
   - Phase 4: Suggest ADR for significant choices

4. **enhancing-superpowers** - Add integration type:
   ```markdown
   Type 6: Decision Documentation
   - If docs/decisions/ exists: Create ADR
   - Otherwise: Use mem
   ```

5. **extracting-patterns-from-projects** - After write-up:
   ```markdown
   If docs/decisions/ exists: Create ADR for major integrations
   Otherwise: Store in mem
   ```

**Integration pattern** (all skills):
```markdown
If [structure] exists:
  [use pattern]
Otherwise:
  [use mem fallback]
```

## Testing Strategy

**Command verification steps**:
1. Verify directories created
2. Verify files created with content
3. Verify git status shows staged files

**Skill testing**:
1. Test with structure present (uses pattern)
2. Test without structure (falls back to mem)
3. Verify no errors in either case

## First-Run Experience

**In superpowers repo**:
1. Run `/setup-knowledge-management` on ourselves
2. Creates our own `docs/` structure
3. Document this decision as ADR 001
4. Commit all changes together
5. Dogfooding our own pattern

**In new projects**:
1. User runs `/setup-knowledge-management`
2. Structure created in ~30 seconds
3. Optional: Document adoption decision
4. Skills automatically detect and use

## Benefits

**For solo projects**:
- Git-tracked knowledge (survives beyond mem)
- Structured decision documentation
- Clear issue history

**For team projects**:
- Shared context for decisions
- Collective learning from problems
- Discoverable by all team members

**For all projects**:
- Opt-in (no forced adoption)
- Graceful fallback to mem
- Natural skill integration

## Trade-offs

**Positive**:
- ✅ Complements mem (doesn't replace)
- ✅ Git-tracked (team visibility)
- ✅ Opt-in (no forcing)
- ✅ Skills work with or without it

**Negative/Risks**:
- ⚠️ Another system to maintain (but opt-in)
- ⚠️ Embedded templates need updating in one place (slash command)
- ⚠️ Users need to remember to document (but skills prompt)

## Implementation Phases

**Phase 1**: Create slash command with embedded templates (1 hour)

**Phase 2**: Update 9 skills with integration points (2-3 hours)

**Phase 3**: Test and verify (30 minutes)

**Phase 4**: Run on superpowers itself, create ADR 001 (30 minutes)

**Phase 5**: Commit everything (10 minutes)

**Total**: 4-5 hours

## Success Criteria

- [ ] Slash command creates clean structure
- [ ] Slash command handles conflicts gracefully
- [ ] All 9 skills reference patterns correctly
- [ ] Skills work with and without structure
- [ ] Superpowers uses its own pattern (dogfooding)
- [ ] Documentation complete and clear
