# Orchestrator Prompt — Team-Driven Development

Reference guide for the lead agent coordinating a team. Not dispatched as a subagent — this is your operating manual.

## Step-by-Step

### 1. Analyze Plan

Read plan file once. Extract ALL tasks with full text.
Build dependency graph:
- Explicit: "requires Task N", "after Task N"
- Implicit: shared files, output→input relationships

Group into parallel tracks. Count them.

If < 3 parallel tracks → recommend subagent-driven-development instead.

### 2. Assign File Ownership

For each task, list files created or modified.
Assign each file to exactly ONE teammate:
- New files → track that creates them
- Modified files → track with most edits to that file
- Shared types/interfaces → one track creates, others read-only

If ANY file must be edited by multiple tracks → switch to worktree mode (use superpowers:using-git-worktrees for per-teammate branches).

### 3. Size the Team

Count parallel tracks → one teammate per track.
Check: 5-6 tasks per teammate? If not, adjust:
- Too few tasks per teammate → reduce team size
- Too many → split tracks or add teammates

Cap at 5 teammates. Minimum 2.

### 4. Create Task List

TaskCreate for EVERY task:
- subject: "Task N: [name]"
- description: FULL task text from plan (don't make teammates read file)
- Set addBlockedBy for dependencies

All tasks start pending. Teammates self-claim.
Use TaskUpdate to manually unblock stuck tasks if needed.

### 5. Prepare Spawn Context

Write a spawn context block containing:
- Shared interfaces/contracts between tracks
- File ownership map: teammate → files they own
- Communication protocol summary
- Peer teammate names and their track focus

### 6. Create Team

Spawn each teammate with:
- Their track focus area
- Spawn context block
- Instructions to self-claim from shared task list
- For risky tracks: require plan approval mode
  - Set criteria: "only approve plans that [specific requirement]"

Lead's history does NOT carry over. Put everything in the spawn prompt.
Teammates auto-load CLAUDE.md, MCP servers, skills.

### 7. Monitor

- Idle notifications arrive automatically when teammates stop
- Route escalations promptly
- DO NOT implement tasks yourself — coordinate only
- If task appears stuck: check if work done, update TaskUpdate, or nudge
- Reuse idle teammates: assign them unblocked tasks from other tracks (update file ownership)

### 8. Integration Review

When all tasks complete:
- Dispatch integration reviewer with:
  - File ownership map
  - Shared context (interfaces/contracts)
  - git diff (base SHA → head SHA)
  - Original plan path
- Maximum 2 review rounds. Escalate to user if issues persist.

### 9. Cleanup

1. Send shutdown request to each teammate
2. Wait for approval (reject = still working, wait and re-request)
3. If unresponsive: advise user to tmux kill-session -t <name>
4. TeamDelete (fails if any teammates still running)
5. If worktree mode: merge branches, clean up worktrees
6. Invoke superpowers:finishing-a-development-branch
