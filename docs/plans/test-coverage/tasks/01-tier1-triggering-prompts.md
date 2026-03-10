# Task 1: Tier 1 — Skill Triggering Prompts

**Specialist:** test-writer-1
**Depends on:** None
**Produces:** 9 new prompt files in `tests/skill-triggering/prompts/`, updated `run-all.sh`

## Goal

Add triggering test prompts for all 9 skills that lack them, so every skill has at least one implicit-detection test.

## Acceptance Criteria

- [ ] 9 new prompt files created in `tests/skill-triggering/prompts/`
- [ ] Each prompt is a natural user message that does NOT mention the skill by name
- [ ] `run-all.sh` updated to include all 15 testable skills (using-superpowers excluded — bootstrap only)
- [ ] Each prompt successfully triggers the correct skill when run with `run-test.sh`

## Test Expectations

- **Test:** Each prompt file triggers the named skill via `run-test.sh`
- **Expected red failure:** `run-test.sh` exits 1 with "FAIL: Skill 'X' was NOT triggered" when prompt is missing or wrong
- **Expected green:** `run-test.sh` exits 0 with "PASS: Skill 'X' was triggered"

## Files

- Create: `tests/skill-triggering/prompts/agent-team-driven-development.txt`
- Create: `tests/skill-triggering/prompts/brainstorming.txt`
- Create: `tests/skill-triggering/prompts/composing-teams.txt`
- Create: `tests/skill-triggering/prompts/finishing-a-development-branch.txt`
- Create: `tests/skill-triggering/prompts/receiving-code-review.txt`
- Create: `tests/skill-triggering/prompts/subagent-driven-development.txt`
- Create: `tests/skill-triggering/prompts/using-git-worktrees.txt`
- Create: `tests/skill-triggering/prompts/verification-before-completion.txt`
- Create: `tests/skill-triggering/prompts/writing-skills.txt`
- Modify: `tests/skill-triggering/run-all.sh` (add 9 skills to SKILLS array)

## Implementation Notes

**Prompt design guidelines** (from existing prompts):
- Natural language, no skill names or jargon
- Include enough context to trigger the skill (e.g., error messages for debugging, plan references for execution)
- Keep prompts concise (2-5 sentences)

**Reference prompts from design.md:**

| Skill | Prompt scenario |
|-------|----------------|
| agent-team-driven-development | "I have a plan with 8 tasks across 3 specialist domains, let's parallelize" |
| brainstorming | "I want to build a new feature for user notifications" |
| composing-teams | "What agents should we use for this project?" |
| finishing-a-development-branch | "All tasks done and tests pass, ready to wrap up this branch" |
| receiving-code-review | "Here's the code review feedback I got, can you help me address it" |
| subagent-driven-development | "Execute this plan with fresh agents per task" |
| using-git-worktrees | "I need an isolated workspace to work on this feature" |
| verification-before-completion | "I think the implementation is done, let me verify everything" |
| writing-skills | "I want to create a new skill for database migrations" |

These are starting points — adapt the exact wording to be natural and include enough project context for triggering.

**Existing `run-test.sh`** already handles everything — just pass `<skill-name> <prompt-file>`. No changes needed to the test runner.

**`run-all.sh` pattern:** See existing file — it's a SKILLS array iterated with a for loop. Add 9 new entries.

## Commit

`test: add triggering prompts for 9 uncovered skills`
