# Task 8: Fix brainstorming (CX-11, L2 plan mode, L3 quick mode, user confirmation gates)

**Depends on:** None
**Produces:** Announce instruction, plan mode prohibition, quick mode acknowledgment, and user confirmation gates in brainstorming skill

## Goal

Four fixes to brainstorming: add "Announce at start" instruction (CX-11), add plan mode prohibition block (L2 from pcvelz fork), add quick mode acknowledgment for trivial tasks (L3 from PRs #534/#477), and add user confirmation gates at team decision and implementation transition steps.

## Acceptance Criteria

- [ ] Skill has an "Announce at start" instruction near the top of Overview
- [ ] Skill has a `<HARD-GATE>` or similar block prohibiting `EnterPlanMode`/`ExitPlanMode`
- [ ] The "Anti-Pattern" section or similar acknowledges that truly simple tasks can have a short design (1-2 sentences)
- [ ] Step 8 (team decision) includes an explicit user confirmation gate before proceeding
- [ ] Step 9 (transition) includes an explicit user confirmation gate before invoking writing-plans

## Files

- Modify: `skills/brainstorming/SKILL.md`

## Implementation Notes

**CX-11 (announce):** Add to the Overview section:
```markdown
**Announce at start:** "I'm using the brainstorming skill to explore and design before implementing."
```

**Plan mode prohibition (pcvelz):** Add a HARD-GATE block:
```markdown
<HARD-GATE>
Do NOT use `EnterPlanMode` or `ExitPlanMode` during brainstorming. These tools trap the session in plan mode where Write/Edit tools are restricted, preventing the brainstorming skill from writing the design document. Use the brainstorming skill's own structured process instead.
</HARD-GATE>
```

**Quick mode (PRs #534, #477):** Modify the "Anti-Pattern" section to acknowledge:
```markdown
The design can be short (a few sentences for truly simple tasks), but you MUST present it and get approval.
```

**User confirmation gates:** In the checklist/process, add explicit confirmation steps:
- Step 8: After evaluating the team decision framework, present the conclusion to the user and ask for confirmation before proceeding
- Step 9: Before invoking writing-plans, ask the user if they're satisfied with the brainstorming output and ready to transition

## Verification

```bash
grep -c "Announce at start" skills/brainstorming/SKILL.md        # should be >= 1
grep -c "EnterPlanMode" skills/brainstorming/SKILL.md             # should be >= 1 (in prohibition block)
grep -c "few sentences" skills/brainstorming/SKILL.md             # should be >= 1
grep -i -c "confirm\|ask.*user\|approval" skills/brainstorming/SKILL.md  # should be >= 2 (gates)
```

## Commit

`fix(brainstorming): add announce, plan mode block, quick mode, confirmation gates (CX-11, pcvelz, #534)`
