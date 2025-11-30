---
name: sharing-skills
description: Use when you've developed a broadly useful skill and want to contribute it upstream via pull request - guides process of branching, committing, pushing, and creating PR to contribute skills back to upstream repository
---

# Sharing Skills

## Overview

Contribute skills from your local branch back to the upstream repository.

**Workflow:** Branch → Edit/Create skill → Commit → Push → PR

## When to Share

**Share when:**
- Skill applies broadly (not project-specific)
- Pattern/technique others would benefit from
- Well-tested and documented
- Follows writing-skills guidelines

**Keep personal when:**
- Project-specific or organization-specific
- Experimental or unstable
- Contains sensitive information
- Too narrow/niche for general use

## Prerequisites

- `gh` CLI installed and authenticated
- Working directory is `~/.config/superpowers/skills/` (your local clone)
- **REQUIRED:** Skill has been tested using writing-skills TDD process

## Sharing Workflow

### 1. Ensure You're on Main and Synced

```bash
cd ~/.config/superpowers/skills/
git checkout main
git pull upstream main
git push origin main  # Push to your fork
```

### 2. Create Feature Branch

```bash
# Branch name: add-skillname-skill
skill_name="your-skill-name"
git checkout -b "add-${skill_name}-skill"
```

### 3. Create or Edit Skill

```bash
# Work on your skill in skills/
# Create new skill or edit existing one
# Skill should be in skills/category/skill-name/SKILL.md
```

### 4. Commit Changes

```bash
# Add and commit
git add skills/your-skill-name/
git commit -m "Add ${skill_name} skill

$(cat <<'EOF'
Brief description of what this skill does and why it's useful.

Tested with: [describe testing approach]
EOF
)"
```

### 5. Push to Your Fork

```bash
git push -u origin "add-${skill_name}-skill"
```

### 6. Create Pull Request

```bash
# Create PR to upstream using gh CLI
gh pr create \
  --repo upstream-org/upstream-repo \
  --title "Add ${skill_name} skill" \
  --body "$(cat <<'EOF'
## Summary
Brief description of the skill and what problem it solves.

## Testing
Describe how you tested this skill (pressure scenarios, baseline tests, etc.).

## Context
Any additional context about why this skill is needed and how it should be used.
EOF
)"
```

## Complete Example

Here's a complete example of sharing a skill called "async-patterns":

```bash
# 1. Sync with upstream
cd ~/.config/superpowers/skills/
git checkout main
git pull upstream main
git push origin main

# 2. Create branch
git checkout -b "add-async-patterns-skill"

# 3. Create/edit the skill
# (Work on skills/async-patterns/SKILL.md)

# 4. Commit
git add skills/async-patterns/
git commit -m "Add async-patterns skill

Patterns for handling asynchronous operations in tests and application code.

Tested with: Multiple pressure scenarios testing agent compliance."

# 5. Push
git push -u origin "add-async-patterns-skill"

# 6. Create PR
gh pr create \
  --repo upstream-org/upstream-repo \
  --title "Add async-patterns skill" \
  --body "## Summary
Patterns for handling asynchronous operations correctly in tests and application code.

## Testing
Tested with multiple application scenarios. Agents successfully apply patterns to new code.

## Context
Addresses common async pitfalls like race conditions, improper error handling, and timing issues."
```

## After PR is Merged

Once your PR is merged:

1. Sync your local main branch:
```bash
cd ~/.config/superpowers/skills/
git checkout main
git pull upstream main
git push origin main
```

2. Delete the feature branch:
```bash
git branch -d "add-${skill_name}-skill"
git push origin --delete "add-${skill_name}-skill"
```

## Troubleshooting

**"gh: command not found"**
- Install GitHub CLI: https://cli.github.com/
- Authenticate: `gh auth login`

**"Permission denied (publickey)"**
- Check SSH keys: `gh auth status`
- Set up SSH: https://docs.github.com/en/authentication

**"Skill already exists"**
- You're creating a modified version
- Consider different skill name or coordinate with the skill's maintainer

**PR merge conflicts**
- Rebase on latest upstream: `git fetch upstream && git rebase upstream/main`
- Resolve conflicts
- Force push: `git push -f origin your-branch`

## Multi-Skill Contributions

**Do NOT batch multiple skills in one PR.**

Each skill should:
- Have its own feature branch
- Have its own PR
- Be independently reviewable

**Why?** Individual skills can be reviewed, iterated, and merged independently.

## Related Skills

- **writing-skills** - REQUIRED: How to create well-tested skills before sharing
