---
name: extract-boundary
description: >
  Extract boundary context and build a semantic ContextEnvelope for subagents.
  Maps technical dependencies (imports, types, contracts) AND semantic context
  (user story, acceptance criteria, flow context, constraints). Use before
  dispatching subagents to provide complete required context.
---

# Extract Boundary Context (Enhanced)

Extract the minimal context a subagent needs to work on specific files, including both technical dependencies and semantic understanding.

## Required Start

Announce: `I'm using extract-boundary to build a ContextEnvelope for the subagent.`

## ContextEnvelope Structure

The subagent prompt must include a structured preamble with:

### Semantic Context (NEW)
- **User Story:** title, actor, goal, value
- **Acceptance Criteria:** all ACs that must be implemented
- **Flow Context:** what triggers this component, what it triggers, where it appears in UI
- **Constraints:** what NOT to do, what patterns to follow

### Technical Context (existing)
- Direct imports (what it consumes)
- Exported types/interfaces (what it provides)
- Function signatures it calls from other modules

## Execution

1. Identify the files the subagent will modify.
2. Load the relevant spec/user story file.
3. Extract acceptance criteria using the spec parser (`lib/harness/completeness/spec-parser.ts`).
4. For each file, find:
   - Direct imports (what it consumes)
   - Exported types/interfaces (what it provides)
   - Function signatures it calls from other modules
5. Build the ContextEnvelope combining semantic + technical context.

## Subagent Prompt Template

```markdown
## Context: What You're Building

**User Story:** [title]
As a [actor], I want [goal], so that [value].

**Acceptance Criteria (ALL must be implemented):**
- AC-1: [description]
- AC-2: [description]

**Where This Fits:**
- Triggered by: [component/flow]
- Used by: [component/flow]
- Appears on: [page/route]

**Constraints:**
- Must NOT: [non-goals]
- Must follow: [patterns]

## Your Task

[task description]

## Files

- Modify: [files]
- Create: [files]

## Technical Dependencies

[existing extract-boundary output: types, interfaces, signatures]

## After Implementation

Run `npx ts-node tools/harness/cli.ts completeness --spec path/to/spec.md` to verify all ACs are implemented.
```

## Hard Rules

- Do NOT include full file contents — only signatures and types.
- Do NOT include implementation details from unrelated files.
- ALWAYS include acceptance criteria in the subagent prompt.
- Keep context under 200 lines per subagent.
- The subagent must know ALL ACs before starting work — never dispatch with partial context.
