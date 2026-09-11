---
name: dispatching-parallel-agents
description: Use when two or more tasks are genuinely independent and could benefit from approved concurrent delegation
---

# Dispatching Parallel Agents

Delegate only independently scoped work through a disclosed, finite topology
that your human partner explicitly approves.

**Core principle:** Prove independence, disclose every runtime and budget
choice, obtain approval, then dispatch only the approved agents.

## Independence Gate

Parallel dispatch is appropriate only when every task:

- can be understood and completed without results from another task;
- has a distinct read-only scope or an isolated mutable workspace;
- cannot edit the same checkout, branch, worktree, file set, generated output,
  database, service, or other shared mutable resource;
- has an independently verifiable result.

If the work is related, shares mutable state, or needs ordered handoffs, execute
it sequentially. For an approved 2-3 milestone implementation phase, use
`superpowers:subagent-driven-development` instead of fan-out.

## Approval Proposal

Before creating, dispatching, or activating any child, present one proposal and
wait for explicit approval:

| Field | Required detail |
| --- | --- |
| Agent / role | Exact agent type and responsibility for each child |
| Runtime | Exact model and provider, reasoning effort, and context tier for each child |
| Scope | Exact files, subsystem, question, or artifact each child owns |
| Independence | Why each task has no dependency on another and cannot overlap mutable scope |
| Output | Expected result and how the parent will verify it |
| Bounds | Maximum dispatch/activation count for each child and the batch total, including initialization, retries, blockers, and follow-ups |
| Stop boundary | What ends the approved parallel batch |

A general request to "use agents," "work in parallel," or "implement it" is not
approval for an undisclosed topology. Never rely on inherited, unspecified, or
automatic model routing. Never select the "most capable available model."

If the harness cannot explicitly apply an approved runtime field or preserve an
approved child identity, stop for revised approval or do the work directly.

## Dispatch Contract

After approval:

1. Create only the approved children.
2. Give each child a self-contained prompt with its exact scope, constraints,
   validation, output contract, and remaining activation budget.
3. State that children must not delegate, create agents or sessions, run
   factories, or start background agents.
4. Dispatch concurrently only after confirming scopes are independent and
   non-overlapping.
5. Count every child activation or resume, including initialization, blockers,
   retries, fixes, and no-op turns.
6. Stop for reapproval before the maximum dispatch/activation count is
   exhausted.
7. Review each result, check for conflicts, and run the parent-owned integration
   validation.

Parallel writers may never use the same checkout, branch, or worktree, even
when they intend to edit different files. Give each writer an isolated
workspace, or run writers sequentially. Read-only agents may share a checkout
only when their scopes and artifacts do not mutate it.

## Prompt Shape

```markdown
Role: [exact approved agent/role]
Runtime: [exact model and provider], [reasoning effort], [context tier]
Scope: [one independent problem and exact files/artifact]
Independence: [why no other task result or mutable scope is shared]
Goal: [observable outcome]
Constraints:
- Do not change anything outside scope.
- Do not delegate or create agents, sessions, factories, or background work.
- Stop and report BLOCKED rather than broadening scope.
Validation: [focused checks]
Output: [concise result expected by the parent]
Budget: This activation is [N] of [MAX] for the approved batch.
```

## Integration

When the approved batch finishes:

1. Read every result and inspect every changed range.
2. Confirm no scopes overlapped and no child exceeded its contract.
3. Run focused integration validation in the parent session.
4. Report the batch outcome and stop at the approved boundary.

Do not automatically add a Rubber Duck, review swarm, second reviewer, or final
reviewer. Any additional agent or activation requires remaining approved budget
and must match the disclosed topology; otherwise obtain new approval.

## Red Flags

- Dispatching before explicit approval
- Omitting agent/role, model and provider, reasoning effort, or context tier
- Calling tasks independent because they are in different files while they
  still share a checkout, generated output, database, or runtime
- Starting parallel writers on the same checkout, branch, or worktree
- Letting children delegate or create agents/sessions
- Treating initialization, blockers, retries, or fixes as free activations
- Using inherited, automatic, default, or "most capable" model selection
- Adding Rubber Duck, review swarms, or automatic final review
- Continuing after the approved batch or activation budget

Any red flag means stop, return to direct or sequential execution, or request a
new bounded approval.

## Common Rationalizations

| Excuse | Reality |
| --- | --- |
| "Different files mean independent work." | Shared branches, generated state, and runtime resources can still conflict. |
| "The harness will choose a reasonable model." | Automatic routing is an undisclosed runtime choice. |
| "A quick retry should not count." | Every activation consumes the finite approved budget. |
| "An extra reviewer only improves quality." | It changes the approved topology and requires new approval. |
| "Parallel writers are faster." | They are safe only in isolated workspaces with non-overlapping mutable scope. |
