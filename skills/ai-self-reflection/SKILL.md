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
4. Shows summary and asks how to handle them:
   - **Act on them now** (recommended): Present each learning and choose action (update CLAUDE.md, create skill, fix code, or save)
   - **Save for later**: Write all to docs/learnings/ without immediate action
   - **Skip**: Don't capture any learnings
5. Executes chosen actions for each learning
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
```

Use AskUserQuestion tool:

```json
{
  "questions": [{
    "question": "How should I handle these learnings?",
    "header": "Action",
    "multiSelect": false,
    "options": [
      {
        "label": "Act on them now (Recommended)",
        "description": "Review each learning and decide what to do (update docs, create skill, fix code, or save for later)"
      },
      {
        "label": "Save for later",
        "description": "Write all learnings to docs/learnings/ without immediate action"
      },
      {
        "label": "Skip",
        "description": "Don't capture any learnings from this session"
      }
    ]
  }]
}
```

If user chooses "Skip", exit skill.

If user chooses "Save for later", proceed to Step 4.

If user chooses "Act on them now", proceed to Step 3a.

### Step 3a: Act on Learnings Immediately

**For each detected learning:**

1. **Present the learning:**

```
## Learning {{N}} of {{TOTAL}}: {{BRIEF_SUMMARY}}

**Type:** {{TYPE}}

**What Happened:**
{{DESCRIPTION}}

**AI Assumption:**
{{ASSUMPTION}}

**Reality:**
{{REALITY}}

**Lesson:**
{{TAKEAWAY}}

**Suggested Action:**
{{SUGGESTED_ACTION}}
```

2. **Ask what to do with this learning:**

Use AskUserQuestion tool:

```json
{
  "questions": [{
    "question": "What should I do with this learning?",
    "header": "Action",
    "multiSelect": false,
    "options": [
      {
        "label": "Update CLAUDE.md",
        "description": "Add this pattern to project documentation"
      },
      {
        "label": "Create/update skill",
        "description": "Create a new skill or enhance an existing one"
      },
      {
        "label": "Fix code now",
        "description": "Make code changes to address this issue"
      },
      {
        "label": "Save for later",
        "description": "Just write to docs/learnings/ for future reference"
      },
      {
        "label": "Skip this one",
        "description": "Don't capture this particular learning"
      }
    ]
  }]
}
```

3. **Execute the chosen action:**

**If "Update CLAUDE.md":**
- Read CLAUDE.md to understand current structure
- Identify appropriate section (or create new section like "Common Patterns" or "Lessons Learned")
- Draft the addition showing context and lesson learned
- Use Edit tool to add to CLAUDE.md
- Write learning to docs/learnings/ with added note in Suggested Action section: "IMPLEMENTED: Added to CLAUDE.md on [DATE]"
- Continue to next learning

**If "Create/update skill":**
- Ask which skill to modify: Use AskUserQuestion with two options:
  - "Create new skill" - then ask for skill name suggestion
  - "Update existing skill" - then ask which skill name
- Invoke superpowers:writing-skills skill
- When writing-skills completes, return to ai-self-reflection workflow
- Write learning to docs/learnings/ with added note: "IMPLEMENTED: Created/updated [SKILL-NAME] skill on [DATE]"
- Continue to next learning

**If "Fix code now":**
- Show the suggested fix from the learning
- Ask user to confirm files to change or provide file paths
- Make the recommended code changes using Edit tool
- Write learning to docs/learnings/ with added note: "IMPLEMENTED: Fixed code in [FILES] on [DATE]"
- Continue to next learning

**If "Save for later":**
- Write this learning to docs/learnings/ without implementation notes
- Continue to next learning

**If "Skip this one":**
- Do NOT write this learning to docs/learnings/
- Continue to next learning

4. **Repeat for all learnings**

5. **After processing all learnings:**
- Count how many learnings were actually saved (excludes "Skip this one" choices)
- If count > 0, proceed to Step 5 (increment counter and commit)
- If count = 0, skip to success message: "Processed {{TOTAL}} learning(s), none were saved."

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
- ✅ Asks how to handle learnings (act now, save for later, or skip)
- ✅ For "Act on them now": presents each learning with full details
- ✅ For "Act on them now": offers action choices (update CLAUDE.md, create/update skill, fix code, save, skip)
- ✅ For "Act on them now": executes chosen actions (edits CLAUDE.md, invokes writing-skills, makes code fixes)
- ✅ For "Save for later": writes all to docs/learnings/ without interaction
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
