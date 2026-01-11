---
name: compound-learning
description: Use when capturing learnings immediately after solving problems and verifying solutions work. Quick 30-second capture to build institutional knowledge.
---

# Compound Learning Skill

Quick learning capture after verification confirms fix works.

## When to Use

- After `verification-before-completion` passes
- After `/compound` command
- Only for non-trivial problems (not typos)

## Capture Process

### Step 1: Verify First (BLOCKING)

Only capture AFTER verification:
- ✅ Tests pass
- ✅ Evidence confirms solution
- ❌ NOT "I think this works"

### Step 2: Quick Capture

Present decision to user:

```
Solution verified! Capture learning? (30 sec)

1. Yes - quick capture
2. No - skip
```

If user chooses "Yes", gather the following (allow flexible input):

```
What did you learn? (one sentence)
> [User enters summary]

Tags (comma-separated, e.g., yaml, debugging, api)
> [User enters tags]

Workflow used (comma-separated, e.g., systematic-debugging, test-driven-development)
> [User enters workflows]
```

### Step 3: Create Learning File

Create directory if needed:

```bash
mkdir -p docs/learnings
```

Generate filename from summary:

```bash
DATE=$(date +%Y-%m-%d)
SUMMARY="[User's one-sentence learning]"
SLUG=$(echo "$SUMMARY" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\+/-/g' | sed 's/^-\|-$//')
FILE="docs/learnings/${DATE}-${SLUG}.md"
```

Create the learning file with YAML frontmatter and content structure:

```bash
cat > "$FILE" << 'EOF'
---
date: [DATE]
tags: [TAGS_AS_YAML_ARRAY]
workflow: [WORKFLOW_AS_YAML_ARRAY]
---

# [SUMMARY]

## Problem

[Extract relevant context from conversation history]

## Solution

[Extract the verified fix from conversation]

## Prevention

[Suggest how to avoid this in the future]
EOF
```

Example output:
```
✓ Learning captured: docs/learnings/2026-01-11-yaml-parsing-edge-case.md
```

### Step 4: Increment Counter

Record the learning and check if threshold reached:

```bash
node lib/meta-learning-state.js record
COUNT=$(node lib/meta-learning-state.js count)
```

If count reaches 10, suggest review:

```
💡 10 learnings captured! Run /review-learnings to detect patterns.
```

### Step 5: Commit Learning

```bash
git add "docs/learnings/[DATE]-[SLUG].md"
git commit -m "docs: capture learning about [SUMMARY]"
```

Report success:

```
✓ Committed: docs/learnings/[DATE]-[SLUG].md
```

## User Choices

**User chooses "No":**
```
Learning capture skipped. You can capture later with /compound.
```

**User has already run this in this session:**
```
Learning already captured in this session. Run /compound again to capture another.
```

## Success Criteria

- ✅ Only after verification (evidence first)
- ✅ Quick (<30 seconds)
- ✅ YAML frontmatter with tags and workflow arrays
- ✅ Auto-increments counter
- ✅ Easy to skip

## Error Handling

**docs/learnings directory doesn't exist:**
```bash
mkdir -p docs/learnings
```

**Git not available:**
```
⚠️  Learning file created but could not commit (git not available).
Created: docs/learnings/[DATE]-[SLUG].md
```

**State tracker fails:**
```
⚠️  Learning captured but counter update failed.
Created: docs/learnings/[DATE]-[SLUG].md
(Manual count: node lib/meta-learning-state.js count)
```
