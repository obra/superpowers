# Meta-Learning Review Skill Implementation Plan

> **Status:** ✅ COMPLETED - 2026-01-11
>
> **Implementation:** Self-learning system with meta-learning-review skill for pattern detection, compound-learning skill for quick capture, /review-learnings and /compound commands, learning decay management (6+ months), and integration with verification workflow.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a self-learning system that reviews captured learnings, detects patterns, suggests workflow improvements or new skills, and manages learning decay.

**Architecture:** Flat file structure in `docs/learnings/` with YAML frontmatter for categorization. Pattern detection via tag clustering. Learning decay automatically archives stale knowledge (6+ months). Uses bash for file operations, JavaScript for analysis.

**Tech Stack:** Bash, Node.js, Markdown, YAML frontmatter

---

## Prerequisites

Before starting, create the learnings directory:

```bash
mkdir -p docs/learnings
mkdir -p docs/learnings/.archive
mkdir -p docs/skill-proposals
```

Simple structure:
- All learnings in `docs/learnings/YYYY-MM-DD-topic.md`
- Archived learnings in `docs/learnings/.archive/`
- Tags in YAML frontmatter for categorization (no folder categories)

---

## Task 1: Create Skill Structure

**Files:**
- Create: `skills/meta-learning-review/SKILL.md`
- Create: `skills/meta-learning-review/lib/learning-analyzer.js`
- Create: `tests/claude-code/test-meta-learning-review.sh`

**Step 1: Create basic skill file**

Create `skills/meta-learning-review/SKILL.md`:

```markdown
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
cat >> "skills/{{SKILL_NAME}}/SKILL.md" << 'EOF'

### Pattern: {{PATTERN_NAME}}
[Content from learnings]
EOF

git add "skills/{{SKILL_NAME}}/SKILL.md"
git commit -m "docs: enhance {{SKILL_NAME}} with {{PATTERN_NAME}} pattern"
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
```

**Step 2: Create learning analyzer script**

Create `skills/meta-learning-review/lib/learning-analyzer.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LEARNINGS_DIR = 'docs/learnings';
const STALE_MONTHS = 6;

// Extract YAML frontmatter
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontmatter = {};
  match[1].split('\n').forEach(line => {
    const [key, value] = line.split(': ');
    if (key && value) {
      // Handle arrays: tags: [a, b, c]
      if (value.startsWith('[')) {
        frontmatter[key] = value.slice(1, -1).split(',').map(t => t.trim());
      } else {
        frontmatter[key] = value;
      }
    }
  });

  return frontmatter;
}

// Find all learning files (excluding .archive)
function findLearnings() {
  try {
    const result = execSync(
      `find ${LEARNINGS_DIR} -maxdepth 1 -name "*.md" -type f 2>/dev/null`,
      { encoding: 'utf8' }
    );
    return result.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

// Load and parse learnings
function loadLearnings() {
  return findLearnings().map(file => {
    const content = fs.readFileSync(file, 'utf8');
    const frontmatter = extractFrontmatter(content) || {};

    return {
      file,
      date: frontmatter.date || path.basename(file).split('-').slice(0, 3).join('-'),
      tags: frontmatter.tags || [],
      workflow: frontmatter.workflow || '',
      content: content.replace(/^---\n[\s\S]*?\n---\n/, '').trim()
    };
  });
}

// Identify stale learnings (6+ months old)
function findStaleLearnings(learnings) {
  const now = new Date();
  const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - STALE_MONTHS));

  return learnings.filter(learning => {
    const learningDate = new Date(learning.date);
    return learningDate < sixMonthsAgo;
  });
}

// Detect patterns via tag clustering
function detectPatterns(learnings, threshold = 3) {
  const tagCounts = {};
  const tagLearnings = {};

  learnings.forEach(learning => {
    learning.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      if (!tagLearnings[tag]) tagLearnings[tag] = [];
      tagLearnings[tag].push(learning.file);
    });
  });

  const patterns = Object.entries(tagCounts)
    .filter(([tag, count]) => count >= threshold)
    .map(([tag, count]) => ({
      tag,
      count,
      learnings: tagLearnings[tag]
    }))
    .sort((a, b) => b.count - a.count);

  return patterns;
}

// Match patterns with existing skills
function matchSkills(patterns) {
  const skills = execSync('find skills -name "SKILL.md" -type f', { encoding: 'utf8' })
    .trim()
    .split('\n');

  return patterns.map(pattern => {
    const matchingSkill = skills.find(skillFile => {
      const content = fs.readFileSync(skillFile, 'utf8').toLowerCase();
      return content.includes(pattern.tag.toLowerCase());
    });

    return {
      pattern,
      matchingSkill: matchingSkill ? path.dirname(matchingSkill).split('/').pop() : null,
      suggestion: matchingSkill ? 'enhance' : 'create'
    };
  });
}

// Main commands
const command = process.argv[2];

if (command === 'analyze') {
  const learnings = loadLearnings();
  const stale = findStaleLearnings(learnings);
  const active = learnings.filter(l => !stale.includes(l));
  const patterns = detectPatterns(active);
  const matched = matchSkills(patterns);

  console.log(JSON.stringify({ learnings: active.length, stale: stale.length, patterns, matched }, null, 2));

} else if (command === 'patterns') {
  const learnings = loadLearnings();
  const patterns = detectPatterns(learnings);
  console.log(JSON.stringify(patterns, null, 2));

} else if (command === 'stale') {
  const learnings = loadLearnings();
  const stale = findStaleLearnings(learnings);
  console.log(JSON.stringify(stale, null, 2));

} else {
  console.log('Usage: learning-analyzer.js [analyze|patterns|stale]');
  process.exit(1);
}
```

**Step 3: Make executable and test**

```bash
chmod +x skills/meta-learning-review/lib/learning-analyzer.js

# Test with sample learning
cat > docs/learnings/2026-01-01-test.md << 'EOF'
---
date: 2026-01-01
tags: [test, sample]
workflow: testing
---

# Test Learning
This is a sample.
EOF

node skills/meta-learning-review/lib/learning-analyzer.js analyze
```

Expected: JSON output with learning count

**Step 4: Create test**

Create `tests/claude-code/test-meta-learning-review.sh`:

```bash
#!/bin/bash

source "$(dirname "$0")/test-helpers.sh"

test_name="meta-learning-review skill"

# Create sample learnings
mkdir -p docs/learnings

for i in 1 2 3; do
  cat > "docs/learnings/2026-01-0${i}-yaml-issue.md" << EOF
---
date: 2026-01-0${i}
tags: [yaml, debugging]
workflow: systematic-debugging
---

# YAML Issue ${i}
EOF
done

prompt="Use meta-learning-review to analyze docs/learnings/"

run_claude "$prompt"

# Should detect yaml pattern (3 learnings)
if echo "$output" | grep -q "yaml"; then
  pass "$test_name"
else
  fail "$test_name"
fi

rm -rf docs/learnings
```

**Step 5: Commit**

```bash
git add skills/meta-learning-review/ tests/claude-code/test-meta-learning-review.sh
git commit -m "feat: add meta-learning-review skill (RED phase)"
```

---

## Task 2: Create Compound Learning Capture

**Files:**
- Create: `skills/compound-learning/SKILL.md`
- Create: `commands/compound.md`
- Create: `lib/meta-learning-state.js` (track count)

**Step 1: Create compound-learning skill**

Create `skills/compound-learning/SKILL.md`:

```markdown
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

```
Solution verified! Capture learning? (30 sec)

1. Yes - quick capture
2. No - skip
```

If yes:

```
What did you learn? (one sentence)
> [Summary]

Tags (comma-separated): yaml, debugging, api
> [Tags]

Workflow: [systematic-debugging, test-driven-development, etc.]
> [Workflow]
```

### Step 3: Create Learning File

```bash
DATE=$(date +%Y-%m-%d)
SLUG=$(echo "$SUMMARY" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
FILE="docs/learnings/$DATE-$SLUG.md"

cat > "$FILE" << EOF
---
date: $DATE
tags: [$TAGS]
workflow: $WORKFLOW
---

# $SUMMARY

## Problem
[From conversation history]

## Solution
[From verified fix]

## Prevention
[How to avoid]
EOF

echo "✓ Learning captured: $FILE"
```

### Step 4: Increment Counter

```bash
node lib/meta-learning-state.js record

COUNT=$(node lib/meta-learning-state.js count)

if [ "$COUNT" -ge 10 ]; then
  echo ""
  echo "💡 10 learnings captured! Run /review-learnings to detect patterns."
fi
```

### Step 5: Commit

```bash
git add "$FILE"
git commit -m "docs: capture learning about $SUMMARY"
```

## Success Criteria

- ✅ Only after verification (evidence first)
- ✅ Quick (<30 seconds)
- ✅ YAML frontmatter with tags
- ✅ Auto-increments counter
- ✅ Easy to skip
```

**Step 2: Create state tracker**

Create `lib/meta-learning-state.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');

const STATE_FILE = '.claude/meta-learning-state.json';

function loadState() {
  if (!fs.existsSync(STATE_FILE)) {
    return { count: 0, lastReview: null };
  }
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

function saveState(state) {
  const dir = require('path').dirname(STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

const command = process.argv[2];

if (command === 'record') {
  const state = loadState();
  state.count++;
  saveState(state);
  console.log(`Recorded. Count: ${state.count}`);
} else if (command === 'count') {
  console.log(loadState().count);
} else if (command === 'reset') {
  saveState({ count: 0, lastReview: new Date().toISOString() });
  console.log('Reset complete');
} else {
  console.log('Usage: meta-learning-state.js [record|count|reset]');
  process.exit(1);
}
```

**Step 3: Create /compound command**

Create `commands/compound.md`:

```markdown
---
name: compound
description: Capture learnings after solving problems
---

# Compound Command

Quick learning capture.

## Usage

```bash
/compound
```

**REQUIRED SUB-SKILL:** superpowers:compound-learning
```

**Step 4: Make executable and commit**

```bash
chmod +x lib/meta-learning-state.js

git add skills/compound-learning/ commands/compound.md lib/meta-learning-state.js
git commit -m "feat: add compound-learning skill for quick capture"
```

---

## Task 3: Create /review-learnings Command

**Files:**
- Create: `commands/review-learnings.md`

**Step 1: Create command**

Create `commands/review-learnings.md`:

```markdown
---
name: review-learnings
description: Review learnings to detect patterns and suggest skills
---

# Review Learnings Command

Analyze captured learnings for patterns.

## Usage

```bash
/review-learnings
```

**REQUIRED SUB-SKILL:** superpowers:meta-learning-review

Will:
1. Handle stale learnings (6+ months)
2. Detect patterns (3+ learnings with same tag)
3. Suggest new skills or enhancements
4. Present decision menu
```

**Step 2: Commit**

```bash
git add commands/review-learnings.md
git commit -m "feat: add /review-learnings command"
```

---

## Task 4: Integration and Testing

**Files:**
- Modify: `skills/verification-before-completion/SKILL.md` (add capture prompt)
- Modify: `~/Dev/superpowers/CLAUDE.md` (document new features)
- Create: `tests/claude-code/test-meta-learning-integration.sh`

**Step 1: Add prompt to verification skill**

Add to `skills/verification-before-completion/SKILL.md` before final step:

```markdown
### Optional: Capture Learning

```
✅ Verification complete!

Capture any learnings? (optional)

1. Yes - use compound-learning
2. No - skip
```

If yes: Invoke compound-learning skill.
```

**Step 2: Update CLAUDE.md**

Add to skills section in `~/Dev/superpowers/CLAUDE.md`:

```markdown
### Meta-Learning

- `meta-learning-review` - Analyze learnings, detect patterns, suggest skills. Handles decay (archives stale knowledge). Triggered every 10 learnings or via /review-learnings.
- `compound-learning` - Quick capture after verification. Builds searchable knowledge in docs/learnings/.
```

**Step 3: Create integration test**

Create `tests/claude-code/test-meta-learning-integration.sh`:

```bash
#!/bin/bash

source "$(dirname "$0")/test-helpers.sh"

test_name="meta-learning integration"

mkdir -p docs/learnings

# Create 5 YAML learnings (pattern threshold = 3)
for i in {1..5}; do
  cat > "docs/learnings/2026-01-0${i}-yaml-${i}.md" << EOF
---
date: 2026-01-0${i}
tags: [yaml, debugging]
workflow: systematic-debugging
---

# YAML Issue ${i}
EOF
done

# Test pattern detection
prompt="Use meta-learning-review to analyze learnings"
run_claude "$prompt"

if echo "$output" | grep -qi "yaml.*5"; then
  pass "$test_name"
else
  fail "$test_name"
fi

rm -rf docs/learnings
```

**Step 4: Run tests**

```bash
cd ~/Dev/superpowers/tests/claude-code
./test-meta-learning-review.sh
./test-meta-learning-integration.sh
```

Expected: All pass

**Step 5: Commit**

```bash
git add skills/verification-before-completion/SKILL.md CLAUDE.md tests/claude-code/test-meta-learning-integration.sh
git commit -m "feat: integrate meta-learning with verification workflow"
```

---

## Completion Checklist

- ✅ `meta-learning-review` skill with pattern detection
- ✅ Learning analyzer script (analyze, patterns, stale)
- ✅ Learning decay handling (6+ months → promote or archive)
- ✅ `compound-learning` skill for quick capture
- ✅ State tracker for auto-trigger (every 10 learnings)
- ✅ `/review-learnings` command
- ✅ `/compound` command
- ✅ Integration with `verification-before-completion`
- ✅ Tests passing
- ✅ Documentation updated

---

## Post-Implementation

1. Test full workflow (capture 5+ learnings, run /review-learnings)
2. Update plugin version in `.claude-plugin/plugin.json`
3. Add entry to `RELEASE-NOTES.md`
4. Run full test suite
5. Merge to main via `finishing-a-development-branch`