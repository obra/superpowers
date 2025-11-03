# Knowledge Management Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate ADR and DISCOVERIES patterns from Amplifier analysis as opt-in knowledge management system

**Architecture:** Slash command with embedded templates creates structure, 9 skills integrate with opt-in checks

**Tech Stack:** Markdown documentation, bash/git for verification

---

## Existing Patterns Survey

**Similar features:**
- Existing slash commands: `commands/brainstorm.md`, `commands/execute-plan.md`, `commands/write-plan.md`
- Skill integration pattern: Skills reference other patterns (e.g., TDD, git-worktrees)
- Opt-in pattern: Skills check for presence before using

**Conventions to follow:**
- Commands: Markdown files with clear instructions for agents
- Skill modifications: Add sections that check "if exists"
- Commit messages: Conventional commits format
- Documentation: Clear examples and templates

---

## Task 1: Create Slash Command with Embedded Templates

**Files:**
- Create: `commands/setup-knowledge-management.md`

**Step 1: Create command file with full content**

Create `commands/setup-knowledge-management.md` with:
- Overview section
- Pre-flight checks instructions
- Decision logic for conflicts
- Setup steps with embedded ADR template
- Setup steps with embedded DISCOVERIES template
- Verification steps

Full content:

```markdown
# Setup Knowledge Management

Set up ADR (Architecture Decision Records) and DISCOVERIES pattern for this project.

## Overview

This command creates an opt-in knowledge management structure:
- `docs/decisions/` for Architecture Decision Records
- `docs/discoveries/` for tracking non-obvious problems and solutions

These complement personal `mem` usage with project-level, git-tracked documentation.

## Pre-flight Checks

BEFORE creating anything, check:

1. Does `docs/decisions/` exist?
2. Does `docs/discoveries/` exist?
3. Does `docs/decisions/README.md` exist?
4. Does `docs/discoveries/DISCOVERIES.md` exist?

Commands:
```bash
ls -la docs/decisions/ 2>/dev/null
ls -la docs/discoveries/ 2>/dev/null
test -f docs/decisions/README.md && echo "README exists"
test -f docs/discoveries/DISCOVERIES.md && echo "DISCOVERIES exists"
```

## Decision Logic

### If ALL checks are clean (nothing exists):
Proceed with "Setup Steps" below.

### If ANY already exist:
**STOP immediately.**

Report what exists:
```bash
echo "Found existing structure:"
test -d docs/decisions && echo "  - docs/decisions/"
test -d docs/discoveries && echo "  - docs/discoveries/"
test -f docs/decisions/README.md && echo "  - docs/decisions/README.md"
test -f docs/discoveries/DISCOVERIES.md && echo "  - docs/discoveries/DISCOVERIES.md"
```

Present options to user:
1. **Skip setup** - Keep existing structure, don't modify
2. **Create only missing pieces** - Add what's missing, preserve what exists
3. **Show templates** - Display what would be created for manual review

Wait for user to choose before proceeding.

## Setup Steps

Only execute if pre-flight checks are clean.

### Step 1: Create directory structure

```bash
mkdir -p docs/decisions
mkdir -p docs/discoveries
```

### Step 2: Create docs/decisions/README.md

Create file with this exact content:

```markdown
# Architecture Decision Records (ADRs)

This directory tracks significant architectural and design decisions for the project.

## When to Create an ADR

Create a decision record when:
- Making architectural choices (patterns, frameworks, approaches)
- Choosing between multiple valid approaches
- Making decisions that will be hard to reverse
- Establishing project conventions or standards
- Making trade-offs that future developers should understand

**Use `mem` for quick decision tracking in solo work.**

**Use ADRs when:**
- Decisions affect team members
- Complex decisions requiring full justification
- Decisions you want in git history
- Formal documentation is valuable

## ADR Template

Copy this template for new decisions:

\`\`\`markdown
# [DECISION-NNN] Title

**Status**: Active | Deprecated | Superseded
**Date**: YYYY-MM-DD

## Context
Why was this decision needed? What problem are we solving?

## Decision
What did we decide to do?

## Rationale
Why this approach over alternatives?

## Alternatives Considered
What other options did we evaluate?
- **Option A**: Description and why rejected
- **Option B**: Description and why rejected

## Consequences

**Positive:**
- ✅ Benefit 1
- ✅ Benefit 2

**Negative/Risks:**
- ⚠️ Trade-off 1
- ⚠️ Trade-off 2

## Review Triggers
When should we reconsider this decision?
- [ ] Condition 1
- [ ] Condition 2
\`\`\`

## Naming Convention

Files: `NNN-short-description.md` where NNN is zero-padded number (001, 002, etc.)

Examples:
- `001-use-typescript-for-frontend.md`
- `002-adopt-microservices-architecture.md`

## Updating Status

When revisiting decisions:
- **Deprecated**: No longer recommended, but still in use
- **Superseded**: Replaced by another decision (link to it)

## Tips

- Write ADRs when fresh - capture context while it's clear
- Include specific examples and code snippets
- Link to relevant issues, PRs, or documentation
- Update status when circumstances change
- One decision per ADR (don't bundle)
```

### Step 3: Create docs/discoveries/DISCOVERIES.md

Create file with this exact content:

```markdown
# Discoveries

This document tracks non-obvious problems, their root causes, solutions, and prevention strategies. Check here before debugging similar issues.

**Use `mem` for personal discovery tracking in solo work.**

**Use this file when:**
- Project-specific issues that affect team members
- Problems you want in git history
- Issues requiring structured documentation
- Collective learning is valuable

## Template

Copy this template for new entries:

\`\`\`markdown
## Issue Title (YYYY-MM-DD)

### Issue
Clear description of the problem observed. Include symptoms and error messages.

### Root Cause
What actually caused it? Not just symptoms - trace to the source.

### Solution
How was it fixed? Specific steps, code changes, or configuration updates.

### Prevention
How to avoid this in the future? Patterns, checks, validation, or practices to adopt.
\`\`\`

---

## Discoveries

*No discoveries yet. This section will grow as we encounter and solve non-obvious problems.*

<!-- Add new discoveries below, newest first -->
```

### Step 4: Verify structure created

Run verification commands:

```bash
echo "Verifying structure..."
ls -la docs/decisions/
ls -la docs/discoveries/
echo ""
echo "Verifying file contents..."
wc -l docs/decisions/README.md
wc -l docs/discoveries/DISCOVERIES.md
```

Expected output:
- Both directories exist
- README.md has ~80+ lines
- DISCOVERIES.md has ~40+ lines

### Step 5: Optional - Create example ADR

Ask user: "Would you like to create an example ADR (001-adopt-knowledge-management.md) documenting this decision to adopt these patterns?"

If yes, create `docs/decisions/001-adopt-knowledge-management.md`:

```markdown
# [DECISION-001] Adopt Knowledge Management Patterns

**Status**: Active
**Date**: YYYY-MM-DD

## Context

Working solo and in teams, we need to track architectural decisions and non-obvious problem solutions. The `mem` system works well for personal knowledge but doesn't provide:
- Team visibility (others can't see decisions/discoveries)
- Git history (no tracking of when/why decisions changed)
- Discoverability (team members don't know what's been solved)

## Decision

Adopt opt-in knowledge management patterns:
- Architecture Decision Records (ADRs) in `docs/decisions/`
- DISCOVERIES pattern in `docs/discoveries/DISCOVERIES.md`

These complement `mem` (personal) with project-level (team) documentation.

## Rationale

- **Opt-in**: Only enable in projects where valuable, no forcing on teams
- **Complements mem**: Use mem for solo work, files for team sharing
- **Git-tracked**: Decisions and discoveries preserved in version control
- **Discoverable**: Team members can browse `docs/` to learn project context

Follows patterns from Microsoft Amplifier project, adapted for our needs.

## Alternatives Considered

- **Just use mem**: Rejected - doesn't share with team, not in git
- **Force in all projects**: Rejected - violates autonomy, creates empty dirs everywhere
- **Separate skill**: Rejected - better to integrate into existing workflows

## Consequences

**Positive:**
- ✅ Project-level knowledge preserved
- ✅ Team members can discover decisions/solutions
- ✅ Git history tracks evolution of thinking
- ✅ Skills automatically use when present

**Negative/Risks:**
- ⚠️ Another system to maintain (but opt-in mitigates)
- ⚠️ Need discipline to document (but skills prompt)
- ⚠️ Template versioning (embedded in slash command)

## Review Triggers
- [ ] If team adoption is low after 3 months
- [ ] If maintenance burden becomes significant
- [ ] If mem system evolves to cover team use cases
```

### Step 6: Stage and commit

```bash
git add docs/
git commit -m "docs: add knowledge management structure (ADR + DISCOVERIES)"
```

## Completion

Structure created successfully. Skills will automatically detect and use these patterns when present.

**Next steps:**
- Document architectural decisions as they're made
- Add discoveries when solving non-obvious problems
- Share with team members
```

**Step 2: Verify file created**

```bash
ls -la commands/setup-knowledge-management.md
wc -l commands/setup-knowledge-management.md
```

Expected: File exists with ~250+ lines

**Step 3: Commit**

```bash
git add commands/setup-knowledge-management.md
git commit -m "feat(commands): add setup-knowledge-management slash command"
```

---

## Task 2: Update systematic-debugging Skill

**Files:**
- Modify: `skills/systematic-debugging/SKILL.md`

**Step 1: Read current file**

```bash
cat skills/systematic-debugging/SKILL.md
```

**Step 2: Add discovery documentation section**

After "Phase 4: Implementation", Step 4 "If Fix Doesn't Work", add new Step 5:

```markdown
5. **Document Discovery (if applicable)**

   **WHEN root cause was non-obvious or could recur:**

   Check if `docs/discoveries/DISCOVERIES.md` exists:

   ```bash
   test -f docs/discoveries/DISCOVERIES.md && echo "File exists"
   ```

   **If file exists:**
   - Document the Issue, Root Cause, Solution, Prevention
   - Help future developers (including yourself) skip this investigation
   - Add entry using template from DISCOVERIES.md

   **If file doesn't exist:**
   - Use `mem add "Discovery: [issue] caused by [root cause]. Fixed by [solution]" --tags "discovery,bug,project"`
   - Personal reference for future debugging
```

**Step 3: Verify changes**

```bash
grep -A 10 "Document Discovery" skills/systematic-debugging/SKILL.md
```

Expected: New section appears with both file-exists and fallback paths

**Step 4: Commit**

```bash
git add skills/systematic-debugging/SKILL.md
git commit -m "feat(skills): integrate discoveries pattern in systematic-debugging"
```

---

## Task 3: Update root-cause-tracing Skill

**Files:**
- Modify: `skills/root-cause-tracing/SKILL.md`

**Step 1: Add documenting discoveries section**

After "Real Example: Empty projectDir" section, add new section:

```markdown
## Documenting Discoveries

After tracing to source and fixing:

**Check if project uses discoveries pattern:**

```bash
test -f docs/discoveries/DISCOVERIES.md && echo "Discoveries file exists"
```

**If `docs/discoveries/DISCOVERIES.md` exists:**
- Document the complete trace path
- Record the root cause discovered
- Describe the solution applied
- Add prevention guidance
- Help others recognize this pattern faster

**If file doesn't exist:**
- Use `mem add "Root cause trace: [symptom] → [immediate cause] → [source]. Fixed at [location]" --tags "discovery,trace,project"`
- Store for personal reference in future debugging
```

**Step 2: Verify changes**

```bash
grep -A 5 "Documenting Discoveries" skills/root-cause-tracing/SKILL.md
```

**Step 3: Commit**

```bash
git add skills/root-cause-tracing/SKILL.md
git commit -m "feat(skills): integrate discoveries pattern in root-cause-tracing"
```

---

## Task 4: Update when-stuck Skill

**Files:**
- Modify: `skills/when-stuck/SKILL.md`

**Step 1: Add check known issues step**

In "Process" section, before step 1, add step 0:

```markdown
0. **Check Known Issues** (if applicable)

   Before dispatching to problem-solving techniques, check if this problem has been solved before:

   ```bash
   test -f docs/discoveries/DISCOVERIES.md && echo "Check DISCOVERIES file"
   ```

   **If `docs/discoveries/DISCOVERIES.md` exists:**
   - Read through discoveries for similar problems
   - Search for keywords related to your stuck-ness
   - May find solution without full investigation

   **Otherwise:**
   - Try `mem search semantic "stuck on [describe problem]"`
   - May find past solutions from your personal knowledge
```

**Step 2: Verify changes**

```bash
grep -B 2 -A 10 "Check Known Issues" skills/when-stuck/SKILL.md
```

**Step 3: Commit**

```bash
git add skills/when-stuck/SKILL.md
git commit -m "feat(skills): integrate discoveries pattern in when-stuck"
```

---

## Task 5: Update predict-issues Skill

**Files:**
- Modify: `skills/predict-issues/SKILL.md`

**Step 1: Update tracking predictions section**

Replace "Tracking Predictions" section with:

```markdown
## Tracking Predictions

After analysis, ask user how to track findings:

**Available options:**

- **decisions/** - Create ADR for architectural choices (if `docs/decisions/` exists)
- **discoveries/** - Document known issues and prevention (if `docs/discoveries/DISCOVERIES.md` exists)
- **Memory** - Store risk assessments using `mem add` for personal reference
- **TodoWrite** - Create structured task list for systematic review
- **Summary only** - Provide report without creating artifacts

Check which options are available:

```bash
test -d docs/decisions && echo "ADR available"
test -f docs/discoveries/DISCOVERIES.md && echo "DISCOVERIES available"
```

Present only available options to user.
```

**Step 2: Verify changes**

```bash
grep -A 15 "Tracking Predictions" skills/predict-issues/SKILL.md
```

**Step 3: Commit**

```bash
git add skills/predict-issues/SKILL.md
git commit -m "feat(skills): integrate ADR and discoveries in predict-issues"
```

---

## Task 6: Update documentation-management Skill

**Files:**
- Modify: `skills/documentation-management/SKILL.md`

**Step 1: Update documentation types section**

In "Documentation Types" section, add after existing types:

```markdown
- **ADR** (decisions/): Architecture decisions with rationale (if `docs/decisions/` exists)
- **DISCOVERIES** (discoveries/): Known issues and solutions (if `docs/discoveries/DISCOVERIES.md` exists)
```

**Step 2: Update change type patterns table**

In "Update Patterns by Change Type" table, add new row:

```markdown
| **Architecture change** | README architecture section, CHANGELOG, ADR in decisions/ (if exists) |
```

**Step 3: Verify changes**

```bash
grep "ADR\|DISCOVERIES" skills/documentation-management/SKILL.md
```

Expected: Both patterns mentioned in types and table

**Step 4: Commit**

```bash
git add skills/documentation-management/SKILL.md
git commit -m "feat(skills): integrate ADR and discoveries in documentation-management"
```

---

## Task 7: Update writing-plans Skill

**Files:**
- Modify: `skills/writing-plans/SKILL.md`

**Step 1: Update survey existing patterns section**

In "Survey Existing Patterns" section, after step 1 "Find similar features", add step 2:

```markdown
2. **Check decisions**: If `docs/decisions/` exists, review relevant ADRs for architectural context
   ```bash
   test -d docs/decisions && ls docs/decisions/*.md
   ```
   Read ADRs that relate to the feature being planned.
```

Renumber subsequent steps (current 2→3, 3→4, 4→5).

**Step 2: Verify changes**

```bash
grep -A 3 "Check decisions" skills/writing-plans/SKILL.md
```

**Step 3: Commit**

```bash
git add skills/writing-plans/SKILL.md
git commit -m "feat(skills): integrate decisions pattern in writing-plans"
```

---

## Task 8: Update brainstorming Skill

**Files:**
- Modify: `skills/brainstorming/SKILL.md`

**Step 1: Update Prep section**

In "Prep: Autonomous Recon", first bullet point, change from:
```markdown
- Use existing tools (file browsing, docs, git history, tests) to understand...
```

To:
```markdown
- Use existing tools (file browsing, docs, git history, tests, decisions/) to understand current project state before asking anything.
```

**Step 2: Update Phase 1 section**

In "Phase 1: Understanding", add after first bullet:

```markdown
- Check `docs/decisions/` (if exists) for relevant architectural decisions
  ```bash
  test -d docs/decisions && fd . docs/decisions
  ```
```

**Step 3: Update Phase 4 section**

In "Phase 4: Design Documentation", after "Commit the design document to git before proceeding", add:

```markdown

**If significant architectural choice was made:**

Check if project uses ADR pattern:
```bash
test -d docs/decisions && echo "ADR available"
```

If available, consider creating ADR to document the architectural decision with full context, alternatives considered, and rationale.
```

**Step 4: Verify changes**

```bash
grep "decisions/" skills/brainstorming/SKILL.md | head -5
```

Expected: Three mentions in Prep, Phase 1, and Phase 4

**Step 5: Commit**

```bash
git add skills/brainstorming/SKILL.md
git commit -m "feat(skills): integrate decisions pattern in brainstorming"
```

---

## Task 9: Update enhancing-superpowers Skill

**Files:**
- Modify: `skills/enhancing-superpowers/SKILL.md`

**Step 1: Add decision documentation integration type**

In "Integration Approaches by Type" section, after Type 5, add Type 6:

```markdown
### Type 6: Decision Documentation

**Example:** Deciding to add/reject external patterns

**Approach:**

1. Check if project uses ADR pattern:
   ```bash
   test -d docs/decisions && echo "ADR available"
   ```
2. **If exists**: Create ADR documenting integration decision with context, rationale, alternatives
3. **Otherwise**: Use `mem add "Integration decision: [what] because [why]. Alternatives: [rejected options]" --tags "decision,integration"`
4. Reference in related skills or documentation

**Avoid:** Making major decisions without documenting rationale
```

**Step 2: Verify changes**

```bash
grep -A 15 "Type 6: Decision Documentation" skills/enhancing-superpowers/SKILL.md
```

**Step 3: Commit**

```bash
git add skills/enhancing-superpowers/SKILL.md
git commit -m "feat(skills): add decision documentation pattern in enhancing-superpowers"
```

---

## Task 10: Update extracting-patterns-from-projects Skill

**Files:**
- Modify: `skills/extracting-patterns-from-projects/SKILL.md`

**Step 1: Update comprehensive write-up section**

In "6. Comprehensive Write-up" section, after the list of required sections, add:

```markdown

**After write-up:**

Check if project uses ADR pattern:
```bash
test -d docs/decisions && echo "ADR available"
```

**If this is a major integration decision:**
- **If ADR available**: Create ADR documenting the decision to integrate (or not integrate) patterns
- **Otherwise**: Store decision rationale with `mem add "Pattern extraction decision: [what] because [why]" --tags "decision,patterns"`

Major integrations warrant formal decision documentation.
```

**Step 2: Verify changes**

```bash
grep -A 10 "After write-up" skills/extracting-patterns-from-projects/SKILL.md
```

**Step 3: Commit**

```bash
git add skills/extracting-patterns-from-projects/SKILL.md
git commit -m "feat(skills): integrate decisions pattern in extracting-patterns-from-projects"
```

---

## Task 11: Test Setup Command in Superpowers Repo

**Files:**
- Will create: `docs/decisions/`, `docs/discoveries/`

**Step 1: Run the slash command**

From worktree root:

```bash
# Simulate what agent would do after reading command
mkdir -p docs/decisions
mkdir -p docs/discoveries
```

Then manually create the two files by copying content from the command template.

**Step 2: Verify structure**

```bash
ls -la docs/decisions/
ls -la docs/discoveries/
cat docs/decisions/README.md | head -20
cat docs/discoveries/DISCOVERIES.md | head -20
```

Expected: Both directories exist with README files

**Step 3: Create ADR 001**

Create `docs/decisions/001-adopt-knowledge-management.md` documenting this integration decision. Use template from command, fill in actual date and context.

**Step 4: Verify all files**

```bash
fd . docs
```

Expected output:
```
docs/decisions/README.md
docs/decisions/001-adopt-knowledge-management.md
docs/discoveries/DISCOVERIES.md
docs/plans/2025-11-03-knowledge-management-integration-design.md
docs/plans/2025-11-03-knowledge-management-implementation-plan.md
```

**Step 5: Commit structure**

```bash
git add docs/
git commit -m "docs: add knowledge management structure to superpowers

- Create docs/decisions/ with README and ADR template
- Create docs/discoveries/ with DISCOVERIES template
- Document decision to adopt pattern in ADR 001
- Superpowers now dogfoods own pattern"
```

---

## Task 12: Final Verification

**Step 1: Verify all changes staged**

```bash
git status
```

Expected: No uncommitted changes (everything already committed in individual tasks)

**Step 2: Review commit history**

```bash
git log --oneline -12
```

Expected: 11 commits (1 command + 9 skills + 1 structure + 1 verification)

**Step 3: Verify skills reference patterns correctly**

```bash
grep -r "docs/decisions" skills/ | wc -l
grep -r "docs/discoveries" skills/ | wc -l
```

Expected: Multiple matches (at least 5 for decisions, at least 4 for discoveries)

**Step 4: Verify command exists**

```bash
cat commands/setup-knowledge-management.md | grep "# Setup Knowledge Management"
```

Expected: Title appears

---

## Completion Checklist

After all tasks complete:

- [ ] Slash command created with embedded templates
- [ ] 9 skills updated with integration points
- [ ] All skills check for presence (opt-in pattern)
- [ ] All skills fall back to mem when absent
- [ ] Structure created in superpowers repo
- [ ] ADR 001 documents this decision
- [ ] All changes committed with conventional commits
- [ ] Verification tests pass

## Estimated Time

- Task 1: 30 min (command creation)
- Tasks 2-10: 15 min each = 2h 15min (skill updates)
- Task 11: 30 min (test in superpowers)
- Task 12: 15 min (verification)

**Total: ~4 hours**
