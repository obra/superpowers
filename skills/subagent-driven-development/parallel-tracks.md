# Parallel Tracks

Execute only the active PR boundary’s tracks. Check earlier-boundary dependencies against its starting commit before dispatch; missing work is a plan defect.

**Primary worktree ownership.** The orchestrator serializes merges, rebases, and primary-worktree task dispatches. No merge or rebase runs while a primary-worktree implementer, fixer, or reviewer is active. Serial fallback waits for those agents and queued branch operations to finish. Before rebasing a boundary, finish and merge its active tracks; queue the rebase until then. Revalidate affected evidence afterwards.

**Execution.** Walk the boundary’s dependencies:

1. When prerequisites are complete, create each ready track’s sub-worktree from the feature-branch head: `git worktree add <sdd-workspace>/tracks/<track-id> -b <feature-branch>--<track-id>`. Apply worktree-policy setup and record the base SHA.
2. At most 3 tracks run concurrently; a lower worktree-policy limit governs. Dispatch ready work within the harness’s free agent slots, counting reviewers and background monitors. Prioritize finishing active tasks and their reviews before opening more tracks.
3. Run tasks sequentially within each track, recording BASE/HEAD per task. Implementers, fixers, and reviewers work in that track’s worktree. Briefs, reports, review packages, and the ledger use absolute paths in the primary SDD workspace.
4. Queue a completed track for merge. When primary-worktree ownership permits, merge with `--no-ff`, record the merge SHA, then remove its sub-worktree and branch. A textual conflict is a plan defect: stop, do not hand-resolve, and report the conflicting paths and declarations to your human partner.
5. After every track at the fork has merged, dispatch its integration task in the primary worktree with the merged tracks' report paths; each report carries a `## Decisions & drift risks` section for the integrator to reconcile.

**Ledger and recovery.** Append each track’s agent, worktree, base SHA, completed head, and merge SHA as they become available; each `Next:` line aggregates pending events. After interruption, reconcile recorded agents and Git state before dispatching or merging again; a completed merge awaiting cleanup must not restart the track.

**Failure semantics.** A BLOCKED track does not stop siblings; integration waits for all tracks. A worktree creation failure queues the affected track for serial fallback in the primary worktree; report the downgrade. Never reuse a partially created worktree or branch without inspecting it. Retain the ledger and reports through delivery; cleanup follows SDD's Ledger section.
