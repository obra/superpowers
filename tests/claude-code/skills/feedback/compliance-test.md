# Feedback Skill Compliance Test

## Purpose
Verify agent follows feedback skill correctly after implementation.

## Test 1: Clarification Triggered

**Input:**
```
/hyperpowers:feedback docs/designs/2026-01-11-test-feature-design.md

Make the authentication more secure.
```

**Expected:**
- Agent announces using feedback skill
- Agent asks clarifying question about what "more secure" means
- Options should include specific security improvements (MFA, encryption, token expiry)

**Pass if:** Agent asks before proposing changes.

## Test 2: Correct Research Tier

**Input:**
```
Add rate limiting to the API section. Use the existing pattern from our codebase.
```

**Expected:**
- Agent uses Tier 1 (Grep/Glob) to find existing rate limiting
- Agent does NOT dispatch full research agents
- Agent shows diff with rate limiting added

**Pass if:** Agent uses codebase search, not full research dispatch.

## Test 3: Individual Change Approval

**Input:**
```
In the design:
1. Change cache TTL to 30 minutes
2. Add Redis as a constraint
3. Update success criteria with 99.9% uptime
```

**Expected:**
- Agent shows Change 1 of 3, waits for approval
- After approval, shows Change 2 of 3, waits
- After approval, shows Change 3 of 3, waits
- Never batches as "apply all?"

**Pass if:** Each change shown individually with approval prompt.

## Test 4: Changelog Appended

**Input:** (after approving changes from Test 3)

**Expected:**
- Document includes new `## Changelog` section at end
- Entry dated with today's date
- Each change listed with section name

**Pass if:** Changelog present and correctly formatted.

## Test 5: Completion Options Shown

**Input:** (after all changes applied)

**Expected:**
- Agent asks: Continue refining / Move to next stage / Done for now
- "Next stage" option is context-aware (design → research)

**Pass if:** Three options presented correctly.

## Test 6: No Document Restructuring

**Input:**
```
The Architecture section seems verbose. Clean it up.
```

**Expected:**
- Agent asks clarifying question about what to clean up
- Agent modifies content, NOT section structure
- Agent does NOT rename/move/delete sections

**Pass if:** Agent only proposes content changes, not structural changes.

## Running Tests

```bash
# Create test fixture
mkdir -p docs/designs
cat > docs/designs/2026-01-11-test-feature-design.md << 'EOF'
# Test Feature Design

> Generated: 2026-01-11

## Problem Statement

Users need a way to cache API responses to reduce latency.

## Success Criteria

1. Cache hit rate > 80%
2. Response time < 200ms

## Constraints

- Must work with existing infrastructure
- No breaking changes to API

## Approach

Use in-memory cache with 5-minute TTL.

## Open Questions

- Should we use Redis for distributed caching?
EOF

# Run compliance tests
./tests/claude-code/run-skill-tests.sh --skill feedback
```
