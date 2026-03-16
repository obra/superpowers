---
name: hwc-realtime-streaming
description: >-
  Implement real-time Hotwire behavior: Turbo Streams over WebSocket/SSE, custom stream actions, inline stream tags, live list updates, and cross-tab state synchronization. Prefer this skill when the core problem is push-based updates or stream action orchestration. Use hwc-navigation-content for pull-based pagination/tab/lazy-navigation flows, hwc-forms-validation for form lifecycle and validation, hwc-media-content for media upload/playback behavior, hwc-ux-feedback for generic loading/progress/transitions, and hwc-stimulus-fundamentals for non-stream Stimulus fundamentals.
---

# Real-Time & Streaming

Implement push-driven Hotwire behavior with Turbo Streams and Stimulus.

## Core Workflow

1. Identify transport and delivery shape: WebSocket, SSE, inline stream tags, or server response streams.
2. Choose default Turbo Stream actions first; add custom actions only when defaults are insufficient.
3. Keep stream actions small and deterministic; avoid embedding arbitrary scripts in stream payloads.
4. Separate stream orchestration from domain UI concerns (forms, media, navigation).
5. Verify ordering, idempotency, and multi-tab behavior for all real-time updates.

## Guardrails

- Prefer `append/prepend/replace/update/remove/before/after/refresh` before custom actions.
- Keep cross-tab sync explicit (BroadcastChannel/localStorage) and scope it to same-device semantics.
- Use view transitions only where animation meaningfully improves state-change clarity.
- Validate failure modes for delayed/out-of-order messages.

## Load References Selectively

Open only the file needed for the current request.

- Inline client-side stream tags: `references/2023-08-01-turbo-streams-inline-stream-tags.md`
- Custom Turbo Stream actions: `references/2023-08-15-turbo-streams-custom-stream-actions.md`
- Advanced playlist orchestration via custom actions: `references/2023-10-10-turbo-streams-custom-stream-actions-video-playlist-management.md`
- LocalStorage-backed stream state: `references/2024-01-30-turbo-streams-custom-stream-actions-localstorage.md`
- List animations with View Transitions: `references/2025-06-10-turbo-streams-list-animation-view-transitions.md`
- Real-time combobox updates: `references/2024-03-12-hotwire-combobox-with-real-time-data.md`
- Inter-tab communication patterns: `references/2023-11-21-stimulus-inter-tab-communication.md`

Use `references/INDEX.md` for the full catalog.

## Escalate to Neighbor Skills

- Pull-based navigation/history concerns: use `hwc-navigation-content`
- Form validation and submit lifecycle concerns: use `hwc-forms-validation`
- Media playback/upload interactions: use `hwc-media-content`
- Generic loading/progress/transition UX: use `hwc-ux-feedback`
- Base Stimulus API questions outside streaming: use `hwc-stimulus-fundamentals`
