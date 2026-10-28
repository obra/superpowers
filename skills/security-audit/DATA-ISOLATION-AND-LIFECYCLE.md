# Data Isolation and Lifecycle Hunting

#### When to use this file

Reach for this file when the target stores multi-tenant or access-controlled data, derives search/index/cache/analytics copies, issues object links, exports or restores records, migrates schemas, or promises deletion, revocation, and retention behavior. This domain follows one data item through every copy and state transition. Use `ATTACK-CLASSES.md` for endpoint-level access control and `CLOUD-AND-DEPLOYMENT.md` for provider-level storage policy.

Split large targets by primary storage, cache/search, object/blob storage, analytics/logging, export/backup, deletion/revocation, and migration.

## Core discipline (include in every agent prompt for this domain)

```
- A tenant or owner field on a record is not isolation. Find the query, key, path, policy, or row-level control that enforces it for each read and write path.
- Trace derived copies. Sanitized primary data can become unsafe in search, cache, analytics, export, previews, logs, replicas, and backups with different ACL and retention rules.
- Deletion and revocation are lifecycle contracts. Check current, historical, cached, indexed, exported, restored, and queued copies within the product's stated boundary.
- Privacy or retention preference is not automatically a security vulnerability. Require an explicit data-access boundary or deletion/revocation guarantee and an unauthorized reader or later operation.
- Use `confirmed` for complete source-visible lineage and bounded dummy-tenant tests. Use `needs_validation` when external storage policy, retention, CDN behavior, replica lag, or backup access is unavailable.
```

## Tenant and object-isolation attack classes (subagent_type: `general`)

**Missing tenant or owner enforcement**
A read, update, delete, list, count, or bulk query identifies an object without binding it to the authenticated tenant/owner, or trusts body fields to supply that identity. Compare direct lookup, nested relationship, background, admin, import, and legacy paths.

**Composite-key and namespace collision**
Cache keys, object paths, database uniqueness, search document IDs, temporary files, or deduplication keys omit tenant or environment. Two principals can overwrite or retrieve the same logical key even though application records carry separate owners.

**Policy and query disagreement**
Row-level policy, ORM default scopes, authorization filters, and raw/bypass clients apply different predicates. Check joins, aggregates, aliases, views, transactions, `unscoped` or service clients, and error paths where context is missing.

**Blob and signed-reference overreach**
Object keys, attachment IDs, version IDs, shared links, or signed URLs permit operations or namespaces beyond the issuing principal's access, or remain valid after the underlying ACL changes. Bind operation, exact object/version, audience, expiry, and tenant.

## Derived-data and disclosure attack classes (subagent_type: `general`)

**Search, cache, and index ACL drift**
A primary record's ACL or lifecycle changes without invalidating a searchable, cached, embedded, thumbnail, RSS, preview, or index copy. Validate filtering at retrieval time as well as document ingestion and invalidation.

**Analytics, logs, traces, and diagnostics as alternate readers**
Private content or credentials are emitted into systems with broader access, longer retention, or tenant mixing. Confirm the data class and realistic reader; field names, public identifiers, and operator-only content under intended policy are not enough.

**Enumeration and aggregate oracles**
Counts, filters, ordering, errors, unique constraints, timings, notification behavior, or existence checks disclose protected object or account state. Require a concrete confidential predicate and observable distinction, not general response variance.

## Export, backup, restore, and migration attack classes (subagent_type: `general`)

**Export and backup scope expansion**
An export, snapshot, portability package, report, or backup includes other tenants, inaccessible object fields, soft-deleted data, secret values, or history above the requester's access. Check per-item authorization after selection and authorization to download the final artifact.

**Import and restore authority expansion**
Restore/import bypasses owner, schema, ACL, uniqueness, or validation rules, overwrites existing resources, or recreates records in a tenant the requester cannot write. Validate archive contents as untrusted and authorize the resulting operation rather than trusting prior provenance.

**Migration default and ownership confusion**
Old records lack tenant/ACL/lifecycle fields, incompatible IDs collide, or partial rollout makes new and old readers apply different defaults. Review backfill, dual-read/write, compatibility, rollback, and resumed-migration paths.

**Backup and replication boundary drift**
Encryption keys, storage accounts, cross-region replicas, restoration environments, or support snapshots have broader identity or tenant scope than primary data. Source can confirm only in-repo policy; hosted access and retention require `needs_validation`.

## Deletion, revocation, and lifecycle attack classes (subagent_type: `general`)

**Soft-delete and tombstone bypass**
Direct lookup, search, relation traversal, object link, background processor, or restore ignores the lifecycle predicate and returns or acts on a deleted/revoked record. Check whether soft-deleted identifiers can be re-registered before all references are gone.

**Stale authorization and derived copy use**
Membership removal, ACL update, consent withdrawal, secret revocation, or role downgrade does not invalidate sessions, caches, subscriptions, jobs, or materialized data that continue to authorize future operations.

**Retention and queued-work overrun**
Deletion completes in primary storage while queued processors, retries, exports, analytics, or generated artifacts recreate or retain the data beyond the promised boundary. Find idempotent deletion and tombstone propagation.

**Restore reintroduces invalid state**
Backup, undo, undelete, or replica recovery restores data, credentials, memberships, or permissions that current policy no longer allows. Re-authorize restored state and reapply lifecycle changes made after the snapshot.

## Universal moves (apply across the above)

- Pick one protected record and draw primary write, query, cache, index, event, export, backup, deletion, and restore paths. Mark principal and tenant at every edge.
- Compare two dummy tenants through the same local service methods, then repeat after ACL change, deletion, account switch, and restore. Do not use real user data.
- Start at bypass clients, background jobs, migrations, global uniqueness, and cache keys. These paths commonly omit request-scoped identity that interactive endpoints carry.

## Validation rules (apply before reporting ANY finding here)

1. Name attacker or lower-trust principal, protected data/state, affected owner/tenant, alternate copy or operation, and unauthorized disclosure or mutation.
2. Cite both intended source-of-truth policy and the path that omits or disagrees with it. Confirm another layer does not enforce the same tenant/lifecycle condition.
3. Use local dummy tenants and non-sensitive fixtures to prove cross-scope access or stale lifecycle behavior. Stop at the minimum observable record or operation.
4. If external cache, object storage, replicas, analytics, backup, or retention policy is required, classify `needs_validation` and state the owner-observed check.
5. Return `confirmed` only with complete lineage and concrete boundary impact. Return `needs_validation` with the exact unresolved storage, ACL, invalidation, retention, or restore fact.
