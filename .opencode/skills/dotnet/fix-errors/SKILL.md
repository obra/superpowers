---
name: fix-errors
description: Guidelines for fixing unhandled errors from the VS Code error telemetry dashboard. Use when investigating error-telemetry issues with stack traces, error messages, and hit/user counts. Covers tracing data flow through call stacks, identifying producers of invalid data vs. consumers that crash, enriching error messages for telemetry diagnosis, and avoiding common anti-patterns like silently swallowing errors.
---

When fixing an unhandled error from the telemetry dashboard, the issue typically contains an error message, a stack trace, hit count, and affected user count.

## Approach

### 1. Do NOT fix at the crash site

The error manifests at a specific line in the stack trace, but **the fix almost never belongs there**. Fixing at the crash site (e.g., adding a `typeof` guard in a `revive()` function, swallowing the error with a try/catch, or returning a fallback value) only masks the real problem. The invalid data still flows through the system and will cause failures elsewhere.

### 2. Trace the data flow upward through the call stack

Read each frame in the stack trace from bottom to top. For each frame, understand:
- What data is being passed and what is expected
- Where that data originated (IPC message, extension API call, storage, user input, etc.)
- Whether the data could have been corrupted or malformed at that point

The goal is to find the **producer of invalid data**, not the consumer that crashes on it.

### 3. When the producer cannot be identified from the stack alone

Sometimes the stack trace only shows the receiving/consuming side (e.g., an IPC server handler). The sending side is in a different process and not in the stack. In this case:

- **Enrich the error message** at the consuming site with diagnostic context: the type of the invalid data, a truncated representation of its value, and which operation/command received it. This information flows into the error telemetry dashboard automatically via the unhandled error pipeline.
- **Do NOT silently swallow the error** — let it still throw so it remains visible in telemetry, but with enough context to identify the sender in the next telemetry cycle.
- Consider adding the same enrichment to the low-level validation function that throws (e.g., include the invalid value in the error message) so the telemetry captures it regardless of call site.

### 4. When the producer IS identifiable

Fix the producer directly:
- Validate or sanitize data before sending it over IPC / storing it / passing it to APIs
- Ensure serialization/deserialization preserves types correctly (e.g., URI objects should serialize as `UriComponents` objects, not as strings)

## Example

Given a stack trace like:
```
at _validateUri (uri.ts)       ← validation throws
at new Uri (uri.ts)            ← constructor
at URI.revive (uri.ts)         ← revive assumes valid UriComponents
at SomeChannel.call (ipc.ts)   ← IPC handler receives arg from another process
```

**Wrong fix**: Add a `typeof` guard in `URI.revive` to return `undefined` for non-object input. This silences the error but the caller still expects a valid URI and will fail later.

**Right fix (when producer is unknown)**: Enrich the error at the IPC handler level and in `_validateUri` itself to include the actual invalid value, so telemetry reveals what data is being sent and from where. Example:
```typescript
// In the IPC handler — validate before revive
function reviveUri(data: UriComponents | URI | undefined | null, context: string): URI {
    if (data && typeof data !== 'object') {
        throw new Error(`[Channel] Invalid URI data for '${context}': type=${typeof data}, value=${String(data).substring(0, 100)}`);
    }
    // ...
}

// In _validateUri — include the scheme value
throw new Error(`[UriError]: Scheme contains illegal characters. scheme:"${ret.scheme.substring(0, 50)}" (len:${ret.scheme.length})`);
```

**Right fix (when producer is known)**: Fix the code that sends malformed data. For example, if an authentication provider passes a stringified URI instead of a `UriComponents` object to a logger creation call, fix that call site to pass the proper object.

## Understanding error construction before fixing

Before proposing any fix, **always find and read the code that constructs the error**. Search the codebase for the error class name or a unique substring of the error message. The construction code reveals:

- **What conditions trigger the error** — thresholds, validation checks, state assertions
- **What classifications or categories the error encodes** — the error may have subtypes that require different fix strategies
- **What the error's parameters mean** — numeric values, ratios, or flags embedded in the message often encode diagnostic context
- **Whether the error is actionable** — some errors are threshold-based warnings where the threshold may be legitimately exceeded by design

Use this understanding to determine the correct fix strategy. The construction code is the source of truth — do NOT assume what the error means from its message alone.

### Example: Listener leak errors

Searching for `ListenerLeakError` leads to `src/vs/base/common/event.ts`, where the construction code reveals:

```typescript
const kind = topCount / listenerCount > 0.3 ? 'dominated' : 'popular';
const error = new ListenerLeakError(kind, message, topStack);
```

Reading this code tells you:
- The error has two categories based on a ratio
- **Dominated** (ratio > 30%): one code path accounts for most listeners → that code path is the problem, fix its disposal
- **Popular** (ratio ≤ 30%): many diverse code paths each contribute a few listeners → the identified stack trace is NOT the root cause; it's just the most identical stack among many. Investigate the emitter and its aggregate subscribers instead
- For popular leaks: do NOT remove caching/pooling/reuse patterns that appear in the top stack — they exist to solve other problems. If the aggregate count is by design (e.g., many menus subscribing to a shared context key service), close the issue as "not planned"

This analysis came from reading the construction code, not from memorized rules about listener leaks.

## Guidelines

- Prefer enriching error messages over adding try/catch guards
- Truncate any user-controlled values included in error messages (to avoid PII and keep messages bounded)
- Do not change the behavior of shared utility functions (like `URI.revive`) in ways that affect all callers — fix at the specific call site or producer
- Run the relevant unit tests after making changes
- Check for compilation errors via the build task before declaring work complete
