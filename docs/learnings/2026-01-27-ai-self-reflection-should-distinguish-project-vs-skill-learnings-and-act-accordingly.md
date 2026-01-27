---
date: 2026-01-27
type: user-correction
source: ai-detected
confidence: high
tags: [ai-self-reflection, learnings, workflow, categorization, meta-learning]
project: superpowers
---

# AI Self-Reflection Should Distinguish Project vs Skill Learnings and Act Accordingly

## What Happened

During ai-self-reflection skill execution in calendar-prep-mvp project, AI captured 4 learnings and asked user "How should I handle these learnings?" with three options: Act on them now, Save for later, or Skip.

User responded: "lets see what are applicable for the project and what are applicable for updating the skills."

This revealed that the ai-self-reflection skill should proactively categorize learnings and suggest appropriate actions based on whether they are:
1. **Project-specific** → Add to project's CLAUDE.md
2. **General patterns** → Update superpowers skills
3. **Platform issues** → File feedback (no action in skills)
4. **Reference documentation** → Keep as learning file

## AI Assumption

AI assumed all learnings should be handled uniformly through the three-option choice: "Act on them now", "Save for later", or "Skip".

## Reality

Learnings have different applicability scopes and should be categorized first:

**Learning Type Matrix:**

| Type | Scope | Suggested Action | Example |
|------|-------|-----------------|---------|
| **Project Architecture** | Project-specific | Add to project CLAUDE.md | AWS SAM template update guidelines |
| **General Workflow** | Cross-project | Update superpowers skill | Proactive test file cleanup after mocking |
| **Technical Pattern** | Reference only | Keep as learning file | MongoDB chainable mock pattern |
| **Platform Behavior** | Claude Code | File feedback, no skill update | Skill tool permission prompts |

## Lesson

**ai-self-reflection skill should add categorization step BEFORE asking "how to handle":**

### Enhanced Step 3: Show Summary and Categorize

```markdown
# Session Retrospective

Found {{COUNT}} potential learning(s) from this session:

## Project-Specific (→ CLAUDE.md)
1. [Template IAM issues] Update CloudFormation template proactively
   → Suggested: Add "Deployment Guidelines" section to CLAUDE.md

## General Patterns (→ Update Skills)
2. [Test file cleanup] Scan for redundant manual tests after mocking
   → Suggested: Enhance test-driven-development skill
3. [Skill invocation prompts] Should not require permission
   → Suggested: Platform feedback (not actionable in skills)

## Reference Documentation (→ Keep as-is)
4. [MongoDB mock pattern] Chainable query mocking technique
   → Suggested: Keep as learning file for reference

---

How would you like to proceed?

1. Implement all suggestions (project + skills)
2. Project updates only (CLAUDE.md)
3. Skill updates only (superpowers)
4. Custom selection
5. Save all for later without action
6. Skip all
```

**Categorization criteria:**

**Project-specific (CLAUDE.md):**
- Mentions project-specific tools (SAM, EventBridge, specific file paths)
- Architecture decisions for this codebase
- Deployment procedures unique to this project
- Configuration patterns specific to tech stack

**General workflow (Skills):**
- Applies across multiple projects
- About development process (testing, git, verification)
- About skill usage patterns
- About workflow discipline

**Platform issues:**
- About Claude Code behavior (not skill content)
- Tool limitations or bugs
- Permission/capability issues
- Requires Anthropic team action

**Reference documentation:**
- Technical patterns (mocking, testing techniques)
- Useful examples but not workflow guidance
- Could apply in many contexts
- Not urgent to add to docs

## Context

Applies to ai-self-reflection skill (Step 3). After detecting learnings, categorize them before asking user how to handle them.

Benefits:
- Clearer action plan
- User can approve categories in bulk
- Prevents mixing project-specific and general learnings
- Surfaces platform issues that need feedback

## Suggested Action

Update `superpowers:ai-self-reflection` skill's Step 3 to add categorization phase:

**New Step 3: Show Summary with Categorization**

1. Analyze each learning for scope (project/skill/platform/reference)
2. Group learnings by category
3. For each category, suggest appropriate action
4. Show categorized summary to user
5. Offer options:
   - Implement all suggestions
   - Project updates only
   - Skill updates only
   - Custom selection (proceed to Step 3a for each)
   - Save all for later
   - Skip all

**Categorization logic:**
```javascript
function categorizeLearning(learning) {
  const { context, suggestedAction, tags } = learning;

  // Project-specific indicators
  if (tags.includes('aws') || tags.includes('cloudformation') ||
      context.includes('project-specific') ||
      suggestedAction.includes('CLAUDE.md')) {
    return 'project';
  }

  // Skill update indicators
  if (tags.includes('workflow') || tags.includes('testing') ||
      suggestedAction.includes('skill') ||
      context.includes('cross-project')) {
    return 'skill';
  }

  // Platform issue indicators
  if (tags.includes('claude-code') || tags.includes('tool:') ||
      suggestedAction.includes('feedback') ||
      suggestedAction.includes('platform')) {
    return 'platform';
  }

  // Default to reference
  return 'reference';
}
```

This prevents the need for post-hoc categorization by user ("lets see what are applicable...") and provides clearer guidance upfront.