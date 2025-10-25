# Multi-Agent Enhancement Updates

## Summary

Enhanced superpowers plugin with generic multi-agent invocation capability. When similar agents exist (e.g., multiple code-reviewers), the system now automatically discovers and invokes all of them in parallel, then synthesizes their findings for comprehensive coverage and consensus validation.

## Changes Made

### 1. New Skill: `invoking-similar-agents`

**Location:** `skills/invoking-similar-agents/SKILL.md`

**Purpose:** Generic mechanism for discovering and invoking multiple agents with similar capabilities.

**Key Features:**
- **Automatic agent discovery** - Finds agents with similar names/roles across all sources:
  - Built-in agents (Claude Code system prompt)
  - Superpowers agents (plugin-provided)
  - Custom agents (`~/.claude/agents/`)
- **Parallel dispatch** - Invokes all discovered agents simultaneously
- **Result synthesis** - Aggregates findings with:
  - Consensus issues (found by 2+ agents) - HIGH PRIORITY
  - Unique findings (found by single agent)
  - Contradictions (where agents disagree)
  - Positive highlights (consensus on strengths)

**Agent Discovery Algorithm:**
1. Normalize agent name (handle variations: dashes, underscores, prefixes)
2. Search all agent sources (primary method: direct filesystem search):
   - Custom agents: `~/.claude/agents/` (filesystem search)
   - Superpowers templates: `~/.claude/plugins/cache/superpowers/skills/`
   - Built-in agents: Known from system prompt
   - Agent registry (optional): `~/.claude/plugins/cache/superpowers/agents/AGENT_REGISTRY.md`
3. Filter by capability/role matching
4. Deduplicate results

**Note:** Agent Registry is optional - discovery works via direct filesystem search. The registry serves as documentation and an optional cache for faster lookups.

**When to Use:**
- Security-critical code reviews
- Major feature implementations
- Before merging to main branch
- Complex architectural decisions

### 2. Updated Skill: `requesting-code-review`

**Location:** `skills/requesting-code-review/SKILL.md`

**Changes:**
- Now uses `invoking-similar-agents` skill for agent discovery
- Automatically finds and invokes all code-reviewer agents
- Enhanced examples showing:
  - Single reviewer workflow (backward compatible)
  - Multiple reviewer workflow (new capability)
  - Synthesis of multiple reviews

**Benefits:**
- No manual tracking of which agents exist
- Automatic discovery of new agents
- Consensus validation of findings
- Diverse perspectives (project-specific + general best practices)

## Usage Example

### Before (Manual, Single Agent)

```
You: Let me request code review.
[Dispatch code-reviewer]
[Review single agent's findings]
[Fix issues]
```

### After (Automatic, Multiple Agents)

```
You: Let me request code review using invoking-similar-agents.

[Automatically discovers]:
- code-reviewer (custom, security-focused)
- superpowers:code-reviewer (general best practices)

[Dispatches both in parallel]

[Synthesizes results]:
  CONSENSUS (HIGH PRIORITY):
  - Both: Unencrypted credentials (auth.js:42)

  UNIQUE FINDINGS:
  - Custom: Rate limiting missing
  - Superpowers: CLI help text missing

  ACTION PLAN:
  1. Fix credential encryption (Critical, consensus)
  2. Add rate limiting (Major)
  3. Add CLI help (Important)

[Fix issues in priority order]
```

## Benefits

### 1. Comprehensive Coverage
- Different agents have different blind spots
- Multiple perspectives catch more issues
- Specialized expertise from custom agents
- General best practices from built-in agents

### 2. Consensus Validation
- Issues found by 2+ agents are high confidence
- Reduces false positives
- Prioritizes fixes based on agreement

### 3. Automatic Discovery
- No manual configuration needed
- Works with any agents that follow naming conventions
- Extensible to new agent types

### 4. Generic Pattern
- Not limited to code-review
- Can be applied to:
  - Debugging (multiple debugging agents)
  - Architecture review (multiple architecture agents)
  - Performance optimization (multiple perf agents)
  - Security review (multiple security agents)

## Architecture

### Agent Sources (Priority Order)

1. **Custom Agents** (`~/.claude/agents/`)
   - User-defined, project-specific
   - Highest priority for local context

2. **Superpowers Agents** (`~/.claude/plugins/cache/superpowers/agents/`)
   - Plugin-provided templates
   - General best practices

3. **Built-in Agents** (Claude Code system prompt)
   - Core agents available by default
   - Known from system prompt

### Discovery Flow

```
User requests code review
    ↓
Use invoking-similar-agents skill
    ↓
Search custom agents directory (primary)
    ↓
Search superpowers templates
    ↓
Check built-in agents
    ↓
Optional: Query AGENT_REGISTRY.md (cache)
    ↓
Find matching agents
    ↓
Dispatch all in parallel (Task tool)
    ↓
Collect results
    ↓
Synthesize findings
    ↓
Present unified review
```

### Synthesis Algorithm

```python
def synthesize_reviews(reviews):
    consensus = find_issues_in_multiple_reviews(reviews, threshold=2)
    unique = find_unique_issues(reviews)
    contradictions = find_disagreements(reviews)
    strengths = find_common_praise(reviews)

    return {
        'consensus': sort_by_severity(consensus),  # HIGH PRIORITY
        'unique': group_by_agent(unique),
        'contradictions': analyze_tradeoffs(contradictions),
        'strengths': strengths,
        'action_plan': prioritize(consensus, unique, contradictions)
    }
```

## Configuration

### Agent Naming Conventions

For automatic discovery, agents should follow naming patterns:

**Code Review Agents:**
- `code-reviewer`
- `code_reviewer`
- `*code*review*`
- `superpowers:code-reviewer`

**Other Agent Types:**
- `debugger`, `debugging-agent`, `superpowers:debugger`
- `architect`, `architecture-reviewer`, `design-reviewer`
- `performance-optimizer`, `perf-agent`
- `security-reviewer`, `security-guardian`

### Agent Metadata (Future Enhancement)

Agents could include metadata for better discovery:

```yaml
---
name: code-reviewer
description: Security-focused code reviewer
tags: [code-review, security, python, javascript]
expertise: [authentication, cryptography, rate-limiting]
specialization: web-security
---
```

## Testing

### Test Scenarios

1. **Single agent available** - Should work as before
2. **Multiple agents available** - Should invoke all and synthesize
3. **No agents available** - Should gracefully handle
4. **Agents with different formats** - Should normalize and discover
5. **Contradictory findings** - Should flag and explain

### Manual Testing

```bash
# Test 1: Verify skill file exists
ls ~/.claude/plugins/cache/superpowers/skills/invoking-similar-agents/SKILL.md

# Test 2: Check agent registry (optional, for reference)
if [ -f ~/.claude/plugins/cache/superpowers/agents/AGENT_REGISTRY.md ]; then
    cat ~/.claude/plugins/cache/superpowers/agents/AGENT_REGISTRY.md | grep -i "code.*review"
fi

# Test 3: List custom agents
find ~/.claude/agents -name "*code*review*.md"

# Test 4: In Claude Code session
# Request code review and verify multiple agents are invoked
```

## Future Enhancements

### 1. Agent Tagging System
- Add metadata/tags to agents for better discovery
- Support capability-based matching (e.g., "find all security agents")

### 2. Configurable Discovery Rules
- User-defined matching rules
- Fuzzy matching threshold configuration
- Priority/preference settings

### 3. Performance Optimization
- Cache agent registry
- Parallel synthesis
- Incremental reviews (only changed files)

### 4. Result Caching
- Cache agent reviews by git SHA
- Reuse reviews for same code
- Invalidate on code changes

### 5. Agent Specialization Routing
- Route specific issues to specialized agents
- E.g., security issues → security-reviewer
- E.g., performance issues → performance-optimizer

### 6. Weighted Consensus
- Weight findings by agent expertise
- Higher confidence for specialized agents in their domain
- Lower weight for general findings

## Migration Guide

### For Existing Users

**No breaking changes!** The `requesting-code-review` skill still works as before when only one agent exists.

**To enable multi-agent:**
1. Add custom agents to `~/.claude/agents/`
2. Follow naming conventions (e.g., `code-reviewer`, `code_reviewer`)
3. Request code review as normal
4. System automatically discovers and uses all available agents

### For Plugin Developers

**To make your agents discoverable:**
1. Follow naming conventions for your agent type
2. Add clear description in frontmatter
3. Consider adding tags/metadata (future)
4. Document agent capabilities

**Example agent frontmatter:**
```yaml
---
name: my-code-reviewer
description: TypeScript-focused code reviewer specializing in React
tools: Read, Grep, Glob, Bash
expertise: [typescript, react, hooks, performance]
---
```

## Rollback Plan

If issues arise, rollback is simple:

```bash
# Remove new skill
rm -rf ~/.claude/plugins/cache/superpowers/skills/invoking-similar-agents

# Restore requesting-code-review from git
cd ~/.claude/plugins/cache/superpowers
git checkout skills/requesting-code-review/SKILL.md
```

## Files Modified

```
~/.claude/plugins/cache/superpowers/
├── skills/
│   ├── invoking-similar-agents/          [NEW]
│   │   └── SKILL.md                      [NEW] - Generic multi-agent pattern
│   └── requesting-code-review/
│       └── SKILL.md                      [MODIFIED] - Uses invoking-similar-agents
└── MULTI_AGENT_UPDATES.md                [NEW] - This document
```

## Related Skills

- `requesting-code-review` - Updated to use multi-agent
- `subagent-driven-development` - Could integrate multi-agent reviews
- `systematic-debugging` - Could benefit from multiple debuggers
- `writing-plans` - Could use multiple reviewers for plan validation

## Notes

This enhancement makes the superpowers plugin more powerful and flexible by:
1. Providing a **generic pattern** for multi-agent invocation (not just code review)
2. **Automatic discovery** reducing manual configuration
3. **Consensus validation** improving review quality
4. **Backward compatible** - works with single or multiple agents

The pattern can be extended to any domain where multiple perspectives add value.
