# Orchestration System Design

**Date:** 2025-10-23
**Status:** Approved Design
**Priority:** Performance + Reliability

---

## Overview

The orchestration system transforms Claude Code into a delegating orchestrator that routes tasks to specialist agents, each expert in one superpowers skill. This preserves orchestrator context while ensuring systematic application of skills.

**Core Principle:** If a skill exists for a task, delegate to a specialist. Never handle complex work directly.

---

## Architecture

### Components

1. **Orchestrator Agent (Main Claude)**
   - Lives in user's project via SessionStart hook injection
   - Loads agent registry at session start (~2500 tokens)
   - Matches user requests to specialist agents
   - Manages workflows (sequential, parallel, adaptive)
   - Receives specialist reports privately
   - Only handles trivial tasks (no specialist match)

2. **Agent Registry** (`lib/agent-registry.json`)
   - Auto-generated from skills
   - 20 specialist metadata entries
   - ~2000 tokens (name, description, file path per agent)
   - Loaded at session start for skill matching

3. **Specialist Agents** (20 pre-generated)
   - One per skill in `agents/{skill-name}-specialist.md`
   - Contains: identity + full skill content + reporting template
   - Only loaded when Task tool spawns that specialist
   - Returns structured reports to orchestrator

4. **Build System** (`lib/generate-specialists.sh`)
   - Reads all `skills/*/SKILL.md`
   - Generates corresponding `agents/*-specialist.md`
   - Generates `lib/agent-registry.json`
   - Run before releases

### Flow

```
User Request
    ↓
Orchestrator (registry loaded)
    ↓
Match request to specialist(s)
    ↓
Task tool spawns specialist agent(s)
    ↓
Specialist loads skill + executes
    ↓
Specialist returns structured report (private)
    ↓
Orchestrator decides: show user / call another / done
```

---

## Orchestrator Behavior

### Mandatory Delegation Rule

```
CRITICAL: If a skill exists for this task, you MUST delegate.

Before ANY request:
1. Check agent registry for match
2. If match → Call specialist via Task tool
3. If NO match → Handle directly (coordination only)

NEVER rationalize "I'll do it myself" when specialist exists.
```

### Skill Matching

- **Semantic reasoning** against agent registry descriptions
- **Hybrid approach:** Project CLAUDE.md can define explicit rules, fallback to semantic matching
- **Examples:**
  - "Fix bug" → `systematic-debugging-specialist`
  - "Add feature" → `brainstorming-specialist`
  - "What's in this file?" → No specialist → Handle directly

### Multi-Skill Workflows

**Sequential:**
```
"Create auth feature"
→ brainstorming-specialist (design)
→ writing-plans-specialist (plan)
→ Present to user
```

**Parallel:**
```
"Fix 3 independent bugs"
→ systematic-debugging-specialist × 3 (parallel)
→ Synthesize results
```

**Adaptive:**
```
"Improve tests"
→ test-driven-development-specialist
→ Report reveals anti-patterns
→ testing-anti-patterns-specialist
→ Continue based on findings
```

### Loop Prevention

- Orchestrator tracks: `specialists_called_this_workflow[]`
- Before calling: check if already called
- If duplicate: escalate to user or call with different scope
- Maximum depth: 10 specialists per request
- Reset on new user request

---

## Specialist Agent Structure

### Template (`agents/{skill-name}-specialist.md`)

```markdown
---
name: {skill-name}-specialist
description: {from SKILL.md frontmatter}
model: sonnet
---

# {Skill Name} Specialist

You are a specialist whose sole purpose is to execute the **{skill-name}** skill.

## Your Identity
Expert in {skill-name} methodology. Follow skill process exactly.

## The Skill You Execute
{FULL CONTENT of skills/{skill-name}/SKILL.md}

## Reporting Requirements

After completion, provide structured report:

### 1. Summary
- Task completed
- Skill steps followed
- Actions taken (files, commands, decisions)
- Status: ✅ Success | ⚠️ Partial | ❌ Blocked

### 2. Recommendations
- Next skills to invoke
- Alternative approaches
- Improvements identified

### 3. Blockers & Questions
- Issues preventing completion
- Decisions requiring user input
- Clarifications needed

### 4. Context for Orchestrator
- State to preserve
- Files to watch
- Artifacts for other specialists

## Critical Rules
- Execute skill exactly as written
- Complete all checklist items
- Never skip steps
- Report honestly (don't fake success)
```

---

## Integration with Superpowers

### File Structure

```
superpowers/
├── agents/
│   ├── code-reviewer.md                     # existing
│   ├── brainstorming-specialist.md          # NEW (generated)
│   ├── systematic-debugging-specialist.md   # NEW (generated)
│   └── ... (18 more specialists)            # NEW (generated)
├── hooks/
│   └── session-start.sh                     # UPDATED
├── lib/
│   ├── generate-specialists.sh              # NEW
│   ├── agent-registry.json                  # NEW (generated)
│   └── orchestrator-instructions.md         # NEW
├── templates/
│   ├── project-claude-md.template           # NEW
│   └── specialist-agent.template            # NEW
└── skills/                                  # unchanged
```

### SessionStart Hook Update

`hooks/session-start.sh` injects:
1. Orchestrator instructions (`lib/orchestrator-instructions.md`)
2. Agent registry (`lib/agent-registry.json`)
3. Project CLAUDE.md (or default template)

Total load: ~2500 tokens

### Default Activation

**Orchestration is active by default when superpowers plugin is installed.**

- Zero user setup required
- Works in any project with superpowers
- Project CLAUDE.md starts minimal, grows with context
- User can customize via project CLAUDE.md

### Project CLAUDE.md Template

```markdown
# Project Instructions

This project uses Claude Code with Superpowers plugin.

## Project Context
[Populated with project-specific info as work progresses]

## Custom Rules
[Project-specific orchestration rules]

---
<!-- Orchestrator mode active via superpowers plugin -->
```

---

## Reliability & Error Handling

### 1. No Specialist Match
- Orchestrator handles directly
- Warns if task seems complex (>2 tool calls needed)

### 2. Specialist Reports Failure
- Read blocker from report
- Present to user: "Specialist encountered: {blocker}. How to proceed?"
- Wait for user guidance (no auto-retry)

### 3. Infinite Loop Prevention
- Track specialists called in workflow
- Detect duplicates before calling
- Escalate to user if duplicate detected
- Max depth: 10 specialists per request

### 4. Specialist Crashes
- Catch Task tool errors
- Inform user with error details
- Offer fallback: "I can attempt directly, or provide alternative approach"
- Do NOT silently retry

### 5. Conflicting Recommendations
- Detect when specialist recommendation conflicts with user constraints
- Present conflict: "Specialist recommends X, but you requested Y. Which?"
- Wait for user decision

### 6. Registry Load Failure
- Degrade gracefully to dynamic specialist construction (Approach A fallback)
- Warn user: "⚠️ Agent registry unavailable - using fallback mode"
- Recommend: "Run generate-specialists.sh to rebuild"

### 7. CLAUDE.md Conflicts
- **Priority order:**
  1. Orchestrator core rules (non-negotiable)
  2. Project CLAUDE.md (overrides)
  3. Specialist instructions (skill execution)
- If CLAUDE.md disables orchestration: honor but warn about skill loss
- If conflict with specific skill: ask user which to follow

---

## Performance Characteristics

### Token Usage (Session Start)
- Orchestrator instructions: ~500 tokens
- Agent registry: ~2000 tokens
- Project CLAUDE.md: ~100-500 tokens (grows over time)
- **Total:** ~2500-3000 tokens per session

### Token Usage (Per Task)
- Orchestrator overhead: Minimal (matching logic only)
- Specialist load: ~200-500 tokens (one skill content)
- Skills NOT loaded into orchestrator (major savings)

### Comparison to Current System
- **Current:** All 20 skills loaded into every conversation (~10,000+ tokens)
- **Orchestration:** Only registry loaded (~2000 tokens), specialists load on-demand
- **Savings:** ~8,000 tokens per session

---

## Implementation Components

### Files to Create

1. **`lib/generate-specialists.sh`** - Build script
   - Parse `skills/*/SKILL.md`
   - Generate `agents/*-specialist.md`
   - Generate `lib/agent-registry.json`

2. **`lib/orchestrator-instructions.md`** - Core orchestrator rules
   - Mandatory delegation rule
   - Skill matching logic
   - Workflow management
   - Error handling

3. **`templates/specialist-agent.template`** - Agent template
   - Used by generator script
   - Includes reporting requirements

4. **`templates/project-claude-md.template`** - Default project CLAUDE.md
   - Minimal starter template
   - User customizes over time

5. **`hooks/session-start.sh`** - Update existing hook
   - Load orchestrator instructions
   - Load agent registry
   - Load or create project CLAUDE.md

### Files to Generate (via script)

1. **`agents/*-specialist.md`** (20 files)
   - One per skill
   - Auto-generated from skills

2. **`lib/agent-registry.json`**
   - Metadata for all 20 specialists
   - Auto-generated from skills

---

## Success Criteria

1. **Performance:** Session start load ≤ 3000 tokens
2. **Reliability:** No infinite loops, graceful error handling
3. **Maintainability:** Skills and agents stay in sync automatically
4. **User Experience:** Zero setup, works immediately with superpowers
5. **Backward Compatible:** Existing superpowers usage unaffected

---

## Next Steps

1. Set up git worktree for implementation
2. Create implementation plan with detailed tasks
3. Build generator script
4. Create orchestrator instructions
5. Update session-start hook
6. Test with sample projects
7. Document for users
