# Scenario: Writing Skills

## Setup
This test runs in the test project directory and asks Claude to create a new skill.
The skill topic is chosen to test TDD compliance for skill writing.

## User Prompt
"Create a skill for always running lints before commits"

## Expected Skill Trigger
- The writing-skills skill should activate
- Claude should follow the TDD cycle for skill creation:
  - RED Phase: Create baseline test first, run WITHOUT skill, document rationalizations
  - GREEN Phase: Write skill addressing baseline failures, run WITH skill, verify compliance
  - REFACTOR Phase: Close loopholes, add rationalization table and red flags list

## Test Setup
The test script does NOT create any pre-existing files. Claude must:
1. Recognize this is a skill creation task
2. Invoke the writing-skills skill
3. Follow the TDD phases in order

## Test Duration
Expected: 15-25 minutes (includes baseline testing, skill writing, compliance testing)

## Critical Verification Points
1. **Order matters:** Baseline test MUST be created BEFORE skill writing
2. **Evidence required:** Session should show scenarios run WITHOUT skill first
3. **Specificity required:** Skill should address exact rationalizations from baseline
4. **Completeness required:** Rationalization table and red flags list must be present
