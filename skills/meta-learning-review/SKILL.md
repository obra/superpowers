---
name: meta-learning-review
description: Use when you want to review captured learnings to detect patterns and suggest skill improvements or new skills. Handles learning decay (archives stale knowledge after 6 months). Triggered every 10 learnings or via /review-learnings command.
---

# Meta-Learning Review Skill

**Purpose:** Analyze captured learnings to identify patterns, suggest skill creation/enhancement, and manage learning decay.

## When to Use

- Explicit: `/review-learnings` command
- Automatic: Every 10 learnings captured
- Manual: User asks to review patterns

## What It Does

1. Loads all learnings from `docs/learnings/`
2. Archives stale learnings (6+ months old) via promote-or-delete workflow
3. Detects patterns through tag clustering (threshold: 3+ learnings)
4. Cross-references with existing skills
5. Generates suggestions (new skills or skill enhancements)
6. Presents decision menu

---

## Execution Steps

### Step 1: Load and Age Learnings

```bash
# Find all non-archived learnings
LEARNINGS=$(find docs/learnings -maxdepth 1 -name "*.md" -type f 2>/dev/null)

if [ -z "$LEARNINGS" ]; then
  echo "No learnings found. Capture some first using /compound."
  exit 0
fi

LEARNING_COUNT=$(echo "$LEARNINGS" | wc -l | tr -d ' ')
echo "Found $LEARNING_COUNT learnings to analyze."
```

Run learning analyzer:

```bash
node skills/meta-learning-review/lib/learning-analyzer.js analyze
```

Output: JSON with patterns, stale learnings, suggestions

### Step 2: Handle Stale Learnings (Decay Management)

**For learnings older than 6 months, run promote-or-delete workflow:**

```markdown
# Stale Learnings Review (6+ months old)

Found {{STALE_COUNT}} learnings older than 6 months.

{{#STALE_LEARNINGS}}
### {{FILENAME}} ({{AGE}} months old)

**Tags:** {{TAGS}}
**Summary:** {{FIRST_LINE}}

**Action:**
- 'promote-{{INDEX}}' → Keep and mark as permanent pattern
- 'archive-{{INDEX}}' → Move to .archive/ (remove from active review)
- 'delete-{{INDEX}}' → Permanently delete

{{/STALE_LEARNINGS}}

Review stale learnings now? (y/n)
```

**If user chooses to review:**

For each stale learning:
- **Promote**: Add to a permanent reference or skill
- **Archive**: Move to `docs/learnings/.archive/`
- **Delete**: Remove entirely

### Step 3: Detect Patterns

**Tag clustering with threshold of 3+ learnings:**

```bash
# Patterns detected (3+ learnings with same primary tag)
node skills/meta-learning-review/lib/learning-analyzer.js patterns
```

Output:
```json
{
  "patterns": [
    {
      "tag": "yaml",
      "count": 5,
      "learnings": ["2026-01-01-yaml-validation.md", ...]
    }
  ]
}
```

### Step 4: Cross-Reference with Skills

**Check if patterns match existing skills:**

```bash
# For each pattern, find matching skill (if any)
node skills/meta-learning-review/lib/learning-analyzer.js match-skills
```

Output:
- Pattern has matching skill → Suggest enhancement
- Pattern has no matching skill → Suggest new skill

### Step 5: Present Decision Menu

```markdown
# Meta-Learning Review

**Learnings analyzed:** {{TOTAL}}
**Stale learnings handled:** {{ARCHIVED}}
**Patterns detected:** {{PATTERN_COUNT}}

---

## Detected Patterns

### 1. {{PATTERN_NAME}} ({{COUNT}} learnings)

{{#IF_NEW_SKILL}}
**No matching skill found**
**Suggestion:** Create skill "{{PROPOSED_NAME}}"

**Source learnings:**
- {{LEARNING_FILES}}

**Actions:**
- 'create-1' → Generate skill proposal
- 'defer-1' → Save for later
- 'dismiss-1' → Ignore
{{/IF_NEW_SKILL}}

{{#IF_ENHANCEMENT}}
**Existing skill:** {{SKILL_NAME}}
**Suggestion:** Add {{PATTERN_NAME}} section

**Actions:**
- 'apply-1' → Enhance {{SKILL_NAME}}
- 'defer-1' → Save for later
- 'dismiss-1' → Ignore
{{/IF_ENHANCEMENT}}

---

**Your choice:**
```

Use **AskUserQuestion** tool for this menu.

### Step 6: Handle User Decisions

**Create Proposal:**
```bash
PROPOSAL_FILE="docs/skill-proposals/$(date +%Y-%m-%d)-{{PROPOSED_NAME}}.md"
# Write proposal with learnings as RED phase scenarios
echo "✓ Proposal created: $PROPOSAL_FILE"
echo "Next: Use superpowers:writing-skills to implement"
```

**Apply Enhancement:**
```bash
# Add section to existing skill
cat >> "skills/{{SKILL_NAME}}/SKILL.md" << 'CATEOF'

### Pattern: {{PATTERN_NAME}}
[Content from learnings]
CATEOF
```

**Archive Stale Learning:**
```bash
mv "docs/learnings/{{FILE}}" "docs/learnings/.archive/"
git add docs/learnings/
git commit -m "docs: archive stale learning {{FILE}}"
```

---

## Success Criteria

- ✅ All learnings loaded and parsed
- ✅ Stale learnings (6+ months) handled via promote-or-delete
- ✅ Patterns detected (threshold: 3+ learnings with same tag)
- ✅ Cross-reference with existing skills complete
- ✅ Suggestions generated and presented
- ✅ User decisions applied (create/enhance/defer/dismiss)
- ✅ Changes committed

---

## Error Handling

**No learnings:**
```
No learnings found. Use /compound to capture knowledge first.
```

**No patterns (< 10 learnings):**
```
No patterns detected ({{COUNT}} learnings).
Meta-learning works best with 10+. Keep capturing, then run again.
```

---

## Integration

**Triggered by:**
- `/review-learnings` command
- Every 10 learnings (automatic)
- Monthly check (if learnings exist)

**Invokes:**
- `superpowers:writing-skills` (for skill proposals)
