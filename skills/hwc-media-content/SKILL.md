---
name: hwc-media-content
description: >-
  Handle media-heavy Hotwire features: image/video/audio uploads, previews, playback controls, progress tracking, and third-party media integrations (for example WaveSurfer, Swiper, Picture-in-Picture, Blurhash). Prefer this skill when the core problem is media rendering, playback state, or media library integration. Use hwc-realtime-streaming for server-pushed Turbo Stream updates, hwc-navigation-content for non-media pagination/tab/lazy-navigation flows, hwc-forms-validation for form validation and inline-edit behavior, hwc-ux-feedback for generic loading/transition patterns, and hwc-stimulus-fundamentals for Stimulus primitives not specific to media.
---

# Media & Rich Content

Implement media-centric Hotwire features with Stimulus and Turbo Frames.

## Core Workflow

1. Identify media mode: upload/preview, playback controls, progress persistence, or embedded library integration.
2. Keep media state in Stimulus values; bridge third-party APIs through value callbacks and targets.
3. Use browser-native APIs first (`URL.createObjectURL`, Picture-in-Picture, IntersectionObserver, MediaSession).
4. Clean up all allocated resources in `disconnect()` (observers, blob URLs, player instances, timers).
5. Persist only intentional client state (for example playback progress) and reconcile on load.

## Guardrails

- Revoke blob URLs after image/file preview rendering.
- Prefer feature detection for browser APIs (PiP/Web Share/MediaSession).
- Avoid mixing transport concerns; media rendering belongs here, stream orchestration belongs in real-time skill.
- Keep frame updates incremental for time-based UI (lyrics, carousels, progress widgets).

## Load References Selectively

Open only the file needed for the current request.

- Upload previews via blob URLs: `references/2024-09-17-stimulus-image-upload-previews.md`
- Progressive image loading and Blurhash: `references/2024-04-23-stimulus-progressive-image-loading-blurhash.md`
- Picture-in-Picture behavior: `references/2024-06-04-stimulus-picture-in-picture.md`
- Video progress persistence: `references/2024-10-29-stimulus-video-progress-tracker.md`
- WaveSurfer marker add flows: `references/2024-07-02-stimulus-wavesurfer-add-markers.md`
- WaveSurfer marker remove flows: `references/2024-07-30-stimulus-wavesurfer-remove-markers.md`
- Time-synced lyrics frame updates: `references/2024-04-09-turbo-frames-scrolling-lyrics.md`
- Swiper autoplay with Turbo Frames: `references/2025-01-14-turbo-frames-swiper-autoplay.md`

Use `references/INDEX.md` for the full catalog.

## Escalate to Neighbor Skills

- Push-based data updates or custom Turbo Stream actions: use `hwc-realtime-streaming`
- Pagination/tab/filter navigation concerns: use `hwc-navigation-content`
- Form lifecycle and validation handling: use `hwc-forms-validation`
- Generic loading/progress/transition UX: use `hwc-ux-feedback`
- Pure Stimulus API architecture: use `hwc-stimulus-fundamentals`
