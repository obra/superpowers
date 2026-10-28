# Protocols, RPC, and Messaging Hunting

#### When to use this file

Reach for this file when the target uses gRPC, GraphQL transports, Cap'n Proto, Thrift, Protobuf, custom binary protocols, streaming RPC, webhooks, brokers, queues, pub/sub, or event buses. It covers peer identity, logical message interpretation, routing, replay, ordering, and delivery semantics. Use `MEMORY-SAFETY-AND-BINARY.md` for parser memory safety, `WEB-PROTOCOL-AND-AUTH.md` for HTTP framing, and `RESOURCE-EXHAUSTION-AND-AVAILABILITY.md` for availability impact.

Split large systems by producer/consumer pair, external/internal peer role, synchronous RPC, streaming, and asynchronous message path.

## Core discipline (include in every agent prompt for this domain)

```
- "Internal" is not authentication. Name the peer identity at every hop and show how it becomes the application principal used for authorization.
- Schema validation proves message shape, not provenance, resource authority, ordering, or safe values. Follow decoded fields to policy and side effects.
- Broker guarantees and application guarantees differ. Write down retry, ordering, acknowledgement, deduplication, and transaction behavior before evaluating state changes.
- Parser disagreement requires two concrete consumers, schema versions, or wire representations and one security-relevant divergent value.
- Use `confirmed` for source-complete paths plus bounded local producer/consumer tests. Use `needs_validation` for broker ACL, service-mesh identity, topic attachment, or compatibility behavior outside the repository.
```

## Framing, schema, and interpretation attack classes (subagent_type: `general`)

**Message boundary and canonicalization disagreement**
Components disagree on length, compression, duplicate fields, unknown fields, encoding, numeric width, normalization, or envelope/body precedence. Compare generated and custom parsers, gateways, language bindings, and version converters. Confirm which principal, resource, or operation differs after decoding.

**Union, enum, and default confusion**
Unknown variants, missing discriminators, zero values, default privileges, or compatibility mappings reach code that assumes a validated case. Review exhaustive dispatch, default branches, and how old consumers interpret newly added fields.

**Envelope and payload identity mismatch**
Authorization uses trusted-looking routing or envelope metadata while the handler acts on a conflicting tenant, account, subject, object, or sender in the body. Identify which source is authoritative and ensure clients cannot override it.

## RPC identity and authorization attack classes (subagent_type: `general`)

**Interceptor and method-path inconsistency**
An authn/authz interceptor applies to unary methods but not streams, reflection, health, gateway-transcoded paths, compatibility services, or individual stream messages. Compare every registration and route to the same operation.

**Peer identity to application-principal confusion**
mTLS, workload identity, bearer metadata, forwarded identity, or broker credentials authenticate a channel, but a caller-controlled field selects the user or tenant. The channel identity and claimed principal must be bound by deterministic policy.

**Per-item and streaming authorization gaps**
A stream, subscription, batch, or bulk message is authorized once, then later items name different resources or continue after role, membership, or token revocation. Re-check where scope can change and bind subscriptions to their original principal.

**Callback and reply-correlation confusion**
Predictable, reused, or cross-tenant correlation IDs let a response, webhook, cancellation, or acknowledgment satisfy another caller's pending operation. Bind each outstanding request to authenticated peer, tenant, operation, and lifecycle.

## Broker and queue isolation attack classes (subagent_type: `general`)

**Topic, routing-key, and subscription scope gaps**
A publisher or subscriber can select another tenant's topic, wildcard, consumer group, partition, reply queue, or dead-letter route. Check broker-enforced ACLs where visible and application-side namespace construction. Tenant text inside a payload is not isolation.

**Dead-letter, retry, and diagnostic disclosure**
Messages routed to dead-letter queues, error topics, tracing, or operator views contain secrets or cross-tenant payloads accessible to a lower-trust consumer. Review policy and redaction at the failure path, not just normal delivery.

**Untrusted producer treated as control plane**
A message body can declare itself an admin event, provider callback, replication record, or migration instruction without an independently authenticated producer and event type. Verify signatures and source/account/audience binding before privileged handling.

## Replay, ordering, and transaction attack classes (subagent_type: `general`)

**Duplicate delivery and idempotency gaps**
Retries or redelivery repeat a side effect because deduplication is absent, occurs after mutation, or uses a key that collides across tenants or operations. Confirm the broker's delivery model and the side effect that is not naturally idempotent.

**Out-of-order and stale message acceptance**
Older state, revoked membership, canceled work, or pre-step-up authorization arrives after newer state and overwrites it. Review sequence/version checks, tombstones, partition changes, and restore/replay workflows.

**Acknowledgment/commit ordering defects**
Acknowledgment occurs before durable commit and loses security-relevant work, or commit happens before an unreliable acknowledgment and duplicates a mutation. Evaluate transactional outbox/inbox behavior and failure recovery.

**Partial multi-consumer transitions**
Several consumers jointly implement one authorization or business transition, but retries and partial failure leave only a subset committed. Identify invariants that must become durable atomically or compensate with current authorization.

## Universal moves (apply across the above)

- Draw producer → broker/transport → gateway → consumer → storage for each message family. At each hop record authenticated peer, authoritative tenant/resource fields, validation, and side effect.
- Feed the same small fixture to every in-repo schema version or language binding. Test duplicate, missing, unknown, boundary, replayed, and reordered messages without producing load.
- Compare normal, retry, dead-letter, replay, migration, reflection, stream, and gateway-transcoded routes. Security policy must survive transport changes.

## Validation rules (apply before reporting ANY finding here)

1. Name the realistic producer or peer, accepted message, authenticated channel identity, affected principal/resource, and unauthorized mutation or disclosure.
2. For disagreement claims, cite both parsers/consumers and the divergent decoded value. Safe rejection by either side prevents confirmation.
3. For replay/order claims, establish actual delivery guarantees and reproduce the invariant failure with a bounded local/in-memory transport.
4. For authorization and isolation, verify all interceptor, broker ACL, gateway, and consumer layers visible in source. External attachments make the candidate `needs_validation`.
5. Return `confirmed` only with the complete message lifecycle and observed meaningful result. Return `needs_validation` with the exact broker, service identity, route, or delivery fact required.
