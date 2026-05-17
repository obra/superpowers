# React/Next.js Review Rules

## Component Architecture
- Components are isolated and testable
- No direct DOM manipulation (use refs properly)
- Error boundaries around new features
- No global state for local component data

## Performance
- No unnecessary re-renders (use React.memo, useMemo, useCallback appropriately)
- Core Web Vitals targets: LCP < 2.5s, CLS < 0.1, INP < 200ms
- Images use next/image with proper sizing
- Code splitting for route-level and component-level lazy loading

## Accessibility
- All interactive elements have aria labels
- Keyboard navigation works
- Color contrast meets WCAG AA
- Form inputs have associated labels

## State Management
- No prop drilling beyond 2 levels (use context or state library)
- Server state separated from UI state
- Optimistic updates with proper rollback
