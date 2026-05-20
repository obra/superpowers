# React/Next.js Specific Evaluation Rules

## Component & Next.js Architecture

- **Server vs. Client Components**: Enforce Next.js App Router defaults. Components must be Server Components by default. Treat `"use client"` as an exception for interactivity/state only.
- **Error Boundaries**: New features or major routing sub-trees must be wrapped in local `error.tsx` or React Error Boundaries to prevent total page crashes.
- **Component Isolation**: Components are isolated and testable. No direct DOM manipulation (use refs properly).
- **State Hygiene**: Local component mutations must not trigger global state updates unnecessarily. Reject prop drilling extending past 2 levels; enforce Context API or zustand/signals for shared cross-component state. Server state separated from UI state. Optimistic updates with proper rollback.

## Performance & Core Web Vitals

- **Render Optimization**: Check for heavy computations inside the render path. Enforce `useMemo` and `useCallback` only when child components are memoized (`React.memo`) or dependency arrays warrant it.
- **Asset Control**: Images MUST use `next/image` with explicit aspect ratios, placeholders, or sizing. Static assets must not cause Layout Shifts (enforce CLS < 0.1). Core Web Vitals targets: LCP < 2.5s, CLS < 0.1, INP < 200ms.
- **Bundle Splitting**: Heavy client-side third-party libraries must be loaded dynamically via `next/dynamic`. Code splitting for route-level and component-level lazy loading.

## Accessibility (a11y) & UX

- **Semantic HTML & WCAG**: Reject non-semantic wrappers (e.g., `div` with an `onClick` instead of a `button`). Interactive nodes must have fully compliant `aria-*` tags and support keyboard navigation (`tabIndex`). Color contrast meets WCAG AA. Form inputs have associated labels.