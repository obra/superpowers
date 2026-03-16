---
name: hwc-navigation-content
description: >-
  Build Hotwire navigation and content-discovery flows: Turbo Frame pagination, tabbed navigation, lazy loading, faceted filtering/search, cache lifecycle, scroll restoration, and visit/render control. Prefer this skill when the core problem is request/response navigation state and browser history behavior. Use hwc-forms-validation for form validation and inline edit flows, hwc-realtime-streaming for WebSocket/Turbo Stream push updates, hwc-media-content for image/video/audio features, hwc-ux-feedback for generic loading/progress/transition polish, and hwc-stimulus-fundamentals for Stimulus APIs not centered on navigation.
---

# Navigation & Content Display

Implement navigation and content-discovery behavior with Turbo Drive and Turbo Frames.

## Core Workflow

1. Classify navigation mode: tabs, pagination, lazy frame loading, faceted search, or custom render/cache lifecycle.
2. Decide URL and history ownership first (`data-turbo-action`, frame `src`, query params, back/forward behavior).
3. Use frame lifecycle and visit events to update active state, request params, and scroll restoration.
4. Clean transient UI state before Turbo cache snapshots.
5. Validate behavior across forward/back navigation and refresh paths.

## Guardrails

- Update active/tab state on load/render events, not click intent events.
- Keep URL state canonical for filters and pagination.
- Avoid leaving transient UI artifacts in cache snapshots.
- Use lazy loading deliberately; verify loading boundaries and observer behavior.

## Load References Selectively

Open only the file needed for the current request.

- Tabbed frame navigation: `references/2023-06-20-turbo-frames-tabbed-navigation.md`
- Pagination + history management: `references/2023-07-04-turbo-frames-pagination.md`
- Lazy frame lifecycle: `references/2023-09-26-turbo-frames-lazy-loading-lifecycle.md`
- Scroll restoration: `references/2023-09-12-turbo-frames-scroll-position-restoration.md`
- Cache lifecycle cleanup: `references/2023-05-23-turbo-drive-cache-lifecycle.md`
- Custom render interception: `references/2023-05-09-turbo-drive-custom-rendering.md`
- Conditional instant click strategy: `references/2024-02-13-turbo-drive-conditional-instant-click.md`
- Faceted search with Stimulus: `references/2024-12-10-stimulus-turbo-frames-faceted-search.md`
- Markdown preview flow: `references/2024-10-08-turbo-frames-markdown-preview.md`

Use `references/INDEX.md` for the full catalog.

## Escalate to Neighbor Skills

- Form submission and validation behavior: use `hwc-forms-validation`
- Push-based real-time updates: use `hwc-realtime-streaming`
- Media-specific interaction design: use `hwc-media-content`
- Generic feedback/transitions and perceived-performance polish: use `hwc-ux-feedback`
- Non-navigation Stimulus API fundamentals: use `hwc-stimulus-fundamentals`
