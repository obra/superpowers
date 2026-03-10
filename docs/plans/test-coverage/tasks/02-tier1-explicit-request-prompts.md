# Task 2: Tier 1 — Explicit Skill Request Prompts

**Specialist:** test-writer-2
**Depends on:** None
**Produces:** 13 new prompt files in `tests/explicit-skill-requests/prompts/`, updated `run-all.sh`

## Goal

Add explicit-request test prompts for all skills that lack them, ensuring every skill can be invoked by name with varied phrasings.

## Acceptance Criteria

- [ ] 13 new prompt files created in `tests/explicit-skill-requests/prompts/`
- [ ] Prompts use varied phrasings: direct naming, action-oriented, mid-conversation
- [ ] `run-all.sh` updated to run all prompt files
- [ ] Each prompt successfully invokes the correct skill when run with `run-test.sh`

## Test Expectations

- **Test:** Each prompt file invokes the named skill via `run-test.sh`
- **Expected red failure:** `run-test.sh` exits 1 with "FAIL: Skill 'X' was NOT triggered" when prompt is missing
- **Expected green:** `run-test.sh` exits 0 with "PASS: Skill 'X' was triggered", no premature tool invocations

## Files

- Create: 13 new files in `tests/explicit-skill-requests/prompts/` (see below)
- Modify: `tests/explicit-skill-requests/run-all.sh` (add all new test entries)

## Implementation Notes

**Skills needing explicit request prompts** (all skills not yet covered by existing 9 prompts):

| Skill | Phrasing style | Example |
|-------|---------------|---------|
| agent-team-driven-development | Direct | "Use the agent-team-driven-development skill" |
| composing-teams | Action-oriented | "Let's compose a team for this project" |
| dispatching-parallel-agents | Direct | "Use dispatching-parallel-agents to handle these tasks" |
| executing-plans | Action-oriented | "Execute the plan we just wrote" |
| finishing-a-development-branch | Mid-conversation | "I'm done with this branch, use the finishing skill" |
| receiving-code-review | Direct | "Use receiving-code-review to process this feedback" |
| requesting-code-review | Action-oriented | "Request a code review of my changes" |
| test-driven-development | Direct | "Use test-driven-development for this feature" |
| using-git-worktrees | Mid-conversation | "Set up a worktree using the git worktrees skill" |
| using-superpowers | Direct | "Use the using-superpowers skill" |
| verification-before-completion | Action-oriented | "Verify everything before we call this complete" |
| writing-plans | Mid-conversation | "Write an implementation plan using the writing-plans skill" |
| writing-skills | Direct | "Use writing-skills to create a new skill" |

**File naming convention:** Use descriptive kebab-case names like `use-agent-team.txt`, `compose-team-action.txt`, `finish-branch-mid-conversation.txt`.

**Existing `run-test.sh`** already checks for premature tool invocations before skill loading — preserve this valuable check.

**`run-all.sh` pattern:** Existing file lists each test individually (not a loop). Follow the same `>>> Test N:` pattern for each new entry.

## Commit

`test: add explicit request prompts for 13 untested skill phrasings`
