# Team-Driven Development — Design Spec

**Date:** 2026-03-29
**Status:** Draft
**Approach:** Lightweight Team Layer (Approach 1)

## Goal

A new skill `team-driven-development` that enables parallel plan execution using Claude Code's experimental agent teams feature. Multiple teammates work simultaneously on independent tracks, communicate directly with each other, and coordinate through a shared task list — delivering faster execution than sequential subagent-driven-development while maintaining quality through an adaptive review strategy.

## Section 1: Skill Structure & Entry Point

### File Structure

```
skills/team-driven-development/
├── SKILL.md                        # Main skill reference
├── orchestrator-prompt.md          # Lead: analyzes plan, creates team, coordinates
├── team-implementer-prompt.md      # Team-aware implementer with communication protocol
├── integration-reviewer-prompt.md  # Reviews all agents' combined changes
```

### Frontmatter

```yaml
---
name: team-driven-development
description: Use when executing implementation plans with 3+ independent parallel tracks that benefit from inter-agent communication and coordination
---
```

### Prerequisites

- Claude Code v2.1.32 or later (`claude --version` to check)
- Agent teams enabled — set in environment or settings.json:
  ```json
  {
    "env": {
      "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
    }
  }
  ```
- Teammates inherit the lead's permission mode. Pre-approve common operations (file edits, bash commands) in permission settings before spawning to reduce interruptions.
- Teammates automatically load CLAUDE.md, MCP servers, and skills from the working directory — no need to manually provide project context.

### Display Mode (optional)

- **In-process (default):** All teammates run in main terminal. Use Shift+Down to cycle between them. Works in any terminal.
- **Split-pane:** Each teammate gets its own pane. Requires tmux or iTerm2 (with `it2` CLI installed and Python API enabled in iTerm2 settings).
- Configure globally in `~/.claude.json`:
  ```json
  {
    "teammateMode": "in-process"
  }
  ```
- Or per-session: `claude --teammate-mode in-process`
- Default `"auto"` uses split panes if already inside tmux, in-process otherwise.

### When to Use

```
Have a plan? → Are tasks mostly independent? → 3+ parallel tracks? → team-driven-development
                                             → 1-2 tracks         → subagent-driven-development
             → Tightly coupled?              → subagent-driven-development
```

### vs. Subagents (SDD)

| | Subagent-Driven Development | Team-Driven Development |
|---|---|---|
| **Context** | Own window; results return to controller | Own window; fully independent |
| **Communication** | Report back to controller only | Teammates message each other directly |
| **Coordination** | Controller manages all work | Shared task list with self-claiming |
| **Best for** | Sequential tasks, tight dependencies | Parallel work requiring discussion |
| **Token cost** | Lower (results summarized back) | Higher (each teammate = separate instance) |

### When NOT to Use

- Sequential tasks with heavy dependencies
- Same-file edits that can't be partitioned
- Fewer than 3 parallelizable tasks (overhead exceeds benefit)
- Routine/small tasks where token cost isn't justified

### Team Sizing

- **Minimum:** 2 teammates
- **Sweet spot:** 3-4 teammates
- **Maximum recommended:** 5 teammates
- **Tasks per teammate:** 5-6 keeps everyone productive without excessive context switching
- **Rule of thumb:** one teammate per independent track in the plan

### Platform Constraints

- One team per session — clean up current team before starting a new one
- Lead is fixed — the session that creates the team leads for its lifetime
- No nested teams — teammates cannot spawn their own teams
- No session resumption — `/resume` and `/rewind` do not restore in-process teammates. After resuming, lead must spawn new teammates.
- Split-pane mode not supported in VS Code integrated terminal, Windows Terminal, or Ghostty

### Platform Support

| Platform | Support | Notes |
|---|---|---|
| **Claude Code** | Full support | Requires v2.1.32+, experimental env var |
| **Cursor** | Discoverable, NOT executable | No `TeamCreate`/`SendMessage` equivalent. Use SDD or executing-plans. |
| **Codex** | Discoverable, NOT executable | No agent team primitives. Use SDD or executing-plans. |
| **OpenCode** | Discoverable, NOT executable | No agent team primitives. Use SDD or executing-plans. |
| **Gemini CLI** | Discoverable, NOT executable | Falls back to executing-plans, consistent with SDD/dispatching-parallel-agents handling. |

The SKILL.md should include a platform gate at the top:

```markdown
**Platform requirement:** This skill requires Claude Code with agent teams enabled.
On other platforms (Cursor, Codex, OpenCode, Gemini CLI), use
subagent-driven-development or executing-plans instead.
```

### Team Initiation

The lead creates the team based on orchestrator analysis. Alternatively, if the user describes a task that would benefit from parallel work, the lead may propose a team — but won't create one without user approval.

### Cost Awareness

Token usage scales linearly with team size. Use when parallelism saves more time than the tokens cost — typically plans with 3+ independent tracks of 2+ tasks each.

### Skill Discovery

Auto-discovery works on all platforms that scan the `skills/` directory:
- **Claude Code** — plugin.json references `./skills/`, new directory picked up automatically
- **Cursor** — plugin.json references `./skills/`, picked up automatically
- **Codex** — native SKILL.md frontmatter discovery, picked up automatically
- **OpenCode** — `superpowers.js` plugin registers skills directory via config hook, picked up automatically
- **Gemini CLI** — extension scans skills directory, picked up automatically

No registration changes needed on any platform.

---

## Section 2: Orchestrator Workflow

The orchestrator is the lead agent running in the main session. It coordinates the entire lifecycle from plan analysis through cleanup.

### Phase 1 — Analyze Plan

- Reads the plan file, extracts all tasks with full text
- Builds a dependency graph: which tasks depend on which
- Identifies parallel tracks: groups of tasks that can run simultaneously
- Counts parallelizable tracks — if fewer than 3, recommends SDD instead
- Determines team size: one teammate per independent track, capped at 5
- Calculates tasks-per-teammate ratio — aim for 5-6 each. If ratio is too low, reduce team size. If too high, consider splitting tracks.

### Phase 2 — Prepare Shared Context & Assign File Ownership

- Identifies shared interfaces between tracks (API contracts, data models, shared types)
- **Assigns file ownership per teammate** — each file has exactly one owner. No two teammates edit the same file. This is non-negotiable — parallel edits cause unpredictable overwrites.
- Writes a spawn context document containing:
  - Shared interfaces/contracts
  - File ownership map (teammate → files they may create/edit)
  - Communication protocol summary (when to message peers vs escalate to lead)
- Note: Project context (CLAUDE.md, MCP servers, skills) loads automatically for all teammates — only task-specific context needs to be in the spawn prompt.

### Phase 3 — Git Strategy

- **Default: File partitioning** — all teammates work on the same branch, each owning distinct files. Simpler, no merge step needed.
- **If file overlap is unavoidable:** Use `using-git-worktrees` to give each teammate its own branch. Lead merges at the end.
- Orchestrator decides which strategy based on file ownership analysis from Phase 2. If any task set can't be cleanly partitioned → worktree mode.

### Phase 4 — Create Team & Task List

- Creates the shared task list using `TaskCreate` for every task from the plan:
  - Each task includes full text description (don't make teammates read plan file)
  - Sets dependencies via `addBlockedBy` — the system auto-unblocks dependent tasks when predecessors complete
  - Tasks start as `pending` — teammates self-claim them
  - Task claiming uses **file locking** to prevent race conditions when multiple teammates try to claim the same task simultaneously
  - Lead can also **explicitly assign** tasks to specific teammates when domain expertise matters. Self-claim is the default; lead-assign is the fallback.
- Creates the team. Lead's conversation history does **not** carry over to teammates — all task-specific context must be in the spawn prompt. Each teammate receives:
  - Their track focus area and expertise
  - Spawn context doc (interfaces, file ownership map, communication protocol)
  - Instructions to self-claim tasks from the shared task list
  - Names of peer teammates for direct messaging
- **For risky or complex tracks:** Require plan approval mode — teammate plans in read-only before implementing. Lead reviews and approves or rejects with feedback. If rejected, the teammate **stays in plan mode**, revises based on feedback, and resubmits. Lead can influence approval criteria via the spawn prompt (e.g., "only approve plans that include test coverage" or "reject plans that modify the database schema").
- Parallel teammates spawn simultaneously

### Phase 5 — Monitor & Coordinate

- **Idle notifications:** When a teammate finishes their current work and goes idle, the lead is notified automatically. Lead checks if the teammate should claim more tasks, help another teammate, or shut down.
- **Peer messaging:** Teammates message each other directly for quick questions ("what field name did you use for userId?"). No bottleneck through the lead.
- **Broadcast:** For team-wide announcements (e.g., "shared interface changed, all teammates check"). Use sparingly — costs scale with team size.
- **Escalation:** Teammates escalate to lead for architectural decisions, file ownership conflicts, or questions peers can't resolve.
- **Lead stays hands-off:** Lead coordinates and routes, does NOT implement tasks itself. If the lead starts implementing instead of delegating, it should stop and wait for teammates. (Known platform behavior — lead sometimes starts coding instead of delegating.)
- **Task dependency flow:** When a teammate completes a task that others depend on, blocked tasks auto-unblock and become claimable. Lead does not need to manually dispatch.
- **Task status lag:** Teammates sometimes fail to mark tasks as completed, which blocks dependent tasks. If a task appears stuck, lead should check whether the work is actually done and update task status manually or nudge the teammate.
- **User can intervene directly:** User can message any teammate without going through the lead — use Shift+Down (in-process) or click into pane (split-pane) to redirect, give instructions, or ask questions.
- **Stuck teammates:** If a teammate appears stuck (idle notification without task completion, or prolonged silence), lead messages them directly, redirects their approach, or spawns a replacement to continue the work.

### Phase 6 — Integration Review

- All teammates complete all tasks → lead dispatches integration reviewer
- Integration reviewer checks cross-cutting concerns:
  - Consistent naming across all agents' work
  - API contracts honored between tracks
  - No file conflicts or inconsistencies
  - Cross-module data flow correctness
- If issues found → targeted fix: lead assigns specific files to a teammate (respecting file ownership) or spawns a focused fix agent

### Phase 7 — Cleanup & Finish

- Shut down all teammates first — lead sends shutdown request to each. Teammates approve and exit gracefully, or reject with explanation (e.g., still has work to finish).
- **All teammates must be shut down before cleanup.** `TeamDelete` fails if any are still running.
- If a teammate rejects shutdown, let them finish, then re-request.
- If a teammate is unresponsive, advise user to manually kill via `tmux kill-session -t <session-name>` for orphaned tmux sessions.
- **Permissions note:** Individual teammate modes can be changed after spawning if needed (e.g., granting a specific teammate more permissive file access), but per-teammate modes cannot be set at spawn time.
- Clean up team resources via `TeamDelete`
- If worktree mode was used → merge branches, clean up worktrees
- Invoke `finishing-a-development-branch`

### Optional: Quality Gate Hooks

For users who want automated enforcement, the skill recommends configuring these hooks:
- **`TeammateIdle`** — runs when a teammate goes idle. Exit code 2 sends feedback and keeps them working. Use for: ensuring teammates don't stop before all their tasks are done.
- **`TaskCreated`** — runs when a task is created. Exit code 2 prevents creation with feedback. Use for: enforcing task sizing or naming conventions.
- **`TaskCompleted`** — runs when a task is marked complete. Exit code 2 prevents completion with feedback. Use for: requiring tests pass before marking done.

### Storage Locations (for troubleshooting)

- Team config: `~/.claude/teams/{team-name}/config.json` — contains `members` array with each teammate's name, agent ID, and agent type
- Task list: `~/.claude/tasks/{team-name}/`
- Teammates can read the team config to discover other team members

### Process Flow

```
Read plan → Build dependency graph → Assign file ownership →
Choose git strategy → Create task list with dependencies →
Create team & spawn teammates → Monitor (idle notifications +
peer messaging + escalation) → Integration review →
Shut down teammates → TeamDelete → Finish
```

---

## Section 3: Communication Protocol

Defines how teammates, the lead, and the user communicate during execution. Every teammate receives this protocol in their spawn prompt.

### Three Communication Channels

| Channel | Mechanism | When to use |
|---|---|---|
| **Peer-to-peer** | `SendMessage` type `message` to named teammate | Quick questions between teammates working on related tracks |
| **Broadcast** | `SendMessage` type `broadcast` | Team-wide announcements (interface changes, blocking discoveries). Use sparingly — costs scale with team size. |
| **Escalate to lead** | `SendMessage` type `message` to lead | Architectural decisions, file ownership conflicts, anything peers can't resolve |

### When to Message a Peer

- You need information about a file or interface another teammate owns
- You're producing output another teammate will consume (e.g., "API endpoint is ready at /api/users, response shape is `{ id, name, email }`")
- You've discovered something that affects a specific teammate's work
- Quick clarifications that don't need the lead's judgment

### When to Broadcast

- A shared interface or contract has changed
- You've discovered a project-wide issue (e.g., "test database is down")
- The lead instructs you to announce something to all teammates

### When to Escalate to Lead

- You need to edit a file you don't own
- Two teammates disagree on an approach
- A task is blocked and no peer can unblock it
- You need an architectural decision that affects multiple tracks
- You're stuck and peers can't help — report as BLOCKED or NEEDS_CONTEXT

### Message Format Guidelines

- Use plain text, not structured JSON
- Messages are delivered automatically to recipients — no polling or checking required. Send and continue working.
- Be specific and actionable: "I need the response shape for GET /api/users" not "I have a question about the API"
- Include file paths when referencing code: "I exported UserType from src/types/user.ts — import it from there"
- Keep messages short — each message costs tokens for the recipient

### Communication Anti-Patterns

- **Don't broadcast what only affects one peer.** Direct message them instead.
- **Don't poll peers for status.** The task list tracks completion. Check there first.
- **Don't have extended conversations.** If a peer exchange goes past 2-3 messages without resolution, escalate to lead.
- **Don't message peers about tasks they don't own.** Check the file ownership map first.
- **Don't use the lead as a relay.** Message peers directly. Lead is for decisions, not routing.

### Lead's Communication Responsibilities

- Monitor for escalations and respond promptly
- Broadcast team-wide changes when needed
- Nudge teammates who appear stuck (idle without completing tasks)
- Never implement tasks — only coordinate
- When resolving disputes: make a decision, communicate it clearly, move on

### User's Communication Options

- **In-process mode:** Shift+Down to cycle through teammates, type to message directly. Press Enter to view a teammate's session, Escape to interrupt their current turn. Ctrl+T to toggle task list.
- **Split-pane mode:** Click into any teammate's pane to interact with their session directly.
- User can redirect, give instructions, or ask questions to any teammate without going through the lead.

---

## Section 4: Adaptive Review Strategy

Defines when and how work gets reviewed. The goal: catch problems early without creating bottlenecks that kill the speed advantage.

### Three Review Layers

| Layer | When | Mechanism | Purpose |
|---|---|---|---|
| **Plan approval** | Before implementation starts | Built-in plan mode | Catch direction problems before any code is written |
| **Self-review** | After every task | Inline in team-implementer prompt | Catch obvious issues without dispatching a reviewer |
| **Integration review** | After all teammates finish | Dedicated reviewer agent | Catch cross-cutting issues that no single agent can see |

### Layer 1 — Plan Approval (selective)

Not every teammate needs this. Use plan approval mode for:
- Tracks touching core architecture or shared infrastructure
- Tracks where a wrong approach would be expensive to undo
- First-time patterns the team hasn't established yet

Skip plan approval for:
- Straightforward tasks with clear specs (add a test file, create a component matching existing patterns)
- Tracks where the plan already specifies exact implementation details

The orchestrator decides at spawn time by adding plan approval to the teammate's spawn configuration. Lead reviews and approves or rejects with feedback. Rejected teammates stay in plan mode, revise, and resubmit. Approved teammates proceed to implementation.

Lead can set criteria in the spawn prompt: "only approve plans that include test coverage" or "reject plans that touch files outside your ownership."

### Layer 2 — Self-Review (every task)

Every teammate self-reviews after completing each task. This is built into the team-implementer prompt — no separate agent dispatch needed. The self-review checklist:

- **Completeness:** Did I implement everything in the task spec? Did I miss edge cases?
- **Quality:** Are names clear? Is the code clean and maintainable?
- **Discipline:** Did I stay within my file ownership? Did I avoid overbuilding (YAGNI)?
- **Testing:** Do tests verify behavior? Did I follow TDD if required?
- **Contracts:** Does my work honor the shared interfaces from the spawn context?

If self-review finds issues, the teammate fixes them before marking the task complete. No external reviewer needed.

Plan approval and self-review are not redundant. Plan approval validates *what* the teammate will build. Self-review validates *how* they built it. A teammate who went through plan approval still self-reviews every task.

For automated enforcement, the `TaskCompleted` hook can prevent a task from being marked complete unless criteria are met (e.g., tests pass, linting clean). This complements self-review with hard gates.

### Layer 3 — Integration Review (once, at the end)

After all teammates complete all tasks, the lead dispatches an integration reviewer using `integration-reviewer-prompt.md`. This reviewer looks at the **combined** output of all agents.

The integration reviewer receives:
- The full file ownership map (to verify no violations)
- The shared context doc (interfaces/contracts)
- A git diff of all changes from all teammates (base SHA → head SHA)
- The original plan for spec compliance checking

Review checklist:

- **Contract compliance:** Do all tracks honor the shared interfaces? Does Track A's API output match what Track B's consumer expects? Are types compatible end-to-end?
- **Consistency:** Naming conventions, error handling patterns, logging formats consistent across all agents' work?
- **Conflict detection:** Any files edited by multiple agents despite ownership rules? Any semantic conflicts (e.g., two tracks defining the same constant differently)?
- **Data flow:** Does data flow correctly across track boundaries? Are there missing transformations?
- **Test coverage:** Do cross-track integration scenarios have test coverage?

If the integration reviewer finds issues:
- **Isolated to one track:** Lead assigns the fix to the teammate who owns those files
- **Cross-track:** Lead makes the architectural decision and assigns targeted fixes respecting file ownership
- **Systemic:** Lead may broadcast the pattern issue and have multiple teammates fix their respective files

### Review Limits

Maximum 2 integration review rounds. If critical issues persist after 2 rounds, the lead escalates to the user. Don't loop endlessly. Present what's working, what's not, and recommended next steps.

### Why Not Per-Task External Review?

SDD dispatches two reviewers (spec + quality) after every single task. With a team of 4 agents each doing 5 tasks, that's 40 reviewer dispatches. This:
- Creates massive token overhead
- Introduces serial bottlenecks (each agent waits for reviewers)
- Defeats the speed advantage of parallel execution

The adaptive strategy achieves comparable quality:
- Plan approval catches direction problems (replaces spec review for first task)
- Self-review catches implementation problems (fast, no dispatch)
- Integration review catches cross-agent problems (new capability SDD doesn't have)

Total review cost: N plan approvals (selective) + 0 external dispatches during execution + 1 integration review at the end.

---

## Section 5: Prompt Templates

Three prompt templates, each with a distinct role.

### 5a: `orchestrator-prompt.md`

The lead uses this as its operating guide. Not dispatched as a subagent — this is reference material for the lead itself.

**Contents:**
- Phase-by-phase workflow (Sections 1-4 condensed into actionable steps)
- Dependency graph analysis algorithm:
  - Parse plan tasks
  - Identify explicit dependencies ("requires Task N")
  - Identify implicit dependencies (shared files, output→input relationships)
  - Group independent tasks into parallel tracks
- File ownership assignment rules:
  - Each file gets exactly one owner
  - New files → assigned to the track that creates them
  - Existing files being modified → assigned to the track with the most edits
  - Shared types/interfaces → created by one track, read-only for others
  - If clean partitioning is impossible → switch to worktree mode
- Task list creation: use `TaskCreate` for each task with full text description, set `addBlockedBy` for dependencies. Tasks start `pending`. Teammates self-claim. Use `TaskUpdate` to manually unblock stuck tasks.
- Team sizing formula:
  - Count parallel tracks
  - Target 5-6 tasks per teammate
  - Cap at 5 teammates
  - Minimum 2 teammates (below this → use SDD)
- Spawn context template — what goes into each teammate's prompt
- Communication protocol summary to include in spawn prompts
- Plan approval criteria — when to require it, what to check
- Monitoring checklist — what to watch for during execution
- Integration review dispatch instructions
- Shutdown and cleanup sequence

### 5b: `team-implementer-prompt.md`

Dispatched to each teammate at spawn time. Adapted from SDD's `implementer-prompt.md` but team-aware.

```
You are a teammate on an agent team implementing [plan name].

## Your Track

[Track focus area and expertise]

## Your Tasks

Claim tasks from the shared task list. Work through them in dependency order.
When you finish a task, mark it complete and claim the next available one.

## Environment

Project context (CLAUDE.md, MCP servers, skills) loads automatically.
You don't need to ask for project setup information.

Task claiming is race-safe (file locking). If you and another teammate
try to claim the same task simultaneously, only one will get it.
The other should claim the next available task.

## File Ownership

You may ONLY create or edit these files:
[File ownership list]

Do NOT edit files outside your ownership. If you need a change to a file
you don't own, message the teammate who owns it.

## Shared Context

[Interfaces, contracts, data models all teammates need]

## Your Teammates

[Name — track focus — files they own]

Use SendMessage to communicate directly with peers.

## Communication Protocol

**Message a peer when:**
- You need info about a file or interface they own
- You've produced output they'll consume
- You've discovered something that affects their work

**Broadcast when:**
- A shared interface has changed (use sparingly)

**Escalate to lead when:**
- You need to edit a file you don't own
- You and a peer disagree on an approach
- You're blocked and no peer can help

Messages are delivered automatically. Send and continue working.
Keep messages short, specific, and actionable.
Don't poll peers for status — check the task list.
If a peer exchange goes past 2-3 messages without resolution, escalate to lead.

## Plan Approval

You may start in plan mode. If so, draft your implementation plan
and submit it. The lead will approve or reject with feedback. If
rejected, revise and resubmit. You stay in plan mode until approved.
Not all teammates require plan approval — the lead decides at spawn time.

## Before You Begin Each Task

If you have questions about requirements, approach, dependencies, or
anything unclear — ask now. Message a peer or escalate to lead.
Don't guess or make assumptions.

## While You Work

- Follow TDD if the plan specifies it
- Stay within your file ownership
- Honor shared interfaces from the spawn context
- If you encounter something unexpected, pause and ask

## Code Organization

- Follow the file structure defined in the plan
- Each file should have one clear responsibility with a well-defined interface
- If a file you're creating grows beyond the plan's intent, stop and report
  as DONE_WITH_CONCERNS — don't split files without plan guidance
- If an existing file you're modifying is already large or tangled, work
  carefully and note it as a concern in your report
- In existing codebases, follow established patterns

## Self-Review (after every task)

Before marking a task complete, review with fresh eyes:

- **Completeness:** Did I implement everything in the task spec?
- **Quality:** Are names clear? Is the code clean?
- **Discipline:** Did I stay within my file ownership? Did I avoid overbuilding?
- **Testing:** Do tests verify behavior?
- **Contracts:** Does my work honor the shared interfaces?

Fix issues before marking complete. Plan approval validates your approach;
self-review validates your implementation. Both matter.

Note: The TaskCompleted hook may enforce additional quality gates
(e.g., tests must pass before marking done). If your task completion
is rejected, fix the issue and try again.

## When You're In Over Your Head

It is always OK to stop and say "this is too hard for me." Bad work is
worse than no work.

STOP and escalate when:
- The task requires architectural decisions with multiple valid approaches
- You need to understand code beyond what was provided
- You feel uncertain about your approach
- The task involves restructuring outside your ownership

How to escalate: Message the lead with status BLOCKED or NEEDS_CONTEXT.
Describe what you're stuck on, what you've tried, and what help you need.

## Report Format (per task)

When done with each task:
- **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- What you implemented
- What you tested and results
- Files changed (must all be within your ownership)
- Self-review findings (if any)
- Any concerns or issues

Mark the task complete in the shared task list, then claim the next
available unblocked task.

## Shutdown

The lead may send you a shutdown request when your work is done.
- If you've completed all your tasks: approve and exit gracefully
- If you still have in-progress work: reject with explanation of what
  remains, finish the work, then approve on the next request
```

### 5c: `integration-reviewer-prompt.md`

Dispatched once after all teammates complete all tasks.

```
You are reviewing the combined output of an agent team that worked
in parallel on [plan name].

## What Was Built

[Summary of all tracks and what each teammate implemented]

## Review Inputs

- File ownership map: [who owned what]
- Shared context: [interfaces, contracts, data models]
- Git diff of all changes: [base SHA → head SHA]
- Original plan: [plan file path]

## Your Job

You are looking for problems that NO SINGLE AGENT could see — issues
that only appear when combining everyone's work.

**Contract compliance:**
- Do all tracks honor the shared interfaces?
- Does Track A's API output match what Track B's consumer expects?
- Are types compatible end-to-end across track boundaries?

**Consistency:**
- Naming conventions consistent across all agents' work?
- Error handling patterns consistent?
- Logging formats consistent?

**Conflict detection:**
- Any files edited by multiple agents despite ownership rules?
- Any semantic conflicts (e.g., two tracks defining same constant differently)?
- Any duplicate code that should be shared?

**Data flow:**
- Does data flow correctly across track boundaries?
- Are there missing transformations between what one track produces and
  another consumes?

**Test coverage:**
- Do cross-track integration scenarios have test coverage?
- Do tests from different tracks interfere with each other?

**Spec compliance:**
- Does the combined output satisfy the original plan's requirements?
- Is anything missing that no individual track was responsible for?

## Review Limits

Maximum 2 integration review rounds. If critical issues persist after
2 rounds, flag to the lead for user escalation. Don't loop endlessly.

## Report Format

- PASS — if everything checks out
- ISSUES FOUND:
  - **Critical** (must fix): [issue, affected files, which teammate should fix]
  - **Important** (should fix): [issue, affected files, recommendation]
  - **Minor** (suggestions): [observation, recommendation]

For each issue, specify which teammate's file ownership it falls under
so the lead can assign the fix correctly.
```

---

## Section 6: Error Handling & Limitations

### Teammate Failures

| Failure | Detection | Recovery |
|---|---|---|
| **Teammate stuck on a task** | Idle notification without task completion, or prolonged silence | Lead messages directly to diagnose. If unrecoverable, spawn replacement teammate with same file ownership and remaining tasks. |
| **Teammate goes off-direction** | User observes via Shift+Down or pane click, or integration review catches it | User or lead redirects. If significant rework needed, lead may shut down teammate, revert their changes, spawn replacement. |
| **Teammate stops on error** | Teammate reports BLOCKED or crashes silently | Lead checks output, provides additional context and re-dispatches, or spawns replacement. |
| **Teammate fails to mark task complete** | Dependent tasks stay blocked, no progress | Lead checks whether work is actually done. If yes, manually updates task status via `TaskUpdate`. If no, nudges teammate. |
| **Teammate edits file outside ownership** | Integration review detects, or git diff shows unexpected files | Revert unauthorized changes. Reassign fix to correct owner. Add explicit warning in future spawn prompts. |
| **Teammate claims task outside their track** | Task doesn't align with teammate's file ownership or expertise | Lead reassigns task via `TaskUpdate`. If work was already started on wrong files, revert and reassign to correct teammate. To prevent: include track-specific guidance in spawn prompt about which tasks to claim. |
| **Plan approval rejection loop (3+ rejections)** | Lead rejects teammate's plan repeatedly | After 3 rejections, lead provides the plan directly. If the teammate fundamentally misunderstands the task, shut down and spawn a replacement with more detailed context. |

### Communication Failures

| Failure | Detection | Recovery |
|---|---|---|
| **Peer message goes unanswered** | Sending teammate waits too long, escalates to lead | Lead checks if receiving teammate is stuck. Routes the answer or nudges the receiver. |
| **Broadcast causes confusion** | Multiple teammates react differently to same announcement | Lead follows up with direct messages to clarify per-teammate impact. |
| **Lead starts implementing instead of coordinating** | User notices lead writing code | User tells lead: "Wait for your teammates to complete their tasks before proceeding." |
| **Peer exchange exceeds 2-3 messages** | Teammates notice conversation isn't resolving | Either teammate escalates to lead for a decision. |

### Team-Level Failures

| Failure | Detection | Recovery |
|---|---|---|
| **File conflict despite ownership rules** | Integration review or git shows merge conflicts | Lead determines correct version, assigns fix to file owner. If in worktree mode, lead resolves merge using file ownership map to determine which teammate's version is authoritative. |
| **Git worktree merge conflicts** | Lead merges branches and encounters conflicts | Lead resolves using file ownership map. If conflicts span multiple files with unclear ownership, escalate to user. |
| **Shared interface mismatch** | Integration review finds contract violations | Lead updates the interface definition, broadcasts change, assigns fixes to affected teammates. |
| **Shared context becomes stale mid-execution** | Teammate changes an interface, peers work against old version | Teammate who changes an interface MUST broadcast immediately. Lead verifies affected teammates acknowledge. If a teammate missed the broadcast, lead messages them directly. |
| **All teammates finish but plan is incomplete** | Lead reviews task list against plan | Lead creates additional tasks and either assigns to existing teammates before shutdown or spawns new ones. |
| **Multiple teammates fail simultaneously** | Multiple BLOCKED reports or idle notifications at once | Lead triages: are failures related (shared dependency down) or independent? If related, fix root cause first, then re-dispatch. If independent, spawn replacements one at a time. |
| **TeamDelete blocks** | Cleanup hangs — teammate is unresponsive | Lead sends individual `shutdown_request` to each remaining teammate. If still unresponsive, advise user to kill via `tmux kill-session -t <session-name>`. Then retry cleanup. |
| **Session interrupted mid-execution** | User closes terminal, network drops, crash | On resume: `/resume` does NOT restore in-process teammates. Lead must spawn new teammates, check task list for incomplete tasks, and continue from where work stopped. Completed tasks remain completed. |
| **Too many permission prompts** | Teammates frequently paused waiting for permission approval | Pre-approve common operations in permission settings. Change individual teammate permission modes after spawn if specific teammates need broader access. |

### Integration Review Failures

| Failure | Detection | Recovery |
|---|---|---|
| **Critical issues found** | Integration reviewer reports Critical items | Lead assigns targeted fixes to file owners, re-runs integration review on changed files only. Maximum 2 rounds. |
| **Issues persist after 2 rounds** | Second integration review still has Critical items | Lead escalates to user. Don't loop endlessly. Present what's working, what's not, and recommended next steps. |
| **Integration reviewer misses issues** | User finds problems post-merge | Normal debugging flow — use `systematic-debugging` skill. |

### Known Platform Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| **Experimental feature** | May have undocumented edge cases, behavior may change | Pin to known-working Claude Code version. Test on non-critical work first. |
| **No session resumption** | `/resume` and `/rewind` don't restore teammates | Check task list on resume. Spawn fresh teammates for incomplete work. |
| **One team per session** | Can't run multiple teams simultaneously | Clean up current team before starting a new one. For very large projects, decompose into sequential team sessions. |
| **No nested teams** | Teammates can't spawn their own teams | Keep team structure flat. If a track needs sub-parallelism, break it into more tasks instead. |
| **Lead is fixed** | Can't promote teammate or transfer leadership | If lead context gets polluted, start a fresh session with a new team. |
| **Permissions set at spawn** | All teammates start with lead's permission mode | Pre-approve common operations before creating team. Change individual modes after spawn if needed. |
| **Split-pane terminal support** | Not supported in VS Code terminal, Windows Terminal, Ghostty | Use in-process mode as fallback. |
| **Token cost** | Scales linearly with team size | Right-size the team. Don't use 5 teammates for a 3-track plan. Monitor costs. |
| **Task status lag** | Teammates sometimes fail to mark tasks done | Lead monitors and manually updates when needed. |
| **Shutdown can be slow** | Teammates finish current request before shutting down | Allow time. Don't force-kill unless truly unresponsive. |

---

## Section 7: Integration with Existing Skills

### Skill Lifecycle Position

```
brainstorming → writing-plans → [EXECUTION] → finishing-a-development-branch
                                     ↑
                        Choose one:
                        • subagent-driven-development (sequential)
                        • executing-plans (parallel session)
                        • team-driven-development (parallel agents) ← NEW
```

### Upstream Skills (feed into team-driven-development)

| Skill | Relationship | How it connects |
|---|---|---|
| **brainstorming** | Produces the design spec | Team-driven reads the spec for context but doesn't modify it |
| **writing-plans** | Produces the plan | Team-driven consumes the plan as input. Plans require NO format changes — the orchestrator analyzes them at runtime. writing-plans should offer team-driven as a third handoff option alongside SDD and executing-plans. |
| **using-git-worktrees** | Creates isolated workspace | Orchestrator invokes when file partitioning isn't possible (Phase 3). Also used for the overall feature branch before the team starts. |

### Downstream Skills (team-driven invokes these)

| Skill | Relationship | How it connects |
|---|---|---|
| **finishing-a-development-branch** | Handles merge/PR/cleanup | Invoked in Phase 7 after TeamDelete. Same as SDD — presents the 4 options (merge, PR, keep, discard). |
| **test-driven-development** | Teammates follow TDD | Referenced in team-implementer prompt. Teammates use TDD when the plan specifies it. The skill loads automatically via CLAUDE.md/skills — no manual injection needed. |

### Peer Skills (alternatives, not dependencies)

| Skill | Relationship | When to use instead |
|---|---|---|
| **subagent-driven-development** | Sequential execution, one agent at a time | Fewer than 3 parallel tracks, tightly coupled tasks, lower token budget |
| **executing-plans** | Manual parallel sessions | User wants hands-on control, or platform doesn't support agent teams |
| **dispatching-parallel-agents** | Fire-and-forget parallel agents | Independent tasks that don't need inter-agent communication (e.g., parallel bug fixes, parallel reviews) |

### Skills Teammates Use Automatically

Teammates are full Claude Code sessions that load CLAUDE.md, MCP servers, and skills from the working directory:
- **test-driven-development** — available if teammates need it
- **systematic-debugging** — available if teammates hit bugs
- **verification-before-completion** — available for teammates to verify before marking tasks done

No special integration needed. These skills work because teammates are full sessions, not limited subagents.

### Skills That Are NOT Used

| Skill | Why not |
|---|---|
| **requesting-code-review / receiving-code-review** | Replaced by the adaptive review strategy (plan approval + self-review + integration review). Per-task external code review would bottleneck parallel execution. |
| **dispatching-parallel-agents** | Team-driven-development IS the parallel agent skill for plan execution. dispatching-parallel-agents remains for ad-hoc parallel work outside plan execution. |

### Required Change to writing-plans

The `writing-plans` skill currently offers two handoff options at completion:
1. subagent-driven-development (recommended)
2. executing-plans (alternative)

It needs a third option:
3. team-driven-development (for plans with 3+ parallel tracks; Claude Code only)

This is a one-line addition to writing-plans' handoff section, not a structural change. The orchestrator handles all the analysis — writing-plans just needs to mention it exists.

### Platform Support in Handoff

The writing-plans handoff should include the platform gate:
```
3. team-driven-development (for plans with 3+ parallel tracks; Claude Code only)
```

### Skill Discovery (using-superpowers)

The `using-superpowers` skill establishes the "1% rule" that makes Claude check for applicable skills. Since team-driven-development has proper frontmatter with a descriptive description, it will be found through normal skill discovery. No change to using-superpowers needed.

### Contributor Testing Guidance

Contributors who modify this skill should:
- Test with the existing test infrastructure in `tests/skill-triggering/` — add `team-driven-development` to the skill list in `run-all.sh`
- Add pressure test scenarios in `skills/team-driven-development/` following the writing-skills TDD pattern
- Test on Claude Code with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` enabled
- Verify the skill triggers correctly for plans with 3+ parallel tracks
- Verify the skill does NOT trigger for sequential plans or on non-Claude Code platforms

**No changes required to any other existing skill.**

---

## Section 8: Example Workflow

A concrete end-to-end example showing how team-driven development executes a plan.

**Scenario:** A plan for a task management API with 4 independent tracks and 18 tasks.

```
Plan: Task Management API
├── Track A: Database layer (5 tasks) — models, migrations, queries
├── Track B: REST API endpoints (5 tasks) — CRUD routes, validation, middleware
├── Track C: Frontend components (5 tasks) — list view, form, filters
├── Track D: Test infrastructure (3 tasks) — fixtures, helpers, integration tests
```

### Phase 1-2: Analyze & Prepare

```
Lead reads plan, identifies 4 parallel tracks.
18 tasks ÷ 4 teammates = 4-5 tasks each (within 5-6 target)

File ownership map:
  teammate-db:       src/models/*, src/migrations/*, src/queries/*
  teammate-api:      src/routes/*, src/middleware/*, src/validators/*
  teammate-frontend: src/components/*, src/hooks/*, src/pages/*
  teammate-tests:    tests/fixtures/*, tests/helpers/*, tests/integration/*

Shared interfaces:
  - Database model types (defined by teammate-db, consumed by all)
  - API response shapes (defined by teammate-api, consumed by teammate-frontend)
  - Test fixtures (defined by teammate-tests, consumed by teammate-api)
```

### Phase 3: Git Strategy

```
Lead: Can all tracks be cleanly partitioned?
  → teammate-db owns src/models/*, teammate-api owns src/routes/*, etc.
  → No file overlap.
  → Decision: file partitioning mode (no worktrees needed)

  (If teammate-api and teammate-frontend both needed to edit
  src/shared/types.ts, lead would switch to worktree mode —
  one branch per teammate, merge at the end.)
```

### Phase 4: Create Team & Task List

```
Lead creates 18 tasks via TaskCreate:
  Task 1: "Create User model" (Track A, no dependencies)
  Task 2: "Create Task model" (Track A, blocked by Task 1)
  Task 3: "Write migration scripts" (Track A, blocked by Tasks 1,2)
  Task 4: "Create GET /tasks endpoint" (Track B, blocked by Task 2)
  Task 5: "Create POST /tasks endpoint" (Track B, blocked by Task 2)
  ...
  Task 16: "Create test fixtures" (Track D, no dependencies)
  Task 17: "Create test helpers" (Track D, blocked by Task 16)
  Task 18: "Write integration tests" (Track D, blocked by Tasks 4,5,16,17)

Lead creates team with 4 teammates.
teammate-db spawned with: Track A tasks, file ownership, shared interfaces
teammate-api spawned with: Track B tasks, file ownership, plan approval required
teammate-frontend spawned with: Track C tasks, file ownership
teammate-tests spawned with: Track D tasks, file ownership

teammate-api gets plan approval because API shapes affect all other tracks.
Lead sets criteria: "Only approve plans that define response schemas
for all endpoints and include input validation."
```

### Phase 5: Execution

```
[All 4 teammates start simultaneously]

teammate-db: Claims Task 1 (Create User model) — no dependencies, starts immediately
teammate-api: Enters plan mode — drafts API design, submits to lead
teammate-frontend: Claims Task 8 (Create list view skeleton) — no dependencies
teammate-tests: Claims Task 16 (Create test fixtures) — no dependencies

[File locking]
teammate-db and teammate-tests both try to claim Task 16 simultaneously
  → File locking ensures only teammate-tests gets it
  → teammate-db claims next available unblocked task instead

[Plan approval with rejection]
teammate-api submits plan: "REST endpoints, no input validation yet — will add later"
Lead rejects: "Plan must include input validation per approval criteria."
teammate-api revises: "REST endpoints with JSON:API format, JWT auth middleware,
  Zod validation schemas for all request bodies"
Lead approves — plan now meets criteria.
teammate-api exits plan mode, claims Task 4

[Peer communication]
teammate-api → teammate-db: "What's the type for User.id? UUID or integer?"
teammate-db → teammate-api: "UUID. Exported from src/models/types.ts"
(Resolved in 1 message. No lead involvement.)

[Dependency unblocking]
teammate-db completes Task 1 (User model) → marks complete
  → Task 2 (Task model) auto-unblocks → teammate-db claims it
  → Task 4 was already claimed by teammate-api, but was blocked
    → now unblocked, teammate-api proceeds

[Task status lag]
teammate-tests finishes Task 16 but forgets to mark complete
  → Task 17 stays blocked
  → Lead notices no progress, checks teammate-tests output
  → Work is done. Lead manually marks Task 16 complete via TaskUpdate
  → Task 17 unblocks, teammate-tests claims it

[Cross-track coordination via broadcast]
teammate-api finishes Task 4 (GET endpoint) → broadcasts:
  "GET /tasks response shape: { data: Task[], meta: { total, page } }"
teammate-frontend acknowledges, uses shape for list component
teammate-tests acknowledges, uses shape for integration test assertions

[Self-review example]
teammate-frontend finishes Task 10 (filter component):
  Self-review catches: "I used inline styles instead of project's CSS modules"
  Fixes before marking complete. No external reviewer needed.

[Self-review after plan approval]
teammate-api finishes Task 4 (GET endpoint):
  Plan approval validated the approach. Self-review now validates implementation.
  Self-review catches: "Missing pagination default — spec says default to page=1"
  Fixes before marking complete.

[DONE_WITH_CONCERNS]
teammate-db finishes Task 3 (migration scripts):
  Reports: DONE_WITH_CONCERNS — "Migrations work but the Tasks table
  will be large. Consider adding an index on created_at. Not in spec
  but may matter at scale."
  Lead notes concern, proceeds — not a blocker.

[NEEDS_CONTEXT]
teammate-frontend hits Task 12 (complex date picker integration)
  Reports: NEEDS_CONTEXT — "Date picker library not in package.json. Which library?"
  Lead answers: "Use date-fns. It's in the spec, section 3.2."
  teammate-frontend continues.

[BLOCKED]
teammate-frontend hits Task 13 (real-time updates):
  Reports: BLOCKED — "Task requires WebSocket setup but no WebSocket
  server exists and it's outside my file ownership."
  Lead assesses: WebSocket is Track B work. Creates new task, assigns
  to teammate-api. Task 13 gets addBlockedBy on the new task.

[User intervenes directly]
User notices teammate-frontend is using a complex state management approach.
User presses Shift+Down to cycle to teammate-frontend and types:
  "Use React context instead of Redux for this — it's simpler for our needs."
teammate-frontend adjusts approach.

[Teammate replacement]
teammate-db crashes on Task 5 (query optimization) — unresponsive.
  Lead spawns teammate-db-2 with same file ownership and remaining tasks.
  teammate-db-2 picks up where teammate-db left off.

[Idle teammate reuse]
teammate-tests finishes first (3 tasks) → goes idle → lead notified
  Lead: "Help teammate-api with remaining validation tests"
  teammate-tests claims an unassigned validation task from Track B
  (Lead updates file ownership: teammate-tests now also owns tests/validation/*)
```

### Phase 6: Integration Review

```
All 18 tasks complete.

Lead dispatches integration reviewer with:
  - File ownership map
  - Shared interfaces doc
  - git diff (base SHA → head SHA)
  - Original plan

Integration reviewer reports:
  ✅ Contract compliance — all API shapes match frontend consumers
  ✅ Consistency — naming conventions consistent across tracks
  ❌ Important: teammate-frontend uses camelCase for query params,
     teammate-api expects snake_case. Affected files:
     - src/components/Filters.tsx (owned by teammate-frontend)
     - src/routes/tasks.ts (owned by teammate-api)

Lead assigns:
  teammate-frontend: update Filters.tsx to use snake_case query params
  (Single owner fixes — no conflict)

Re-runs integration review on changed files:
  ✅ All clean.
```

### Phase 7: Cleanup

```
Lead sends shutdown request to all 4 teammates.
  teammate-db-2: approves, exits
  teammate-api: rejects — "Still running final validation on Task 7"
  teammate-frontend: approves, exits
  teammate-tests: approves, exits

Lead waits for teammate-api to finish.
teammate-api completes Task 7, marks complete.
Lead re-sends shutdown request to teammate-api.
  teammate-api: approves, exits

Lead runs TeamDelete — cleans up team resources.
Lead invokes finishing-a-development-branch:
  Presents 4 options: merge, PR, keep, discard
  User chooses: Push & PR
  Done.
```

### What This Achieved

| Metric | SDD (sequential) | Team-driven (parallel) |
|---|---|---|
| **Execution tracks** | 1 at a time | 4 simultaneous |
| **Reviews dispatched** | 36 (18 tasks × 2 reviews) | 1 integration review |
| **Peer communication** | Not possible | 3 direct exchanges |
| **Idle teammate reuse** | Not possible | teammate-tests helped teammate-api |
| **Total wall-clock time** | Sum of all tasks | Longest track + coordination |

**Token cost:** 4 teammates ≈ 4× the context windows of a single session. For this 18-task plan with 4 independent tracks, parallel execution completed in roughly the wall-clock time of the longest track (Track A or B, ~5 tasks) instead of all 18 sequentially. The token premium was justified by the time savings and the cross-track communication that caught the query param format mismatch before it reached production.
