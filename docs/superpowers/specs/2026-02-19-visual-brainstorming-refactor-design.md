# Visual Brainstorming Refactor: Browser Displays, Terminal Commands

**Date:** 2026-02-19
**Status:** Approved
**Scope:** `lib/brainstorm-server/`, `skills/brainstorming/visual-companion.md`, `tests/brainstorm-server/`

## Problem

During visual brainstorming, Claude runs `wait-for-feedback.sh` as a background task and blocks on `TaskOutput(block=true, timeout=600s)`. This seizes the TUI entirely — the user cannot type to Claude while visual brainstorming is running. The browser becomes the only input channel.

Claude Code's execution model is turn-based. There is no way for Claude to listen on two channels simultaneously within a single turn. The blocking `TaskOutput` pattern was the wrong primitive — it simulates event-driven behavior the platform doesn't support.

## Design

### Core Model

**Browser = interactive display.** Shows mockups, lets the user click to select options. Selections are recorded server-side.

**Terminal = conversation channel.** Always unblocked, always available. The user talks to Claude here.

### The Loop

1. Claude writes an HTML file to the session directory
2. Server detects it via chokidar, pushes WebSocket reload to the browser (unchanged)
3. Claude ends its turn — tells the user to check the browser and respond in the terminal
4. User looks at browser, optionally clicks to select an option, then types feedback in the terminal
5. On the next turn, Claude reads `$SCREEN_DIR/.events` for the browser interaction stream (clicks, selections), merges with the terminal text
6. Iterate or advance

No background tasks. No `TaskOutput` blocking. No polling scripts.

### Key Deletion: `wait-for-feedback.sh`

Deleted entirely. Its purpose was to bridge "server logs events to stdout" and "Claude needs to receive those events." The `.events` file replaces this — the server writes user interaction events directly, and Claude reads them with whatever file-reading mechanism the platform provides.

### Key Addition: `.events` File (Per-Screen Event Stream)

The server writes all user interaction events to `$SCREEN_DIR/.events`, one JSON object per line. This gives Claude the full interaction stream for the current screen — not just the final selection, but the user's exploration path (clicked A, then B, settled on C).

Example contents after a user explores options:

```jsonl
{"type":"click","choice":"a","text":"Option A - Preset-First Wizard","timestamp":1706000101}
{"type":"click","choice":"c","text":"Option C - Manual Config","timestamp":1706000108}
{"type":"click","choice":"b","text":"Option B - Hybrid Approach","timestamp":1706000115}
```

- Append-only within a screen. Each user event is appended as a new line.
- The file is cleared (deleted) when chokidar detects a new HTML file (new screen pushed), preventing stale events from carrying over.
- If the file doesn't exist when Claude reads it, no browser interaction occurred — Claude uses only the terminal text.
- The file contains only user events (`click`, etc.) — not server lifecycle events (`server-started`, `screen-added`). This keeps it small and focused.
- Claude can read the full stream to understand the user's exploration pattern, or just look at the last `choice` event for the final selection.

## Changes by File

### `index.js` (server)

**A. Write user events to `.events` file.**

In the WebSocket `message` handler, after logging the event to stdout: append the event as a JSON line to `$SCREEN_DIR/.events` via `fs.appendFileSync`. Only write user interaction events (those with `source: 'user-event'`), not server lifecycle events.

**B. Clear `.events` on new screen.**

In the chokidar `add` handler (new `.html` file detected), delete `$SCREEN_DIR/.events` if it exists. This is the definitive "new screen" signal — better than clearing on GET `/` which fires on every reload.

**C. Replace `wrapInFrame` content injection.**

The current regex anchors on `<div class="feedback-footer">`, which is being removed. Replace with a comment placeholder: remove the existing default content inside `#claude-content` (the `<h2>Visual Brainstorming</h2>` and subtitle paragraph) and replace with a single `<!-- CONTENT -->` marker. Content injection becomes `frameTemplate.replace('<!-- CONTENT -->', content)`. Simpler and won't break if template formatting changes.

### `frame-template.html` (UI frame)

**Remove:**
- The `feedback-footer` div (textarea, Send button, label, `.feedback-row`)
- Associated CSS (`.feedback-footer`, `.feedback-footer label`, `.feedback-row`, textarea and button styles within it)

**Add:**
- `<!-- CONTENT -->` placeholder inside `#claude-content`, replacing the default text
- A selection indicator bar where the footer was, with two states:
  - Default: "Click an option above, then return to the terminal"
  - After selection: "Option B selected — return to terminal to continue"
- CSS for the indicator bar (subtle, similar visual weight to the existing header)

**Keep unchanged:**
- Header bar with "Brainstorm Companion" title and connection status
- `.main` wrapper and `#claude-content` container
- All component CSS (`.options`, `.cards`, `.mockup`, `.split`, `.pros-cons`, placeholders, mock elements)
- Dark/light theme variables and media query

### `helper.js` (client-side script)

**Remove:**
- `sendToClaude()` function and the "Sent to Claude" page takeover
- `window.send()` function (was tied to the removed Send button)
- Form submission handler — no purpose without the feedback textarea, adds log noise
- Input change handler — same reason
- `pageshow` event listener (was added to fix textarea persistence — no textarea anymore)

**Keep:**
- WebSocket connection, reconnect logic, event queue
- Reload handler (`window.location.reload()` on server push)
- `window.toggleSelect()` for selection highlighting
- `window.selectedChoice` tracking
- `window.brainstorm.send()` and `window.brainstorm.choice()` — these are distinct from the removed `window.send()`. They call `sendEvent` which logs to the server via WebSocket. Useful for custom full-document pages.

**Narrow:**
- Click handler: capture only `[data-choice]` clicks, not all buttons/links. The broad capture was needed when the browser was a feedback channel; now it's just for selection tracking.

**Add:**
- On `data-choice` click, update the selection indicator bar text to show which option was selected.

**Remove from `window.brainstorm` API:**
- `brainstorm.sendToClaude` — no longer exists

### `visual-companion.md` (skill instructions)

**Rewrite "The Loop" section** to the non-blocking flow described above. Remove all references to:
- `wait-for-feedback.sh`
- `TaskOutput` blocking
- Timeout/retry logic (600s timeout, 30-minute cap)
- "User Feedback Format" section describing `send-to-claude` JSON

**Replace with:**
- The new loop (write HTML → end turn → user responds in terminal → read `.events` → iterate)
- `.events` file format documentation
- Guidance that the terminal message is the primary feedback; `.events` provides the full browser interaction stream for additional context

**Keep:**
- Server startup/shutdown instructions
- Content fragment vs full document guidance
- CSS class reference and available components
- Design tips (scale fidelity to the question, 2-4 options per screen, etc.)

### `wait-for-feedback.sh`

**Deleted entirely.**

### `tests/brainstorm-server/server.test.js`

Tests that need updating:
- Test asserting `feedback-footer` presence in fragment responses — update to assert the selection indicator bar or `<!-- CONTENT -->` replacement
- Test asserting `helper.js` contains `send` — update to reflect narrowed API
- Test asserting `sendToClaude` CSS variable usage — remove (function no longer exists)

## Platform Compatibility

The server code (`index.js`, `helper.js`, `frame-template.html`) is fully platform-agnostic — pure Node.js and browser JavaScript. No Claude Code-specific references. Already proven to work on Codex via background terminal interaction.

The skill instructions (`visual-companion.md`) are the platform-adaptive layer. Each platform's Claude uses its own tools to start the server, read `.events`, etc. The non-blocking model works naturally across platforms since it doesn't depend on any platform-specific blocking primitive.

## What This Enables

- **TUI always responsive** during visual brainstorming
- **Mixed input** — click in browser + type in terminal, naturally merged
- **Graceful degradation** — browser down or user doesn't open it? Terminal still works
- **Simpler architecture** — no background tasks, no polling scripts, no timeout management
- **Cross-platform** — same server code works on Claude Code, Codex, and any future platform

## What This Drops

- **Pure-browser feedback workflow** — user must return to the terminal to continue. The selection indicator bar guides them, but it's one extra step compared to the old click-Send-and-wait flow.
- **Inline text feedback from browser** — the textarea is gone. All text feedback goes through the terminal. This is intentional — the terminal is a better text input channel than a small textarea in a frame.
- **Immediate response on browser Send** — the old system had Claude respond the moment the user clicked Send. Now there's a gap while the user switches to the terminal. In practice this is seconds, and the user gets to add context in their terminal message.
