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
   gh repo view --json owner,name,defaultBranchRef,isInOrganization
   ```
3. Detect repo ownership:
   - If `isInOrganization: true` → Projects will be org-level
   - If `isInOrganization: false` → Projects will be user-level
4. Inform user about project level:
   ```
   ℹ️  GitHub Projects V2 are [org/user]-level, not repository-level.

   For [org] repos: Projects are created at the organization level and can
   contain issues from any repo in the org.

   For [user] repos: Projects are created at the user level.

   Projects won't appear in the repo's "Projects" tab (that's for deprecated
   Classic Projects), but they work perfectly with the loop orchestrator.

   Continue? (y/n)
   ```
5. If any check fails, stop and report the error

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

**Q8: Test setup validation (optional)**
```
Would you like to validate your test setup now?

This helps catch common issues with:
- Test command permissions
- Docker configuration (if using Docker for tests/UAT)
- Missing dependencies or environment variables
- Path issues

Validating now can prevent workflow blockers later.

Validate test setup? (y/n)
```

If yes:
1. Run each provided test command in a safe way (read-only, non-destructive)
2. Capture any errors (permissions, missing files, Docker not running, etc.)
3. For each error, offer to help troubleshoot:
   - Permission errors: suggest chmod/chown or running with appropriate user
   - Docker errors: check if Docker is running, suggest docker-compose setup
   - Missing dependencies: identify what's missing and suggest install commands
   - Path errors: help locate the correct paths
4. Re-run commands after fixes until they work or user opts to skip
5. If UAT type is "Docker-based UAT":
   - Verify Docker/docker-compose is installed
   - Check if Docker daemon is running
   - If Dockerfile or docker-compose.yml exists, offer to validate it builds
   - Suggest creating a test script if none exists

If no, skip to project creation.

### Project Creation

For each selected flow, create a GitHub Project:

```bash
gh project create --owner <owner> \
  --title "Bug Fixes" \
  --format json
```

Extract `number`, `url`, and `id` from the response. Store for each project.

### Manual Status Field Configuration

**The GitHub API doesn't support modifying Status field options.** This must be done manually via the web UI.

For each created project, guide the user:

**Bug Fixes Project:**
```
✅ Created Bug Fixes project: <url>

⚠️  Manual setup required:

Part 1: Configure Status Field
1. Open: <url>
2. Select "Settings" from the "..." dropdown menu at the top right of the project
3. Navigate to "Status" in the left pane under "Fields"
4. Edit/add options to match these exact names (delete defaults):

   Name: Triage
   Color: Red (optional)
   Description: "Investigating root cause" (optional)

   Name: Fix
   Color: Orange (optional)
   Description: "Implementing the fix" (optional)

   Name: Test
   Color: Yellow (optional)
   Description: "Running CI gates" (optional)

   Name: UserTest
   Color: Blue (optional)
   Description: "Ready for user acceptance testing" (optional)

   Name: Done
   Color: Green (optional)
   Description: "Complete and merged" (optional)

5. Delete the default "Todo", "In Progress" options
6. Save changes

Part 2: Configure Board View
7. Click the view selector (gear icon) on the right side of the screen
8. Select "Board" view (or create one if needed)
9. Click the view dropdown (•••) → Settings
10. Set "Group by: Status"
11. Columns will automatically show your stages in order
12. Save the view

Once you've completed both parts, type "done" to continue.
```

Wait for user to type "done".

**Feature Development Project** (if selected):
```
✅ Created Feature Development project: <url>

⚠️  Manual setup required:

Part 1: Configure Status Field
1. Open: <url>
2. Select "Settings" from the "..." dropdown menu at the top right of the project
3. Navigate to "Status" in the left pane under "Fields"
4. Edit/add options to match these exact names (delete defaults):

   Name: Brainstorm
   Color: Blue (optional)
   Description: "Exploring ideas and requirements" (optional)

   Name: Design Review
   Color: Green (optional)
   Description: "Ready for design review" (optional)

   Name: Plan
   Color: Yellow (optional)
   Description: "Creating implementation plan" (optional)

   Name: Implement
   Color: Orange (optional)
   Description: "Implementing the feature" (optional)

   Name: Test
   Color: Red (optional)
   Description: "Running CI gates" (optional)

   Name: Review
   Color: Pink (optional)
   Description: "Ready for code review" (optional)

   Name: Done
   Color: Purple (optional)
   Description: "Complete and merged" (optional)

5. Delete the default "Todo", "In Progress" options
6. Save changes

Part 2: Configure Board View
7. Click the view selector (gear icon) on the right side of the screen
8. Select "Board" view (or create one if needed)
9. Click the view dropdown (•••) → Settings
10. Set "Group by: Status"
11. Columns will automatically show your stages in order
12. Save the view

Once you've completed both parts, type "done" to continue.
```

Wait for user to type "done".

### Validate Status Field Configuration

After user confirms manual setup, validate that the Status field has the correct options:

```bash
gh project field-list <project_number> --owner <owner> --format json
```

Parse the Status field options and verify they match the expected stage names:

**For Bug Fixes:**
Expected: `["Triage", "Fix", "Test", "UserTest", "Done"]`

**For Feature Development:**
Expected: `["Brainstorm", "Design Review", "Plan", "Implement", "Review", "Done"]`

If validation fails:
```
❌ Validation failed. Status field options don't match expected values.

Expected: Triage, Fix, Test, UserTest, Done
Found: <actual values>

Please correct the Status field and type "retry" to validate again.
```

If validation succeeds:
```
✅ Status field validated successfully!
```

### Generate `project-flows.json`

Create `.claude/project-flows.json` using the **validated stage names** from GitHub.

**Important:** The `name` field in each stage uses the validated Status field value from GitHub. The `skill` field maps to the corresponding generic skill based on stage order:

**Bug Flow mapping:**
- Stage 1 (Triage) → `bug-triage`
- Stage 2 (Fix) → `bug-fix`
- Stage 3 (Test) → `testing-gates`
- Stage 4 (UserTest) → `user-acceptance-testing`
- Stage 5 (Done) → `committing`

**Feature Flow mapping:**
- Stage 1 (Brainstorm) → `brainstorming`
- Stage 2 (Design Review) → `spec-document-reviewer`
- Stage 3 (Plan) → `writing-plans`
- Stage 4 (Implement) → `subagent-driven-development`
- Stage 5 (Review) → `requesting-code-review`
- Stage 6 (Done) → `finishing-a-development-branch`

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
      "project_url": "<url>",
      "stages": [
        {
          "name": "<validated stage 1 name>",
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
3. [If test validation was skipped] Verify your test commands work before using /loop
4. Test with: /loop
5. Commit to git:
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
