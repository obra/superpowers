# Agent Teams vs Subagents: Comparison Guide

This guide helps you choose between Claude's Agent Teams and the traditional Subagent approach for executing implementation plans.

## Quick Decision Matrix

| Your Situation | Recommended Approach |
|----------------|---------------------|
| Independent tasks, sequential execution OK | **subagent-driven-development** |
| Tasks need coordination, agents must collaborate | **team-driven-development** |
| Multiple independent bugs/problems | **dispatching-parallel-agents** |
| Budget constrained | **subagent-driven-development** |
| Speed critical, cost secondary | **team-driven-development** |
| Unclear dependencies, need flexibility | **team-driven-development** |
| Clear specs, well-defined tasks | **subagent-driven-development** |
| Adversarial review beneficial | **team-driven-development** |

## Detailed Comparison

### Architecture

**Subagent-Driven Development:**
```
        Lead Agent
         /  |  \
        /   |   \
       /    |    \
   Sub1  Sub2  Sub3
   (task 1→2→3, sequential)
   
- Fresh subagent per task
- All communication through lead
- No agent-to-agent communication
- Sequential task execution
```

**Team-Driven Development:**
```
         Lead Agent
         /    |    \
        /     |     \
       /      |      \
   Agent1 ←→ Agent2 ←→ Agent3
   (parallel + coordination)
   
- Persistent teammate sessions  
- Direct peer-to-peer messaging
- Shared task list
- Parallel task execution
```

### Team Composition Flexibility

**Subagents (rigid structure):**
- Fixed 3-role pattern per task: Implementer → Spec Reviewer → Code Quality Reviewer
- Same structure every time, no customization
- Roles are predetermined by the skill

**Agent Teams (flexible composition):**
- **Customizable roles** based on project needs
- Examples: Frontend/Backend specialists, Security expert, Performance analyst, Documentation writer
- Team size adaptable (3-6 agents)
- Roles can be specialized (e.g., "React specialist") or generalized (e.g., "Full-stack developer")
- Mix and match based on task complexity

**Key insight:** Subagents are a fixed workflow; agent teams are a collaboration framework you adapt to your needs.

### Communication Model

**Subagents:**
- Hub-and-spoke topology
- Subagent reports to lead
- Lead dispatches next subagent
- No context shared between subagents
- Communication overhead: O(n) where n = tasks

**Agent Teams:**
- Mesh topology (agents can message each other)
- Agents coordinate directly
- Shared task state
- Context builds up within each agent
- Communication overhead: O(n*m) where n = agents, m = coordination points

### Cost Structure

**Subagent Approach:**
```
Per task:
- 1 implementer subagent call
- 1 spec reviewer subagent call  
- 1 code quality reviewer subagent call
- Controller prep/orchestration overhead

Total: ~3-5 subagent invocations per task
Example: 10 tasks × 4 calls × $2 = $80
```

**Agent Team Approach:**
```
Per team session:
- N full agent sessions (lead + teammates)
- Message passing overhead
- Shared context maintenance

Total: ~N × $40-50 per agent + overhead
Example: 4 agents × $45 = $180

Typical multiplier: 2-4x cost of subagent approach
```

### When Each Excels

**Use Subagents When:**
- ✅ Tasks are clearly independent
- ✅ Sequential execution is acceptable  
- ✅ Budget is constrained
- ✅ Well-established patterns
- ✅ Simple review suffices
- ✅ No emergent dependencies expected

**Use Agent Teams When:**
- ✅ Tasks have interdependencies
- ✅ Coordination needed between parallel work
- ✅ Multiple perspectives add value
- ✅ Adversarial review beneficial
- ✅ Speed more important than cost
- ✅ Architectural decisions needed during work
- ✅ Research/exploration phase

### Real-World Scenarios

#### Scenario 1: CRUD API Endpoints (5 endpoints)

**Analysis:**
- Tasks are independent (each endpoint standalone)
- Clear patterns (REST conventions)
- No coordination needed
- Sequential is fine

**Recommendation:** Subagent-driven-development

**Why:** Each endpoint can be built, reviewed, and completed independently. No collaboration benefit. Subagents are more cost-effective.

**Estimated cost:** 5 tasks × 4 subagents × $2 = $40

---

#### Scenario 2: Authentication System (8 tasks)

**Analysis:**
- Backend and frontend must coordinate
- Security reviewer needs to challenge implementation
- Dependencies emerge during work (token format, error handling)
- Multiple layers need alignment

**Recommendation:** Team-driven-development

**Why:** Backend implementer and frontend implementer need to align on contracts. Security reviewer provides adversarial validation. Coordination overhead justifies team approach.

**Estimated cost:** 4 agents (lead + 2 impl + reviewer) × $45 = $180

---

#### Scenario 3: Bug Fixes (6 unrelated bugs)

**Analysis:**
- Independent failures
- Different subsystems
- No shared state
- Can work in parallel

**Recommendation:** dispatching-parallel-agents

**Why:** Pure parallel execution with no coordination. Even simpler than teams - just dispatch concurrent subagents with focused scopes.

**Estimated cost:** 6 subagents × $3 = $18

---

#### Scenario 4: Database Migration (12 tasks)

**Analysis:**
- Schema changes affect multiple services
- Migration scripts must coordinate
- Rollback strategy needs discussion
- Data integrity critical

**Recommendation:** Team-driven-development

**Why:** High coordination needs. Multiple agents can explore impact, challenge approaches, and ensure consistency. Worth the cost for mission-critical work.

**Estimated cost:** 5 agents × $50 = $250

---

#### Scenario 5: Refactoring (10 files)

**Analysis:**
- Each file can be refactored independently
- Tests verify correctness
- Pattern is clear (existing code shows the way)
- No coordination needed

**Recommendation:** Subagent-driven-development

**Why:** Classic independent task pattern. Each file is a task. No collaboration benefit. Subagents are sufficient.

**Estimated cost:** 10 tasks × 4 subagents × $2 = $80

## Feature Comparison Table

| Feature | Subagents | Agent Teams |
|---------|-----------|-------------|
| **Inter-agent messaging** | ❌ No | ✅ Yes |
| **Shared task state** | ❌ No | ✅ Yes |
| **Parallel execution** | ⚠️ Limited | ✅ Full |
| **Context persistence** | ❌ Fresh per task | ✅ Per agent |
| **Self-coordination** | ❌ No | ✅ Yes |
| **Adversarial review** | ❌ No | ✅ Yes |
| **Team composition** | ❌ Fixed (1 impl + 2 reviewers) | ✅ Flexible (customize roles) |
| **Cost efficiency** | ✅ High | ❌ Low |
| **Setup complexity** | ✅ Simple | ⚠️ Complex |
| **Wall-clock speed** | ⚠️ Sequential | ✅ Parallel |
| **Budget predictability** | ✅ High | ⚠️ Variable |
| **Coordination overhead** | ✅ Low | ⚠️ High |
| **Requires experimental features** | ❌ No | ✅ Yes |

## Migration Path

### Starting with Subagents

Begin with subagent-driven-development for most projects:
- Lower cost
- Simpler orchestration
- Proven workflow
- Predictable results

### When to Consider Teams

Switch to agent teams when you hit:
- Coordination bottlenecks (too much lead agent back-and-forth)
- Emergent dependencies (tasks aren't as independent as thought)
- Quality issues from lack of discussion (agents should challenge each other)
- Time pressure (parallelization worth the cost)

### Hybrid Approach

You can mix approaches in the same project:
1. Use teams for complex coordinated phases (architecture, integration)
2. Switch to subagents for independent implementation phases
3. Use teams again for final integration and testing

**Example:**
```
Phase 1: Planning (manual)
Phase 2: Core architecture (agent team - coordination critical)
Phase 3: Independent features (subagents - clear tasks)
Phase 4: Integration (agent team - coordination critical)
Phase 5: Bug fixes (dispatching-parallel-agents)
```

## Cost-Benefit Analysis Framework

### Calculate Break-Even Point

Agent teams worth it if:
```
(Team Cost - Subagent Cost) < (Human Time Saved × Hourly Rate)

Example:
Teams: $180
Subagents: $60
Difference: $120

If teams save 2+ hours at $60/hr: Worth it
If teams save 1 hour at $60/hr: Not worth it
```

### Factor in Quality

Also consider:
- Cost of bugs that reach production
- Value of adversarial review catching issues early
- Speed-to-market for time-sensitive features

High-stakes work (security, payments, data integrity): Quality premium justifies team approach

### Monitor Real Costs

Track actual costs:
```
Project: Authentication Feature
Approach: Agent Team
Agents: 4 (lead + 2 impl + reviewer)
Actual cost: $195
Time to complete: 3 hours
Issues found: 3 security flaws (caught in peer review)

Estimated subagent cost: $70
Estimated time: 8 hours
Issues caught: Unknown (sequential review might miss)

Verdict: Team justified - security findings and 5hr time savings
```

## Common Pitfalls

### Using Teams When Subagents Sufficient

**Symptom:** Agents aren't messaging each other, just implementing independently

**Fix:** Tasks are too independent. Use subagents instead.

### Using Subagents When Teams Needed

**Symptom:** Lead agent doing excessive back-and-forth, reimplementing context for each subagent

**Fix:** Too much coordination overhead. Use teams instead.

### Wrong Team Size

**Symptom:** Costs exploding with 8+ agents, most sitting idle

**Fix:** Team too large. Reduce to 3-6 agents max.

### Over-Communication

**Symptom:** More messages than implementations, no forward progress

**Fix:** Tasks too tightly coupled. Either break dependencies or do sequentially.

### Under-Communication

**Symptom:** Team members building incompatible implementations

**Fix:** More coordination needed. Lead should actively facilitate discussions.

## Summary

**Default choice:** Subagent-driven-development
- Cost-effective
- Simple orchestration
- Works for most projects

**Upgrade to teams when:**
- Coordination overhead high
- Multiple perspectives add significant value
- Speed critical
- Budget allows 2-4x cost multiplier

**Key insight:** Agent teams are a premium feature for complex collaborative work. Use them strategically where coordination and discussion provide clear value, not as a default replacement for subagents.
