# Claude Code Permissions for Autonomous Agents

Guide for configuring Claude Code permissions to enable autonomous `/loop` execution.

## Problem

Claude Code's security model requires user approval for many git and GitHub CLI operations. This is appropriate for interactive use, but blocks autonomous `/loop` execution.

**Key insight:** Claude often tries `cd <path> && git <command>` patterns, which are blocked by security rules (and should be). Git commands work from anywhere in the repo, making this unnecessary.

## Solution

Configure granular permissions in `.claude/settings.local.json` and add explicit instructions in `.claude/CLAUDE.md`.

### 1. Configure Permissions

**`.claude/settings.local.json`** (local, not committed):

```json
{
  "permissions": {
    "allow": [
      "Bash(git log:*)",
      "Bash(git diff:*)",
      "Bash(git status:*)",
      "Bash(git branch:*)",
      "Bash(git push origin feat:*)",
      "Bash(git push origin fix:*)",
      "Bash(git push origin agent:*)",
      "Bash(git push origin chore:*)",
      "Bash(gh pr list:*)",
      "Bash(gh pr view:*)",
      "Bash(gh pr create:*)",
      "Bash(gh pr comment:*)",
      "Bash(gh issue list:*)",
      "Bash(gh issue view:*)",
      "Bash(gh issue comment:*)",
      "Bash(gh repo view:*)",
      "Bash(gh project item-list:*)"
    ],
    "deny": [
      "Bash(git push * dev)",
      "Bash(git push * main)",
      "Bash(git push * staging)",
      "Bash(git push --force:*)",
      "Bash(git push *--delete:*)",
      "Bash(git branch -D main)",
      "Bash(git branch -D staging)",
      "Bash(git branch -D dev)",
      "Bash(git checkout main)",
      "Bash(git checkout dev)",
      "Bash(git checkout staging)",
      "Bash(git switch main)",
      "Bash(git switch dev)",
      "Bash(git switch staging)",
      "Bash(gh api:*)",
      "Bash(gh pr merge:*)",
      "Bash(gh pr close:*)",
      "Bash(gh pr edit:*)",
      "Bash(gh repo delete:*)",
      "Bash(gh repo edit:*)",
      "Bash(gh project *edit:*)",
      "Bash(gh project *delete:*)"
    ]
  }
}
```

**Why `.settings.local.json`?**
- Local to your machine (gitignored by default)
- Personal preferences for autonomous operation
- Project-level `.claude/settings.json` can have team-wide policies

### 2. Document Command Patterns

**`.claude/CLAUDE.md`** (can be committed or local):

```markdown
# Claude Code Project Guidelines

## Git Command Patterns - CRITICAL

**NEVER use `cd <path> && git <command>` patterns.** This is blocked by security rules and is unnecessary.

### ✅ CORRECT - Run git commands from anywhere in the repo
```bash
git status
git log
git diff
git push origin feat/my-feature
```

### ❌ WRONG - Do NOT combine cd with git commands
```bash
cd /path/to/repo && git status  # BLOCKED - security risk
```

Git commands work from any subdirectory within the repository. If you need to change directories, use separate `cd` commands.

## Allowed Git/GitHub Operations

### Git Commands (Auto-approved)
- `git log` - View commit history
- `git diff` - View changes
- `git status` - Check repository status
- `git branch` - List/manage branches
- `git push origin feat/*` - Push feature branches
- `git push origin fix/*` - Push bugfix branches
- `git push origin agent/*` - Push agent branches
- `git push origin chore/*` - Push chore branches

### GitHub CLI (Auto-approved)
- `gh pr list`, `gh pr view`, `gh pr create`, `gh pr comment`
- `gh issue list`, `gh issue view`, `gh issue comment`
- `gh repo view`
- `gh project item-list`

## Blocked Operations (Require Manual Intervention)

These operations are **explicitly denied** and will fail if attempted:

### Protected Branches
- ❌ `git push * dev` / `git push * main` / `git push * staging`
- ❌ `git checkout main|dev|staging`
- ❌ `git switch main|dev|staging`
- ❌ `git branch -D main|dev|staging`

### Destructive Operations
- ❌ `git push --force`
- ❌ `git push --delete`

### GitHub CLI Restricted
- ❌ `gh pr merge|close|edit`
- ❌ `gh repo delete|edit`
- ❌ `gh project *edit|*delete`
- ❌ `gh api` (raw API access)

## Loop Agent Behavior

When running autonomous `/loop` commands:

1. **Stick to allowed operations** - Don't attempt blocked commands
2. **Use git from repo root** - Never use `cd && git` patterns
3. **Work on feature branches** - Create feat/*, fix/*, agent/*, or chore/* branches
4. **Report blockers** - If a required operation is blocked, report it and wait for manual intervention
5. **Push to origin cautiously** - Only push feature branches, never main/dev/staging

## Fallback Strategies

If you encounter a permission block:
1. Verify you're not using `cd && command` patterns
2. Check if the operation is in the blocked list
3. Use an alternative approach (e.g., create a feature branch instead of pushing to main)
4. Report the blocker and request manual intervention
```

## Permission Pattern Breakdown

### Allow List Strategy

**Safe read operations:**
- `git log`, `git diff`, `git status`, `git branch`
- No side effects, always safe to auto-approve

**Feature branch pushes:**
- `git push origin feat/*`, `fix/*`, `agent/*`, `chore/*`
- Safe because feature branches are disposable
- Pattern matching prevents pushing to protected branches

**GitHub CLI read/write:**
- Read: `list`, `view` operations
- Write: `create`, `comment` operations
- Restricted: `merge`, `close`, `edit`, `delete`

### Deny List Strategy

**Protected branches:**
- Block all operations on `main`, `dev`, `staging`
- Prevents accidental damage to stable branches

**Destructive operations:**
- `--force`, `--delete`, `-D` flags
- High risk, always require manual approval

**Administrative operations:**
- `gh api` (raw API access)
- `gh repo delete|edit` (repo settings)
- `gh project *edit|*delete` (project structure)

## Testing the Setup

After configuration, test with a simple autonomous operation:

```bash
# Create test issue
gh issue create --title "Test autonomous loop" --body "Testing permissions"

# Run loop on the issue
/loop
```

**Expected behavior:**
- Loop processes issue without permission prompts
- Safe git operations auto-approve
- Blocked operations are reported, not attempted

**If permission prompts still appear:**
1. Check `.claude/settings.local.json` syntax (valid JSON?)
2. Verify permission rule patterns match your commands
3. Check for `cd && command` patterns in output
4. Restart Claude Code to reload settings

## Adapting for Your Project

### Adjust Branch Patterns

If your project uses different branch naming:

```json
{
  "permissions": {
    "allow": [
      "Bash(git push origin feature:*)",
      "Bash(git push origin bugfix:*)",
      "Bash(git push origin hotfix:*)"
    ]
  }
}
```

### Additional Protected Branches

If you have more protected branches:

```json
{
  "permissions": {
    "deny": [
      "Bash(git push * production)",
      "Bash(git checkout production)"
    ]
  }
}
```

### Team-Wide Policies

For shared policies, use `.claude/settings.json` (committed):

```json
{
  "permissions": {
    "deny": [
      "Bash(git push --force:*)",
      "Bash(rm -rf:*)"
    ]
  }
}
```

Team members can override with `.claude/settings.local.json`.

## Security Considerations

**What this enables:**
- Autonomous loop processing
- Safe git operations without prompts
- Feature branch workflow automation

**What this protects:**
- Protected branches (main, dev, staging)
- Destructive operations (force push, delete)
- Repository administration

**Balance:**
- Permissive enough for automation
- Restrictive enough to prevent accidents
- Local configuration, not forced on team

## Troubleshooting

### "Permission denied" on allowed operations

**Cause:** Settings not loaded or syntax error

**Fix:**
1. Check `.claude/settings.local.json` is valid JSON
2. Restart Claude Code
3. Verify permission rule matches exact command

### Loop still prompts for approval

**Cause:** Command pattern doesn't match allow rules

**Fix:**
1. Check Claude Code output for exact command
2. Add more specific pattern to allow list
3. Avoid `cd && command` patterns

### Accidentally blocked safe operations

**Cause:** Deny rule too broad

**Fix:**
1. Make deny rules more specific
2. Use exact patterns, not wildcards
3. Test with small operations first

## Related Documentation

- [BRANCH_STRATEGY.md](BRANCH_STRATEGY.md) - Branch protection and promotion
- [commands/loop.md](../commands/loop.md) - Loop orchestrator usage
- [skills/loop-orchestrator/SKILL.md](../skills/loop-orchestrator/SKILL.md) - Loop implementation
