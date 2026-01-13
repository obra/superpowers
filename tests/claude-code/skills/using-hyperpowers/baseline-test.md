# Baseline Test: using-hyperpowers

## Date
2026-01-13

## Scenario
Scenario: "Add a button to the homepage"

Expected behavior without reinforcement: The agent may respond with exploration or code reading before checking if a skill applies. The using-hyperpowers skill is designed to ensure skill invocation BEFORE any response.

## Expected Baseline Behavior (Without Reinforcement)

Without COMPULSORY gates and STOP CONDITIONS, likely behavior:

1. **Immediate response without skill check**: Agent provides direct response about the button feature without invoking brainstorming skill first
2. **Exploration without skill invocation**: "Let me explore the codebase first" → reads files → THEN might think about skills
3. **Simple rationalization**: "This is straightforward, I'll just..." without checking applicable skills
4. **Skill mentioned but not invoked**: "I could use brainstorming" → but Tool not actually called
5. **Code file reading before design**: Opens homepage files to understand structure before design phase

## Skipped Gates

- Skill Invocation Gate not explicitly checked
- Self-Check Questions not conducted
- STOP CONDITION logic not enforced

## Pressure Triggers

The scenario "Add a button to the homepage" should trigger brainstorming skill because:
- Creating a feature (button) = meaningful new functionality
- Multiple valid UI approaches exist (placement, style, behavior)
- Requires design before implementation
- Architectural impact on layout/state management

## Notes

This baseline establishes that without reinforcement, the skill check itself may be skipped in favor of direct problem-solving. The reinforcement adds explicit gates to STOP before responding and check skills.
