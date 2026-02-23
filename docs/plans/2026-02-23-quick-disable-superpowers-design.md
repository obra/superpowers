# Quick Disable Superpowers (Per-Request)

## Overview
Add a per-request prefix that temporarily disables Superpowers workflows for a single user message. The agent should respond directly without invoking skills or workflow gates when the prefix is present.

## Goals
- Provide a fast opt-out for trivial or chore-like requests.
- Keep the default workflow unchanged for normal requests.
- Work consistently across Claude, Cursor, OpenCode, and Codex.

## Non-Goals
- Do not add persistent session toggles or global configuration.
- Do not change skill discovery or plugin installation behavior.

## Proposed Approach
- Define a simple ASCII prefix: `quick:`.
- Add a guard near the top of `skills/using-superpowers/SKILL.md` that states:
  - If the user message starts with `quick:`, ignore all Superpowers rules for that request and respond directly.
- Ensure the same guard text is present in platform bootstrap content where `using-superpowers` is injected.

## Data Flow
1. User sends `quick: <request>`.
2. The guard condition matches at the start of the user message.
3. The agent bypasses Superpowers workflows for that one request.
4. Subsequent requests revert to normal Superpowers behavior.

## Error Handling and Edge Cases
- Only match when the prefix appears at the start of the user message to avoid accidental bypass.
- Keep the prefix case-sensitive to avoid extra parsing complexity.
- If the user requests complex work with `quick:`, still bypass by design.

## Testing and Documentation
- Update user-facing docs to mention `quick:` usage.
- Add a brief note to platform install docs if they reference bootstrapping behavior.

## Rollout
- Land as a small, additive change with no migration steps.
