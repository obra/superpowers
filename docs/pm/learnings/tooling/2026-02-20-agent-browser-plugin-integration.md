---
date: 2026-02-20
project: scaffolding-platform
project_type: claude-code-plugin
category: tooling
tags: [agent-browser, vercel, browser-testing, mcp, playwright, headless]
outcome: success
---

# agent-browser Plugin Integration

## Context

Integrated the `vercel-labs/agent-browser` plugin into the SDLC pipeline as the primary browser automation tool for the `browser-test` stage. This replaces a custom-built browser testing skill.

## What Worked

### Plugin install via `npx skills add`

```bash
npx skills add vercel-labs/agent-browser --yes --global
```

Installs to `~/.agents/skills/agent-browser/` and auto-symlinks to Claude Code. Available immediately as the `agent-browser` skill in any session. No MCP configuration required — it uses the existing `Bash` tool with pattern `Bash(agent-browser:*)`.

### Headless mode works for autonomous pipeline runs

`agent-browser` runs completely headlessly — no display, no browser window. Perfect for autonomous pipeline runs. The `snapshot -i` output provides accessible element refs (`@e1`, `@e2`) that agents can interact with programmatically.

### `set device "iPhone 15"` for mobile testing

The device emulation mode works exactly as needed for mobile layout verification. Combined with `screenshot --full`, it captures full-page mobile screenshots for the review-findings artifacts.

### Playwright fallback via `npx playwright`

When `agent-browser` is unavailable, `npx playwright screenshot --device="iPhone 15"` provides equivalent screenshot coverage. The fallback is reliable because Playwright v1.58.2 is installed globally.

## What Didn't Work / Gotchas

### agent-browser daemon holds stale session state

After a browser session, the daemon continues running. On subsequent calls in the same pipeline run, it may be connected to a stale tab. Always run `agent-browser close 2>/dev/null || true` at the start of each new `browser-tester` invocation.

### Tailwind CDN + agent-browser snapshot

When the app uses Tailwind CSS via CDN (`<script src="https://cdn.tailwindcss.com">`), the agent-browser snapshot may show unstyled elements briefly before Tailwind hydrates. Add `agent-browser wait --load networkidle` before taking snapshots to ensure styles are applied.

### Build preview vs dev server for browser testing

`npm run preview` (Vite's preview of the production build) is more stable for browser testing than `npm run dev` (hot-reload dev server). The dev server sometimes returns 304s or partial responses during HMR. Use `npm run build && npm run preview` for the browser-test stage.

## Reusable Pattern

### Standard browser-test sequence for Vite apps

```bash
# 1. Build production bundle
npm run build

# 2. Start preview server in background
npm run preview -- --port 4173 &
PREVIEW_PID=$!
sleep 3

# 3. Reset session
agent-browser close 2>/dev/null || true

# 4. Smoke check
agent-browser open http://localhost:4173 && \
agent-browser wait --load networkidle && \
agent-browser errors

# 5. Mobile layout
agent-browser set device "iPhone 15"
agent-browser open http://localhost:4173
agent-browser wait --load networkidle
agent-browser screenshot docs/pm/review-findings/mobile-portrait.png --full

# 6. E2E snapshot
agent-browser open http://localhost:4173
agent-browser snapshot -i

# 7. Cleanup
kill $PREVIEW_PID 2>/dev/null
```

## Architecture Decision

The two-layer approach works well:
- **`agent-browser` skill** (official plugin): provides the full command reference and automation patterns
- **`browser-testing` skill** (custom): provides SDLC context — when to run, how to classify findings as P1/P2/P3
- **`browser-tester` agent**: orchestrates the specific test sequence for the pipeline stage

This separation means updating the official plugin doesn't break the pipeline's business logic, and vice versa.
