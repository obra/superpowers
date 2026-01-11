# GitHub Adapter

## Detection

```bash
# Check gh CLI installed AND authenticated
gh auth status 2>&1
```

Exit code 0 = GitHub available. Parse output for account info.

## Commands

### discover

```bash
# List open issues assigned to me
gh issue list --assignee @me --state open

# List all open issues
gh issue list --state open --limit 20

# Search by keyword
gh issue list --search "<keyword>"

# Get specific issue
gh issue view <number>
```

### update-status

GitHub uses labels for status tracking:

```bash
# Add in-progress label
gh issue edit <number> --add-label "in-progress"

# Remove open label if exists
gh issue edit <number> --remove-label "open"
```

### create

```bash
gh issue create --title "<title>" --body "<body>"
```

Returns: Issue URL in output (parse for number)

### close

```bash
gh issue close <number>
# With structured reason:
gh issue close <number> --reason "completed"
gh issue close <number> --reason "not planned"
# Or with comment:
gh issue close <number> --comment "<message>"
```

### add-comment

```bash
gh issue comment <number> --body "<comment>"
```

### get-branch-convention

```bash
# Check CONTRIBUTING.md
grep -i "branch" CONTRIBUTING.md .github/CONTRIBUTING.md 2>/dev/null

# Analyze recent branches
git branch -r --sort=-committerdate | head -20 | grep -oE '[a-z]+/[A-Z]+-[0-9]+'
```

Common patterns:
- `feature/<issue-number>-<description>`
- `<issue-number>-<description>`
- `feature/GH-<issue-number>-<description>`

## PR Integration

When creating PRs, include closing reference:
- `Closes #<number>` - same repo
- `Closes org/repo#<number>` - cross-repo
