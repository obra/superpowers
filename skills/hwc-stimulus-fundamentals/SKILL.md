---
name: hwc-stimulus-fundamentals
description: >-
  Cover Stimulus controller fundamentals: lifecycle hooks, values and valueChanged callbacks, targets and target callbacks, outlets, action parameters, keyboard events, and controller architecture patterns. Prefer this skill when the request is primarily about Stimulus APIs and controller design independent of a specific Hotwire domain. Use hwc-forms-validation for form-specific workflows, hwc-navigation-content for Turbo navigation concerns, hwc-realtime-streaming for Turbo Streams/WebSocket patterns, hwc-media-content for media integrations, and hwc-ux-feedback for loading/progress/transition UX patterns.
---

# Stimulus Fundamentals

Implement robust Stimulus controllers with clear lifecycle and state boundaries.

## Core Workflow

1. Define controller contract first: targets, values, outlets, actions, and expected lifecycle.
2. Keep state transitions in value callbacks when reactive updates are required.
3. Guard callbacks that can run before `connect()` completes.
4. Use `connect()/disconnect()` for setup and teardown symmetry.
5. Isolate DOM event handling from business rules; keep controllers composable.

## Guardrails

- Prefer declarative action parameters over manual dataset parsing.
- Use outlets for controller-to-controller communication instead of private internals.
- Keep target callbacks idempotent; account for repeated connect/disconnect cycles.
- Use MutationObserver only when DOM-driven reactivity is required.
- Feature-detect browser APIs before exposing UI affordances.

## Load References Selectively

Open only the file needed for the current request.

- Value changed callbacks: `references/2023-08-29-stimulus-value-changed-callbacks.md`
- Keyboard action filters and hotkeys: `references/2023-10-24-stimulus-keyboardevent-101.md`
- MutationObserver-based sorting: `references/2023-12-05-stimulus-auto-sorting.md`
- Outlets API communication: `references/2023-12-19-stimulus-outlets-api.md`
- Target callback orchestration: `references/2024-05-07-stimulus-target-callbacks.md`
- Web Share API integration: `references/2025-11-25-stimulus-web-share-api.md`
- Core Web Vitals and lazy-loading fundamentals: `references/2024-06-18-fundamentals-core-web-vitals.md`

Use `references/INDEX.md` for the full catalog.

## Escalate to Neighbor Skills

- Form-centric behavior: use `hwc-forms-validation`
- Navigation/history/cache with Turbo: use `hwc-navigation-content`
- Turbo Stream/WebSocket orchestration: use `hwc-realtime-streaming`
- Media integrations and playback concerns: use `hwc-media-content`
- UX feedback/transitions/progress concerns: use `hwc-ux-feedback`
