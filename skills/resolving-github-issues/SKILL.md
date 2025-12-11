---
name: resolving-github-issues
description: Use when a GitHub issue URL or number is referenced and needs analysis, planning, or implementation - systematically fetches issue details, analyzes codebase impact, assesses feasibility, creates implementation plan, and executes fix with user approval at checkpoints
---

# Resolving GitHub Issues

## Overview

Systematic workflow for analyzing GitHub issues and implementing fixes.

**Core principle:** Fetch → Analyze → Plan → Checkpoint → Implement → Verify

**Announce at start:** "I'm using the resolving-github-issues skill to analyze and address this issue."

## When to Use

- User references a GitHub issue (URL or `#123`)
- Asked to "fix issue #X" or "look at issue #X"
- Need to understand scope before committing to work

**Don't use for:**
- Creating new issues (use creating-github-issues skill)
- Issues in repos you don't have access to
- Vague requests without issue reference

## The Process

### Phase 1: Fetch Issue

```bash
gh issue view <number> --repo <owner/repo>
```

Extract: title, description, labels, comments, acceptance criteria, related PRs.

### Phase 2: Analyze Codebase

```bash
git pull origin main  # Ensure latest
```

Investigate:
- Files/code mentioned in issue
- Affected components and dependencies
- Related test files
- Recent commits: `git log --oneline -n 20 <path>`
- Similar fixes: `git log --grep="<keywords>"`

### Phase 3: Assess Feasibility

Evaluate these dimensions:

| Dimension | Question |
|-----------|----------|
| Clarity | Are requirements well-defined? |
| Scope | Can I identify all files needing changes? |
| Dependencies | Are required APIs/services accessible? |
| Testing | Can I verify the fix works? |
| Side Effects | Can I predict impacts? |
| Complexity | Rate 1-10 with reasoning |

### Phase 4: Determine Path

Make one of three determinations:

**A. CAN PROCEED** (requirements clear, scope manageable)
```text
IMPLEMENTATION PLAN
Complexity: [1-10]
Files: [list with changes needed]

Steps:
1. [Specific action]
2. [Next action]

Testing: [How to verify]
Risks: [Potential issues]
```

**B. REQUIRES CLARIFICATION** (missing information)
```text
REQUIRES CLARIFICATION
Missing: [specific questions]
Suggested: [how to obtain info]
```

**C. BEYOND SCOPE** (too complex, blocked)
```text
COMPLEXITY WARNING
Reason: [why too complex]
Blockers: [specific blockers]
Recommended: [suggested approach]
```

### Phase 5: User Checkpoint

**Always wait for approval before implementing:**

- CAN PROCEED: "Ready to create branch and implement. Shall I continue?"
- REQUIRES CLARIFICATION: "Need more info. Want me to comment on the issue?"
- BEYOND SCOPE: "This needs [X]. Want me to document findings on issue?"

### Phase 6: Implement (if approved)

```bash
git checkout -b fix/issue-<number>-<brief-description>
```

Follow plan step-by-step:
1. Make changes per plan
2. Run tests: `npm test` / `cargo test` / etc.
3. Verify no regressions
4. Create clear commit messages (conventional commits)

### Phase 7: Complete

```bash
git diff --stat  # Show changes
```

Offer options:
- "Create PR with these changes?"
- "Run additional tests?"
- "Review changes together?"

## Quick Reference

| Phase | Action | Output |
|-------|--------|--------|
| 1. Fetch | `gh issue view` | Issue summary |
| 2. Analyze | Search codebase | Affected files list |
| 3. Assess | Evaluate dimensions | Feasibility rating |
| 4. Determine | Choose path | Plan/Clarification/Warning |
| 5. Checkpoint | Ask user | Approval to proceed |
| 6. Implement | Code changes | Working fix |
| 7. Complete | Show diff | PR or next steps |

## Common Mistakes

### Starting implementation without checkpoint
- Problem: Wasted effort if approach is wrong
- Fix: Always present plan and wait for approval

### Skipping codebase analysis
- Problem: Miss dependencies, break other features
- Fix: Always check related files and recent commits

### Underestimating complexity
- Problem: Get stuck mid-implementation
- Fix: Be conservative in complexity ratings

### Auto-committing or pushing
- Problem: User loses control
- Fix: Never commit/push without explicit approval

## Safety Measures

**Never:**
- Auto-commit or push without approval
- Work directly on main/master
- Skip the user checkpoint
- Force-push without explicit request

**Always:**
- Create feature branches
- Present plan before implementing
- Run tests before declaring done
- Show diff summary at completion

## Integration

**Pairs with:**
- **finishing-a-development-branch** - After implementation complete
- **systematic-debugging** - If issue involves complex bug
- **creating-github-issues** - For creating new issues (opposite workflow)
