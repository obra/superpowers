# Updating from Super Agents

Guide for pulling updates from the super_agents repository into consuming repos that use GitHub Project workflows.

## Overview

Super_agents is the upstream repository containing generic skills and commands. Your consuming repository has:
- Project-specific configuration in `.claude/project-flows.json`
- Project-specific guidance in `.claude/shared/*.md`
- Skills and commands loaded from super_agents (via plugin/submodule/reference)

## Update Strategies

### Strategy 1: Plugin Marketplace (Recommended)

If you installed via plugin marketplace, updates are automatic:

```bash
# Claude Code
/plugin update superpowers

# Cursor
# Updates automatically, or manually via plugin marketplace UI

# Gemini
gemini extensions update superpowers
```

**When to use:**
- You're using the plugin from the marketplace
- You want automatic skill updates
- You don't need to modify skills locally

**Pros:**
- Simple and automatic
- No merge conflicts
- Always get latest improvements

**Cons:**
- Can't customize skills
- Updates may change behavior unexpectedly

### Strategy 2: Git Submodule

Add super_agents as a submodule:

```bash
# Initial setup
git submodule add https://github.com/superpowers-agent/super-agents .claude/super-agents
git submodule update --init --recursive

# In your CLAUDE.md
Load skills from .claude/super-agents/skills/
```

**Updating:**

```bash
# Pull latest changes
cd .claude/super-agents
git pull origin main

# Commit the submodule update
cd ../..
git add .claude/super-agents
git commit -m "chore: update super-agents to latest"
```

**When to use:**
- You want version control over updates
- You need to pin to specific versions
- You want to review changes before applying

**Pros:**
- Explicit version control
- Can pin to stable versions
- Easy to rollback

**Cons:**
- Manual update process
- Extra git complexity

### Strategy 3: Fork and Merge

Fork super_agents and maintain your own version:

```bash
# Initial setup
git clone https://github.com/YOUR-ORG/super-agents-fork
cd super-agents-fork

# Add upstream remote
git remote add upstream https://github.com/superpowers-agent/super-agents
```

**Updating:**

```bash
# Fetch upstream changes
git fetch upstream

# Merge into your main branch
git checkout main
git merge upstream/main

# Resolve conflicts if any
git push origin main
```

**When to use:**
- You need to customize skills heavily
- You want to maintain a stable version with your changes
- You plan to contribute changes back

**Pros:**
- Full control over changes
- Can customize anything
- Can contribute improvements back

**Cons:**
- Requires resolving merge conflicts
- More maintenance overhead
- Need to track upstream carefully

### Strategy 4: Copy and Diverge

Copy skills into your repo and maintain independently:

```bash
# One-time copy
cp -r ../super-agents/skills/ .claude/skills/
cp -r ../super-agents/commands/ .claude/commands/
```

**When to use:**
- You need heavy customization
- Your workflows diverge significantly
- You don't plan to sync updates

**Pros:**
- Complete independence
- No merge conflicts
- Full customization

**Cons:**
- No upstream updates
- Miss bug fixes and improvements
- Duplicate maintenance

## What to Update

### Always Safe to Update

These change rarely and are backward-compatible:
- Generic skills (bug-triage, bug-fix, testing-gates, etc.)
- Supporting skills (evidence-driven-testing, handler-authority, etc.)
- Setup and loop commands

### Review Before Updating

These may affect your workflows:
- `project-flows.json` schema changes
- Stage marker conventions
- Skill prompt changes that alter behavior

### Never Overwrite

These are project-specific:
- `.claude/project-flows.json` (your configuration)
- `.claude/shared/*.md` (your project guidance)
- Any customizations you've made

## Handling Breaking Changes

### Check Changelog

Before updating, review changes:

```bash
# If using submodule
cd .claude/super-agents
git log --oneline origin/main..HEAD

# If using fork
git fetch upstream
git log --oneline main..upstream/main
```

Look for:
- `BREAKING:` prefixed commits
- Schema changes to `project-flows.json`
- Changes to stage markers or skill names

### Test in a Branch

Test updates before applying to main:

```bash
# Create test branch
git checkout -b test-super-agents-update

# Update super-agents (via your chosen strategy)
# ...

# Test with a sample issue
/loop bug

# If successful, merge to main
git checkout main
git merge test-super-agents-update
```

### Migration Path

If a breaking change occurs, super_agents will provide migration docs:

1. Read `CHANGELOG.md` for migration instructions
2. Check `docs/migrations/` for version-specific guides
3. Update your `project-flows.json` to match new schema
4. Test thoroughly before deploying

## Update Schedule

### Recommended Cadence

- **Plugin users**: Auto-updates are fine, monitor for issues
- **Submodule users**: Monthly updates, or when specific features needed
- **Fork users**: Quarterly syncs, more frequent for critical fixes
- **Copy users**: Ad-hoc when you need specific improvements

### Monitoring for Updates

**Watch the Repository:**
```bash
# On GitHub, click "Watch" → "Releases only"
```

**Subscribe to Changelog:**
- Check [CHANGELOG.md](../CHANGELOG.md) regularly
- Join [Discord](https://discord.gg/Jd8Vphy9jq) for announcements

**CI Integration:**
If using submodule, add a CI check:
```yaml
# .github/workflows/check-super-agents-update.yml
name: Check Super Agents Updates
on:
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
      - name: Check for updates
        run: |
          cd .claude/super-agents
          git fetch origin
          BEHIND=$(git rev-list HEAD..origin/main --count)
          if [ "$BEHIND" -gt 0 ]; then
            echo "::warning::Super agents is $BEHIND commits behind"
          fi
```

## Conflict Resolution

### Config File Conflicts

If `project-flows.json` schema changes:

1. **Read the migration guide** in upstream CHANGELOG
2. **Backup your config**: `cp .claude/project-flows.json .claude/project-flows.json.backup`
3. **Merge changes manually**: Add new fields, preserve your values
4. **Validate**: Run `/setup` validation or test with `/loop`

### Skill Prompt Conflicts

If a skill's SKILL.md changes and you've customized it:

1. **Compare versions**: `git diff upstream/main -- skills/bug-triage/SKILL.md`
2. **Extract improvements**: Identify new techniques or fixes
3. **Merge selectively**: Apply improvements to your version
4. **Test behavior**: Ensure skill still works as expected

### Marker Conflicts

If stage markers change (e.g., `[TRIAGE_READY]` → `[READY]`):

1. **Update project-flows.json** to match new markers
2. **Clean up old markers**: Search GitHub issues for old marker format
3. **Document the change**: Note in your repo's changelog

## Rollback Procedure

If an update causes issues:

**Plugin:**
```bash
# Uninstall and reinstall specific version (if supported)
/plugin uninstall superpowers
/plugin install superpowers@v1.2.3
```

**Submodule:**
```bash
cd .claude/super-agents
git checkout <previous-commit>
cd ../..
git add .claude/super-agents
git commit -m "rollback: revert super-agents to stable version"
```

**Fork:**
```bash
git revert <merge-commit>
git push origin main
```

## Version Pinning

For production stability, pin to specific versions:

**Submodule:**
```bash
# Pin to specific tag
cd .claude/super-agents
git checkout v1.2.3
cd ../..
git add .claude/super-agents
git commit -m "chore: pin super-agents to v1.2.3"
```

**Fork:**
```bash
# Create stable branch
git checkout -b stable-v1
git merge upstream/v1.2.3
```

**Document pinned version:**
```markdown
# In your repo's README.md
## Dependencies

- super_agents: v1.2.3 (pinned for stability)
- Last updated: 2026-03-23
```

## Contributing Improvements Back

If you make improvements while updating:
- See [CONTRIBUTING_LESSONS_LEARNED.md](CONTRIBUTING_LESSONS_LEARNED.md)
- Open PR to super_agents with generic improvements
- Keep project-specific changes in your repo

## Best Practices

1. **Update regularly** - Don't let updates pile up
2. **Test in isolation** - Use test branch for updates
3. **Read changelogs** - Understand what changed
4. **Monitor behavior** - Watch for unexpected changes after update
5. **Document versions** - Track which version you're using
6. **Automate checks** - CI alerts for available updates
7. **Have rollback plan** - Know how to revert if needed

## Troubleshooting

### Update Breaks Workflow

1. Check CHANGELOG for breaking changes
2. Review your project-flows.json for compatibility
3. Test with single issue before running on all
4. Rollback if necessary, fix incrementally

### Merge Conflicts in Submodule

```bash
# Accept upstream version
cd .claude/super-agents
git checkout --theirs <file>

# Or accept local version
git checkout --ours <file>
```

### Plugin Update Not Working

1. Clear plugin cache (platform-specific)
2. Reinstall plugin
3. Check for platform-specific issues on Discord

## Support

- **Issues**: Report problems at https://github.com/superpowers-agent/super-agents/issues
- **Discord**: Get help at https://discord.gg/Jd8Vphy9jq
- **Discussions**: Ask questions in GitHub Discussions

## Related Docs

- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Initial setup
- [CONTRIBUTING_LESSONS_LEARNED.md](CONTRIBUTING_LESSONS_LEARNED.md) - Contributing back
- [CHANGELOG.md](../CHANGELOG.md) - Version history
