---
name: performance-investigation
description: >
  MUST USE when investigating or fixing performance issues: slow responses, high
  memory usage, CPU spikes, throughput degradation, or optimization requests.
  Enforces measure-first methodology — profile before guessing, baseline before
  fixing, re-measure after every change. Distinct from systematic-debugging (which
  changes behavior to fix bugs) and brainstorming (which designs new features).
  Triggers on: "slow", "performance", "optimize", "speed up", "latency", "throughput",
  "memory leak", "high CPU", "profiling", "benchmark", "bottleneck", "takes too long",
  "response time", "why is this slow", "make it faster", "reduce memory", "loading time".
  Routed by using-superpowers, or invoke directly via /performance-investigation.
---

# Performance Investigation

Measure first. Guess never. Fix once.

## Why This Exists

Performance intuition is wrong more often than it's right. Developers consistently misidentify bottlenecks — optimizing the wrong function, caching the wrong query, parallelizing the wrong loop. This skill enforces a measurement-first approach that ensures you fix what's actually slow, not what feels slow.

## Phase 1: Baseline

Before changing anything, establish a quantitative baseline.

1. **Define the metric.** What specifically is slow? Be precise:
   - Response time for endpoint X under Y concurrent users
   - Time to render component Z with N items
   - Memory usage after processing M records
   - Build time for the full project
   
   "It's slow" is not a metric. "GET /api/users takes 1200ms p95 with 100 concurrent connections" is.

2. **Measure the current state.** Run the measurement 3+ times to confirm it's stable and reproducible. For long-running measurements (>2 min each), 2 runs within 5% of each other is sufficient. Record:
   - The metric value (with units)
   - The measurement method (tool, command, conditions)
   - The environment (machine, load, data size)

3. **Set a target** (if the user hasn't). What would "fast enough" look like? This prevents infinite optimization — you stop when the target is met, not when you run out of ideas.

```
Baseline: GET /api/users → 1200ms p95 (100 concurrent, 10k users in DB)
Target: < 300ms p95
Method: wrk -t4 -c100 -d30s http://localhost:3000/api/users
```

## Phase 2: Profile

Identify the actual bottleneck — not the guessed one.

1. **Choose the right profiling tool** for the stack. Prefer CLI-based tools that produce text output (Claude can read and analyze these directly). For GUI-only tools, ask the user to run them and share the output.
   - Node.js: `node --prof` + `node --prof-process` (text output), `clinic doctor --autocannon` (generates HTML — ask user to share), `0x` (flamegraph — ask user to describe hotspots)
   - Python: `python -m cProfile -s cumulative script.py` (text output), `py-spy top --pid PID` (text output)
   - Go: `go test -bench . -cpuprofile cpu.prof` + `go tool pprof -text cpu.prof` (text output)
   - Browser: Ask the user to run Lighthouse CLI (`npx lighthouse URL --output json`) or share DevTools Performance tab screenshots
   - Database: `EXPLAIN ANALYZE` (text output — run directly), slow query log
   - General: `time command`, `perf stat command` (text output)

2. **Profile under realistic conditions.** A profile with 10 items in the database tells you nothing about production with 10 million. Match the data size, concurrency, and environment as closely as possible. If no profiling infrastructure exists, add lightweight instrumentation (`console.time`/`console.timeEnd`, `Date.now()` deltas, or language-equivalent timing) at suspected boundaries — this is often enough to identify the bottleneck without setting up a full profiler.

3. **Read the profile output.** Identify the top 3 time/memory consumers. The bottleneck is the thing that takes the most wall-clock time (or memory, if that's the metric) — not the thing with the most calls, not the thing with the worst Big-O notation, not the thing that "looks inefficient." Distinguish between self time (time in the function itself) and total time (including callees) — the optimization target is usually the function with the highest self time.

4. **State the bottleneck explicitly** before proposing any fix:
   > "The profile shows 82% of time is spent in `serializeUser()`, specifically the N+1 query loading user.permissions for each user in the list."

## Phase 3: Hypothesize

Propose a specific fix with a predicted improvement.

1. **State the hypothesis:** "Batch-loading permissions with a single IN query instead of N individual queries should reduce serialization time by ~80%, bringing p95 from 1200ms to ~300ms."

2. **Sanity-check the hypothesis:**
   - Does it address the measured bottleneck (not a different one)?
   - Is the predicted improvement realistic (not "10x faster" without evidence)?
   - Does it change behavior? If yes, route through TDD — performance fixes must not break correctness.

3. **Identify risks:** Could this fix introduce new problems? (Memory spikes from batch loading, cache staleness, increased complexity)

## Phase 4: Fix and Re-measure

Apply one change, then measure again.

1. **Implement the fix.** One fix at a time — never bundle multiple optimizations. If you change three things and it's faster, you don't know which change helped (or if one made things worse and the other two compensated).

2. **Re-measure using the exact same method** from Phase 1. Same tool, same conditions, same data.

3. **Compare to baseline:**
   - **Target met?** Stop. Document the fix and the measurement.
   - **Improved but not enough?** Return to Phase 2 — profile again. The bottleneck has likely shifted to a different component.
   - **No improvement?** The hypothesis was wrong. Revert the change and return to Phase 2 with fresh profiling.
   - **Regression?** Revert immediately. Investigate why — the fix may have shifted load elsewhere.

4. **Record the result:**
   ```
   Fix: Batch permissions query (N+1 → 1)
   Before: 1200ms p95
   After: 340ms p95
   Improvement: 72%
   Target (< 300ms): not met → continue
   ```

## Rules

- Never optimize without a measurement. "I think this is faster" is not evidence.
- Never optimize code that isn't the measured bottleneck. Optimizing a function that takes 2% of total time can never produce meaningful improvement regardless of how efficient you make it.
- One fix at a time. Bundle = can't attribute improvement.
- If the fix changes observable behavior (response shape, error handling, side effects), it's not just an optimization — route the behavior change through TDD.
- Stop when the target is met. Over-optimization is real cost with no real benefit.

## Anti-Patterns

| Temptation | Why it fails |
|---|---|
| "Let me cache everything" | Caching adds complexity, staleness bugs, and memory pressure. Only cache what the profile says is slow. |
| "I'll parallelize it" | Parallelism helps CPU-bound work. If the bottleneck is I/O or a lock, parallelism makes it worse. |
| "This algorithm is O(n²), I should fix it" | Big-O matters at scale. If n is always 10, the constant factor dominates. Profile first. |
| "Pre-optimization: let me make this efficient from the start" | Write correct code first. Optimize only when measurement shows a problem. |

## Related Skills

- `systematic-debugging` — when performance degradation is actually a bug (infinite loop, memory leak from a logic error)
- `test-driven-development` — when the performance fix requires behavior changes
- `refactoring` — when the fix is purely structural (reorganizing code for better locality, no behavior change)
