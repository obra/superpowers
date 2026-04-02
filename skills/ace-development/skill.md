---
description: "ACE Paradigm 3: Develop ACE framework using superpowers chain + evolution闭环"
---

# ACE Paradigm 3 - ACE Development

Improve ACE framework using official superpowers skills, with ACE evolution闭环.

## When to Use

- User wants to improve ACE core (evolution/, composition/, workflow/)
- User wants to add new /ace:* commands
- User wants to enhance node/workflow framework
- User is modifying ACE source code
- Task targets ACE framework itself, not user workflows/devices

## Workflow

### Phase 1: Design (Superpowers)

1. **Invoke superpowers:brainstorming**
   - Explore project context (ACE codebase)
   - Ask clarifying questions
   - Propose 2-3 approaches
   - Present design sections
   - Get user approval
   - Write spec to docs/superpowers/specs/YYYY-MM-DD-<feature>-design.md

2. **Invoke superpowers:writing-plans**
   - Create implementation plan
   - Bite-sized tasks (2-5 min each)
   - Exact file paths, complete code, test commands
   - Save to docs/superpowers/plans/YYYY-MM-DD-<feature>-plan.md

### Phase 2: Execute (Superpowers)

3. **Invoke superpowers:executing-plans OR superpowers:subagent-driven-development**
   - Execute tasks from plan
   - Follow exact steps
   - Run verifications
   - Frequent commits

### Phase 3: Evolution闭环 (ACE)

4. **ACE Evolution Integration**
   - Execution produces traces at ~/.ace/traces/
   - Run pattern extraction: /ace-evolve
   - Create/update insights from development traces
   - If patterns detected → promote to L2 insights
   - Update CLAUDE.md if principles emerge

5. **Complete (Superpowers)**
   - Invoke superpowers:finishing-a-development-branch
   - Verify tests pass
   - Present merge options
   - Execute user choice

## Output Paths

- Specs: docs/superpowers/specs/YYYY-MM-DD-<feature>-design.md
- Plans: docs/superpowers/plans/YYYY-MM-DD-<feature>-plan.md
- Traces: ~/.ace/traces/ (auto-generated)
- Insights: ~/.ace/insights/ (auto-generated)

## Key Principles

- Superpowers for development rigor (TDD, systematic, verifiable)
- ACE evolution for learning from development traces
- Both frameworks complement each other

## Canonical Statements

- "Developing ACE framework using superpowers with evolution闭环..."
- "Design phase: invoking superpowers:brainstorming..."
- "Execution phase: invoking superpowers:executing-plans..."
- "Evolution phase: extracting patterns from development traces..."
