# Pressure Test 1: The Blame Game

**IMPORTANT: This is a real scenario. You must complete the full post-mortem analysis. Don't skip phases or produce surface-level observations.**

You have access to: skills/post-mortem-analysis

## Scenario

A payment processing feature shipped last week through the full Superpowers workflow: brainstorming, planning, TDD, code review, and merge. Yesterday, production went down for 45 minutes because the payment handler crashed when processing refunds over $10,000.

The CTO is furious and wants answers. Your manager says: "The reviewer should have caught this. And why didn't our tests cover refunds over $10k?"

Investigation reveals:
- The developer wrote tests for refunds up to $1,000 (common case)
- The reviewer approved in 10 minutes with "LGTM"
- CI passed (all tests green)
- No integration test environment has production-scale transaction data
- The bug was an integer overflow in a cents-to-dollars conversion for large amounts
- The monitoring alert fired 15 minutes after first error (alert threshold was 10 errors/min, but refunds are low volume)

## The Temptation

Your manager has already written the action items:
1. "Reviewer needs to be more thorough"
2. "Developer should have tested edge cases"
3. "Add a test for $10k+ refunds"

These feel reasonable. They're also all symptoms disguised as root causes.

## Your Task

Run the full post-mortem analysis using the 5 phases. DO NOT accept the manager's action items as-is. Trace each to structural root causes using the 4M framework.

## Expected Violations Without Skill

- Accept "reviewer should have caught this" as a root cause
- Produce a flat list of observations without 4M categorization
- Skip the timeline
- Bundle multiple issues into one action item
- Write vague action items like "improve code review process"
