# Integration Guide: Adding GitHub Project Workflows to Your Repo

This guide walks you through adding the GitHub Project integration to an existing repository that uses Superpowers.

## Prerequisites

1. **Superpowers installed** - Your repo should already have the Superpowers plugin installed
2. **GitHub CLI authenticated** - Run `gh auth login` if needed
3. **Git repository** - Must be a valid git repository
4. **Repository location** - Repo must be on GitHub (org or user account)

## Quick Start

From your repository root:

```bash
/setup
```

The setup command will guide you through:
1. Detecting your repository and branch structure
2. Choosing which workflows to enable (bug fixes, features, or both)
3. Creating GitHub Projects
4. Configuring Status fields and Board views
5. Setting up test commands and validation
6. Generating configuration files

## What Gets Created

After running `/setup`, you'll have:

```
your-repo/
  .claude/
    project-flows.json              # Main workflow configuration
    shared/
      triage-project.md            # Bug triage guidance
      fix-project.md               # Bug fix guidance
      test-project.md              # Testing configuration
      commit-project.md            # Git workflow guidance
```

## Configuration Files

### `project-flows.json`

Core configuration linking GitHub Projects to skills:

```json
{
  "version": 1,
  "repo": "owner/repo-name",
  "github_owner": "owner",
  "default_base_branch": "main",
  "branch_naming": "<type>/<issue#>-<short-description>",
  "flows": {
    "bug": {
      "project_number": 1,
      "project_url": "https://github.com/orgs/owner/projects/1",
      "stages": [...]
    },
    "feature": {
      "project_number": 2,
      "project_url": "https://github.com/orgs/owner/projects/2",
      "stages": [...]
    }
  },
  "project_specific": {
    "languages": ["python", "typescript"],
    "test_commands": {
      "linting": "eslint .",
      "type_checking": "tsc --noEmit",
      "unit_tests": "npm test"
    },
    "uat_enabled": true,
    "build_sync": {
      "enabled": true,
      "command": "npm run build"
    }
  }
}
```

### Project-Specific Guidance Files

These stub files guide the agent for project-specific concerns:

- **triage-project.md** - Code tracing paths, language-specific entry points
- **fix-project.md** - Backwards compatibility concerns, build/sync requirements
- **test-project.md** - Exact test commands, Docker configuration
- **commit-project.md** - Branch naming, PR conventions, cleanup procedures

## Post-Setup Tasks

### 1. Fill In Project Details

Edit `.claude/shared/*.md` files with project-specific information:

```markdown
# triage-project.md

## Languages and Tracing

### Python
- **Entry points:** `app/main.py`, `api/server.py`
- **Main logic:** `src/lib/`
- **Test scratch directory:** `test/scratch/`

### TypeScript
- **Entry points:** `src/routes/`
- **Main logic:** `src/services/`
- **Test scratch directory:** `test/scratch/`
```

### 2. Verify Test Commands

If you skipped test validation during setup, verify commands work:

```bash
# Run each test command manually
npm run lint
npm run type-check
npm test
```

Fix any issues with paths, permissions, or dependencies before using `/loop`.

### 3. Test the Integration

Create a test issue to verify the workflow:

```bash
# Create a test issue
gh issue create --title "Test: Integration check" --body "Testing GitHub Project integration"

# Add to Bug Fixes project
gh project item-add <project-number> --owner <owner> --url <issue-url>

# Set status to first stage
gh project item-edit --id <item-id> --field-id <status-field-id> --single-select-option-id <triage-option-id>

# Run loop orchestrator
/loop bug
```

The agent should detect the issue in "Triage" status and dispatch the `bug-triage` skill.

### 4. Commit Configuration

Once verified, commit the configuration:

```bash
git add .claude/
git commit -m "chore: add GitHub Project integration"
git push
```

## GitHub Projects Setup

### Projects Are Org/User-Level

GitHub Projects V2 are **not** repository-level:
- For org repos → Projects created at organization level
- For user repos → Projects created at user level
- Projects won't appear in repo's "Projects" tab (that's for deprecated Classic Projects)

### Manual Status Field Configuration

The GitHub API doesn't support programmatic Status field configuration. After creating projects via `/setup`, you must manually configure Status fields:

**Bug Fixes Project:**
1. Open project URL
2. Settings → Status field
3. Add stages: Triage, Fix, Test, UserTest, Done
4. Delete default "Todo", "In Progress" options
5. Configure Board view → Group by Status

**Feature Development Project:**
1. Open project URL
2. Settings → Status field
3. Add stages: Brainstorm, Design Review, Plan, Implement, Test, Review, Done
4. Delete default options
5. Configure Board view → Group by Status

See [GITHUB_PROJECT_SETUP.md](GITHUB_PROJECT_SETUP.md) for detailed instructions.

## Using the Workflows

### Bug Fix Flow

Issues progress through:
1. **Triage** - Investigate root cause with parallel hypothesis testing
2. **Fix** - Implement the fix
3. **Test** - Run CI gates (linting, type checking, tests)
4. **UserTest** - User acceptance testing (optional)
5. **Done** - Create PR and merge

### Feature Development Flow

Issues progress through:
1. **Brainstorm** - Explore ideas and requirements
2. **Design Review** - Review design document
3. **Plan** - Create implementation plan
4. **Implement** - Build the feature
5. **Test** - Run CI gates
6. **Review** - Code review
7. **Done** - Merge and cleanup

### Running the Loop

Process issues through stages:

```bash
# Process all issues in bug flow
/loop bug

# Process all issues in feature flow
/loop feature

# Process both flows
/loop all
```

The loop orchestrator:
- Reads issues from GitHub Projects
- Checks current Status field value
- Dispatches appropriate skill for that stage
- Posts markers to issue comments for idempotency
- Never blocks waiting for user input (async via GitHub comments)

## Integration with Existing Workflows

### Branch Strategy

Update `project-flows.json` with your branching model:

```json
{
  "default_base_branch": "dev",
  "branch_naming": "<type>/<issue#>-<short-description>",
  "promotion_flow": {
    "enabled": true,
    "stages": ["dev", "staging", "main"]
  }
}
```

See [BRANCH_STRATEGY.md](BRANCH_STRATEGY.md) for branch promotion best practices.

### Test Configuration

Configure test commands for your stack:

```json
{
  "test_commands": {
    "linting": "ruff check .",
    "type_checking": "mypy src/",
    "unit_tests": "pytest test/unit/",
    "integration_tests": "pytest test/integration/"
  }
}
```

### UAT Configuration

For Docker-based UAT:

```json
{
  "uat_enabled": true,
  "uat_type": "docker",
  "uat_config": {
    "compose_file": "docker-compose.test.yml",
    "test_command": "docker-compose -f docker-compose.test.yml up --abort-on-container-exit"
  }
}
```

## Troubleshooting

### Setup Command Fails

- **Not in git repo**: Run from repository root
- **gh not authenticated**: Run `gh auth login`
- **Permission denied**: Check GitHub org/repo permissions

### Loop Orchestrator Doesn't Process Issues

- Verify project numbers in `project-flows.json` match GitHub Projects
- Check Status field options match stage names exactly (case-sensitive)
- Ensure issues are added to the project (not just labeled)

### Test Commands Fail

- Run test validation during setup: answer "y" to Q8
- Fix permissions: `chmod +x scripts/test.sh`
- Check Docker is running: `docker ps`
- Verify paths exist: check test directories are correct

### Status Field Not Found

The GitHub API can't create Status field options. You must:
1. Open project in browser
2. Settings → Status
3. Manually add stage names
4. Re-run `/setup` validation

## Next Steps

1. Read [UPDATING_FROM_SUPER_AGENTS.md](UPDATING_FROM_SUPER_AGENTS.md) for keeping skills updated
2. Read [CONTRIBUTING_LESSONS_LEARNED.md](CONTRIBUTING_LESSONS_LEARNED.md) for contributing improvements back
3. Read [BRANCH_STRATEGY.md](BRANCH_STRATEGY.md) for branch promotion workflows
4. Join [Discord](https://discord.gg/Jd8Vphy9jq) for community support

## Reference

- **Setup command**: [commands/setup.md](../commands/setup.md)
- **Loop orchestrator**: [skills/loop-orchestrator/SKILL.md](../skills/loop-orchestrator/SKILL.md)
- **Bug triage**: [skills/bug-triage/SKILL.md](../skills/bug-triage/SKILL.md)
- **Bug fix**: [skills/bug-fix/SKILL.md](../skills/bug-fix/SKILL.md)
- **Testing gates**: [skills/testing-gates/SKILL.md](../skills/testing-gates/SKILL.md)
