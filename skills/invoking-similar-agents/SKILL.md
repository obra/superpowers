---
name: invoking-similar-agents
description: Use when you need comprehensive perspective on a task - automatically discovers and invokes all agents with similar names or roles in parallel, then synthesizes their findings for better coverage and consensus validation
---

# Invoking Similar Agents

Discover and dispatch multiple agents with similar capabilities to get diverse perspectives and comprehensive coverage.

**Core principle:** Multiple perspectives catch more issues and validate findings through consensus.

## When to Use

**Mandatory:**
- Security-critical code reviews
- Major feature implementations
- Before merging to main branch
- Complex architectural decisions

**Optional but valuable:**
- Code reviews for important features
- Design decisions with trade-offs
- Debugging complex issues
- Performance optimization reviews

## How It Works

### 1. Agent Discovery

**Find all agents matching the role:**

Discover agents through multiple sources:
- **Name matching**: Find agents with similar names (e.g., "code-reviewer", "code_reviewer", "superpowers:code-reviewer")
- **Role matching**: Find agents with similar descriptions or capabilities
- **Sources**: Check built-in agents, superpowers agents, and custom agents

**Discovery methods:**

1. **Direct filesystem search**:
   - Custom agents: `~/.claude/agents/**/*.md`
   - Superpowers templates: `~/.claude/plugins/cache/superpowers/skills/*/`
   - Built-in agents: Known from Claude Code system prompt

**Note:** Agent discovery uses direct filesystem search - no registry or configuration file needed.

### 2. Parallel Dispatch

**Invoke all discovered agents in parallel:**

Use Task tool to dispatch agents simultaneously:
- Each agent receives the same context/prompt
- All agents work independently
- No shared state between agents
- Results collected when all complete

**Example for code review:**
```bash
# Get context
BASE_SHA=$(git rev-parse HEAD~1)
HEAD_SHA=$(git rev-parse HEAD)

# Dispatch all code-reviewer agents in parallel
Task 1: code-reviewer (custom agent)
Task 2: superpowers template-based reviewer
Task 3: security-focused-reviewer (if exists)
```

### 3. Result Aggregation

**Synthesize findings from all agents:**

**Consensus Issues (HIGH PRIORITY):**
- Issues found by 2+ agents
- High confidence these are real problems
- Fix immediately

**Unique Findings:**
- Issues found by single agent
- May indicate specialized knowledge
- Evaluate based on agent's expertise area

**Contradictions:**
- Agents disagree on approach/severity
- Investigate to understand trade-offs
- May require human judgment

**Strengths:**
- Positive feedback from multiple agents
- Validates good design decisions

### 4. Synthesis Format

```markdown
## Multi-Agent Review Summary

### Agents Consulted
- code-reviewer (custom, security-focused)
- superpowers:code-reviewer (general best practices)
- performance-optimizer (if performance-related)

### Consensus Findings (High Confidence)
[Issues found by 2+ agents]

🔴 **Critical** (found by N agents):
- Issue description
- File:line references
- Suggested fix

🟡 **Important** (found by N agents):
- ...

### Unique Findings by Agent
**code-reviewer:**
- [Issues only this agent found]

**superpowers:code-reviewer:**
- [Issues only this agent found]

### Contradictions/Trade-offs
[Where agents disagree and why]

### Positive Highlights (Consensus)
[What multiple agents praised]

### Recommended Actions
1. [Prioritized list based on consensus + severity]
```

## Algorithm: Finding Similar Agents

### Step 1: Normalize agent name

```text
Input: "code-reviewer"
Variations to check:
- code-reviewer
- code_reviewer
- coderereviewer
- superpowers:code-reviewer
- *code*review*
```

### Step 2: Search agent locations

```bash
# Primary: Direct filesystem search (always works)
find ~/.claude/agents -name "*code*review*.md"

# Check superpowers templates
find ~/.claude/plugins/cache/superpowers/skills -name "*code*review*" -type d

# Built-in agents are known from Claude Code system prompt
# No filesystem search needed - they're in the agent list
```

### Step 3: Filter by capability

- Read agent descriptions
- Match against desired role/capability
- Include agents with overlapping expertise

### Step 4: Deduplicate

- Remove duplicate references to same agent
- Keep highest-specificity version

## Example: Code Review

```text
[Just completed authentication feature]

You: Let me use invoking-similar-agents to get comprehensive code review.

Step 1: Discover code-reviewer agents
  Found:
  - code-reviewer (custom, security-focused)
  - superpowers template (general practices)

Step 2: Dispatch both in parallel
  [Task 1: code-reviewer with context]
  [Task 2: superpowers template with context]

Step 3: Collect results
  code-reviewer:
    🔴 Critical: Plain-text credentials (auth.js:42)
    🟡 Major: Missing rate limiting
    🟢 Minor: Variable naming

  superpowers:
    Critical: Unencrypted credentials (auth.js:42)
    Important: No CLI help text
    Strengths: Good test coverage

Step 4: Synthesize
  CONSENSUS (FIX NOW):
  - Both: Unencrypted credentials at auth.js:42

  UNIQUE FINDINGS:
  - Custom: Rate limiting missing
  - Superpowers: CLI help text missing

  POSITIVE (CONSENSUS):
  - Good test coverage

  ACTION PLAN:
  1. Fix credential encryption (Critical, consensus)
  2. Add rate limiting (Major, security-focused)
  3. Add CLI help (Important, UX)
  4. Improve naming (Minor, optional)

[Implement fixes in priority order]
```

## Integration with Existing Skills

**requesting-code-review:**
- Uses this skill to discover all code-reviewer agents
- Dispatches discovered agents in parallel
- Synthesizes review results

**systematic-debugging:**
- Could use to get multiple debugging perspectives
- Especially for complex/unclear bugs

**writing-plans:**
- Could use to validate plan quality from multiple angles
- Architecture review agents

## Benefits

**Comprehensive Coverage:**
- Different agents have different blind spots
- Multiple perspectives = better coverage

**Consensus Validation:**
- Issues found by multiple agents are high confidence
- Reduces false positives

**Specialized Expertise:**
- Custom agents may have project-specific knowledge
- Built-in agents have general best practices
- Security agents focus on vulnerabilities

**Redundancy:**
- If one agent misses something, others may catch it
- Safety net for critical reviews

## Red Flags

**Don't:**
- Invoke similar agents for trivial tasks
- Ignore consensus findings
- Cherry-pick only favorable reviews
- Skip synthesis step

**Do:**
- Use for high-stakes decisions/reviews
- Prioritize consensus issues
- Investigate contradictions
- Balance cost (multiple agents) vs benefit (better coverage)

## Configuration

**Agent matching rules** can be customized:
- Fuzzy name matching threshold
- Description keyword matching
- Expertise area tagging
- Priority/preference for certain agents

**Future enhancement:** Create agent tags/metadata for better discovery
- Tags: ["code-review", "security", "performance"]
- Specializations: ["react", "node.js", "python"]
- Expertise level: ["junior", "senior", "expert"]
