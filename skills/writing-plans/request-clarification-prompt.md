# Request Clarification Prompt Template

Use this template for the orchestrator's request clarification phase. Codebase exploration is delegated to a subagent; this template guides the overall flow.

## When to Use

Run this phase BEFORE any context gathering (Phase 1-3). This is the validation gate.

## Clarification Flow

### Step 1: Analyze the Request

Read the user's request carefully. Look for:
- **Clear goal**: Is the purpose explicit (new feature, refactor, bug fix, performance)?
- **Defined scope**: Are boundaries mentioned (files, areas, what's out of scope)?
- **Success criteria**: How will "done" be measured?
- **Constraints**: Timeline, dependencies, technical limitations?

### Step 2: Dispatch Exploration Subagent

Before asking questions, dispatch a single Explore subagent:

```
Task(
  description="Explore project structure",
  prompt=[Use ./clarification-explorer-prompt.md template with user's request],
  subagent_type="Explore",
  model="haiku"
)
```

Wait for subagent to return findings. This takes 30 seconds max.

### Step 2b: Write Exploration Handoff

Write subagent's returned findings to `docs/handoffs/context-clarification-exploration.md`.

The orchestrator will use these findings to:
- Design context-aware questions (not generic templates)
- Detect ambiguities based on existing project patterns
- Inform the ask/proceed decision

### Step 3: Detect Ambiguity

Flag requests that have:
- **Semantic ambiguity**: Multiple valid interpretations
- **Vague terminology**: "improve", "better", "user-friendly", "robust"
- **Missing scope boundaries**: No explicit in/out of scope
- **Unclear success criteria**: No measurable definition of done
- **Assumption gaps**: Technical details left unstated

### Step 4: Decide: Ask or Proceed

**Ask questions when:**
- Request is ambiguous (multiple valid interpretations)
- Scope boundaries are unclear
- Success criteria are vague
- First-time pattern in this codebase

**Proceed without asking when:**
- All Six Questions unambiguously answered in user's request (Why/What/Who/Where/When/How)
- User explicitly said "don't ask, just plan"
- User provided comprehensive spec document AND you verified it addresses all Six Questions

### Step 5: Ask Clarifying Questions (if needed)

Use AskUserQuestion with 2-3 focused questions. Examples:

**Goal clarification:**
```json
{
  "question": "What type of change is this?",
  "header": "Goal",
  "multiSelect": false,
  "options": [
    {"label": "New Feature", "description": "Building new functionality from scratch"},
    {"label": "Refactoring", "description": "Improving code without changing behavior"},
    {"label": "Bug Fix", "description": "Resolving specific issues or defects"},
    {"label": "Performance", "description": "Optimizing speed or resource usage"}
  ]
}
```

**Scope clarification:**
```json
{
  "question": "What's the expected scope of this change?",
  "header": "Scope",
  "multiSelect": false,
  "options": [
    {"label": "Small (1-3 files)", "description": "Focused changes to a limited area"},
    {"label": "Medium (5-15 files)", "description": "Multiple files, moderate complexity"},
    {"label": "Large (15+ files)", "description": "Significant changes across codebase"}
  ]
}
```

**Only ask what's actually unclear.** Don't ask questions if you already know the answer from the request or exploration.

### Step 6: Document Clarification

Write findings to `docs/handoffs/context-clarification.md`:

```markdown
# Request Clarification Summary

## Original Request
[User's request as stated]

## Request Analysis
- **Goal**: [Feature/Refactor/Fix/Performance]
- **Scope**: [Files/areas identified]
- **Success Criteria**: [How done is measured]
- **Constraints**: [Timeline, dependencies, limitations]

## Codebase Context (from shallow exploration)
- **Project type**: [What kind of project is this]
- **Key directories**: [Main code locations]
- **Related patterns**: [Existing similar code found]

## Exploration Handoff
See: `docs/handoffs/context-clarification-exploration.md`

## Clarifications Obtained
- [Question 1]: [User's answer]
- [Question 2]: [User's answer]

## Exploration Targets for Phase 1
Based on clarification, focus on:
1. [Specific aspect to explore]
2. [Specific aspect to explore]
3. [Specific aspect to explore]
```

## Anti-Patterns to Avoid

- **Generic templates**: Don't ask "Is there anything else?" Ask specific, context-aware questions.
- **Over-clarification**: Don't ask about every detail. 2-3 questions max.
- **Skipping exploration**: Always explore before asking so questions are targeted.
- **Proceeding with ambiguity**: If unclear, ask. Don't assume and proceed.
