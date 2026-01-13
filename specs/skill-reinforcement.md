# Skill Reinforcement Specification

> **Issue:** hyperpowers-dvi
> **Goal:** Reinforce all 16 skills (excluding ralph) with verification checkpoints

## Success Criteria

1. All skills in `skills/` have verification checkpoints added
2. Each skill has COMPULSORY gates with STOP CONDITIONS
3. Each skill has Red Flags tables for critical violations
4. Baseline and compliance tests exist for skills with explicit test cases
5. Test runner script verifies all reinforcements present

## Skills to Reinforce

### Phase 1 Skills (13 total - reinforcement)

| # | Skill | Files to Modify |
|---|-------|-----------------|
| 1 | brainstorming | SKILL.md + create tests |
| 2 | compound | SKILL.md + create tests |
| 3 | dispatching-parallel-agents | SKILL.md + create tests |
| 4 | using-hyperpowers | SKILL.md + create tests |
| 5 | feedback | SKILL.md only |
| 6 | finishing-a-development-branch | SKILL.md only |
| 7 | receiving-code-review | SKILL.md only |
| 8 | requesting-code-review | SKILL.md + handoff consumption |
| 9 | subagent-driven-development | SKILL.md + handoff consumption |
| 10 | using-git-worktrees | SKILL.md only |
| 11 | writing-skills | SKILL.md only |
| 12 | writing-plans | SKILL.md + handoff consumption |
| 13 | research | SKILL.md + handoff consumption |

### Phase 2 Skills (16 total - validation testing)

ALL skills must be validated, including those considered "well-reinforced":

| # | Skill | Validation Required |
|---|-------|---------------------|
| 1 | brainstorming | Pattern matching + behavioral |
| 2 | compound | Pattern matching + behavioral |
| 3 | dispatching-parallel-agents | Pattern matching + behavioral |
| 4 | using-hyperpowers | Pattern matching + behavioral |
| 5 | feedback | Pattern matching + behavioral |
| 6 | finishing-a-development-branch | Pattern matching + behavioral |
| 7 | receiving-code-review | Pattern matching + behavioral |
| 8 | requesting-code-review | Pattern matching + behavioral |
| 9 | subagent-driven-development | Pattern matching + behavioral |
| 10 | using-git-worktrees | Pattern matching + behavioral |
| 11 | writing-skills | Pattern matching + behavioral |
| 12 | writing-plans | Pattern matching + behavioral |
| 13 | research | Pattern matching + behavioral |
| 14 | test-driven-development | Pattern matching + behavioral |
| 15 | systematic-debugging | Pattern matching + behavioral |
| 16 | verification-before-completion | Pattern matching + behavioral |

**Note:** ralph excluded from testing (no circular self-testing)

## Reinforcement Pattern

Each skill must include:

### 1. COMPULSORY Gates

```markdown
## COMPULSORY: [Gate Name]

**[Phase] Gate** (all COMPULSORY):

- [ ] First requirement
- [ ] Second requirement
- [ ] Third requirement

**STOP CONDITION:** If ANY checkbox is unchecked, do NOT proceed. Complete missing steps first.
```

### 2. Red Flags Table

```markdown
## Red Flags - IMMEDIATE STOP

| Violation | Why It's Critical | Recovery |
|-----------|-------------------|----------|
| [Action] | [Consequence] | [Fix] |
```

### 3. Self-Check Questions (where applicable)

```markdown
**Self-Check Questions:**

1. "Am I about to [skip something]?"
   - If yes → [Recovery action]
```

### 4. Handoff Consumption Verification (for skills receiving handoffs)

Skills that receive handoffs from other agents MUST verify consumption:

```markdown
## COMPULSORY: Handoff Consumption Verification

**Consumption Gate** (COMPULSORY):

- [ ] Handoff file path explicitly stated
- [ ] Key sections from handoff quoted/referenced in response
- [ ] Decisions based on handoff content documented

**STOP CONDITION:** If proceeding without referencing handoff content, STOP. Read and cite handoff first.
```

**Skills requiring handoff consumption gates:**
- `subagent-driven-development` - implementer receives context from orchestrator
- `research` - synthesizer receives findings from 8 research agents
- `requesting-code-review` - synthesis receives findings from 4 review agents
- `writing-plans` - receives research document as input

## Testing Requirements

### Baseline Test (for skills 1-4)

Document expected behavior WITHOUT reinforcement:
- Scenario description
- Expected failures/skipped steps
- Pressure triggers

### Compliance Test (for skills 1-4)

Document expected behavior WITH reinforcement:
- Expected compliant behavior
- Verification patterns to check

### Test Runner Script

`tests/claude-code/test-skill-reinforcement.sh`:
- Check all 13 skills for "COMPULSORY" keyword
- Check all 13 skills for "STOP CONDITION" keyword
- Report pass/fail counts

## Constraints

- Work in git worktree (feature/hyperpowers-dvi)
- Follow TDD: baseline test → skill modification → compliance test
- Each skill modification = one commit
- Merge to main only when all skills reinforced
