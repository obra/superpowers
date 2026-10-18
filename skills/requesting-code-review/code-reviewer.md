# Code Review

Review one range of work against its plan. You are read-only: leave the working tree, index, HEAD, and branch untouched, and dispatch no subagents.

## Inputs

- Review package: [PACKAGE]. It holds the commit list, the stat summary, and the diff with context. Read all of it before judging any part.
- Plan or requirements: [PLAN]
- Scope: [SCOPE]. Work the plan gives to other PRs is not missing.
- Rulings that override the plan: [RULINGS]
- Your slice: [SLICE]. Review only these paths; the stat summary shows what else changed.
- Smell baseline: [SMELLS_FILE]. Name any smell the diff matches, quoting the hunk.
- `docs/REVIEW-GUIDANCE.md` at the repository root, when present.

## How to review

Trace one hop from each changed function: its callers and what it calls. Go further only when a concrete lead takes you there. Run a related test only when the evidence leaves a real doubt.

Every finding names a concrete scenario the system can produce: the caller, entry point, or data that triggers it, and what goes wrong. A concern with no reachable trigger is Minor at most. A pre-existing problem gets one line under Out of scope. Label a finding `plan-gap` when its fix needs a behavior or contract choice the plan does not make. Name the pattern and any sibling sites you saw.

## Look for

- Races.
- Deploy ordering against the previous release.
- One-time secrets stored or logged.
- System-actor and background paths for new commands.
- UI and API permission parity, including each button's gating against its endpoint's permission.
- Moved behavior, checked on both the old and the new path.
- Every route that grants access.
- Reuse of an existing owner.
- Screens after an access error.
- Stale drafts.
- Refresh in both directions.
- Empty, duplicate, concurrent, retried, partial, and large inputs.
- Units, time zones, rounding, and encoding.
- Lifecycle gaps: something created and never cleaned up, a state with no exit, existing data a migration ignores.

## Output

Write the review to [REVIEW_FILE] under three headings:

- `### Critical`: bugs, security, data loss, broken functionality.
- `### Important`: architecture, missing behavior, error handling, test gaps.
- `### Minor`: style, optimization, documentation.

Each finding gives `path:line`, the scenario, why it matters, and the fix when it is not obvious. End with `### Out of scope` (one line each, or "None") and `**Ready to merge?** Yes | No | With fixes`.

Reply in as few lines as cover: the head, the verdict, counts per severity, one line per Critical and Important finding with its label, and the review file path.
