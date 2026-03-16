---
name: hwc-ux-feedback
description: >-
  Implement cross-cutting Hotwire UX feedback patterns: loading states, busy indicators, progress bars, optimistic UI, render interception, and view/page transitions. Prefer this skill when the core goal is perceived performance and user feedback, independent of a single feature domain. Use hwc-forms-validation for form correctness and validation behavior, hwc-navigation-content for navigation/history/cache mechanics, hwc-realtime-streaming for push/stream orchestration, hwc-media-content for media-specific behavior, and hwc-stimulus-fundamentals for base Stimulus API questions.
---

# User Experience & Feedback

Implement cross-cutting feedback and perceived-performance patterns in Hotwire.

## Core Workflow

1. Identify feedback need: loading, submit activity, progress reporting, optimistic updates, or transitions.
2. Prefer built-in Turbo semantics first (`busy`, progress bar hooks, submit/render lifecycle events).
3. Add optimistic updates only with a clear reconciliation strategy.
4. Keep transition logic bounded to explicit lifecycle events and cache/preview-safe paths.
5. Verify UX behavior on slow network, back/forward cache restores, and submission failures.

## Guardrails

- Do not use fixed timeouts as a proxy for network or render completion.
- Gate animations/transitions for previews and cache restores.
- Keep submit locking/unlocking symmetric between start and end events.
- Separate UX feedback logic from domain-specific form/media/navigation implementations.

## Load References Selectively

Open only the file needed for the current request.

- Turbo progress bar reuse: `references/2023-07-18-turbo-drive-progress-bar.md`
- Form activity indicators: `references/2023-06-06-turbo-drive-form-activity-indicators.md`
- Render interception and page transitions: `references/2023-04-25-turbo-drive-render-interception.md`
- Swiper-like transition behavior: `references/2024-11-19-turbo-drive-swiper-view-transitions.md`
- Frame busy spinner patterns: `references/2026-01-20-turbo-frames-loading-spinner.md`
- Optimistic UI with Turbo morph reconciliation: `references/2024-03-26-optimistic-ui-with-turbo-8-morphs.md`
- ULID-based optimistic identity strategy: `references/2024-08-13-turbo-drive-ulid.md`

Use `references/INDEX.md` for the full catalog.

## Escalate to Neighbor Skills

- Form validation and submit correctness concerns: use `hwc-forms-validation`
- Navigation/history/cache flow concerns: use `hwc-navigation-content`
- Real-time push updates and stream actions: use `hwc-realtime-streaming`
- Media-specific playback/upload concerns: use `hwc-media-content`
- General Stimulus API/controller fundamentals: use `hwc-stimulus-fundamentals`
