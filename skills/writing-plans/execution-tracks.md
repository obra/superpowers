# Execution Tracks

```markdown
## Execution Tracks

| Track | PR | Tasks | Depends on | Files touched (summary) | Why safe |
|---|---|---|---|---|---|
| serial-1 | 1 | 1–2 | — | shared types, API contract | mainline (contract freeze) |
| backend | 1 | 3–6 | serial-1 | src/server/** | disjoint from frontend, e2e-specs |
| frontend | 1 | 7–9 | serial-1 | src/app/settings/** | disjoint from backend, e2e-specs |
| e2e-specs | 1 | 10 | serial-1 | e2e/** | disjoint from backend, frontend |
| serial-2 | 1 | 11 | backend, frontend, e2e-specs | (integration) | merge point |
```

- Track ids are kebab-case branch/worktree names. `serial-N` tracks run in the primary worktree, named tracks in sub-worktrees.
- Each track belongs to one PR boundary; all its tasks and its fork’s integration task stay within that boundary. Tasks appear once, in numeric order within each track.
- `Depends on` names tracks, forming a DAG. Earlier-boundary dependencies must be present in the starting commit. Within the active boundary, a track is ready when all its dependencies are complete, with any per-task reviews clean.

- **Disjoint file sets.** No file is created or modified by two concurrent tracks, including tests, fixtures, and generated-file sources.
- **No contract-shaped work in tracks.** Migrations, shared schema, shared types, and shared API contracts belong in a mainline task before the fork — the **contract-freeze** pattern. A track consumes the frozen contract; it never changes it.
- **No cross-track interfaces.** Concurrent tracks cannot consume each other’s outputs. Shared inputs come from a mainline task before the fork.
- **Threshold.** Use a separate worktree for at least two tasks or one substantial task when overlap saves enough time to justify setup and coordination.
- **Every fork closes with a mainline integration task.** The orchestrator merges; the task does not. It runs the integration scope — targeted cross-package checks and E2E over the merged tracks' seams, within SDD's verification scope, never workspace-wide — and fixes what breaks. Its dispatch carries the merged tracks' report paths, whose `Decisions & drift risks` sections it reconciles.
