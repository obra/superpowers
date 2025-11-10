# Conversion Scripts

This directory contains scripts for converting Superpowers Claude Code plugin skills to Claude Desktop format.

## Purpose

The conversion process:
1. Strips tool-specific references (Skill, Task, TodoWrite tools)
2. Rewrites cross-references (superpowers: format → .md files)
3. Adds Desktop-specific notes
4. Preserves core skill content and workflows

## Scripts

### convert-skill.sh

Converts a single skill file.

**Usage:**
```bash
./convert-skill.sh <input-skill.md> <output-skill.md>
```

**Example:**
```bash
./convert-skill.sh \
  ../../skills/test-driven-development/SKILL.md \
  ../pro-setup/skills/core/test-driven-development.md
```

**What it does:**
- Replaces "Skill tool" → "skill reference"
- Replaces "Task tool" → "manual task breakdown"
- Replaces "TodoWrite" → "explicit checklist tracking"
- Replaces "SessionStart hook" → "custom instructions"
- Rewrites "superpowers:skill-name" → "skill-name.md (in project knowledge)"
- Rewrites "@file.md" → "file.md (in project knowledge)"
- Adds Desktop compatibility note after frontmatter

### convert-all-skills.sh

Converts all skills from the plugin source to Desktop format.

**Usage:**
```bash
./convert-all-skills.sh
```

**What it does:**
- Converts all 20 skills from `../../skills/` directory
- Organizes into categories (core, testing, debugging, collaboration, meta)
- Copies example files (TypeScript, shell scripts)
- Outputs to `../pro-setup/skills/` directory

**Output structure:**
```
pro-setup/skills/
├── core/ (4 skills)
├── testing/ (2 skills + examples)
├── debugging/ (3 skills + scripts)
├── collaboration/ (8 skills)
└── meta/ (3 skills)
```

## Maintenance Workflow

### When Plugin Skills Are Updated

1. **Pull latest plugin changes:**
   ```bash
   cd /home/user/superpowers
   git pull origin main
   ```

2. **Run conversion:**
   ```bash
   cd superpowers-desktop/conversion
   ./convert-all-skills.sh
   ```

3. **Verify conversions:**
   ```bash
   # Check a sample file
   head -n 20 ../pro-setup/skills/core/test-driven-development.md

   # Should see:
   # - Frontmatter with name and description
   # - Desktop compatibility note
   # - No tool-specific references
   ```

4. **Update free-mode if core skills changed:**
   - Manually review changes to core 4 skills
   - Update `../free-mode/core-workflows.md` if needed
   - Update cheat sheets if significant changes

5. **Test both packages:**
   - Pro: Upload sample skills to test project
   - Free: Upload core-workflows.md to conversation
   - Verify workflows still function correctly

6. **Commit and release:**
   ```bash
   git add ../pro-setup ../free-mode
   git commit -m "Update skills from plugin v<version>"
   git push
   ```

## Conversion Rules

### Tool Reference Replacements

| Plugin | Desktop |
|--------|---------|
| `Skill tool` | `skill reference` |
| `Task tool` | `manual task breakdown` |
| `TodoWrite` | `explicit checklist tracking` |
| `SessionStart hook` | `custom instructions` |
| `dispatch subagent` | `break down into sequential tasks` |
| `subagent` | `separate task` |

### Cross-Reference Replacements

| Plugin | Desktop |
|--------|---------|
| `superpowers:skill-name` | `skill-name.md (in project knowledge)` |
| `@file.md` | `file.md (in project knowledge)` |
| `**REQUIRED SUB-SKILL:** Use superpowers:foo` | `**REQUIRED:** Reference foo.md from project knowledge` |

### Content Preserved

- Frontmatter (name, description)
- Core skill content
- Workflows and processes
- Examples and code
- Checklists and verification steps
- Philosophy and rationale

### Content Added

After frontmatter:
```markdown
> **Note for Claude Desktop:** This skill has been adapted from the Claude Code plugin. Some automation features (like automatic activation and TodoWrite tracking) require manual implementation. Track checklists explicitly in your responses.
```

## Testing Conversions

### Automated Checks

```bash
# Check all conversions completed
find ../pro-setup/skills -name "*.md" | wc -l
# Should be 20+

# Check for unconverted references (should return nothing)
grep -r "Skill tool" ../pro-setup/skills/
grep -r "Task tool" ../pro-setup/skills/
grep -r "superpowers:" ../pro-setup/skills/ | grep -v "Note for Claude"

# Check Desktop notes were added
grep -r "Note for Claude Desktop" ../pro-setup/skills/ | wc -l
# Should be 20+
```

### Manual Verification

1. **Read a converted skill** - Ensure it's coherent
2. **Check cross-references** - Links should point to .md files
3. **Verify workflows intact** - Core processes preserved
4. **Test in Claude Desktop** - Upload and use in conversation

## Version Tracking

When updating from plugin:

1. **Note plugin version:**
   ```bash
   cd /home/user/superpowers
   git log -1 --oneline
   # Record commit hash
   ```

2. **Tag Desktop distribution:**
   ```bash
   cd superpowers-desktop
   git tag -a v1.1.0 -m "Sync with plugin v3.4.0 (commit abc123)"
   git push --tags
   ```

3. **Update CHANGELOG:**
   - List which skills were updated
   - Note any significant workflow changes
   - Document any breaking changes

## Troubleshooting

### "Conversion failed for skill X"

**Check:**
- Does source file exist at expected path?
- Is source file valid markdown?
- Are there sed-incompatible characters?

**Fix:**
- Verify source path in convert-all-skills.sh
- Check for special regex characters in content
- Run convert-skill.sh manually to see specific error

### "Free mode out of sync"

**Problem:** Core skills updated in Pro but not reflected in free-mode/

**Solution:**
- Manually review changes to core 4 skills
- Update core-workflows.md with essential changes
- Keep condensed (don't just copy-paste full skills)
- Update cheat sheets if presentation changed

### "Cross-references broken"

**Problem:** Links to non-existent files

**Solution:**
- Check conversion rules in convert-skill.sh
- Verify referenced files are actually in pro-setup/skills/
- Update sed rules if new reference patterns introduced

## Future Improvements

Potential automation enhancements:

1. **Auto-sync free-mode** - Script to generate core-workflows.md from core skills
2. **Validation tests** - Automated checks for broken references
3. **Diff tool** - Compare plugin vs desktop versions to highlight changes
4. **Version checker** - Auto-detect when plugin has updates

## Contact

For questions about the conversion process:
- Open issue in main repository
- Reference this README
- Include skill name and specific conversion issue
