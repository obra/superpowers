# New Skills Design: Security, Database, and Architecture

**Date:** 2025-11-10
**Status:** Validated

## Overview

Adding three new skill categories to Superpowers:
1. **Secure Implementation Patterns** - Security-critical code implementation guidance
2. **Schema Migration Strategy** - Database schema change management
3. **System Design Validation** - Architecture validation before implementation

## Design Decisions

### Trigger Strategy
All three skills are **manual invocation** (not proactive):
- User explicitly calls them when needed
- Gives control, avoids false triggers
- Similar to `brainstorming` and `writing-plans` patterns

### Integration Points
- `system-design-validation` runs after `brainstorming`, before `writing-plans`
- `secure-implementation-patterns` and `schema-migration-strategy` work alongside `test-driven-development`
- All integrate with `verification-before-completion`

### Philosophy Alignment
- **Systematic over ad-hoc**: Checklists prevent skipping steps
- **Evidence over claims**: Verify migrations work, test security, validate designs
- **Complexity reduction**: YAGNI ruthlessly, avoid over-engineering
- **Test-first mentality**: Security tests, migration tests, design failure mode testing

## Skill 1: Secure Implementation Patterns

**File:** `skills/secure-implementation-patterns/SKILL.md`

**Core Principle:**
"Never implement security-critical code without following proven patterns. Custom crypto/auth = vulnerabilities."

**Iron Law:**
```
NO CUSTOM SECURITY IMPLEMENTATIONS WITHOUT EXPERT REVIEW
Use battle-tested libraries. Follow established patterns.
```

### Categories Covered

1. **Authentication & Authorization**
   - Password handling (bcrypt/argon2, never plaintext, no MD5/SHA1)
   - JWT best practices (signing, expiration, refresh tokens, secret rotation)
   - Session management (secure cookies, CSRF protection)
   - OAuth/SAAS integration patterns

2. **Secret Management**
   - Environment variables (never commit secrets)
   - Secret rotation strategies
   - Using secret managers (AWS Secrets Manager, Vault, etc)
   - Development vs production secret handling

3. **Input Validation & Sanitization**
   - SQL injection prevention (parameterized queries, ORMs)
   - XSS prevention (escaping, Content Security Policy)
   - Command injection prevention (avoid shell execution, whitelist validation)
   - Path traversal prevention (validate file paths)

4. **Data Protection**
   - Encryption at rest (which data needs it, key management)
   - Encryption in transit (HTTPS, TLS configuration)
   - PII handling (GDPR compliance, data retention)
   - Secure file uploads (type validation, size limits, virus scanning)

### Process
1. Identify what you're implementing (auth? secrets? user input?)
2. TodoWrite checklist for relevant category
3. Follow pattern with test-first approach
4. Verify with security test cases
5. Document security decisions

### Anti-patterns
- Rolling your own crypto
- Storing passwords in plaintext
- Trusting user input
- Hardcoding secrets
- Using weak hashing (MD5, SHA1 for passwords)

## Skill 2: Schema Migration Strategy

**File:** `skills/schema-migration-strategy/SKILL.md`

**Core Principle:**
"Schema changes in production require backward compatibility and rollback plans. Breaking migrations = downtime."

**Iron Law:**
```
NO SCHEMA CHANGES WITHOUT BACKWARD COMPATIBILITY ANALYSIS
Every migration must support rollback and zero-downtime deployment.
```

### Main Process

1. **Pre-Migration Analysis**
   - What are you changing? (add column, remove column, rename, change type, add constraint)
   - Is this breaking or non-breaking?
   - Who/what depends on current schema? (services, reports, jobs)
   - Can old code run with new schema? Can new code run with old schema?

2. **Migration Strategy Selection**
   - **Non-breaking**: Add column (nullable/default), add table, add index
   - **Breaking (multi-phase required)**: Remove column, rename, change type, add NOT NULL
   - **Multi-phase pattern**:
     - Phase 1: Additive changes only (deploy)
     - Phase 2: Update code to use new schema (deploy)
     - Phase 3: Remove old schema (deploy)

3. **Safety Checklist** (TodoWrite items)
   - Write migration with both UP and DOWN
   - Test migration on production-like data volume
   - Test rollback migration
   - Check for locking issues on large tables
   - Verify indexes won't cause timeout
   - Add new columns as nullable first, backfill, then add constraint
   - Document deployment order vs code deploy

4. **Testing Requirements**
   - Test with production data snapshot
   - Test rollback scenario
   - Measure migration time on large dataset
   - Verify application works during migration

5. **Deployment Plan**
   - Timing (maintenance window? zero-downtime?)
   - Monitoring (query performance, errors)
   - Rollback triggers (when to abort)
   - Communication plan

### Anti-patterns
- Dropping columns immediately (orphans old code)
- Adding NOT NULL without default (breaks inserts)
- Renaming in single step (breaks all queries)
- No rollback plan
- Testing only on empty database
- Ignoring lock time on large tables

## Skill 3: System Design Validation

**File:** `skills/system-design-validation/SKILL.md`

**Core Principle:**
"Validate design decisions before implementation. Finding architectural flaws during coding = expensive rework."

**Iron Law:**
```
NO LARGE FEATURE IMPLEMENTATION WITHOUT DESIGN VALIDATION
Answer the hard questions before writing code.
```

### Main Validation Checklist

1. **Requirements Clarity**
   - What problem does this solve?
   - What are the success criteria?
   - What are the performance requirements? (latency, throughput, scale)
   - What are the availability requirements? (SLA, uptime)

2. **Scalability Analysis**
   - What are the expected load patterns? (requests/sec, data volume)
   - Where are the bottlenecks? (database, API, processing)
   - How does this scale? (horizontal, vertical, limits)
   - What happens at 10x current load?

3. **Failure Mode Analysis**
   - What can fail? (dependencies, network, database, external APIs)
   - What happens when X fails? (graceful degradation? hard failure?)
   - What are the retry/timeout strategies?
   - How do we recover from failures?
   - What monitoring/alerting is needed?

4. **Data Consistency**
   - What data needs to be consistent? (strong vs eventual)
   - What are the consistency guarantees?
   - How do we handle conflicts?
   - What happens during partial failures?
   - Do we need transactions? Distributed transactions?

5. **Operational Complexity**
   - How many new components does this add?
   - What's the deployment strategy?
   - What configuration is needed?
   - How do we debug issues in production?
   - What's the rollback plan?

6. **Dependencies & Interfaces**
   - What external systems does this depend on?
   - What are the SLAs of dependencies?
   - What happens if dependency is slow/down?
   - What are the API contracts?
   - How do we version these interfaces?

7. **Security & Compliance**
   - What data is being processed? (PII, sensitive)
   - What are the auth/authz requirements?
   - What encryption is needed?
   - What compliance requirements apply? (GDPR, SOC2, etc)

8. **Simplicity Check (YAGNI Ruthlessly)**
   - Can we solve this with existing components?
   - What features can we cut from v1?
   - What's the simplest thing that could work?
   - Are we over-engineering?

### Output
- Document validation results in `docs/designs/YYYY-MM-DD-<feature>-validation.md`
- List of risks identified + mitigation strategies
- Go/No-go decision with rationale
- Simplified design after YAGNI analysis

### Anti-patterns
- Skipping failure mode analysis
- Assuming infinite scale not needed = ignore scalability
- Adding complexity "for future flexibility"
- Not validating dependency SLAs
- Ignoring operational burden

## Implementation Plan

1. Create skill directories and SKILL.md files
2. Follow existing skill structure (frontmatter + sections)
3. Include concrete examples for each pattern/anti-pattern
4. Test skills with subagents (using `testing-skills-with-subagents`)
5. Update README.md to list new skills
6. Update plugin version

## Success Criteria

- Each skill has clear trigger conditions
- TodoWrite integration for checklists
- Concrete examples (Good vs Bad)
- Anti-rationalization language
- Follows Superpowers philosophy
- Validated with subagent testing
