# Codex CLI Integration Guide

## Overview

SuperPowers now supports delegating code review and debugging tasks to Codex CLI, allowing Claude Code to focus on main implementation while Codex handles auxiliary review and debugging work.

## Architecture

```
User Request
    ↓
Claude Code (Orchestrator)
    ↓
[Check Config] → Codex enabled?
    ├─ Yes → Codex Delegator Skill
    │         ↓
    │    Format Prompt → mcp__codex__spawn_agent
    │         ↓
    │    Codex Executes Review/Debug
    │         ↓
    │    Response Validation Hook
    │         ↓
    │    Claude Validates & Integrates
    │         ↓
    │    Action (fix/proceed/escalate)
    │
    └─ No → Traditional Claude Workflow
              ↓
         code-reviewer subagent / systematic debugging
```

## Configuration

### Location

`~/.claude/plugins/cache/superpowers/config/codex-config.json`

### Structure

```json
{
  "codex_enabled": true | false,
  "delegation_rules": {
    "code_review": {
      "enabled": true,
      "delegate_to_codex": true,
      "fallback_to_claude": true
    },
    "debugging": {
      "enabled": true,
      "delegate_to_codex": true,
      "phases": ["evidence_gathering", "hypothesis_testing"],
      "fallback_to_claude": true
    }
  },
  "response_validation": {
    "require_reasoning": true,
    "require_concrete_findings": true,
    "max_retry_attempts": 2
  }
}
```

### Configuration Options

**codex_enabled** (boolean)
- Master toggle for all Codex delegation
- `false` → All work handled by Claude
- `true` → Check individual delegation rules

**delegation_rules.code_review**
- `enabled`: Whether code review delegation is available
- `delegate_to_codex`: Actually delegate reviews to Codex
- `fallback_to_claude`: Use Claude if Codex fails

**delegation_rules.debugging**
- `enabled`: Whether debugging delegation is available
- `delegate_to_codex`: Actually delegate debugging to Codex
- `phases`: Which systematic-debugging phases can be delegated
- `fallback_to_claude`: Use Claude if Codex fails

**response_validation**
- `require_reasoning`: Codex must explain its findings
- `require_concrete_findings`: Codex must provide specific examples
- `max_retry_attempts`: How many times to retry if validation fails

## Usage

### Code Review with Codex

**Automatic (recommended):**

```markdown
[You've completed a task]

You: "I'm using requesting-code-review to validate this work"

System:
1. Checks config → Codex enabled for code_review
2. Uses codex-delegator skill
3. Formats review prompt
4. Calls mcp__codex__spawn_agent
5. Validates response
6. Presents structured feedback

You: [Act on feedback: fix issues, proceed, or discuss]
```

**Manual override (force Claude review):**

```bash
# Temporarily disable Codex for code review
jq '.delegation_rules.code_review.delegate_to_codex = false' config/codex-config.json > tmp.json
mv tmp.json config/codex-config.json

# Or directly dispatch code-reviewer subagent
[Use Task tool with superpowers:code-reviewer]
```

### Debugging with Codex

**Within systematic-debugging workflow:**

```markdown
[Bug encountered]

You: "I'm using systematic-debugging to find the root cause"

Phase 1: Root Cause Investigation
System:
1. Checks config → Codex enabled for debugging
2. Checks phase → "evidence_gathering" in allowed phases
3. Uses codex-delegator skill
4. Codex gathers evidence and forms hypothesis
5. Claude validates hypothesis
6. Decide: Proceed to Phase 3 or gather more evidence
```

## Response Formats

### Code Review Response

Codex returns:

```
STRENGTHS:
- [Specific things done well with examples]

ISSUES:

CRITICAL:
- [Issue description at file:line]
  Reasoning: [Why critical]

IMPORTANT:
- [Issue description at file:line]
  Reasoning: [Why important]

MINOR:
- [Issue description at file:line]
  Reasoning: [Why minor]

ASSESSMENT:
[ready to proceed | needs fixes | requires discussion]

REASONING:
[Overall assessment reasoning]
```

### Debugging Response

Codex returns:

```
EVIDENCE GATHERED:
- [Concrete evidence: logs, traces, data]

ROOT CAUSE HYPOTHESIS:
[Clear hypothesis statement]

REASONING:
[Why this hypothesis based on evidence]

RECOMMENDED NEXT STEPS:
1. [Specific test action]
2. [Expected outcome if correct]
3. [Alternative if fails]
```

## Validation

### Validation Hook

Location: `hooks/codex-response-validator.sh`

**Validates:**
- Required sections present
- Reasoning provided (if configured)
- Concrete findings (if configured)
- Proper structure

**On validation failure:**
1. Check retry count < max_retry_attempts
2. Refine prompt
3. Retry delegation
4. If max retries → fallback to Claude (if enabled)

## Integration with Existing Workflows

### Subagent-Driven Development

```markdown
Task 1: [Implementation]
↓
Code Review (Codex or Claude based on config)
↓
Fix Issues
↓
Mark Complete
↓
Task 2: [Implementation]
...
```

**No workflow changes required**
- codex-delegator integrates transparently
- Same feedback format
- Same action steps

### Systematic Debugging

```markdown
Phase 1: Root Cause Investigation
├─ Evidence gathering (optionally Codex)
├─ Claude validates evidence
↓
Phase 2: Pattern Analysis (Claude)
↓
Phase 3: Hypothesis Testing (optionally Codex)
├─ Codex runs minimal tests
├─ Claude validates results
↓
Phase 4: Implementation (Claude)
```

**Preserves systematic approach**
- No phase-skipping
- Claude validates all findings
- Maintains closed-loop with TDD, verification, etc.

## Troubleshooting

### Codex delegation not working

1. Check `codex_enabled: true` in config
2. Check specific delegation rule enabled
3. Verify Codex MCP server is running
4. Check Claude Code has access to `mcp__codex__spawn_agent`

### Validation keeps failing

1. Check response format matches expected structure
2. Review `response_validation` settings (may be too strict)
3. Check if `require_reasoning: false` helps
4. Review max_retry_attempts (may need more)

### Want to disable Codex temporarily

```bash
# Quick disable
jq '.codex_enabled = false' config/codex-config.json > tmp.json && mv tmp.json config/codex-config.json

# Disable specific delegation
jq '.delegation_rules.code_review.delegate_to_codex = false' config/codex-config.json > tmp.json && mv tmp.json config/codex-config.json
```

### Fallback not working

1. Check `fallback_to_claude: true` in delegation rules
2. Verify code-reviewer subagent still available
3. Check for errors in hook output

## Examples

See:
- `examples/codex-review-example.md` - Full code review workflow
- `examples/codex-debug-example.md` - Full debugging workflow

## Advanced Configuration

### Custom Prompts

Edit `codex_prompts` in config to customize:
- Template structure
- Required information
- Output format expectations

### Phase-Specific Debugging

```json
{
  "delegation_rules": {
    "debugging": {
      "phases": ["evidence_gathering"],
      "delegate_to_codex": true
    }
  }
}
```

This delegates only evidence gathering to Codex, Claude handles pattern analysis and hypothesis testing.

### Parallel Reviews

For multiple tasks, Codex can review in parallel:

```
Use: mcp__codex__spawn_agents_parallel
With: [
  {"prompt": "review task 1"},
  {"prompt": "review task 2"},
  {"prompt": "review task 3"}
]
```

## Best Practices

1. **Start with defaults** - Default config is balanced
2. **Monitor validation failures** - Adjust if too many retries
3. **Use fallback** - Always enable `fallback_to_claude: true`
4. **Trust but verify** - Claude validates all Codex findings
5. **Preserve workflows** - Don't skip phases/steps for Codex
6. **Document decisions** - If you modify config, document why

## Migration from Claude-Only

1. Backup config: `cp config/codex-config.json config/codex-config.backup.json`
2. Set `codex_enabled: true`
3. Test with small tasks first
4. Monitor validation success rate
5. Adjust settings as needed
6. Roll back if issues: `mv config/codex-config.backup.json config/codex-config.json`
