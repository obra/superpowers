---
name: brainstorming
description: |
  Collaborative design exploration before implementation. Use when asked to
  "brainstorm", "design a feature", "explore ideas", "plan before coding",
  or before any creative work like creating features, building components,
  or adding functionality.
---

# Brainstorming Ideas Into Designs

Transform ideas into validated designs through structured dialogue. Ask one question at a time, present designs in 200-300 word sections, and validate incrementally.

## Workflow

### Phase 1: Understand Context

1. Review current project state (files, docs, recent commits)
2. Ask one question per message to refine the idea
3. Prefer multiple-choice questions when possible
4. Focus on: purpose, constraints, success criteria

### Phase 2: Explore Approaches

5. Propose 2-3 approaches with trade-offs
6. Lead with recommended option and explain reasoning
7. Confirm direction before proceeding

### Phase 3: Present Design

8. Present design in 200-300 word sections
9. After each section, ask: "Does this look right so far?"
10. Cover: architecture, components, data flow, error handling, testing
11. Revisit earlier sections if clarification needed

### Phase 4: Document

12. Write validated design to `docs/plans/YYYY-MM-DD-<topic>-design.md`
    - See [references/design-template.md](references/design-template.md) for structure
13. Use elements-of-style:writing-clearly-and-concisely skill if available
14. Commit the design document to git

### Phase 5: Handoff (Optional)

15. Ask: "Ready to set up for implementation?"
16. Use superpowers:using-git-worktrees for isolated workspace
17. Use superpowers:writing-plans for detailed implementation plan

## Guidelines

- **One question per message** - Avoid overwhelming with multiple questions
- **Multiple-choice preferred** - Easier to answer than open-ended
- **YAGNI ruthlessly** - Remove unnecessary features from designs
- **Validate incrementally** - Check understanding after each section

## Reference Files

| File | Purpose |
|------|---------|
| [references/design-template.md](references/design-template.md) | Design document structure |
| [references/example-session.md](references/example-session.md) | Sample brainstorming dialogue |
