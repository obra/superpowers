# Issue #455 Proposal: Deterministic End-to-End Validation Skill

## Problem
Current workflows often stop at unit/integration confidence, not user-path validation.

## Proposed minimal upstream scope
1. Add `skills/end-to-end-validation/SKILL.md`
2. Add deterministic command contract + JSON artifact expectations
3. Add a lightweight smoke check script for skill structure

## Non-goals
- No cross-provider framework rewrite
- No strict global enforcement on all workflows

## Acceptance criteria
- Skill exists and is discoverable
- Smoke check passes locally
- README references new skill
