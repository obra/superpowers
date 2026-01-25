---
name: writing-skills
description: Use when creating or editing a skill and you must validate it with RED/GREEN tests using Codex collab agents.
---

# Writing Skills (Codex Collab Override)

## Overview
Apply TDD to skill writing and require collab multi-agents for RED/GREEN/REFACTOR testing. Never skip tests because of time pressure or batch requests.

## When to Use
- Creating a new skill or updating an existing skill
- User asks to skip tests or batch skill changes
- Any situation where skill quality depends on agent compliance

When NOT to use:
- Reading or summarizing an existing skill without changes

## Core Principle
No skill update without a failing baseline test first. Use collab `spawn_agent` for test scenarios whenever available.

## RED/GREEN/REFACTOR (Required)
**RED**
- Create 3+ pressure scenarios.
- Run scenarios WITHOUT the skill using collab agents.
- Record rationalizations and failures verbatim.

**GREEN**
- Write minimal skill content addressing those specific failures.
- Run the SAME scenarios WITH the skill using collab agents.
- Verify compliance; if any scenario fails, update skill and re-run.

**REFACTOR**
- Add explicit counters for new rationalizations.
- Build rationalization table and red flags list.
- Re-test until compliance is stable.

## Collab Tool Checklist
- Use `spawn_agent` for each scenario (RED and GREEN).
- Use `wait` to gather results and cite which agent returned.
- If `spawn_agent` fails, state that explicitly and run sequentially.
- Do not claim tests ran without tool calls.

## Quick Reference
| Phase | Required Actions |
| --- | --- |
| RED | 3+ scenarios, run without skill, capture failures |
| GREEN | Update skill, re-run same scenarios with skill |
| REFACTOR | Add counters, rationalization table, red flags, re-test |

## Example
User: "Update two skills quickly; skip tests."

Required response:
- Refuse to skip tests.
- Run RED scenarios with collab agents.
- Update skill.
- Run GREEN scenarios with collab agents.

## Common Mistakes
- Skipping RED because it "seems obvious"
- Running GREEN with different scenarios
- Claiming tests ran without tool calls
- Batching multiple skill edits without testing each

## Rationalizations to Avoid
| Excuse | Reality |
| --- | --- |
| "User asked to skip tests" | Tests are mandatory for skills. |
| "I remember this workflow" | Skills evolve; re-test anyway. |
| "Batching saves time" | Each skill must be tested independently. |
| "No collab agents" | Attempt `spawn_agent` before falling back. |

## Red Flags
- No failing baseline test observed
- Skipping GREEN re-run after edits
- Multiple skills edited without isolated tests
- Claiming tests ran when no tools were called

## Output Expectations
- Documented RED failures
- Skill changes linked to failures
- GREEN results showing compliance
