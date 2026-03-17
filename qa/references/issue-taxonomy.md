# QA Issue Taxonomy

## Severity Levels

| Severity | Definition | Examples |
|----------|------------|----------|
| `critical` | Breaks a core workflow, risks data loss, or crashes the app | Checkout fails, destructive action runs without confirmation, submit returns an error page |
| `high` | Major feature is broken or unusable with no good workaround | Auth loop, upload silently fails, search results are wrong |
| `medium` | Feature works with a noticeable defect or weak fallback | Missing loading state, mobile layout broken, validation incomplete |
| `low` | Cosmetic or polish issue | Typo, spacing issue, inconsistent hover state |

## Categories

### Visual / UI
- Layout breaks, clipped text, overflow, layering issues
- Broken images, missing media, inconsistent typography
- Theme or responsiveness problems

### Functional
- Broken links, dead controls, wrong redirects
- Forms that do nothing, validate incorrectly, or lose data
- State not persisting across refresh, back-button, or role changes

### UX
- Missing loading or success feedback
- Confusing navigation, dead ends, no way back
- Destructive actions without confirmation

### Content
- Typos, stale copy, placeholder text, bad empty states

### Performance
- Slow loads, layout shifts, excessive requests, visibly janky interactions

### Console / Errors
- JavaScript exceptions, failed requests, CORS/CSP issues, mixed-content warnings

### Accessibility
- Missing labels, broken keyboard flow, focus traps, inaccessible contrast, missing alt text

## Per-Page Exploration Checklist

For each page or route visited during QA:

1. Visual scan
2. Interactive elements
3. Forms and validation
4. Navigation paths in and out
5. Loading, empty, error, and overflow states
6. Console and failed requests after interaction
7. Mobile or tablet pass if relevant
8. Auth or role boundary behavior when relevant
