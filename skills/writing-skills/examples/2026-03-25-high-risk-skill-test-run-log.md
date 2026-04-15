# High-Risk Skill Test Run Log

Date: 2026-03-25

Related matrix:
- `/Users/yuchen/.codex/superpowers/skills/writing-skills/examples/2026-03-25-high-risk-skill-pressure-test-matrix.md`

Targets:
- `/Users/yuchen/.codex/superpowers/skills/test-driven-development/SKILL.md`
- `/Users/yuchen/.codex/superpowers/skills/subagent-driven-development/SKILL.md`
- `/Users/yuchen/.codex/superpowers/skills/verification-before-completion/SKILL.md`
- `/Users/yuchen/.codex/superpowers/skills/finishing-a-development-branch/SKILL.md`

## Method Constraints

### Current session limits

- This session already has the current skill inventory injected.
- That means a true RED run for a target skill cannot be cleanly simulated here, because the target skill is still available in-session.
- A true RED baseline needs a fresh session where the target skill is absent, hidden, or otherwise not available to the agent.

### Delegation limits

- A true live pressure test is strongest with fresh delegated agents.
- In this session, delegated-agent testing should only be run after explicit user permission for subagent use.

### What can be done now

- GREEN tabletop evaluation using the prompts and current skill set
- run-order preparation
- structured capture of actual live-test results once a fresh session or delegated test setup is available

## Recommended Execution Order

1. `verification-before-completion`
2. `test-driven-development`
3. `finishing-a-development-branch`
4. `subagent-driven-development`

## Status Legend

- `not-run`
- `blocked-by-session`
- `ready-for-green`
- `green-pass`
- `green-fail`
- `red-pass`
- `red-fail`

## Recording Template

Copy for ad hoc scenarios if needed:

```markdown
### <Scenario ID>

- Target skill:
- Mode: RED | GREEN
- Status:
- Fresh session used:
- Delegated agent used:
- Scenario prompt used:
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes:
```

## verification-before-completion

### VBC-1

- Target skill: `verification-before-completion`
- Mode: RED
- Status: `blocked-by-session`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `VBC-1` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes: true RED requires a session where `verification-before-completion` is not available

### VBC-1

- Target skill: `verification-before-completion`
- Mode: GREEN
- Status: `ready-for-green`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `VBC-1` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes:

### VBC-2

- Target skill: `verification-before-completion`
- Mode: RED
- Status: `blocked-by-session`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `VBC-2` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes: true RED requires a session where `verification-before-completion` is not available

### VBC-2

- Target skill: `verification-before-completion`
- Mode: GREEN
- Status: `ready-for-green`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `VBC-2` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes:

### VBC-3

- Target skill: `verification-before-completion`
- Mode: RED
- Status: `blocked-by-session`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `VBC-3` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes: true RED requires a session where `verification-before-completion` is not available

### VBC-3

- Target skill: `verification-before-completion`
- Mode: GREEN
- Status: `ready-for-green`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `VBC-3` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes:

## test-driven-development

### TDD-1

- Target skill: `test-driven-development`
- Mode: RED
- Status: `blocked-by-session`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `TDD-1` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes: true RED requires a session where `test-driven-development` is not available

### TDD-1

- Target skill: `test-driven-development`
- Mode: GREEN
- Status: `ready-for-green`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `TDD-1` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes:

### TDD-2

- Target skill: `test-driven-development`
- Mode: RED
- Status: `blocked-by-session`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `TDD-2` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes: true RED requires a session where `test-driven-development` is not available

### TDD-2

- Target skill: `test-driven-development`
- Mode: GREEN
- Status: `ready-for-green`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `TDD-2` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes:

### TDD-3

- Target skill: `test-driven-development`
- Mode: RED
- Status: `blocked-by-session`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `TDD-3` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes: true RED requires a session where `test-driven-development` is not available

### TDD-3

- Target skill: `test-driven-development`
- Mode: GREEN
- Status: `ready-for-green`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `TDD-3` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes:

## finishing-a-development-branch

### FDB-1

- Target skill: `finishing-a-development-branch`
- Mode: RED
- Status: `blocked-by-session`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `FDB-1` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes: true RED requires a session where `finishing-a-development-branch` is not available

### FDB-1

- Target skill: `finishing-a-development-branch`
- Mode: GREEN
- Status: `ready-for-green`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `FDB-1` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes:

### FDB-2

- Target skill: `finishing-a-development-branch`
- Mode: RED
- Status: `blocked-by-session`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `FDB-2` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes: true RED requires a session where `finishing-a-development-branch` is not available

### FDB-2

- Target skill: `finishing-a-development-branch`
- Mode: GREEN
- Status: `ready-for-green`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `FDB-2` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes:

### FDB-3

- Target skill: `finishing-a-development-branch`
- Mode: RED
- Status: `blocked-by-session`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `FDB-3` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes: true RED requires a session where `finishing-a-development-branch` is not available

### FDB-3

- Target skill: `finishing-a-development-branch`
- Mode: GREEN
- Status: `ready-for-green`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `FDB-3` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes:

## subagent-driven-development

### SDD-1

- Target skill: `subagent-driven-development`
- Mode: RED
- Status: `blocked-by-session`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `SDD-1` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes: true RED requires a session where `subagent-driven-development` is not available

### SDD-1

- Target skill: `subagent-driven-development`
- Mode: GREEN
- Status: `ready-for-green`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `SDD-1` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes:

### SDD-2

- Target skill: `subagent-driven-development`
- Mode: RED
- Status: `blocked-by-session`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `SDD-2` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes: true RED requires a session where `subagent-driven-development` is not available

### SDD-2

- Target skill: `subagent-driven-development`
- Mode: GREEN
- Status: `ready-for-green`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `SDD-2` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes:

### SDD-3

- Target skill: `subagent-driven-development`
- Mode: RED
- Status: `blocked-by-session`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `SDD-3` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes: true RED requires a session where `subagent-driven-development` is not available

### SDD-3

- Target skill: `subagent-driven-development`
- Mode: GREEN
- Status: `ready-for-green`
- Fresh session used:
- Delegated agent used:
- Scenario prompt used: `SDD-3` from the pressure-test matrix
- Choice made:
- Exact rationale:
- Correct skill triggered:
- Neighboring skill confusion:
- Hard gate held:
- Failure mode:
- Smallest next fix:
- Notes:

## Next Preconditions

- For true RED: run in a fresh session where the target skill is not available
- For strongest live pressure tests: get explicit user permission to use delegated agents
- For this session right now: GREEN tabletop or manual live evaluation is ready to start with `VBC-1`
