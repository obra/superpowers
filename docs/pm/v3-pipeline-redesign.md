# Pipeline v3 Redesign — Reference Document

## Status: PLANNING (not yet implemented)

## User Feedback
- Break down the work into discrete tasks
- Focus on one item at a time (not all at once)
- The full plan is at `~/.claude/plans/bright-munching-hummingbird.md`

---

## Task Breakdown

### Task 1: Update CLAUDE.md with Vision + v3 Architecture
**Scope:** Rewrite the worktree CLAUDE.md to reflect:
- Organization HQ vision (scalable AI employee structure)
- 3 iterations + IP replacing 6 sequential phases
- OpenProject as mandatory (not optional)
- Updated SAFe alignment table
- Micro-sync protocol description
**File:** `/Users/milindbhat/Documents/dev_work/scaffolding-platform/.worktrees/dev-pipeline/CLAUDE.md`
**Status:** Not started

### Task 2: Create pipeline-v3-default.yaml
**Scope:** New pipeline template with:
- `iterations` array replacing `phases` array
- Per-iteration `teams` dict with task-level `requires`/`produces`
- `integration_point` definitions with artifact-glob triggers
- `openproject.enabled: true` (mandatory)
- Dependency-based task ordering
**File:** `~/.claude/skills/orchestration/templates/pipeline-v3-default.yaml`
**Dependencies:** None (can start first)
**Status:** Not started

### Task 3: Create micro-sync-template.md
**Scope:** Template for lightweight cross-team notifications (200 tokens max)
**File:** `~/.claude/skills/orchestration/templates/micro-sync-template.md`
**Dependencies:** None
**Status:** Not started

### Task 4: Rewrite orchestration/SKILL.md
**Scope:** Replace sequential phase loop with:
- Parallel task queue algorithm with dependency checking
- Micro-sync protocol
- Integration Point protocol (3 IPs replacing 5 phase-boundary syncs)
- Task-level state tracking
- Mandatory OP setup
**File:** `~/.claude/skills/orchestration/SKILL.md`
**Dependencies:** Task 2 (needs to know pipeline.yaml structure)
**Status:** Not started

### Task 5: Rewrite orchestrator.md agent
**Scope:** Update agent instructions for:
- Parallel task dispatch (not sequential phase dispatch)
- Micro-sync publishing/consuming
- Integration point facilitation
- Mandatory OP pre-flight
- Task-level state tracking
**File:** `~/.claude/agents/orchestrator.md`
**Dependencies:** Task 4 (implements what SKILL.md defines)
**Status:** Not started

### Task 6: Update openproject-sync/SKILL.md
**Scope:**
- Remove "optional" / "if enabled" language
- Add iteration version creation (3 per PI)
- Add dependency relation creation
- Add per-task WP status updates
- Replace phase-numbered events with iteration-scoped events
**File:** `~/.claude/skills/openproject-sync/SKILL.md`
**Dependencies:** Task 2 (needs iteration structure)
**Status:** Not started

### Task 7: Update Lead agent files (5 files)
**Scope:** Minor updates to each Lead:
- `product-lead.md` — iteration-scoped tasks, micro-sync publishing
- `design-lead.md` — split work across iterations, micro-sync
- `engineering-lead.md` — split work across iterations, micro-sync consuming
- `quality-lead.md` — split work across iterations
- `founder.md` — Integration Points replacing phases
**Dependencies:** Task 4 (needs to align with SKILL.md)
**Status:** Not started

### Task 8: Update supporting templates and skills
**Scope:** Update existing templates for iteration terminology:
- `program-board-template.md`, `pod-brief-template.md`, `retro-template.md`
- `iteration-plan-template.md`, `demo-template.md`
- `judgment-gates/SKILL.md`, `knowledge-compounding/SKILL.md`
- `context-management/SKILL.md`, `converge-diverge-protocol.md`
**Dependencies:** Task 4
**Status:** Not started

### Task 9: Update OP metrics buckets
**Scope:** Update `_load_metrics()` in op CLI for iteration-based phase names
**File:** `~/.claude/scripts/op`
**Dependencies:** None
**Status:** Not started

### Task 10: Validate with Sudoku test run
**Scope:** Run the full v3 pipeline on the Sudoku app at `~/Documents/dev_work/tbd/sudoku/`
**Dependencies:** All other tasks complete
**Status:** Not started

---

## Recommended Execution Order

```
Independent (can do first):
  Task 2 (pipeline-v3-default.yaml)
  Task 3 (micro-sync-template.md)
  Task 9 (OP metrics)

After Task 2:
  Task 1 (CLAUDE.md — references pipeline structure)
  Task 4 (SKILL.md — implements pipeline structure)
  Task 6 (OP sync — uses iteration structure)

After Task 4:
  Task 5 (orchestrator.md)
  Task 7 (Lead agents)
  Task 8 (supporting files)

After all:
  Task 10 (Sudoku test run)
```

---

## Architecture Summary

### v2.1 (Current — Sequential)
```
Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5 -> Phase 6
(all teams idle while one team works)
```

### v3 (Target — Parallel)
```
Iteration 1: Foundation          Iteration 2: Build              Iteration 3: Harden
┌────────┬────────┬─────┬─────┐  ┌────────┬────────┬─────┬─────┐  ┌────────┬────────┬─────┬─────┐
│Product │Design  │Eng  │Qual │  │Product │Design  │Eng  │Qual │  │Product │Design  │Eng  │Qual │
│research│design  │tech │test │  │refine  │mockups │arch │test │  │verify  │comply  │fix  │test │
│PM spec │system  │eval │plan │  │stories │        │impl │specs│  │coverage│check   │bugs │run  │
│WSJF    │        │scaff│     │  │        │        │     │     │  │notes   │        │     │demo │
└────────┴────────┴─────┴─────┘  └────────┴────────┴─────┴─────┘  └────────┴────────┴─────┴─────┘
         ▼ IP1: Spec Lock                 ▼ IP2: Feature Complete          ▼ IP3: Ship Decision
```

### Key Concepts
- **Micro-syncs**: 200-token notifications when a team publishes an artifact another team needs
- **Integration Points**: Full converge-diverge syncs at 3 dependency gates (not 5 phase boundaries)
- **Task dependencies**: Expressed as artifact globs (`requires: ["docs/pm/*-pm-spec.md"]`)
- **OpenProject**: Mandatory from pipeline start. Tracks iterations, tasks, dependencies, artifacts
