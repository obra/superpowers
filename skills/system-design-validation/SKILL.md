---
name: system-design-validation
description: Use after brainstorming design, before implementation - validates architecture decisions against scalability, failure modes, complexity, and YAGNI principles to catch flaws early
---

# System Design Validation

## Overview

Architectural flaws found during coding are expensive to fix. Missing failure modes cause production outages. Over-engineering wastes time.

**Core principle:** Validate design decisions before implementation. Finding architectural flaws during coding = expensive rework.

**Violating the letter of this checklist is violating the spirit of good design.**

## The Iron Law

```
NO LARGE FEATURE IMPLEMENTATION WITHOUT DESIGN VALIDATION
Answer the hard questions before writing code.
```

Starting to code without validation? Stop. Run the checklist first.

Skipping failure mode analysis? Delete it. Start over.

## When to Use

Use this skill when:

**Always:**
- Designing large features (multi-week effort)
- Adding new services or components
- Making architectural decisions
- Changing system boundaries
- Adding external dependencies

**Especially when:**
- After brainstorming session (before writing implementation plan)
- Before starting multi-week projects
- When design adds complexity
- When performance/scale matters
- When availability requirements are high

**Don't skip when:**
- "Design seems simple" (simple designs have failure modes)
- "Already discussed in meeting" (meetings miss details)
- "Under time pressure" (validation saves time vs fixing production)

## Validation Process

Use TodoWrite to track this checklist. Answer every question honestly.

## 1. Requirements Clarity

Before validating design, ensure requirements are clear:

### Questions

- [ ] **What problem does this solve?**
  - State the user problem, not the solution
  - What happens if we don't build this?

- [ ] **What are the success criteria?**
  - How do we know this works?
  - What metrics matter?

- [ ] **What are the performance requirements?**
  - Expected latency (p50, p95, p99)
  - Expected throughput (requests/sec, events/sec)
  - Expected data volume (records, storage size)

- [ ] **What are the availability requirements?**
  - SLA commitment (99.9%, 99.99%)
  - Acceptable downtime
  - Acceptable data loss (RPO, RTO)

### Red Flags

- Vague requirements ("should be fast", "highly available")
- No success metrics
- No performance numbers
- Assuming requirements instead of confirming

## 2. Scalability Analysis

Ensure design scales to expected load:

### Questions

- [ ] **What are the expected load patterns?**
  - Requests per second (average, peak)
  - Data volume (current, 1 year, 3 years)
  - User growth projections
  - Seasonal/daily patterns

- [ ] **Where are the bottlenecks?**
  - Database queries (N+1, full table scans)
  - API rate limits
  - Memory usage
  - CPU-intensive operations
  - Network bandwidth

- [ ] **How does this scale?**
  - Horizontal scaling (add more instances)
  - Vertical scaling (bigger instances)
  - What are the scaling limits?
  - Where does it stop scaling?

- [ ] **What happens at 10x current load?**
  - Will it work at 10x users?
  - What breaks first?
  - What's the mitigation plan?

### Red Flags

- "We'll scale when we need to" (measure now, not later)
- No load testing plan
- Assuming infinite database capacity
- Single point of bottleneck with no mitigation

### Example Analysis

**Good:**
```
Current: 100 req/sec
Expected 1yr: 1000 req/sec
Expected 3yr: 5000 req/sec

Bottleneck: Database writes (500 writes/sec max)

Mitigation:
- Use write batching (10x reduction in write ops)
- Add read replicas for read traffic (90% of load)
- Cache frequent queries (Redis)
- Shard database if exceeds 5000 req/sec

Validation: Load test at 2000 req/sec to confirm headroom
```

**Bad:**
```
Should handle whatever traffic comes

(No numbers, no bottleneck analysis, no mitigation plan)
```

## 3. Failure Mode Analysis

Identify what can fail and plan for it:

### Questions

- [ ] **What can fail?**
  - External dependencies (APIs, databases, services)
  - Network failures
  - Disk failures
  - Process crashes
  - Data corruption
  - Configuration errors

- [ ] **What happens when X fails?**
  - If database is down?
  - If external API is down?
  - If network is slow/lossy?
  - If service crashes mid-operation?
  - If dependency returns errors?

- [ ] **Graceful degradation or hard failure?**
  - Can system operate in degraded mode?
  - What functionality is lost?
  - What's the fallback behavior?

- [ ] **What are the retry/timeout strategies?**
  - Retry on transient failures?
  - Exponential backoff?
  - Circuit breaker pattern?
  - Timeout values (connection, request)

- [ ] **How do we recover from failures?**
  - Automatic recovery?
  - Manual intervention required?
  - Data repair needed?
  - Rollback strategy?

- [ ] **What monitoring/alerting is needed?**
  - What metrics to track?
  - What triggers alerts?
  - What SLIs/SLOs?

### Red Flags

- "Dependencies are reliable" (everything fails)
- No timeout strategy
- No retry strategy
- Assuming happy path only
- No monitoring plan

### Example Analysis

**Good:**
```
Dependency: Payment Gateway API

Failure modes:
1. API timeout → Retry 3x with exponential backoff, then fail order
2. API returns 500 → Same retry logic
3. API returns 400 (bad request) → No retry, fail order immediately
4. API unavailable → Circuit breaker trips after 5 failures, return error to user

Monitoring:
- Alert if payment error rate > 5%
- Alert if payment latency p95 > 3s
- Dashboard showing payment success rate

Graceful degradation:
- Cannot process orders if payment API down
- Show maintenance message to users
- Queue orders for retry when API recovers (if acceptable to business)
```

**Bad:**
```
If payment API fails, show error

(No retry strategy, no monitoring, no circuit breaker)
```

## 4. Data Consistency

Ensure data consistency guarantees match requirements:

### Questions

- [ ] **What data needs to be consistent?**
  - Strong consistency (immediate)
  - Eventual consistency (delayed)
  - Which data can tolerate stale reads?

- [ ] **What are the consistency guarantees?**
  - Read-your-writes?
  - Monotonic reads?
  - Causal consistency?

- [ ] **How do we handle conflicts?**
  - Last-write-wins?
  - Application-level merge?
  - Conflict-free data structures (CRDTs)?

- [ ] **What happens during partial failures?**
  - Transaction halfway done?
  - Some nodes updated, others not?
  - Reconciliation strategy?

- [ ] **Do we need transactions?**
  - Single database transaction?
  - Distributed transaction (2PC, Saga)?
  - Idempotent operations instead?

### Red Flags

- Assuming eventual consistency is fine (without analysis)
- Ignoring partial failure scenarios
- Using distributed transactions without understanding cost
- No conflict resolution strategy

### Example Analysis

**Good:**
```
Use case: Order processing

Consistency requirements:
- Inventory count: Strong consistency (prevent overselling)
- Order status: Eventual consistency acceptable (status email can be delayed)
- User profile: Eventual consistency acceptable

Approach:
- Use database transaction for inventory decrement + order creation (atomic)
- Async job for sending confirmation email (eventual)
- Idempotent payment processing (safe to retry)

Partial failure handling:
- If payment succeeds but email fails → Retry email with idempotency
- If inventory locked but payment fails → Rollback transaction
```

**Bad:**
```
Store everything in database with transactions

(No analysis of what needs strong vs eventual consistency)
```

## 5. Operational Complexity

Evaluate operational burden of the design:

### Questions

- [ ] **How many new components does this add?**
  - New services/processes
  - New databases/caches
  - New queues/brokers
  - New infrastructure

- [ ] **What's the deployment strategy?**
  - Blue-green deployment?
  - Rolling deployment?
  - Canary deployment?
  - Database migrations?

- [ ] **What configuration is needed?**
  - Environment variables
  - Feature flags
  - Service discovery
  - Secrets management

- [ ] **How do we debug issues in production?**
  - Logging strategy
  - Distributed tracing
  - Metrics/dashboards
  - Access to production data

- [ ] **What's the rollback plan?**
  - Can we rollback code?
  - Can we rollback database changes?
  - What's the rollback time?

### Red Flags

- Adding multiple new components without justification
- No deployment plan
- No rollback strategy
- Assuming debugging will be easy

### Example Analysis

**Good:**
```
Components added:
- 1 new service (recommendation engine)
- 1 new cache (Redis for recommendations)

Deployment:
- Canary deploy: 5% → 25% → 100%
- Feature flag to enable/disable recommendations
- Can rollback code in < 5 minutes
- Cache is optional (graceful degradation if unavailable)

Debugging:
- Structured logging with request IDs
- OpenTelemetry tracing across services
- Dashboard showing recommendation latency, cache hit rate
- Runbook for common issues

Operational cost: Acceptable (1 new service, 1 cache, well-tested)
```

**Bad:**
```
Add 5 new microservices, 3 message queues, 2 databases

(No justification for complexity, no deployment/debugging plan)
```

## 6. Dependencies & Interfaces

Validate external dependencies and API contracts:

### Questions

- [ ] **What external systems does this depend on?**
  - Third-party APIs
  - Internal services
  - Databases
  - Message queues

- [ ] **What are the SLAs of dependencies?**
  - Uptime guarantees
  - Latency expectations
  - Rate limits
  - Support contracts

- [ ] **What happens if dependency is slow/down?**
  - Timeout strategy
  - Fallback behavior
  - Circuit breaker
  - Cached data

- [ ] **What are the API contracts?**
  - Request/response schemas
  - Error handling
  - Versioning strategy
  - Breaking vs non-breaking changes

- [ ] **How do we version these interfaces?**
  - URL versioning (/v1/api)
  - Header versioning
  - Content negotiation
  - Deprecation policy

### Red Flags

- Depending on unreliable service without fallback
- No SLA validation
- No API versioning plan
- Assuming dependencies never change

## 7. Security & Compliance

Ensure security and compliance requirements are met:

### Questions

- [ ] **What data is being processed?**
  - PII (personally identifiable information)
  - Financial data
  - Health data
  - Sensitive business data

- [ ] **What are the auth/authz requirements?**
  - Who can access this?
  - What permissions are needed?
  - How is authentication handled?

- [ ] **What encryption is needed?**
  - Encryption at rest (database, files)
  - Encryption in transit (TLS)
  - Key management

- [ ] **What compliance requirements apply?**
  - GDPR (data privacy)
  - PCI-DSS (payment data)
  - HIPAA (health data)
  - SOC2 (security controls)

### Red Flags

- Storing PII without encryption
- No access control
- Ignoring compliance requirements
- Assuming security isn't needed

## 8. Simplicity Check (YAGNI Ruthlessly)

Simplify the design before implementing:

### Questions

- [ ] **Can we solve this with existing components?**
  - Use existing service instead of new one?
  - Use existing database instead of new one?
  - Use existing patterns?

- [ ] **What features can we cut from v1?**
  - Which features are "nice to have"?
  - What's the minimal viable version?
  - What can we add later if needed?

- [ ] **What's the simplest thing that could work?**
  - Simplest architecture?
  - Fewest components?
  - Least code?

- [ ] **Are we over-engineering?**
  - Building for scale we don't have?
  - Adding abstraction we don't need?
  - Premature optimization?

### Red Flags

- "We might need this later" (YAGNI)
- Adding abstraction "for flexibility"
- Building for 1000x scale when at 1x
- Complex solution to simple problem

### Example Analysis

**Good:**
```
Initial design: 3 microservices, event bus, saga pattern

Simplified design: 1 service with database transactions

Justification:
- Current load: 10 req/sec (doesn't need microservices)
- All operations in same bounded context (don't need distributed transactions)
- Can refactor to microservices later if needed

Removed features:
- Real-time notifications (add later if users request)
- Advanced analytics (add later with actual usage data)
- Multi-region deployment (add when we have users in other regions)
```

**Bad:**
```
Building microservices architecture from day 1 for future scale

(Over-engineering, YAGNI violation)
```

## Validation Output

After completing the checklist, document:

### 1. Validation Results Document

Create `docs/designs/YYYY-MM-DD-<feature>-validation.md`:

```markdown
# System Design Validation: [Feature Name]

**Date:** YYYY-MM-DD
**Status:** [Approved / Needs Revision / Rejected]

## Requirements Summary
- Problem: ...
- Success criteria: ...
- Performance: ...
- Availability: ...

## Scalability Analysis
- Expected load: ...
- Bottlenecks: ...
- Scaling strategy: ...
- Load testing plan: ...

## Failure Modes
- Dependencies: ...
- Failure scenarios: ...
- Retry/timeout strategy: ...
- Monitoring plan: ...

## Data Consistency
- Consistency requirements: ...
- Transaction strategy: ...
- Conflict resolution: ...

## Operational Complexity
- New components: ...
- Deployment strategy: ...
- Rollback plan: ...
- Debugging approach: ...

## Dependencies
- External dependencies: ...
- SLAs: ...
- Fallback strategies: ...

## Security & Compliance
- Data classification: ...
- Auth/authz: ...
- Encryption: ...
- Compliance: ...

## Simplification (YAGNI)
- Original design: ...
- Simplified design: ...
- Features removed from v1: ...
- Justification: ...

## Risks & Mitigations
1. Risk: ... / Mitigation: ...
2. Risk: ... / Mitigation: ...

## Decision
[Go / No-go with rationale]
```

### 2. Risks & Mitigations

List identified risks with mitigation strategies:

**Example:**
```
Risks:
1. Payment API has 99.5% SLA (below our 99.9% target)
   Mitigation: Implement circuit breaker + retry logic + queue for offline processing

2. Database bottleneck at 1000 req/sec
   Mitigation: Add read replicas + caching + load test at 2000 req/sec to confirm

3. New service increases operational complexity
   Mitigation: Comprehensive monitoring + runbook + on-call training
```

### 3. Go/No-Go Decision

Make explicit decision:

**Go:** Requirements clear, risks identified with mitigations, design simplified
**No-go:** Critical risks without mitigation, unclear requirements, over-engineered

## Anti-Patterns

### The "We'll Scale Later" Anti-Pattern

**Problem:** No scalability analysis, assumes infinite capacity

**Solution:** Analyze bottlenecks now, plan for 10x growth

### The "Happy Path Only" Anti-Pattern

**Problem:** Ignoring failure modes, no error handling

**Solution:** Analyze every dependency failure, plan graceful degradation

### The "Add Abstraction for Flexibility" Anti-Pattern

**Problem:** Over-engineering, building for hypothetical future

**Solution:** YAGNI ruthlessly, build for current requirements

### The "Microservices from Day 1" Anti-Pattern

**Problem:** Premature distribution, operational complexity without need

**Solution:** Start with monolith, extract services when needed

### The "No Monitoring Plan" Anti-Pattern

**Problem:** Cannot debug production issues, no visibility

**Solution:** Define monitoring/alerting before implementing

## Integration with Other Skills

- **brainstorming**: Run validation AFTER brainstorming, BEFORE implementation
- **writing-plans**: Validation informs implementation plan
- **test-driven-development**: Validation identifies test scenarios (failure modes)
- **schema-migration-strategy**: Database design validated here
- **secure-implementation-patterns**: Security requirements validated here

## Common Rationalizations (STOP)

If you catch yourself thinking:

- "Design is simple, doesn't need validation" → NO. Simple designs have failure modes.
- "We can fix scalability later" → NO. Measure bottlenecks now.
- "Dependencies are reliable" → NO. Everything fails.
- "We might need microservices later" → NO. YAGNI. Build for now.
- "Adding this abstraction gives flexibility" → NO. YAGNI. Build what's needed.
- "We don't have time for validation" → NO. Validation saves time vs production fixes.

Every production outage from architecture issues came from skipping validation.
