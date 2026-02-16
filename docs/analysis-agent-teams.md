# Agent Teams Support Analysis

## Executive Summary

This document analyzes the work needed to add native Claude Agent Teams support to Superpowers alongside the current subagents approach. Agent Teams is a new experimental feature in Claude Code (Opus 4.6+) that enables direct inter-agent communication and collaborative AI workflows.

## Current State: Subagent Architecture

### How Subagents Work in Superpowers

The current `subagent-driven-development` skill uses a **hub-and-spoke model**:

1. **Lead agent (controller)** orchestrates everything
2. **Fresh subagent per task** - no context pollution
3. **Two-stage review process**:
   - Spec compliance reviewer (did they build what was requested?)
   - Code quality reviewer (is it well-built?)
4. **All communication through lead** - subagents report back, lead dispatches next

**Key characteristics:**
- Sequential task execution (one after another)
- Subagents are isolated - no awareness of each other
- Controller provides full context to each subagent
- Review cycles ensure quality before moving forward
- Cost-effective for independent sequential tasks

### Existing Parallel Approach

The `dispatching-parallel-agents` skill enables **concurrent subagent execution**:

- Multiple subagents work simultaneously on independent problems
- Each has focused scope (e.g., different test files, subsystems)
- Still report only to lead agent
- Used for independent debugging or parallel fixes

**Limitations:**
- No inter-agent collaboration or discussion
- Can't share findings or coordinate dependencies
- Can't challenge each other's approaches
- No shared task state or self-organization

## New Capability: Agent Teams

### What Agent Teams Add

Agent Teams (introduced in Opus 4.6) provide:

1. **Independent context windows** - Each teammate is a full session
2. **Direct inter-agent communication** - Agents message each other, not just lead
3. **Shared task list** - Agents claim/assign/complete tasks collaboratively
4. **Self-coordination** - Agents can negotiate, delegate, resolve dependencies
5. **Peer review** - Agents can challenge findings and collaborate on solutions

### Technical Architecture

**Communication primitives:**
```
- send_message: Agent-to-agent messaging
- read_inbox: Check for new messages
- poll_inbox: Wait for messages asynchronously
```

**Team structure:**
```
~/.claude/teams/<team-name>/
  ├── tasks.json          # Shared task list
  └── inboxes/
      ├── lead.json       # Lead agent's inbox
      ├── agent-1.json    # Teammate 1's inbox
      └── agent-2.json    # Teammate 2's inbox
```

**Enable with:**
```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

### When Agent Teams Excel

**Best for:**
- Complex multi-module refactoring requiring coordination
- Adversarial development (one agent writes, another tries to break)
- Research requiring multiple perspectives and discussion
- Cross-layer features needing negotiation between frontend/backend
- Tasks with uncertain dependencies that emerge during work

**Not optimal for:**
- Simple sequential task lists
- Cost-sensitive projects (each agent = full Claude instance)
- Tasks with clear sequential dependencies
- When final result is all that matters (no collaboration benefit)

## Gap Analysis: What's Missing

### 1. Team Orchestration Skill

**Need:** New skill `team-driven-development` parallel to `subagent-driven-development`

**Would include:**
- When to use teams vs subagents (decision flowchart)
- How to initialize a team (team name, roles, task list)
- Team lead responsibilities (orchestration, conflict resolution)
- Teammate responsibilities (claim tasks, communicate, coordinate)
- How to handle inter-agent disagreements
- When to escalate to human

### 2. Team Member Prompts

**Need:** Prompt templates for team roles (not just isolated subagents)

**Required prompts:**
- `team-lead-prompt.md` - Orchestrator and facilitator
- `teammate-implementer-prompt.md` - Team-aware implementer
- `teammate-reviewer-prompt.md` - Collaborative reviewer
- `teammate-researcher-prompt.md` - Exploration and options

**Key differences from current prompts:**
- Include team context and member roster
- Encourage inter-agent communication
- Define when to message vs execute
- Handle concurrent work conflicts

### 3. Communication Patterns

**Need:** Structured patterns for agent interactions

**Examples needed:**
- Request review from peer agent
- Negotiate dependency resolution
- Share findings and get feedback
- Escalate blocking issue to lead
- Coordinate on shared resources
- Challenge implementation approach

### 4. Team Configuration

**Need:** Team setup and initialization utilities

**Would include:**
- Team composition guidance (how many agents? what roles?)
- Task distribution strategies
- Conflict resolution protocols
- Progress monitoring for teams
- Cost estimation for team vs subagent approach

### 5. Integration with Existing Skills

**Skills that would need team-aware versions:**

1. **writing-plans** - Generate team-compatible task lists
   - Mark tasks as parallel-safe or requiring coordination
   - Identify dependency groups
   - Suggest team composition

2. **requesting-code-review** - Support peer review between agents
   - Enable reviewer-implementer dialogue
   - Allow multiple reviewers to discuss findings

3. **systematic-debugging** - Parallel investigation by team
   - Agents explore different hypotheses simultaneously
   - Share findings and discuss root cause

4. **finishing-a-development-branch** - Team completion
   - Ensure all agents have finished
   - Consolidated review of team output
   - Handle conflicts in changes

### 6. Documentation and Guidance

**Need:** Clear when-to-use guidance and examples

**Documents needed:**
- Comparison matrix (teams vs subagents vs manual)
- Cost analysis and budgeting guide
- Real-world case studies
- Troubleshooting team coordination issues
- Best practices for team composition

## Proposed Architecture

### Coexistence Strategy

Both approaches should be available with clear guidance on when to use each:

```
Have implementation plan?
  ├─ Tasks highly independent? → subagent-driven-development
  ├─ Tasks require coordination? → team-driven-development  
  └─ Tasks tightly coupled? → Manual or executing-plans
```

### Skill Hierarchy

```
Collaboration Skills:
  ├─ subagent-driven-development (existing)
  │   ├─ Sequential execution
  │   ├─ Hub-and-spoke model
  │   └─ Cost-effective
  │
  ├─ team-driven-development (new)
  │   ├─ Collaborative execution
  │   ├─ Peer-to-peer communication
  │   └─ Resource-intensive
  │
  └─ dispatching-parallel-agents (existing)
      ├─ Concurrent execution
      ├─ Independent scopes
      └─ No coordination needed
```

### Minimal Implementation Approach

**Phase 1: Core Team Skill**
1. Create `team-driven-development/SKILL.md`
2. Define team initialization process
3. Create basic team member prompts
4. Document message passing patterns
5. Add when-to-use decision tree

**Phase 2: Integration**
1. Update `writing-plans` with team-compatibility markers
2. Add team-aware version notes to related skills
3. Create comparison documentation

**Phase 3: Examples and Testing**
1. Create example team scenarios
2. Test with real development tasks
3. Document cost comparisons
4. Refine based on learnings

## Key Design Decisions

### 1. Coexistence vs Replacement

**Decision:** Coexistence - both approaches remain available

**Rationale:**
- Subagents are simpler and more cost-effective for many tasks
- Agent teams are overkill for sequential independent tasks
- Users should choose based on task requirements
- Existing workflows shouldn't be disrupted

### 2. Opt-in vs Automatic

**Decision:** Explicit opt-in to agent teams

**Rationale:**
- Experimental feature requiring configuration
- Significantly higher token costs
- Users should consciously choose team approach
- Avoid unexpected behavior changes

### 3. Skill Structure

**Decision:** New parallel skill, not modification of existing

**Rationale:**
- Clear separation of concerns
- Different mental models (sequential vs collaborative)
- Easier to document and understand
- Lower risk of breaking existing workflows

### 4. Integration Depth

**Decision:** Light integration initially, deeper over time

**Rationale:**
- Start with standalone team skill
- Let patterns emerge from usage
- Avoid over-engineering before validation
- Iteratively improve based on real experience

## Implementation Roadmap

### Milestone 1: Research & Analysis (Current)
- ✅ Research agent teams feature
- ✅ Analyze current architecture
- ✅ Identify gaps and requirements
- ✅ Create implementation plan

### Milestone 2: Core Team Skill (Next)
- Create `skills/team-driven-development/SKILL.md`
- Write team member prompt templates
- Document message passing patterns
- Add team initialization guide
- Test with sample scenario

### Milestone 3: Documentation
- Create comparison guide (teams vs subagents)
- Document team composition best practices
- Add configuration instructions
- Create cost analysis guide
- Write troubleshooting guide

### Milestone 4: Integration (Future)
- Update `writing-plans` for team tasks
- Add team hints to related skills
- Create team-aware debugging patterns
- Build team coordination utilities

### Milestone 5: Validation (Future)
- Real-world testing with teams
- Cost-benefit analysis
- Performance benchmarking
- User feedback integration
- Pattern refinement

## Cost Considerations

### Token Usage Comparison

**Subagent-driven-development:**
- 1 implementer + 2 reviewers per task = 3 subagent calls
- Controller does prep work (extracts context)
- Review loops add iterations
- Typical: 3-5 subagent invocations per task

**Team-driven-development:**
- 1 lead + N teammates (full sessions each)
- Each agent maintains full context
- Inter-agent messages add overhead
- Typical: N * (full session cost) + message overhead

**Estimation:**
- Teams are 2-4x more expensive in tokens
- BUT can be faster wall-clock time for collaborative tasks
- Trade-off: Cost vs speed vs collaboration quality

### When Cost is Justified

Agent teams worth the cost when:
- Task complexity benefits from multiple perspectives
- Coordination overhead would be high manually
- Adversarial validation adds significant value
- Time-to-completion is critical
- Research/exploration phase needs breadth

Not justified when:
- Tasks are clearly independent
- Sequential execution is fine
- Budget is constrained
- Simple review suffices
- Pattern is well-established

## Risks and Mitigations

### Risk 1: Over-complexity
**Mitigation:** Start simple, add complexity only as needed

### Risk 2: High costs surprise users
**Mitigation:** Clear cost warnings in documentation and prompts

### Risk 3: Coordination overhead wastes time
**Mitigation:** Provide clear patterns for when agents should communicate

### Risk 4: Feature remains experimental
**Mitigation:** Document fallback to subagents if teams unavailable

### Risk 5: Conflicts in concurrent work
**Mitigation:** Task planning emphasizes conflict-free work distribution

## Success Metrics

### Adoption Metrics
- Number of users enabling agent teams
- Frequency of team-driven-development usage
- Team size distribution (how many agents typically?)

### Quality Metrics
- Defect rate: teams vs subagents vs manual
- Review cycle count before approval
- Implementation accuracy (spec compliance)

### Efficiency Metrics
- Wall-clock time: teams vs subagents
- Token usage per completed task
- Tasks completed before human intervention needed

### User Experience
- User satisfaction ratings
- When-to-use guidance clarity
- Documentation effectiveness
- Support ticket frequency

## Conclusion

Adding native agent teams support to Superpowers is feasible and valuable, but should be implemented as a complementary approach rather than a replacement for the existing subagent model. The key is providing clear guidance on when each approach is appropriate and ensuring both can coexist harmoniously.

**Recommended approach:**
1. Start with a standalone `team-driven-development` skill
2. Create comprehensive documentation on when to use teams
3. Test with real scenarios to validate patterns
4. Gradually integrate with existing skills as patterns stabilize
5. Monitor costs and effectiveness to refine guidance

The experimental nature of the feature and its higher cost profile mean it should be opt-in and clearly documented, allowing users to make informed choices about when collaborative agent teams provide sufficient value to justify the additional expense.
