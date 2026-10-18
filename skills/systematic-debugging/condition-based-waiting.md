# Condition-Based Waiting

A fixed delay guesses at timing. Wait for the condition instead, with the framework's helper when it has one (`vi.waitFor`, Testing Library's `waitFor`, testify's `Eventually`). `vi.waitFor` and Testing Library's `waitFor` retry only while the callback throws, so assert inside it; a callback that returns `false` resolves at once.

```typescript
await vi.waitFor(() => expect(getResult()).toBeDefined());
```

Without a framework helper, write one that re-reads fresh state every few milliseconds, returns once the condition holds, and throws on a timeout with a message naming the condition.

A fixed delay is right only when the behavior under test is itself timed, such as a debounce. Then wait for the triggering condition first, derive the delay from the known interval, and comment why: `// 2 ticks at 100ms`.
