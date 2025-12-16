# Changelog - writing-plans Skill

## 2025-12-16 - Skill Name Reversion

**Changed:** Reverted skill name from `record-plan` back to `writing-plans`

**Reason:**
- Align with upstream naming for PR 170 submission
- Fork identity already established via plugin.json (`superpowers-fork`)
- Zero backward compatibility concerns (no external users yet)
- Reduces diff noise in PR review
- Easier upstream integration if mechanical enforcement improvements are accepted

**Impact:**
- Slash command unchanged: `/write-plan` (always used same command)
- All mechanical enforcement logic preserved (wrapper scripts, lock files, validation)
- Only naming changed - no functional differences

**Migration:** None needed (no external users)

## 2025-12-12 - file-track Integration

### Changed
- Date format now YYMMDDXX (8 digits) instead of MMDDXX (6 digits)
- Tight coupling with file-track CLI for automatic tracking

### Added
- `scripts/track_with_filetrack.sh` - Integration script for file-track
- `scripts/tests/test_track_integration.sh` - Integration tests
- Automatic file-track invocation after rename in `rename_jot.py`
- Post-write workflow Step 3.5 for file-track tracking

### Migration
- No migration needed for existing files
- New files will use YYMMDDXX format going forward

## 2025-12-11 - Executable Wrapper

### Added
- Executable wrapper script (scripts/write_plan.py) that forces file writing
- Shared script infrastructure in ~/.claude/scripts/record-tools/
- "Red Flags" section to SKILL.md to prevent common rationalizations

### Changed
- Skill now uses executable wrapper instead of documentation-only approach
- Script paths updated to use shared record-tools location
- Wrapper output strengthened with critical warnings

### Fixed
- Bug where Claude would describe plans instead of writing them

### Removed
- Duplicate validate-frontmatter.py and rename_jot.py (now shared)

## Migration Notes

**For users of old version:**
- Old behavior: Skill was documentation Claude sometimes followed
- New behavior: Skill invokes wrapper that FORCES correct workflow
- No breaking changes to file formats or workflows
