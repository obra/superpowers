# React Best Practices Skill

How the vercel-react-best-practices skill works and what to expect when you ask the AI to write, review, or refactor React/Next.js code.

## What It Does

The react-best-practices skill is a comprehensive performance optimization system for React and Next.js applications, maintained by Vercel Engineering. Instead of applying generic optimization patterns, it enforces a prioritized, impact-driven approach with 70+ rules across 8 categories — from critical (eliminating waterfalls, reducing bundle size) to incremental (advanced patterns).

The skill covers:
- **Eliminating waterfalls** — CRITICAL impact, 2-10× improvement on data fetching
- **Bundle size optimization** — CRITICAL impact, 200-800ms import cost savings
- **Server-side performance** — HIGH impact, RSC/SSR optimization patterns
- **Client-side data fetching** — MEDIUM-HIGH impact, automatic deduplication
- **Re-render optimization** — MEDIUM impact, memoization and state management
- **Rendering performance** — MEDIUM impact, hydration, SVG, and DOM optimization
- **JavaScript performance** — LOW-MEDIUM impact, hot path micro-optimizations
- **Advanced patterns** — LOW impact, useEffectEvent, stable callbacks, init guards

## How It Works

### 1. Priority-Based Rule System

Rules are organized by impact, not alphabetically. The skill applies higher-priority rules first during code generation and review:

| Priority | Category | Impact | Prefix |
|---|---|---|---|
| 1 | Eliminating Waterfalls | CRITICAL | `async-` |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` |
| 3 | Server-Side Performance | HIGH | `server-` |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `client-` |
| 5 | Re-render Optimization | MEDIUM | `rerender-` |
| 6 | Rendering Performance | MEDIUM | `rendering-` |
| 7 | JavaScript Performance | LOW-MEDIUM | `js-` |
| 8 | Advanced Patterns | LOW | `advanced-` |

This ensures the most impactful optimizations are always applied first — eliminating a waterfall matters more than hoisting a RegExp.

### 2. Eliminating Waterfalls (CRITICAL)

Waterfalls are the #1 performance killer in React/Next.js apps. Each sequential `await` adds full network latency. The skill enforces patterns that maximize parallelism:

- **Promise.all() for independent operations** — 3 round trips → 1 round trip
- **Start promises early, await late** — fire independent operations immediately in API routes and Server Actions
- **Defer await until needed** — move await into branches where actually used
- **Check cheap conditions before async** — evaluate sync guards before hitting the network
- **Dependency-based parallelization** — use `better-all` for partially dependent operations
- **Strategic Suspense boundaries** — stream content instead of blocking entire layouts

### 3. Bundle Size Optimization (CRITICAL)

Reducing initial bundle size directly improves Time to Interactive and Largest Contentful Paint:

- **Avoid barrel imports** — import directly from source; popular libraries can have 10,000+ re-exports taking 200-800ms to import
- **Dynamic imports for heavy components** — use `next/dynamic` for editors, charts, modals
- **Defer third-party libraries** — load analytics/logging after hydration
- **Conditional module loading** — load large data only when feature is activated
- **Preload on user intent** — preload on hover/focus for perceived speed
- **Statically analyzable paths** — avoid dynamic imports that force broad bundles

### 4. Server-Side Performance (HIGH)

React Server Components and Next.js server-side patterns:

- **Authenticate server actions** — treat `"use server"` like public API routes
- **Parallel data fetching with composition** — restructure component tree to eliminate RSC waterfalls
- **Parallel nested fetching** — chain nested fetches per item in Promise.all so slow items don't block others
- **React.cache() for per-request deduplication** — deduplicate database queries and auth checks within a request
- **LRU cache for cross-request caching** — persist cache across sequential user actions
- **Minimize RSC boundary serialization** — only pass fields the client actually uses
- **Avoid duplicate serialization in props** — don't transform arrays server-side; do it client-side
- **No shared module state** — avoid mutable module-level variables in RSC/SSR
- **Hoist static I/O to module level** — load fonts, logos, config once, not per request
- **Use after() for non-blocking** — schedule logging/analytics after response is sent

### 5. Client-Side Data Fetching (MEDIUM-HIGH)

Patterns for efficient client-side data management:

- **SWR for automatic deduplication** — multiple component instances share one request
- **Deduplicate global event listeners** — use `useSWRSubscription` so N components = 1 listener
- **Passive event listeners** — enable immediate scrolling for touch/wheel events
- **Version localStorage** — add version prefix, store only needed fields, wrap in try-catch

### 6. Re-render Optimization (MEDIUM)

Reducing unnecessary re-renders:

- **Memoization** — extract expensive work into `memo()` components for early returns
- **Functional setState** — stable callbacks, no stale closures, fewer dependencies
- **Lazy state initialization** — pass function to `useState` for expensive initial values
- **Derived state during render** — compute from props/state, don't store in state + effect
- **Defer state reads** — don't subscribe to state only read in callbacks
- **Split combined hooks** — independent tasks with different dependencies get separate hooks
- **Subscribe to derived booleans** — not continuous values like pixel widths
- **Transitions for non-urgent updates** — `startTransition` for frequent non-blocking updates
- **useDeferredValue** — keep input responsive during expensive computations
- **useRef for transient values** — mouse trackers, intervals, frequent DOM updates
- **No inline components** — defining components inside components causes remount on every render
- **Narrow effect dependencies** — primitives instead of objects
- **Event handlers over effects** — put interaction logic in handlers, not state + effect

### 7. Rendering Performance (MEDIUM)

Optimizing what the browser does:

- **Animate SVG wrapper** — wrap SVG in div for hardware acceleration
- **content-visibility for long lists** — 10× faster initial render for 1000+ items
- **Hoist static JSX** — extract outside components to avoid re-creation
- **SVG precision reduction** — reduce coordinate decimal places
- **Hydration mismatch prevention** — inline script for client-only data, no flicker
- **Suppress expected hydration warnings** — dates, random IDs, locale formatting
- **Activity component** — preserve state/DOM for frequently toggled expensive components
- **Explicit conditional rendering** — ternary over `&&` to prevent rendering 0 or NaN
- **React DOM resource hints** — prefetchDNS, preconnect, preload, preinit
- **useTransition over manual loading** — built-in pending state, better error resilience
- **defer/async on script tags** — eliminate render-blocking

### 8. JavaScript Performance (LOW-MEDIUM)

Micro-optimizations for hot paths:

- **Index maps for repeated lookups** — 1M ops → 2K ops for 1000×1000
- **Cache property access in loops** — 1 lookup total instead of N iterations
- **Cache function results** — module-level Map for repeated computations
- **Cache storage API reads** — localStorage/sessionStorage are synchronous and expensive
- **Combine array iterations** — multiple filter/map into one loop
- **Early length check** — O(1) before expensive array comparison
- **Early return** — skip processing once result is determined
- **Hoist RegExp** — don't create inside render
- **flatMap over map+filter** — one pass, no intermediate array
- **Loop for min/max** — O(n) instead of O(n log n) sort
- **Set/Map for O(1) lookups** — convert arrays for membership checks
- **toSorted() for immutability** — prevents React state mutation bugs
- **requestIdleCallback** — defer non-critical work to browser idle time
- **Batch DOM/CSS changes** — group via classes or cssText, avoid layout thrashing

### 9. Advanced Patterns (LOW)

Specialized patterns for edge cases:

- **useEffectEvent** — stable callback refs without effect re-runs
- **Don't put effect events in deps** — identity intentionally changes every render
- **Event handlers in refs** — stable subscriptions without re-subscribing
- **Initialize once** — module-level guard, not useEffect in component

## What to Expect

When you prompt "optimize this React component" or "build a Next.js dashboard," the AI will:

1. Apply critical rules first — eliminate waterfalls, optimize bundle imports
2. Structure server components for parallel fetching, not sequential
3. Use proper Suspense boundaries for streaming content
4. Minimize data passed across RSC/client boundaries
5. Memoize expensive computations and use functional setState
6. Handle all five UI states with proper loading, error, and empty patterns
7. Apply rendering optimizations — SVG wrappers, content-visibility, hydration handling
8. Use JavaScript micro-optimizations in hot paths
9. Respect the React Compiler — manual memoization is unnecessary when compiler is enabled

## Integration with Other Skills

This skill integrates with `frontend-design` — when building UI, both skills apply simultaneously:
- `frontend-design` handles visual direction, accessibility, responsive layout, and UI states
- `react-best-practices` handles performance, data fetching patterns, bundle optimization, and re-render management

During plan execution or subagent-driven development, any task involving React/Next.js code automatically applies these standards.

## Activation

The skill activates automatically when your prompt involves React/Next.js code — writing, reviewing, refactoring, data fetching, bundle optimization, or performance improvements. You can also invoke it directly:

```
Use vercel-react-best-practices to review this component for performance issues.
```

## Rule Files

Each of the 70+ rules has its own file in `skills/react-best-practices/rules/` with:
- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and references

The full compiled document with all rules expanded is available at `skills/react-best-practices/AGENTS.md`.
