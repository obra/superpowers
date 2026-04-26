# Superpowers Workflow Graph

This file defines the workflow linkage between all superpowers skills. Referenced by `using-superpowers`.

## Primary Workflow (New Project / Major Feature)

```
using-superpowers (entry point)
        │
        ▼
brainstorming ←─ product-requirements (if no PRD)
        │              │
   mcu-selection       │ (PRD)
   (if embedded)       │
        │              ▼
        │         test-cases
        │              │
        ▼              │
writing-plans ◄────────┘
        │
        ├──► subagent-driven-development (recommended)
        │         │
        │    using-git-worktrees
        │    careful / freeze / karpathy-guidelines
        │    test-driven-development ← test-cases
        │    verification-before-completion
        │    requesting-code-review → receiving-code-review
        │         │
        │         ▼
        │    finishing-a-development-branch
        │
        └──► executing-plans (alternative)
                  │
             (same quality chain as above)
```

## Debugging Branch

```
systematic-debugging (on any bug/failure)
        │
        ├── freeze (lock scope to fault module FIRST)
        ├── careful (if hw register / flash operations)
        │
        ▼ Phase 1-3: Root cause investigation
        │
        ▼ Phase 4: Implementation
        ├── test-driven-development (create failing test)
        │     └── test-cases (if available, use as RED input)
        └── verification-before-completion (confirm fix)
```

## Test Chain (Requirements → Verification)

```
product-requirements
        │ (acceptance criteria)
        ▼
test-cases (generate structured test cases)
        │ (test case list)
        ├──► test-driven-development (RED: use as first failing tests)
        └──► verification-before-completion (GREEN: all must pass)
```

## Skill Development Branch

```
writing-skills (TDD for documentation) ◄──► skill-creator (evaluate, benchmark, optimize)
```

## Entry Routing

| Task type | Route to | Skip when |
|-----------|----------|-----------|
| New project, unclear requirements | `product-requirements` → `brainstorming` | Task scope ≤3 files AND no new hardware |
| Feature to add, requirements clear | `brainstorming` | Mechanical change (rename, config) |
| Bug / test failure | `systematic-debugging` + `freeze` | Never skip |
| Embedded/hardware project | `mcu-selection` during `brainstorming` | MCU already chosen |
| Need new capability | `find-skills` → `skill-install` | N/A |
| Create/edit a skill | `writing-skills` → `skill-creator` | N/A |
