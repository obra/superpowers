---
title: Check Cheap Conditions Before Async Flags
impact: HIGH
impactDescription: avoids unnecessary async work when a synchronous guard already fails
tags: async, await, feature-flags, short-circuit, conditional
---

## Check Cheap Conditions Before Async Flags

When a branch uses `await` for a flag or remote value and also requires a **cheap synchronous** condition (local props, request metadata, already-loaded state), evaluate the cheap condition **first**. Otherwise you pay for the async call even when the compound condition can never be true.

This is a specialization of [Defer Await Until Needed](./async-defer-await.md) for `flag && cheapCondition` style checks.

**Incorrect:**

```typescript
const someFlag = await getFlag()

if (someFlag && someCondition) {
  // ...
}
```

**Correct:**

```typescript
if (someCondition) {
  const someFlag = await getFlag()
  if (someFlag) {
    // ...
  }
}
```

This matters when `getFlag` hits the network, a feature-flag service, or `React.cache` / DB work: skipping it when `someCondition` is false removes that cost on the cold path.

Keep the original order if `someCondition` is expensive, depends on the flag, or you must run side effects in a fixed order.
