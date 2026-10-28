# Resource Exhaustion and Availability Hunting

#### When to use this file

Reach for this file when untrusted requests, messages, files, tenant state, or agent work can consume CPU, memory, disk, connections, worker slots, paid APIs, or queue capacity, or can deadlock/crash a shared service. This domain distinguishes a source-reviewable availability vulnerability from a general performance issue. Never validate by stressing a shared or live service.

Use `MEMORY-SAFETY-AND-BINARY.md` for memory-integrity defects and `PROTOCOLS-RPC-AND-MESSAGING.md` for broker delivery logic. A reachable fatal error belongs here for shared impact even when the underlying parser is covered elsewhere.

## Core discipline (include in every agent prompt for this domain)

```
- Require an input-to-cost path, a missing effective bound, and impact on another user, shared service, safety function, or operator-owned spend. Self-limiting work in the requester's own process is not a service vulnerability.
- A missing rate limit is not enough. Check body/message/file caps, concurrency, queues, deadlines, database constraints, upstream gateways, and per-tenant quotas before calling a path unbounded.
- Do not run stress, saturation, or production tests. Use asymptotic analysis, small boundary fixtures, mocked paid calls, strict local resource limits, and deterministic cancellation tests.
- State attacker cost, service work, persistence, scope, and recovery. One bounded input with superlinear or persistent shared effect is materially different from sustained volume.
- Use `confirmed` for source-visible bounds failures demonstrated safely. Use `needs_validation` when upstream caps, deployed topology, autoscaling, paid quota, or recovery behavior is outside the repository.
```

## Computational amplification attack classes (subagent_type: `general`)

**Superlinear parsing, matching, or evaluation**
Small accepted input drives catastrophic regex backtracking, nested parsing, recursive validation, symbolic evaluation, graph traversal, template expansion, or adversarial sort/hash behavior. Derive accepted depth/cardinality and complexity, then demonstrate a bounded growth curve locally.

**Decompression and representation amplification**
Compressed, sparse, nested, aliased, or encoded input expands far beyond the checked transfer or file size. Verify limits after every expansion and across parser stages, including archives, images, fonts, structured documents, and protocol compression tables.

**Database and downstream query amplification**
A small request creates broad scans, pathological joins, fan-out, unbounded sort/aggregation, or many downstream calls because query depth, filter cardinality, pagination, or expansion fields are not bounded. Confirm authorization does not intentionally permit the same resource scope.

## Resource accumulation attack classes (subagent_type: `general`)

**Unbounded buffering and cardinality**
Bodies, out-of-order streams, uploads, sessions, unique cache keys, metrics labels, log fields, subscriptions, or pending jobs accumulate without per-item and aggregate limits. Find cleanup and expiration on disconnect, timeout, cancellation, and partial parse.

**File descriptor, handle, and temporary-resource leaks**
Malformed or canceled work misses cleanup and retains sockets, files, database cursors, timers, subprocesses, temporary files, or object references. Confirm the leak repeats through bounded local iterations and affects a shared pool.

**Detached work after cancellation**
Client timeout, disconnect, canceled job, or failed authorization returns control but leaves database, model, network, or worker work running. Trace cancellation and deadline propagation through every layer.

## Quota and scheduling attack classes (subagent_type: `general`)

**Pre-authentication work imbalance**
Expensive parsing, key lookup, cryptography, decompression, or external requests happen before authentication and the earliest size/rate gate. Compare minimal requester effort to shared service cost and check upstream limits.

**Quota-accounting scope and reset gaps**
Accounting uses attacker-influenceable IP, route, tenant, key prefix, task ID, or other dimension, allowing one principal's work to escape its intended budget or consume another principal's allocation. Review integer overflow, distributed races, retries, reconnects, and account switching.

**Worker, pool, and priority starvation**
Low-priority or attacker-controlled jobs hold shared locks, workers, database pools, event-loop turns, or scheduler priority needed by unrelated users. Require a path that bypasses queue/concurrency fairness or retains a slot beyond its deadline.

## Failure and recovery attack classes (subagent_type: `general`)

**Reachable fatal error or deadlock**
An untrusted input reaches `panic`, abort, fatal assertion, unhandled exception, process exit, lock cycle, or infinite loop in a shared process. Confirm supervisor scope and whether one worker or the whole service becomes unavailable. A restarted isolated worker may reduce impact but does not erase the defect.

**Retry storm and fail-open amplification**
Timeouts, dependency errors, partially processed messages, or health-check failures trigger synchronized or unbounded retries without jitter, ceilings, circuit breaking, or deduplication. Verify one bounded failure source can create persistent aggregate work.

**Poison-record and head-of-line blocking**
One malformed record or message repeatedly fails at the front of a shared queue, partition, startup scan, migration, or recovery loop. Review skip/quarantine policy, offsets, and whether other tenants share the blocked unit.

**Unsafe recovery and capacity rollback**
A restart, restore, fallback, or cleanup path rebuilds unbounded state, ignores current quotas, or restores the input that immediately repeats failure. Recovery correctness is part of availability.

## Universal moves (apply across the above)

- Build an input-to-resource table: earliest accepted size/cardinality, work before auth, downstream fan-out, persistence, shared pool, limit and cleanup owner, recovery.
- Compare aggregate limits with per-object limits. Ten thousand valid one-byte items may evade a per-message cap while exhausting tenant-wide or process-wide state.
- Validate only in an isolated fixture with strict CPU/memory/time limits and small growth points. Mock external and paid calls and stop once the missing bound or cancellation is observable.

## Validation rules (apply before reporting ANY finding here)

1. Name untrusted input, requester work, service amplification or retained resource, shared blast radius, and recovery. Missing limits without concrete shared impact are hardening.
2. Confirm no source-visible upstream, parser, queue, tenant, or framework bound prevents the path. Unknown deployed controls require `needs_validation`.
3. For superlinear behavior, establish the accepted complexity and bounded local growth. For leaks, show repeatable retention after cleanup should occur. For fatal paths, identify process/supervisor isolation.
4. Prioritize by low requester work, unauthenticated reachability, cross-tenant scope, persistence, and poor recovery; do not validate with availability impact.
5. Return `confirmed` only with safe local proof and meaningful shared effect. Return `needs_validation` with the exact upstream limit, topology, quota, or recovery observation an owner must check.
