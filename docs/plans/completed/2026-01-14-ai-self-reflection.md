# AI Self-Reflection Implementation Plan

> **Status:** ✅ COMPLETED - 2026-01-14
>
> **Implementation:** All 9 tasks completed successfully. Created ai-self-reflection skill with three mistake detection types (user corrections, backtracking, repeated errors), integrated with verification-before-completion, added /ai-self-reflection and /retrospective commands, updated meta-learning infrastructure, created fast test suite, bumped version to 4.1.0.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create an AI self-reflection skill that analyzes sessions for mistakes (user corrections, backtracking, repeated errors) and captures learnings automatically.

**Architecture:** Skill analyzes conversation context after verification-before-completion, detects three mistake types using pattern matching, asks user for scope and confirmation, writes structured learnings to docs/learnings/ using same format as compound-learning, feeds into meta-learning-review for pattern detection.

**Tech Stack:** Markdown skill file, bash commands, YAML frontmatter, existing meta-learning infrastructure (learning-analyzer.js, meta-learning-state.js)

---

## Task 1: Create Core ai-self-reflection Skill

**Files:**
- Create: `skills/ai-self-reflection/SKILL.md`

**Step 1: Create skill directory**

```bash
mkdir -p ~/Dev/superpowers/skills/ai-self-reflection
```

**Step 2: Write the skill file**

Create the skill with YAML frontmatter and detection algorithms for each mistake type.

```markdown
---
name: ai-self-reflection
description: Use when verification-before-completion finishes or when analyzing the session for mistakes and capturing learnings. Detects user corrections, backtracking, and repeated errors to build institutional knowledge.
---

# AI Self-Reflection Skill

**Purpose:** Analyze the current session for mistakes and capture learnings automatically to prevent future errors.

## When to Use

- After `verification-before-completion` completes (automatic invocation)
- Via `/retrospective` command (manual trigger)
- When asked to "reflect on this session" or similar

## What It Does

1. Asks user for scope of analysis
2. Analyzes conversation for three mistake types
3. Extracts structured learnings from detected mistakes
4. Shows summary and asks for bulk confirmation
5. Writes learnings to docs/learnings/
6. Increments counter for meta-learning-review trigger

---

## Execution Steps

### Step 1: Determine Scope

**Ask user for analysis scope:**

Use AskUserQuestion tool:

```json
{
  "questions": [{
    "question": "What scope should I analyze for learnings?",
    "header": "Analysis scope",
    "multiSelect": false,
    "options": [
      {
        "label": "Since last verification",
        "description": "Analyze only the conversation since verification-before-completion last ran"
      },
      {
        "label": "Full session",
        "description": "Analyze the entire session from the beginning"
      }
    ]
  }]
}
```

Set scope based on user response.

### Step 2: Analyze for Mistakes

**Silently analyze the conversation within scope for three mistake types.**

Do NOT verbalize the analysis process. Just analyze internally.

#### Mistake Type A: User Corrections

**Pattern detection:**
- User message contains negation: "no", "don't", "wrong", "not what I", "actually"
- User message contains correction after AI action: "instead", "should be", "use X not Y"
- User explicitly references AI's previous action negatively

**Examples:**
- User: "No, the tests are in __tests__ not tests/"
- User: "Wrong, use yarn not npm"
- User: "Don't use that approach, do this instead"

**For each detected correction, extract:**
- AI's assumption (what AI thought)
- User's correction (what's actually correct)
- Context (when this applies)

#### Mistake Type B: Backtracking

**Pattern detection:**
- AI stated intention: "I'll", "Let me", "I expect", "This should"
- Tool call resulted in failure or unexpected output
- AI's next action was different approach (not just retry)

**Distinguish from normal iteration:**
- Normal: "Let me try A first, then B if needed" (uncertainty stated upfront)
- Mistake: "I'll do A" → fails → "Oh, I see I need B" (confident then surprised)

**For each detected backtrack, extract:**
- AI's assumption
- Reality (what actually happened)
- Corrected approach
- Signal (how to detect this upfront)

#### Mistake Type C: Repeated Errors

**Pattern detection:**
- Same or similar error occurs 2+ times in session
- Same tool fails with same error message
- Same class of error (e.g., "file not found" from different commands)

**For each repeated error, extract:**
- Error pattern description
- Number of occurrences
- Resolution (how to prevent it)

### Step 3: Show Summary and Confirm

**If no mistakes detected:**

```
✓ Session analyzed. No significant learnings detected.
```

Exit skill.

**If mistakes detected:**

Show summary:

```
# Session Retrospective

Found {{COUNT}} potential learning(s) from this session:

1. [Type: user-correction] {{BRIEF_SUMMARY_1}}
2. [Type: backtracking] {{BRIEF_SUMMARY_2}}
3. [Type: repeated-error] {{BRIEF_SUMMARY_3}}

Capture all learnings?
```

Use AskUserQuestion tool:

```json
{
  "questions": [{
    "question": "Should I capture these learnings?",
    "header": "Confirmation",
    "multiSelect": false,
    "options": [
      {
        "label": "Yes - capture all",
        "description": "Write all detected learnings to docs/learnings/"
      },
      {
        "label": "No - skip",
        "description": "Don't capture any learnings from this session"
      }
    ]
  }]
}
```

If user chooses "No", exit skill.

If user chooses "Yes", proceed to Step 4.

### Step 4: Create Learning Files

**For each detected learning:**

Create directory if needed:

```bash
mkdir -p ~/Dev/superpowers/docs/learnings
```

Generate filename:

```bash
DATE=$(date +%Y-%m-%d)
SUMMARY="[brief description from mistake]"
SLUG=$(echo "$SUMMARY" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\+/-/g' | sed 's/^-\|-$//')
FILE="~/Dev/superpowers/docs/learnings/${DATE}-${SLUG}.md"
```

Write learning file with YAML frontmatter:

```yaml
---
date: [DATE]
type: user-correction | backtracking | repeated-error
source: ai-detected
confidence: high | medium | low
tags: [relevant, tags, from, context]
project: superpowers
---

# [One-line summary]

## What Happened

[Brief description of the mistake]

## AI Assumption

[What the AI expected/believed]

## Reality

[What actually happened]

## Lesson

[The takeaway - what to do differently]

## Context

[When this applies - codebase-specific? General?]

## Suggested Action

[Optional: Proposed CLAUDE.md addition or skill modification]
```

**Confidence levels:**
- High: User explicit correction, repeated error 3+ times
- Medium: Clear backtracking with evidence
- Low: Ambiguous patterns

**Tag selection:**
- Extract from context (file operations, git, testing, etc.)
- Add tool name if relevant (tool:grep, tool:bash)
- Add "codebase-specific" if project-specific
- Add "general" if broadly applicable

### Step 5: Increment Counter

```bash
node ~/Dev/superpowers/lib/meta-learning-state.js record
COUNT=$(node ~/Dev/superpowers/lib/meta-learning-state.js count)
```

If count reaches 10:

```
💡 10 learnings captured! Run /review-learnings to detect patterns.
```

### Step 6: Commit Learnings

```bash
git add ~/Dev/superpowers/docs/learnings/*.md
git commit -m "docs: capture AI self-reflection learnings from session"
```

Report success:

```
✓ Captured {{COUNT}} learning(s):
- docs/learnings/[DATE]-[SLUG-1].md
- docs/learnings/[DATE]-[SLUG-2].md

These learnings will be analyzed by meta-learning-review for patterns.
```

---

## Success Criteria

- ✅ Asks user for scope (since last verification OR full session)
- ✅ Silently analyzes conversation for mistakes
- ✅ Detects user corrections, backtracking, repeated errors
- ✅ Shows summary with brief descriptions
- ✅ Asks bulk confirmation (capture all or skip)
- ✅ Writes YAML frontmatter with source:ai-detected
- ✅ Increments meta-learning counter
- ✅ Commits learnings to git
- ✅ Suggests meta-learning-review at 10 learnings

---

## Error Handling

**No mistakes detected:**
```
✓ Session analyzed. No significant learnings detected.
```

**User declines capture:**
```
Learnings not captured. You can run /retrospective again later.
```

**Git not available:**
```
⚠️  Learning files created but could not commit (git not available).
Created: docs/learnings/[FILES]
```

---

## Integration

**Triggered by:**
- verification-before-completion skill (automatic)
- `/retrospective` command (manual)
- User request to reflect

**Feeds into:**
- meta-learning-review (consumes ai-detected learnings)

**Uses:**
- lib/meta-learning-state.js (counter)
- docs/learnings/ (storage)
```

**Step 3: Verify file created**

```bash
ls -la ~/Dev/superpowers/skills/ai-self-reflection/SKILL.md
```

Expected: File exists

**Step 4: Commit**

```bash
git add ~/Dev/superpowers/skills/ai-self-reflection/
git commit -m "feat: add ai-self-reflection skill core"
```

---

## Task 2: Modify verification-before-completion to Invoke ai-self-reflection

**Files:**
- Modify: `skills/verification-before-completion/SKILL.md:133-145`

**Step 1: Read current verification skill**

```bash
cat ~/Dev/superpowers/skills/verification-before-completion/SKILL.md
```

**Step 2: Add ai-self-reflection invocation after compound-learning section**

Replace the "Optional: Capture Learning" section (lines 133-145) with:

```markdown
### Optional: Self-Reflection

```
✅ Verification complete!

Reflect on this session and capture learnings? (optional)

1. Yes - use ai-self-reflection
2. No - skip
```

If yes: Invoke ai-self-reflection skill.

Note: You can also manually trigger retrospection later with `/retrospective` command.
```

**Step 3: Verify change**

```bash
grep -A 5 "Self-Reflection" ~/Dev/superpowers/skills/verification-before-completion/SKILL.md
```

Expected: Shows new section with ai-self-reflection invocation

**Step 4: Commit**

```bash
git add ~/Dev/superpowers/skills/verification-before-completion/SKILL.md
git commit -m "feat: integrate ai-self-reflection with verification skill"
```

---

## Task 3: Create /retrospective Command

**Files:**
- Create: `commands/retrospective.md`

**Step 1: Create command file**

```bash
cat > ~/Dev/superpowers/commands/retrospective.md << 'EOF'
---
name: retrospective
description: Analyze session for mistakes and capture learnings
---

# Retrospective Command

Analyze the current session for mistakes and capture learnings.

## Usage

```bash
/retrospective
```

**REQUIRED SUB-SKILL:** superpowers:ai-self-reflection
EOF
```

**Step 2: Verify file created**

```bash
cat ~/Dev/superpowers/commands/retrospective.md
```

Expected: File contains REQUIRED SUB-SKILL reference

**Step 3: Commit**

```bash
git add ~/Dev/superpowers/commands/retrospective.md
git commit -m "feat: add /retrospective command"
```

---

## Task 4: Update meta-learning-review to Handle ai-detected Source

**Files:**
- Read: `skills/meta-learning-review/SKILL.md`
- Modify if needed: `skills/meta-learning-review/lib/learning-analyzer.js`

**Step 1: Verify learning-analyzer.js handles source field**

```bash
grep -n "source" ~/Dev/superpowers/skills/meta-learning-review/lib/learning-analyzer.js
```

Expected: Check if source field is already extracted in frontmatter parsing

**Step 2: Test learning-analyzer with ai-detected source**

Create test learning with source:ai-detected:

```bash
mkdir -p ~/Dev/superpowers/docs/learnings
cat > ~/Dev/superpowers/docs/learnings/2026-01-14-test-ai-detected.md << 'EOF'
---
date: 2026-01-14
type: user-correction
source: ai-detected
confidence: high
tags: [testing, file-operations]
---

# Test learning with ai-detected source

## What Happened
Test for analyzer.

## AI Assumption
Test assumption.

## Reality
Test reality.

## Lesson
Test lesson.
EOF
```

Run analyzer:

```bash
cd ~/Dev/superpowers && node skills/meta-learning-review/lib/learning-analyzer.js analyze
```

Expected: Output includes the test learning in analysis

**Step 3: Update learning-analyzer.js if needed**

If source field is not extracted, add to extractFrontmatter function:

```javascript
// Around line 19-39 in extractFrontmatter
// Ensure 'source', 'type', 'confidence' are extracted like 'tags' and 'workflow'
```

**Step 4: Clean up test file**

```bash
rm ~/Dev/superpowers/docs/learnings/2026-01-14-test-ai-detected.md
```

**Step 5: Commit if modified**

```bash
git add ~/Dev/superpowers/skills/meta-learning-review/lib/learning-analyzer.js
git commit -m "feat: ensure learning-analyzer handles ai-detected source"
```

---

## Task 5: Create Fast Test for ai-self-reflection Skill

**Files:**
- Create: `tests/claude-code/test-ai-self-reflection.sh`

**Step 1: Write test file**

```bash
cat > ~/Dev/superpowers/tests/claude-code/test-ai-self-reflection.sh << 'TESTEOF'
#!/bin/bash

source "$(dirname "$0")/test-helpers.sh"

echo "=== Test: ai-self-reflection skill ==="
echo ""

# Test 1: Verify skill can be loaded
echo "Test 1: Skill loading..."

output=$(run_claude "What is the ai-self-reflection skill? Describe its purpose briefly." 30)

if assert_contains "$output" "ai-self-reflection\|retrospective\|mistake" "Skill is recognized"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 2: Verify skill describes mistake types
echo "Test 2: Mistake types detection..."

output=$(run_claude "What types of mistakes does the ai-self-reflection skill detect?" 30)

if assert_contains "$output" "user.*correction\|backtrack\|repeated" "Mentions mistake types"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 3: Verify skill describes scope options
echo "Test 3: Scope selection..."

output=$(run_claude "In ai-self-reflection, what analysis scope options are available?" 30)

if assert_contains "$output" "verification\|full.*session\|scope" "Mentions scope options"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 4: Verify skill describes output format
echo "Test 4: Output format..."

output=$(run_claude "What format does ai-self-reflection use for captured learnings?" 30)

if assert_contains "$output" "YAML\|frontmatter\|ai-detected" "Mentions YAML and source field"; then
    : # pass
else
    exit 1
fi

echo ""
echo "=== All tests passed ==="
TESTEOF
```

**Step 2: Make test executable**

```bash
chmod +x ~/Dev/superpowers/tests/claude-code/test-ai-self-reflection.sh
```

**Step 3: Run the test**

```bash
cd ~/Dev/superpowers/tests/claude-code
./test-ai-self-reflection.sh
```

Expected: All tests pass

**Step 4: Commit**

```bash
git add ~/Dev/superpowers/tests/claude-code/test-ai-self-reflection.sh
git commit -m "test: add fast test for ai-self-reflection skill"
```

---

## Task 6: Update CLAUDE.md with New Skill

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Find the skills list in CLAUDE.md**

```bash
grep -n "Complete Skills List" ~/Dev/superpowers/CLAUDE.md
```

**Step 2: Add ai-self-reflection to the Meta-Learning section**

In the "Complete Skills List" section, under "Meta-Learning:", add:

```markdown
**Meta-Learning**:
- `ai-self-reflection` - Analyze session for mistakes (user corrections, backtracking, repeated errors), capture learnings automatically
- `meta-learning-review` - Analyze learnings, detect patterns, suggest skills. Handles decay (archives stale knowledge). Triggered every 10 learnings or via /review-learnings.
- `compound-learning` - Quick capture after verification. Builds searchable knowledge in docs/learnings/.
```

**Step 3: Update the workflow chain section**

Find the "Workflow Chain" section and add ai-self-reflection:

```markdown
8. `ai-self-reflection` → Automatic mistake detection and learning capture
9. `compound-learning` → Manual learning capture (alternative to ai-self-reflection)
10. `meta-learning-review` → Pattern detection across learnings
```

**Step 4: Verify changes**

```bash
grep -A 3 "ai-self-reflection" ~/Dev/superpowers/CLAUDE.md
```

Expected: Shows ai-self-reflection in both locations

**Step 5: Commit**

```bash
git add ~/Dev/superpowers/CLAUDE.md
git commit -m "docs: add ai-self-reflection to CLAUDE.md skills list"
```

---

## Task 7: Manual Integration Test

**Files:**
- None (manual testing in session)

**Step 1: Test manual invocation**

In a new Claude Code session:

```
User: Please use the ai-self-reflection skill to analyze this session.
```

Expected behavior:
1. Skill asks for scope (since last verification OR full session)
2. Analyzes conversation
3. Reports findings or "no learnings detected"

**Step 2: Test with deliberate mistake scenario**

Create a scenario with a user correction:

```
User: What files are in the tests directory?
[AI uses wrong path]
User: No, the tests are in tests/claude-code/ not just tests/
[AI corrects]
User: Now run /retrospective
```

Expected behavior:
1. Skill asks for scope
2. Detects the user correction about tests directory
3. Shows summary: "Found 1 potential learning (user-correction)"
4. Asks for confirmation
5. If confirmed, creates learning file in docs/learnings/

**Step 3: Verify learning file format**

```bash
cat ~/Dev/superpowers/docs/learnings/2026-01-14-*.md
```

Expected format:
- YAML frontmatter with source: ai-detected
- Sections: What Happened, AI Assumption, Reality, Lesson, Context
- Suggested Action (optional)

**Step 4: Verify counter increment**

```bash
node ~/Dev/superpowers/lib/meta-learning-state.js count
```

Expected: Count incremented by 1

**Step 5: Test verification integration**

In a session where verification-before-completion runs:

Expected behavior after verification:
- Skill suggests running ai-self-reflection
- User can choose yes/no

**Step 6: Clean up test learnings**

```bash
rm ~/Dev/superpowers/docs/learnings/2026-01-14-*.md
node ~/Dev/superpowers/lib/meta-learning-state.js reset
```

---

## Task 8: Update Plugin Version and Release Notes

**Files:**
- Modify: `.claude-plugin/plugin.json`
- Modify: `RELEASE-NOTES.md`

**Step 1: Update plugin version**

Current version: 4.0.6
New version: 4.1.0 (minor version bump for new feature)

```bash
cat > ~/Dev/superpowers/.claude-plugin/plugin.json << 'EOF'
{
  "name": "superpowers",
  "version": "4.1.0",
  "author": "Pieter",
  "description": "Skills-based workflow system for Claude Code"
}
EOF
```

**Step 2: Add to RELEASE-NOTES.md**

```bash
cat >> ~/Dev/superpowers/RELEASE-NOTES.md << 'EOF'

## 4.1.0 - 2026-01-14

### New Features
- **ai-self-reflection skill**: Automatic mistake detection and learning capture
  - Analyzes sessions for user corrections, backtracking, and repeated errors
  - Captures learnings in structured format (YAML frontmatter)
  - Integrates with verification-before-completion
  - Manual trigger via `/retrospective` command
  - Feeds into meta-learning-review for pattern detection

### Improvements
- verification-before-completion now suggests ai-self-reflection after completion
- meta-learning-review enhanced to handle ai-detected learnings

EOF
```

**Step 3: Verify changes**

```bash
cat ~/Dev/superpowers/.claude-plugin/plugin.json
tail -20 ~/Dev/superpowers/RELEASE-NOTES.md
```

Expected: Version updated to 4.1.0, release notes added

**Step 4: Commit**

```bash
git add ~/Dev/superpowers/.claude-plugin/plugin.json ~/Dev/superpowers/RELEASE-NOTES.md
git commit -m "chore: bump version to 4.1.0 for ai-self-reflection release"
```

---

## Task 9: Final Verification

**Files:**
- Run all tests

**Step 1: Run fast test suite**

```bash
cd ~/Dev/superpowers/tests/claude-code
./run-skill-tests.sh
```

Expected: All tests pass including new test-ai-self-reflection.sh

**Step 2: Verify git status**

```bash
cd ~/Dev/superpowers
git status
```

Expected: Working tree clean (all changes committed)

**Step 3: Verify all files created**

```bash
ls -la ~/Dev/superpowers/skills/ai-self-reflection/SKILL.md
ls -la ~/Dev/superpowers/commands/retrospective.md
ls -la ~/Dev/superpowers/tests/claude-code/test-ai-self-reflection.sh
```

Expected: All files exist

**Step 4: Create summary report**

```
✓ ai-self-reflection skill implementation complete

Created:
- skills/ai-self-reflection/SKILL.md
- commands/retrospective.md
- tests/claude-code/test-ai-self-reflection.sh

Modified:
- skills/verification-before-completion/SKILL.md
- CLAUDE.md
- .claude-plugin/plugin.json
- RELEASE-NOTES.md

Integration:
- Triggers after verification-before-completion
- Manual trigger via /retrospective
- Feeds into meta-learning-review
- Shares infrastructure with compound-learning

Next steps:
- Update plugin: /plugin update superpowers
- Test in real sessions
- Monitor learning quality (review docs/learnings/ after use)
```

---

## Success Criteria Summary

- ✅ ai-self-reflection skill created with all three mistake detection types
- ✅ Skill uses YAML frontmatter format compatible with meta-learning
- ✅ Integration with verification-before-completion complete
- ✅ /retrospective command created
- ✅ Fast test created and passing
- ✅ CLAUDE.md updated with skill documentation
- ✅ Plugin version bumped and release notes updated
- ✅ All changes committed to git
- ✅ Manual integration test successful
