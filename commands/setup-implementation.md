# Setup Implementation Guide

This file provides the detailed logic for implementing `/setup`. The command is interactive and orchestrates multiple `gh` CLI calls to set up GitHub Projects.

## Implementation Approach

The `/setup` command is implemented as a Claude Code prompt that:

1. Asks the user questions one at a time (using AskUserQuestion)
2. Validates git repo and `gh` auth
3. Creates GitHub Projects via `gh` CLI
4. Generates JSON and markdown files with user-provided values
5. Verifies the setup
6. Provides next steps

## Step-by-Step Implementation

### Initialization

1. Announce: "I'm setting up GitHub Project integration for this repo."
2. Check prerequisites:
   ```bash
   git rev-parse --git-dir
   gh auth status
   gh repo view --json owner,name,defaultBranchRef
   ```
3. If any check fails, stop and report the error

### User Questions (Sequential)

Ask each question one at a time. Don't ask all at once.

**Q1: Which flows?**
```
Which workflows would you like to set up?

1. Bug fix flow only
2. Feature flow only
3. Both
```

Store: `flows_selected` (array: ["bug"], ["feature"], or ["bug", "feature"])

**Q2 (for each flow): Base branch**
```
What's your base branch for this project?
(default: main)

Examples: dev, develop, staging, master
```

Store: `base_branch`

**Q3: Branch naming**
```
What's your branch naming convention?

Examples:
  - fix/123-resolve-login-bug
  - feat/456-add-dark-mode

Format (default): <type>/<issue#>-<short-description>
```

Store: `branch_naming`

**Q4: Languages**
```
What languages does this project use?

Examples: python, typescript, go, rust, java

Enter comma-separated (or leave blank):
```

Store: `languages` (array)

**Q5: UAT**
```
Do you need user acceptance testing?

1. Docker-based UAT (full stack)
2. Deployed preview
3. Manual testing only
4. No UAT
```

Store: `uat_type`

**Q6: Build/sync steps**
```
Any language-specific build or sync steps?

Examples:
  - python scripts/deploy_to_web.py
  - npm run build
  - go generate ./...

(Leave blank if none)
```

Store: `build_steps` (string or empty)

**Q7: Test commands**
```
What are your test commands?

Provide for each type that applies:
  - Linting: (e.g., eslint ., pylint src/)
  - Type checking: (e.g., tsc --noEmit)
  - Unit tests: (e.g., pytest test/, npm test)

(Leave blank for any you don't use)
```

Store: `test_commands` (object: { linting: "", type_checking: "", unit_tests: "", ... })

### Project Creation

For each selected flow, create a GitHub Project:

```bash
gh project create --owner <owner> \
  --title "<repo> - Bug Fixes" \
  --format json
```

Extract `number` from the response. Store project numbers.

**Add Status field** (if `gh` supports it):
```bash
gh project field-list <number> --owner <owner> --format json
```

Look for Status field. If it doesn't exist, create it (or note that user must add manually).

### Generate `project-flows.json`

Create `.claude/project-flows.json` with:

```json
{
  "version": 1,
  "repo": "<owner/repo>",
  "github_owner": "<owner>",
  "default_base_branch": "<base_branch>",
  "branch_naming": "<branch_naming>",
  "flows": {
    "bug": {
      "project_number": <number>,
      "stages": [
        {
          "name": "Triage",
          "skill": "bug-triage",
          "exit_marker": "[TRIAGE_READY]",
          "question_marker": "[TRIAGE_QUESTION]"
        },
        {
          "name": "Fix",
          "skill": "bug-fix",
          "exit_marker": "[FIX_COMPLETE]"
        },
        {
          "name": "Test",
          "skill": "testing-gates",
          "exit_marker": "[TEST_PASS]",
          "fail_marker": "[TEST_FAIL]"
        },
        {
          "name": "UserTest",
          "skill": "user-acceptance-testing",
          "exit_marker": "[UAT_ACCEPTED]",
          "optional": true,
          "skip_condition": "no user-facing changes"
        },
        {
          "name": "Done",
          "skill": "committing",
          "exit_marker": "[PR_CREATED]"
        }
      ]
    },
    "feature": {
      "project_number": <number>,
      "stages": [
        {
          "name": "Brainstorm",
          "skill": "brainstorming",
          "exit_marker": "[SPEC_APPROVED]",
          "question_marker": "[DESIGN_QUESTION]"
        },
        {
          "name": "Design Review",
          "skill": "spec-document-reviewer",
          "exit_marker": "[DESIGN_APPROVED]"
        },
        {
          "name": "Plan",
          "skill": "writing-plans",
          "exit_marker": "[PLAN_READY]",
          "question_marker": "[PLAN_QUESTION]"
        },
        {
          "name": "Implement",
          "skill": "subagent-driven-development",
          "exit_marker": "[IMPL_COMPLETE]"
        },
        {
          "name": "Review",
          "skill": "requesting-code-review",
          "exit_marker": "[REVIEW_APPROVED]"
        },
        {
          "name": "Done",
          "skill": "finishing-a-development-branch",
          "exit_marker": "[PR_CREATED]"
        }
      ]
    }
  },
  "project_specific": {
    "languages": <languages>,
    "test_commands": <test_commands>,
    "uat_enabled": <uat_enabled>,
    "build_sync": {
      "enabled": <has_build_steps>,
      "command": "<build_steps>"
    }
  }
}
```

Include only the flows that were selected.

### Generate Project-Specific Stubs

Create `.claude/shared/` directory and stub files:

#### `triage-project.md`

```markdown
# Triage Project-Specific Guidance

## Code Tracing (by language)

**Languages in this project:** <languages>

[For each language, provide:]

### <Language>
- **Entry points:** <path examples>
- **Main logic:** <path examples>
- **Test artifacts:** <scratch test path>
- **Common tools:** <linter, type checker, etc.>

## Project-Specific Concerns

<Placeholder items based on languages>

- [ ] Backwards compatibility considerations
- [ ] Database or data store specifics
- [ ] External service dependencies
- [ ] Multi-platform concerns (Windows/Mac/Linux)
```

#### `fix-project.md`

```markdown
# Fix Project-Specific Guidance

## Fix Concerns

[Based on detected languages]

### Backwards Compatibility
- [ ] Any pickle/serialization concerns? (Python)
- [ ] Schema migrations needed? (Database)
- [ ] Config format changes? (Any)

### Code Sync Steps
- Project runs: <build_steps or "none">
- Before committing, run: <build_steps or "none">

### Testing Requirements
After fix, ensure:
- [ ] Reproduction test passes
- [ ] Full test suite passes
- [ ] No new warnings/errors in linting
- [ ] Type checking passes (if applicable)
```

#### `test-project.md`

```markdown
# Test Project-Specific Guidance

## Test Commands

**Linting:** <linting command or "not configured">
**Type checking:** <type_checking command or "not configured">
**Unit tests:** <unit_tests command or "not configured">

## Test Modes

### Smart Mode (detects what changed)
- If .py files changed: run Python tests
- If .ts/.tsx files changed: run TypeScript linting + type check
- Etc.

### Full Mode (all gates)
Run all test commands regardless of changes

## Regression Tests

<Notes on regression test setup>

## Docker/CI Flag

If using Docker for CI environment:
- Check with: `<docker cache check command>`
- Run in Docker: `docker run --rm -v "\${PWD}:/app" <image> <test command>`
```

#### `commit-project.md`

```markdown
# Commit Project-Specific Guidance

## Branch Naming

Convention: <branch_naming>

Examples:
- `fix/123-resolve-login-bug`
- `feat/456-add-dark-mode`

## Commit Message Format

```
<type>: #<issue#> one line description

<optional longer description>
```

Types: `feat`, `fix`, `chore`

## PR Template

PR body should include:
- Closes #<issue#>
- Summary of changes
- Test evidence
- Files changed

## Cleanup

Before PR:
- [ ] Remove test artifacts from <scratch test path> (if any)
- [ ] Check for console warnings/errors
- [ ] Verify no .env or secrets in staging
```

### Verification

After generating files, verify the setup:

```bash
gh project list --owner <owner> --json number,title
gh project field-list <bug_project_number> --owner <owner> --json id,name,options
gh project field-list <feature_project_number> --owner <owner> --json id,name,options
```

Confirm:
- Projects exist and are listed
- Status field exists on both
- Status field has stage options

### Output

Present summary:

```
✅ GitHub Project integration set up successfully!

Created projects:
- Bug Fixes (project #11)
- Feature Development (project #12)

Generated files:
- .claude/project-flows.json
- .claude/shared/triage-project.md
- .claude/shared/fix-project.md
- .claude/shared/test-project.md
- .claude/shared/commit-project.md

Next steps:

1. Review .claude/project-flows.json
2. Fill in project-specific details in .claude/shared/*.md
3. Test with: /loop
4. Commit to git:
   git add .claude/
   git commit -m "chore: set up GitHub Project integration"

Docs: https://github.com/obra/superpowers
```

## Error Recovery

- **Git repo not found:** "Not in a git repository. Run this from the repo root."
- **`gh` not authenticated:** "GitHub CLI not authenticated. Run: gh auth login"
- **Project creation fails:** "Failed to create project. Check permissions and try again."
- **Field creation fails:** "Could not create Status field. Add it manually in the GitHub Project settings."
- **Verification fails:** "Setup partially complete. Check GitHub Project settings and re-run if needed."

## File Structure After Setup

```
repo-root/
  .claude/
    project-flows.json
    shared/
      triage-project.md
      fix-project.md
      test-project.md
      commit-project.md
    commands/ (optional, if generated)
      (thin wrappers)
```
