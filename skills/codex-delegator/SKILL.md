---
name: codex-delegator
description: Use when delegating code review or debugging tasks to Codex CLI - handles prompt formatting, delegation, response validation, and feedback integration into superpowers workflows
---

# Codex Delegator

## Overview

Delegates code review and debugging tasks to Codex CLI while maintaining superpowers workflow integrity.

**Core principle:** Claude orchestrates and validates, Codex executes reviews and debugging.

## When to Use

**Automatically triggered by:**
- `requesting-code-review` skill (when Codex enabled)
- `systematic-debugging` skill (when Codex enabled for specific phases)

**Manual use:**
- When you want to explicitly delegate review/debug to Codex
- When Claude-only approach is insufficient and need second opinion

## Codex Delegation Decision Tree

```
Task received → Check config → Codex enabled?
├─ No → Use traditional Claude workflow
└─ Yes → Check delegation rules for task type
    ├─ code_review.delegate_to_codex = true → Delegate to Codex
    ├─ debugging.delegate_to_codex = true → Check phase
    │   └─ Phase in allowed phases → Delegate to Codex
    └─ Otherwise → Use traditional Claude workflow
```

## Delegation Process

### Phase 1: Prepare Codex Prompt

**For Code Review:**
1. Source config template: `codex_prompts.code_review_template`
2. Gather required context:
   - BASE_SHA (starting commit)
   - HEAD_SHA (ending commit)
   - WHAT_WAS_IMPLEMENTED (from implementation report)
   - PLAN_OR_REQUIREMENTS (from plan file or requirements)
3. Fill template with context
4. Add validation requirements from config

**For Debugging:**
1. Source config template: `codex_prompts.debugging_template`
2. Gather required context:
   - PROBLEM_DESCRIPTION (error, failure, unexpected behavior)
   - DEBUG_PHASE (which systematic-debugging phase)
   - CONTEXT (code, logs, environment)
3. Fill template with context
4. Add systematic debugging framework requirements

### Phase 2: Delegate to Codex

**Use MCP Codex tool:**

```
Tool: mcp__codex__spawn_agent
Parameters:
  prompt: [filled template from Phase 1]

Returns: Codex response (text)
```

**For parallel operations (multiple reviews):**

```
Tool: mcp__codex__spawn_agents_parallel
Parameters:
  agents: [
    {"prompt": "review task 1"},
    {"prompt": "review task 2"}
  ]

Returns: Array of responses
```

### Phase 3: Validate Response

**Validation checklist** (from config `response_validation`):

- [ ] Response contains reasoning (if `require_reasoning: true`)
- [ ] Response contains concrete findings (if `require_concrete_findings: true`)
- [ ] Response follows expected structure
- [ ] Response addresses the specific questions asked

**If validation fails:**
1. Check retry count < `max_retry_attempts`
2. Refine prompt with specific guidance on what's missing
3. Retry delegation
4. If max retries reached → fallback to Claude (if `fallback_to_claude: true`)

### Phase 4: Integrate Response

**For Code Review:**
1. Parse Codex response into structured format:
   - Strengths: []
   - Issues: {Critical: [], Important: [], Minor: []}
   - Assessment: "ready to proceed" | "needs fixes"
2. Return to `requesting-code-review` skill for action
3. Claude decides: fix issues, proceed, or escalate

**For Debugging:**
1. Parse Codex response:
   - Evidence gathered: []
   - Root cause hypothesis: ""
   - Recommended next steps: []
2. Return to `systematic-debugging` skill
3. Claude validates hypothesis against evidence
4. Claude decides next phase or action

## Response Format Expectations

### Code Review Response Format

```
STRENGTHS:
- [What was done well, specific examples]

ISSUES:

CRITICAL:
- [Issue description with file:line reference]
  Reasoning: [Why this is critical]

IMPORTANT:
- [Issue description with file:line reference]
  Reasoning: [Why this is important]

MINOR:
- [Issue description with file:line reference]
  Reasoning: [Why this is minor]

ASSESSMENT:
[ready to proceed | needs fixes | requires discussion]

REASONING:
[Overall assessment reasoning]
```

### Debugging Response Format

```
EVIDENCE GATHERED:
- [Specific evidence from investigation]
- [Data points, log outputs, behavior observations]

ROOT CAUSE HYPOTHESIS:
[Clear statement of hypothesized root cause]

REASONING:
[Why this hypothesis based on evidence]

RECOMMENDED NEXT STEPS:
1. [Specific action to test hypothesis]
2. [Expected outcome if hypothesis correct]
3. [Alternative hypothesis if this fails]
```

## Error Handling

**If Codex delegation fails:**
1. Log failure reason
2. Check `fallback_to_claude` setting
3. If true → continue with Claude-only workflow
4. If false → report error to user, ask for guidance

**If response validation fails after max retries:**
1. Present Codex response to user as-is
2. Ask if they want to:
   - Try again with manual prompt refinement
   - Continue with Claude-only approach
   - Skip this delegation point

## Integration with Existing Skills

**This skill is called by:**
- `requesting-code-review` - delegates review to Codex
- `systematic-debugging` - delegates investigation to Codex

**This skill maintains compatibility with:**
- `test-driven-development` - Reviews check for TDD adherence
- `verification-before-completion` - Reviews validate before proceeding
- `receiving-code-review` - Claude applies same rigor to Codex feedback
- `root-cause-tracing` - Debugging maintains systematic approach

## Configuration Toggle

**To enable Codex delegation:**

Edit `/Users/fh/.claude/plugins/cache/superpowers/config/codex-config.json`:

```json
{
  "codex_enabled": true,
  "delegation_rules": {
    "code_review": {
      "enabled": true,
      "delegate_to_codex": true
    }
  }
}
```

**To disable Codex delegation:**

```json
{
  "codex_enabled": false
}
```

Or set specific delegation to false:

```json
{
  "delegation_rules": {
    "code_review": {
      "delegate_to_codex": false
    }
  }
}
```

## Example Usage

### Code Review Delegation

```
[Task completed, requesting code review]

1. Check config: codex_enabled = true, code_review.delegate_to_codex = true
2. Prepare prompt:
   - Load template from config
   - Fill: BASE_SHA=abc123, HEAD_SHA=def456
   - Fill: WHAT_WAS_IMPLEMENTED="Added auth system"
   - Fill: PLAN_OR_REQUIREMENTS="Task 3 from plan"
3. Delegate: mcp__codex__spawn_agent with filled prompt
4. Codex responds with structured review
5. Validate: Has reasoning ✓, Has concrete findings ✓
6. Parse into Issues structure
7. Return to requesting-code-review: Issues found → Fix → Continue
```

### Debugging Delegation

```
[Test failure encountered, systematic debugging Phase 1]

1. Check config: codex_enabled = true, debugging.delegate_to_codex = true
2. Check phase: "evidence_gathering" in allowed phases ✓
3. Prepare prompt:
   - Load debugging template
   - Fill: PROBLEM_DESCRIPTION="Test fails with NullPointerException"
   - Fill: DEBUG_PHASE="evidence_gathering"
   - Fill: CONTEXT="Stack trace + recent changes"
4. Delegate: mcp__codex__spawn_agent
5. Codex responds with evidence and hypothesis
6. Validate: Has reasoning ✓, Has evidence ✓
7. Claude reviews hypothesis against evidence
8. Claude decides: Hypothesis sound → Phase 2 (test hypothesis)
```

## Red Flags

**Never:**
- Accept Codex response without validation
- Skip validation steps to save time
- Proceed with fixes if Critical issues identified
- Delegate without checking config
- Bypass fallback mechanism

**Always:**
- Validate response structure and content
- Apply same rigor to Codex feedback as human feedback
- Follow up on unclear or vague findings
- Maintain closed-loop with other skills
