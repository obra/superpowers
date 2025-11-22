---
name: schema-migration-strategy
description: Use when changing database schema in production systems - ensures backward compatibility, zero-downtime deployments, and rollback plans for safe schema migrations
---

# Schema Migration Strategy

## Overview

Schema changes in production require careful planning. Breaking migrations cause downtime. Missing rollback plans cause outages.

**Core principle:** Schema changes require backward compatibility and rollback plans. Breaking migrations = downtime.

**Violating the letter of this process is violating the spirit of safe deployments.**

## The Iron Law

```
NO SCHEMA CHANGES WITHOUT BACKWARD COMPATIBILITY ANALYSIS
Every migration must support rollback and zero-downtime deployment.
```

Planning to drop a column? Stop. Multi-phase it.

Renaming without compatibility plan? Delete it. Start over.

## When to Use

Use this skill when:

**Always:**
- Adding/removing database columns
- Changing column types
- Renaming tables or columns
- Adding/removing constraints (NOT NULL, UNIQUE, FOREIGN KEY)
- Adding/removing indexes
- Changing table structure

**Especially when:**
- Database has production data
- Multiple services depend on schema
- Zero-downtime requirement
- Rollback capability needed

**Don't skip when:**
- "It's just development" (develop habits that work in production)
- "We have maintenance window" (practice zero-downtime anyway)
- "Small change" (small changes break production too)

## Pre-Migration Analysis

Before writing any migration, use TodoWrite to track this analysis:

### 1. What Are You Changing?

Identify the change type:

- **Add column** (non-breaking if nullable/default)
- **Remove column** (breaking - requires multi-phase)
- **Rename column** (breaking - requires multi-phase)
- **Change column type** (breaking - requires multi-phase)
- **Add constraint** (breaking if NOT NULL, UNIQUE without backfill)
- **Remove constraint** (usually non-breaking)
- **Add index** (non-breaking but check lock time)
- **Add table** (non-breaking)
- **Remove table** (breaking - requires multi-phase)

### 2. Backward Compatibility Questions

Answer these before proceeding:

- [ ] Can old code run with new schema?
- [ ] Can new code run with old schema?
- [ ] Who/what depends on current schema? (services, reports, background jobs)
- [ ] What happens during deployment when some instances have old code, some have new?
- [ ] Is this a breaking or non-breaking change?

### 3. Dependencies Check

- [ ] Which services read from this table/column?
- [ ] Which services write to this table/column?
- [ ] Are there database views depending on this?
- [ ] Are there foreign keys referencing this?
- [ ] Are there triggers or stored procedures affected?

## Migration Strategy Selection

Choose strategy based on change type:

### Non-Breaking Changes (Single Phase)

Safe to deploy in one step:

**Safe:**
- Add nullable column
- Add column with default value
- Add new table
- Add index (check lock time)
- Remove constraint (usually)

**Example:**
```sql
-- UP: Add nullable column
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);

-- DOWN: Remove column
ALTER TABLE users DROP COLUMN phone_number;
```

### Breaking Changes (Multi-Phase Required)

Require multiple deployments:

**Breaking:**
- Remove column
- Rename column
- Change column type
- Add NOT NULL constraint
- Add UNIQUE constraint without backfill

**Requires:** Multi-phase migration pattern

## Multi-Phase Migration Pattern

For breaking changes, follow this pattern:

### Phase 1: Additive Changes Only

Add new column/table, keep old one:

```sql
-- Example: Renaming 'email' to 'email_address'

-- UP: Add new column
ALTER TABLE users ADD COLUMN email_address VARCHAR(255);

-- DOWN: Remove new column
ALTER TABLE users DROP COLUMN email_address;
```

**Deploy code that:**
- Writes to BOTH old and new columns
- Reads from old column (fallback to new if needed)

**Wait:** Until all instances deployed

### Phase 2: Backfill Data

Migrate existing data:

```sql
-- UP: Backfill data
UPDATE users SET email_address = email WHERE email_address IS NULL;

-- DOWN: Clear backfilled data
UPDATE users SET email_address = NULL;
```

**Deploy code that:**
- Writes to BOTH old and new columns
- Reads from new column (fallback to old if needed)

**Wait:** Until all instances deployed, verify data correct

### Phase 3: Remove Old Schema

Clean up old column/table:

```sql
-- UP: Remove old column
ALTER TABLE users DROP COLUMN email;

-- DOWN: Re-add old column
ALTER TABLE users ADD COLUMN email VARCHAR(255);
UPDATE users SET email = email_address;
```

**Deploy code that:**
- Writes to new column only
- Reads from new column only

**Result:** Migration complete, zero downtime

## Safety Checklist

Use TodoWrite to track these items:

### Before Writing Migration

- [ ] Analyzed what depends on current schema
- [ ] Determined if breaking or non-breaking change
- [ ] Selected appropriate migration strategy (single vs multi-phase)
- [ ] Planned deployment sequence (migration before/after code)

### Writing Migration

- [ ] Written both UP and DOWN migrations
- [ ] Used appropriate migration type (single-phase or multi-phase)
- [ ] Added new columns as nullable first (add constraint later if needed)
- [ ] Checked for potential locking issues on large tables
- [ ] Added indexes concurrently if supported (CONCURRENTLY in PostgreSQL)
- [ ] Included data migration if needed (backfill)

### Testing Migration

- [ ] Tested migration on production-like dataset (not empty database)
- [ ] Measured migration time on large dataset
- [ ] Tested rollback migration (DOWN)
- [ ] Verified application works during migration
- [ ] Tested with old code + new schema
- [ ] Tested with new code + old schema (if multi-phase)
- [ ] Checked for lock timeouts on large tables

### Deployment Planning

- [ ] Documented deployment order (migrate before code? after code? during?)
- [ ] Determined timing (maintenance window? zero-downtime?)
- [ ] Set up monitoring (query performance, error rates)
- [ ] Defined rollback triggers (when to abort)
- [ ] Communicated plan to team
- [ ] Prepared rollback commands

## Common Patterns

### Adding NOT NULL Constraint

**DON'T:**
```sql
-- NEVER DO THIS - breaks inserts immediately
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) NOT NULL;
```

**DO:**
```sql
-- Phase 1: Add nullable column with default
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);

-- Phase 2: Backfill existing rows
UPDATE users SET phone_number = '' WHERE phone_number IS NULL;

-- Phase 3: Add constraint after backfill
ALTER TABLE users ALTER COLUMN phone_number SET NOT NULL;
```

### Renaming Column

**DON'T:**
```sql
-- NEVER DO THIS - breaks all queries immediately
ALTER TABLE users RENAME COLUMN email TO email_address;
```

**DO (Multi-Phase):**
```sql
-- Phase 1: Add new column
ALTER TABLE users ADD COLUMN email_address VARCHAR(255);

-- Phase 2: Backfill + dual writes in code
UPDATE users SET email_address = email WHERE email_address IS NULL;

-- Phase 3: Remove old column
ALTER TABLE users DROP COLUMN email;
```

### Changing Column Type

**DON'T:**
```sql
-- NEVER DO THIS - may fail on existing data, locks table
ALTER TABLE orders ALTER COLUMN total TYPE DECIMAL(10,2);
```

**DO (Multi-Phase):**
```sql
-- Phase 1: Add new column with new type
ALTER TABLE orders ADD COLUMN total_decimal DECIMAL(10,2);

-- Phase 2: Backfill and validate
UPDATE orders SET total_decimal = CAST(total AS DECIMAL(10,2));

-- Phase 3: Verify data, then remove old column
ALTER TABLE orders DROP COLUMN total;
ALTER TABLE orders RENAME COLUMN total_decimal TO total;
```

### Adding Index on Large Table

**DON'T:**
```sql
-- NEVER DO THIS - locks table during index build
CREATE INDEX idx_users_email ON users(email);
```

**DO (PostgreSQL):**
```sql
-- Build index without locking table
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
```

**DO (Other databases):**
```sql
-- Build index during low-traffic period
-- Monitor for lock timeouts
-- Consider online index build if supported
```

### Removing Column

**DON'T:**
```sql
-- NEVER DO THIS - breaks code still using it
ALTER TABLE users DROP COLUMN deprecated_field;
```

**DO (Multi-Phase):**
```sql
-- Phase 1: Stop writing to column (code deploy)
-- Wait for verification

-- Phase 2: Stop reading from column (code deploy)
-- Wait for verification

-- Phase 3: Remove column (schema deploy)
ALTER TABLE users DROP COLUMN deprecated_field;
```

## Database-Specific Considerations

### PostgreSQL

- Use `CONCURRENTLY` for index creation (no table lock)
- Watch for lock_timeout on ALTER TABLE
- Consider statement_timeout for long migrations
- Vacuum after large data changes

### MySQL

- `ALTER TABLE` locks table by default (use `ALGORITHM=INPLACE` if available)
- Large table alterations can take hours
- Consider pt-online-schema-change for zero-downtime
- Check for replication lag

### SQLite

- Limited ALTER TABLE support (can't drop columns in old versions)
- May require table recreation
- No concurrent index builds
- Appropriate for small datasets only

## Rollback Strategy

Every migration needs a rollback plan:

### Write DOWN Migration

Always write the DOWN migration:

```sql
-- UP
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);

-- DOWN
ALTER TABLE users DROP COLUMN phone_number;
```

### Test Rollback

Before deploying:

```bash
# Test the migration cycle
migrate up
# Verify application works
migrate down
# Verify application still works
migrate up
# Verify application still works
```

### Define Rollback Triggers

Before deploying, define when to rollback:

- Migration fails or times out
- Error rate spikes above X%
- Critical functionality broken
- Performance degradation beyond threshold

### Have Rollback Commands Ready

```bash
# Pre-prepare rollback commands
# Keep in runbook or deployment notes

# If migration is running and causing issues:
ROLLBACK;  # If in transaction

# If migration completed but broke application:
migrate down
# Deploy old code version
```

## Anti-Patterns

### The "Drop Column Immediately" Anti-Pattern

**Problem:** Dropping column breaks old code still using it

**Solution:** Multi-phase: stop writes → stop reads → drop column

### The "Rename in One Step" Anti-Pattern

**Problem:** Renaming breaks all queries immediately

**Solution:** Multi-phase: add new → dual write → dual read → remove old

### The "Test on Empty Database" Anti-Pattern

**Problem:** Migration works on empty DB, times out on production data

**Solution:** Test on production-sized dataset

### The "No Rollback Plan" Anti-Pattern

**Problem:** Migration breaks production, no way to recover quickly

**Solution:** Always write DOWN migration, test rollback, have commands ready

### The "Add NOT NULL Immediately" Anti-Pattern

**Problem:** Breaks inserts for old code

**Solution:** Add nullable → backfill → add constraint

### The "Ignore Lock Time" Anti-Pattern

**Problem:** ALTER TABLE locks table for hours on large dataset

**Solution:** Test migration time, use CONCURRENTLY, consider online tools

## Deployment Sequence

Migration timing matters:

### Migration Before Code

**When:** Adding new columns/tables that new code depends on

**Sequence:**
1. Deploy migration (add schema)
2. Verify migration succeeded
3. Deploy new code (uses new schema)

**Safe for:** Additive changes

### Code Before Migration

**When:** Removing columns/tables that old code uses

**Sequence:**
1. Deploy code (stops using old schema)
2. Verify code works
3. Deploy migration (removes schema)

**Safe for:** Removals

### Multi-Phase Deployment

**When:** Breaking changes

**Sequence:**
1. Phase 1: Migration (add new schema) → Code (dual write)
2. Phase 2: Backfill → Code (dual read, prefer new)
3. Phase 3: Migration (remove old schema) → Code (use new only)

## Integration with Other Skills

- **test-driven-development**: Write migration tests first
- **verification-before-completion**: Verify migration tested on production-like data
- **systematic-debugging**: If migration fails, find root cause before retrying
- **system-design-validation**: Validate migration strategy before implementing

## Common Rationalizations (STOP)

If you catch yourself thinking:

- "It's just one column, can drop immediately" → NO. Multi-phase it.
- "We have maintenance window, can lock table" → NO. Practice zero-downtime.
- "Tested on dev database, good enough" → NO. Test on production-sized data.
- "Don't need DOWN migration, won't rollback" → NO. Always write DOWN.
- "Can add NOT NULL directly with default" → NO. Nullable → backfill → constraint.
- "Renaming is quick, can do in one step" → NO. Multi-phase: add → dual write → remove.

Every production outage from schema changes came from skipping these steps.
