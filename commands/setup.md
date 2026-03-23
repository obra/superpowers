# Setup: Bootstrap GitHub Project Integration

Bootstrap a consuming repo with GitHub Projects integration. Creates projects, generates `project-flows.json`, and generates project-specific stubs.

## Usage

```
/setup
```

Interactive command. No arguments. Runs in the consuming repo (the project installing superpowers).

## Process

### Step 1: Detect Repo

Verify git repo and detect basic info:

```bash
gh repo view --json owner,name,defaultBranchRef
```

- Confirm org/owner and repo name
- Detect default branch (fallback: ask user)

**Output:**
```
Detected repo: owner/repo-name
Default branch: main
```

### Step 2: Choose Flows

Ask user which flows they need:

```
Which workflows would you like to set up?

1. Bug fix flow only (Triage → Fix → Test → UserTest → Done)
2. Feature flow only (Brainstorm → Design Review → Plan → Implement → Review → Done)
3. Both (manage bugs and features)
```

Store selection. Continue to Step 3 for each selected flow.

### Step 3: Create GitHub Projects

For each selected flow, create a GitHub Project:

```bash
gh project create --owner <owner> --title "<Repo> - Bug Fixes" --format json
gh project create --owner <owner> --title "<Repo> - Feature Development" --format json
```

Extract project numbers from the created projects.

For each project, add a single-select "Status" field with stage values:

```bash
gh project field-list <project_number> --owner <owner> --format json
```

Parse output to get field IDs, then add options via the GitHub API (or provide instructions if `gh` doesn't support this yet).

**Output:**
```
Created Bug Fixes project (number: 11)
Created Feature Development project (number: 12)
```

### Step 4: Interview for Project Specifics

Ask user about their project setup:

```
What languages does this project use?
(comma-separated, e.g., python,typescript,go)

What's your base branch?
(default: main, examples: dev, develop, staging)

Branch naming convention?
(default: <type>/<issue#>-<short-description>)
Examples:
  - fix/123-resolve-login-bug
  - feat/456-add-dark-mode
  - chore/789-update-deps

Do you need user acceptance testing (UAT)?
(Docker, deployed preview, manual, or none)

Any language-specific build/sync steps?
(Examples: python deploy_to_web.py, npm run build, go generate ./...)
(Leave blank if none)

What are your test commands?
Provide commands for each type (comma-separated, or "skip" if no tests):
  - Linting: (e.g., eslint, pylint, go fmt)
  - Type checking: (e.g., tsc --noEmit, mypy)
  - Unit tests: (e.g., pytest test/, npm test)
  - Regression tests: (if any)
(Leave blank if no tests)
```

Collect all answers.

### Step 5: Generate Files

#### 5a: Generate `project-flows.json`

Create `.claude/project-flows.json` with:
- Project numbers from Step 3
- Answers from Step 4
- Stage definitions from the spec
- Placeholder values for project-specific config

```json
{
  "version": 1,
  "repo": "owner/repo-name",
  "github_owner": "owner",
  "default_base_branch": "main",
  "branch_naming": "<type>/<issue#>-<short-description>",
  "flows": {
    "bug": {
      "project_number": 11,
      "stages": [
        {
          "name": "Triage",
          "skill": "bug-triage",
          "exit_marker": "[TRIAGE_READY]",
          "question_marker": "[TRIAGE_QUESTION]"
        },
        ...
      ]
    },
    "feature": {
      "project_number": 12,
      "stages": [...]
    }
  },
  "project_specific": {
    "languages": [...from Step 4...],
    "test_commands": {...from Step 4...},
    "uat_enabled": true,
    "python_promotion": {
      "enabled": false,
      "command": "python scripts/deploy_to_web.py"
    }
  }
}
```

#### 5b: Generate Project-Specific Stubs

Create `.claude/shared/` directory with stub files:

- **`triage-project.md`** — Code tracing guidance for the project languages
- **`fix-project.md`** — Fix-specific concerns (e.g., backwards compat, pickle, config schema)
- **`test-project.md`** — Exact test commands, gate structure, Docker/CI flag usage
- **`commit-project.md`** — Branch naming, PR conventions, cleanup paths

Each stub includes:
- Placeholder sections for project-specific details
- Comments explaining what should go there
- Examples from common project types

Example stub structure:

```markdown
# Triage Project-Specific Guidance

## Languages and Tracing

This project uses: python, typescript

### Python Tracing
- **Entry points:** `webserver_*.py` files
- **Main logic:** `libs/python/Maths/` directory
- **Test scratch directory:** `test/python/Maths/triage/`

### TypeScript Tracing
- **Entry points:** route handlers in `app/routes/`
- **Main logic:** `app/lib/` directory
- **Test scratch directory:** `test/typescript/` (or adjust)

## Project-Specific Concerns

- [ ] Pickle compatibility (Python classes with `__getstate__`/`__setstate__`)
- [ ] Prisma schema sync (`npx prisma generate`)
- [ ] Database migrations (check migration status before changes)
```

#### 5c: Generate Command Stubs (Optional)

Optionally generate thin `.claude/commands/` stubs as interactive convenience wrappers:

```markdown
# /triage — Investigate a bug

Uses the `bug-triage` skill. See `superpowers:bug-triage` for full documentation.

## Usage
/triage [issue#]
/triage

## Behavior
[Points to the skill documentation]
```

### Step 6: Verify

Verify the setup:

```bash
gh project list --owner <owner>
gh project field-list <bug_project_number> --owner <owner>
gh project field-list <feature_project_number> --owner <owner>
```

Confirm:
- Both projects exist and are listed
- Status field exists on each project
- Status field has stage values as options

**Output:**
```
✅ Bug Fixes project verified (11 stages found)
✅ Feature Development project verified (12 stages found)

Setup complete! Next steps:

1. Review .claude/project-flows.json and update any placeholders
2. Review .claude/shared/*.md files and fill in project-specific details
3. (Optional) Test the setup by running /loop on a test issue
4. Commit these files to git:
   git add .claude/
   git commit -m "chore: set up GitHub Project integration"
5. Read the docs: https://github.com/obra/superpowers (link)

Projects are ready to use. Handler can create issues and assign to the Bug Fixes or Feature Development projects to start processing.
```

## Error Handling

| Error | Action |
|-------|--------|
| Not in a git repo | Stop and report |
| `gh` not authenticated | Stop and ask user to `gh auth login` |
| Project creation fails | Report error, ask user to check permissions |
| Field creation fails | Report error, note that Status field must be added manually |

## Output Files

All files created in `.claude/`:

```
.claude/
  project-flows.json         -- Main config (generated)
  shared/
    triage-project.md        -- Stub (generated)
    fix-project.md           -- Stub (generated)
    test-project.md          -- Stub (generated)
    commit-project.md        -- Stub (generated)
  commands/ (optional)
    (thin wrappers for each stage skill)
```

## Notes for Consuming Repos

After `/setup` runs:

1. **Edit `project-flows.json`** to customize:
   - Stage markers if different from defaults
   - Project-specific config
   - Any language/tool specifics

2. **Fill in `.claude/shared/` stubs** with real project details:
   - Code tracing paths
   - Test command details
   - Backwards compat concerns

3. **Test the setup** by creating a test issue, adding it to a project, and running `/loop`

4. **Commit to git** so all future users get the config

## Future Enhancements

- Auto-detect languages by checking for `package.json`, `setup.py`, etc.
- Auto-detect test commands from CI config (`.github/workflows/`, etc.)
- Template library for common project types (Python Django, Node Express, etc.)
