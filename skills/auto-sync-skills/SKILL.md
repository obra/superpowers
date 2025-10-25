---
name: auto-sync-skills
description: Use when checking for updates to Claude Code best practices, official Anthropic skills, or community skill repositories - monitors multiple sources and reports available updates for skill improvements
---

# Auto-Sync Skills

## Overview

Stay current with latest Claude Code best practices and official skill updates from Anthropic and community repositories.

**Core principle:** Regularly check authoritative sources for updates to ensure skills follow current best practices.

## When to Use

- **Weekly/Monthly**: Regular check for best practice updates
- **Before major releases**: Ensure compliance with latest standards
- **After Anthropic announcements**: Check for new official guidelines
- **When contributing**: Verify skills follow current patterns

## Quick Reference

| Task | Command | Frequency |
|------|---------|-----------|
| Check Anthropic docs | `./scripts/sync-anthropic-docs.sh` | Weekly |
| Check official repos | `./scripts/sync-official-repos.sh` | Weekly |
| Full sync check | `./scripts/auto-sync.sh` | Monthly |
| Manual review | WebFetch + analysis | As needed |

## Auto-Sync Process

### 1. Check Anthropic Documentation

Monitor Claude Code docs for best practice updates:

```bash
# Manual check
./scripts/sync-anthropic-docs.sh

# Checks:
# - https://docs.claude.com/en/docs/claude-code/skills
# - https://docs.claude.com/en/docs/claude-code/claude_code_docs_map.md
# - Best practices documentation
```

**What it checks:**
- Skill frontmatter format changes
- New allowed-tools
- Description format updates
- Structure recommendations
- New skill system features

### 2. Monitor Official Repositories

Track updates from authoritative sources:

```bash
./scripts/sync-official-repos.sh

# Monitors:
# - anthropics/skills (official Anthropic skills)
# - anthropics/anthropic-sdk-python (SDK updates)
# - obra/superpowers (original superpowers repo)
```

**What it tracks:**
- New skills added
- Skill pattern updates
- Breaking changes
- New best practices
- Community contributions

### 3. Automated Sync (GitHub Action)

Scheduled checks run automatically:

**Schedule:** Weekly on Monday mornings
**Action:** `.github/workflows/sync-practices.yml`

**What happens:**
1. Fetches latest from all monitored sources
2. Compares with current skills
3. Generates report of differences
4. Creates issue if updates needed
5. Optionally creates PR with updates

### 4. Manual Review and Update

When updates are found:

**Review Process:**
1. Read the auto-generated report
2. Assess impact on existing skills
3. Prioritize critical updates
4. Plan rollout of changes
5. Update affected skills
6. Test with subagents
7. Update version and release notes

## Sources Monitored

### Primary Sources

**Anthropic Official Documentation**
- URL: https://docs.claude.com/en/docs/claude-code/
- What: Official best practices and guidelines
- Priority: Critical - always follow

**anthropics/skills Repository**
- URL: https://github.com/anthropics/skills
- What: Official Anthropic skill examples
- Priority: High - reference implementation

### Community Sources

**obra/superpowers**
- URL: https://github.com/obra/superpowers
- What: Original superpowers methodology skills
- Priority: High - methodology patterns

**Community Skill Collections**
- Various repositories with Claude skills
- Priority: Medium - inspiration and patterns

## Scripts

### sync-anthropic-docs.sh

Fetches and analyzes Anthropic documentation:

```bash
#!/usr/bin/env bash
# Check Anthropic docs for updates

DOCS_URLS=(
  "https://docs.claude.com/en/docs/claude-code/skills"
  "https://docs.claude.com/en/docs/claude-code/claude_code_docs_map.md"
)

echo "Checking Anthropic documentation..."
for url in "${DOCS_URLS[@]}"; do
  echo "Fetching: $url"
  # Fetch and compare with cached version
  # Report differences
done
```

### sync-official-repos.sh

Checks official repositories for updates:

```bash
#!/usr/bin/env bash
# Monitor official skill repositories

REPOS=(
  "anthropics/skills"
  "obra/superpowers"
)

for repo in "${REPOS[@]}"; do
  echo "Checking: $repo"
  # Fetch latest commits
  # Compare with last sync
  # Report new skills or changes
done
```

### auto-sync.sh

Full synchronization check:

```bash
#!/usr/bin/env bash
# Complete auto-sync process

./scripts/sync-anthropic-docs.sh
./scripts/sync-official-repos.sh

# Generate comprehensive report
echo "Sync complete. See sync-report.md for details."
```

## GitHub Action

**File:** `.github/workflows/sync-practices.yml`

```yaml
name: Auto-Sync Skills Best Practices

on:
  schedule:
    # Run every Monday at 9 AM UTC
    - cron: '0 9 * * 1'
  workflow_dispatch: # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run auto-sync
        run: ./scripts/auto-sync.sh

      - name: Check for updates
        id: check
        run: |
          if [ -f sync-report.md ]; then
            echo "updates=true" >> $GITHUB_OUTPUT
          fi

      - name: Create issue if updates found
        if: steps.check.outputs.updates == 'true'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('sync-report.md', 'utf8');

            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: 'Best Practices Update Available',
              body: report,
              labels: ['auto-sync', 'best-practices']
            });
```

## Update Categories

### Critical Updates

Apply immediately:
- Breaking changes to skill format
- Security-related best practices
- Deprecated features

### Important Updates

Apply in next release:
- New recommended patterns
- Performance improvements
- Enhanced features

### Optional Updates

Consider for future:
- Style improvements
- Additional examples
- Community suggestions

## Integration Workflow

When updates are detected:

```
1. Auto-sync runs (weekly)
   ↓
2. Report generated
   ↓
3. Issue created (if updates found)
   ↓
4. Manual review
   ↓
5. Create branch: update/sync-YYYY-MM-DD
   ↓
6. Apply updates to affected skills
   ↓
7. Test with testing-skills-with-subagents
   ↓
8. Update RELEASE-NOTES.md
   ↓
9. Bump version
   ↓
10. Submit PR
   ↓
11. Merge and release
```

## Manual Sync Command

To manually check for updates:

```bash
# Full sync
./scripts/auto-sync.sh

# Just docs
./scripts/sync-anthropic-docs.sh

# Just repos
./scripts/sync-official-repos.sh
```

## Notifications

Get notified when updates are available:

1. **GitHub Issues**: Auto-created when updates found
2. **Watch Repository**: Enable notifications for your fork
3. **Email Digest**: Configure GitHub to email weekly summaries

## Best Practices

**Do:**
- Review sync reports thoroughly
- Test updates in isolated branch
- Update multiple related skills together
- Document changes in RELEASE-NOTES.md
- Communicate breaking changes clearly

**Don't:**
- Apply updates blindly without review
- Skip testing after updates
- Update one skill and forget related ones
- Ignore community feedback on updates

## Troubleshooting

### Sync script fails

```bash
# Check network connectivity
curl -I https://docs.claude.com

# Check GitHub API rate limits
curl https://api.github.com/rate_limit

# Run with verbose output
bash -x ./scripts/auto-sync.sh
```

### False positives

Update `.sync-ignore` to exclude known differences:

```
# .sync-ignore
examples/old-pattern.md
deprecated/legacy-skill.md
```

### Updates not detected

```bash
# Clear cache
rm -rf .sync-cache/

# Force refresh
./scripts/auto-sync.sh --force
```

## Future Enhancements

- [ ] RSS feed monitoring for Anthropic blog
- [ ] Slack/Discord notifications
- [ ] Auto-PR creation for non-breaking updates
- [ ] Skill diff visualization
- [ ] Community contribution tracking
- [ ] Update impact analysis

## Related Skills

- **writing-skills** - Apply updates to existing skills
- **testing-skills-with-subagents** - Test updated skills
- **sharing-skills** - Contribute improved patterns back

## Version Compatibility

This skill tracks:
- Claude Code skills system v1.x
- Anthropic best practices as of 2025-10
- Community patterns from major repositories

Update this skill when major changes occur to sync infrastructure.
