# Visual Brainstorming Companion — Issue & Change Catalog

**Date:** 2026-06-09
**Status:** Analysis / triage. We are implementing these ourselves; the referenced
community PRs are evidence and reference material, **not** code we intend to merge.

## Purpose

A single place that captures every open issue and PR touching the visual
brainstorming companion (the local server in `skills/brainstorming/scripts/`),
distilled to the underlying problem and the change we'd make. Each item is
grounded against the current code, not the PR author's description.

## Scope decisions (Jesse, 2026-06-09)

- **Not vendoring Alpine.js.** PR #1639 (interactive mockups via a vendored
  Alpine build) is **dropped**. See E3.
- **E1 (terminal-vs-HTML hard gate) is a workshop item.** We'll design it
  together; it is not specced here.
- **E2 (storage location, #975/#977) is deferred** for now.
- **Remote serving is a first-class scenario.** Superpowers is general-purpose;
  users connect from remote (SSH tunnel, Tailscale, `--host 0.0.0.0`). The
  security fix MUST protect those users, not just loopback. **Decision: a
  per-session secret key**, not a Host allowlist. A Host allowlist only
  defends the loopback browser-confused-deputy; a direct remote client just
  sends the expected `Host`, so the allowlist is theater for remote exposure. A
  secret key is the only thing that authenticates a client uniformly across
  loopback, tunnel, and direct-remote, and it also defeats DNS rebinding. See A1.

## Component map

| File | Role |
|------|------|
| `skills/brainstorming/scripts/server.cjs` | Zero-dep HTTP + WebSocket server (RFC 6455 hand-rolled). Serves the newest screen, watches `content/`, records events to `state/events`. |
| `skills/brainstorming/scripts/helper.js` | Injected into every page. WebSocket client, click capture, `window.brainstorm` API. |
| `skills/brainstorming/scripts/frame-template.html` | Frame (header, theme CSS, status dot, indicator bar) wrapped around content fragments. |
| `skills/brainstorming/scripts/start-server.sh` | Launch wrapper. Session dir, host/url-host, owner-PID resolution, platform backgrounding. |
| `skills/brainstorming/scripts/stop-server.sh` | Kills the server by PID file, cleans `/tmp` sessions. |
| `skills/brainstorming/visual-companion.md` | Operator guide the agent reads when it accepts the companion. |
| `skills/brainstorming/SKILL.md` | Where the companion is offered and the per-question decision lives. |

## Disposition summary

| ID | Item | Source | Disposition |
|----|------|--------|-------------|
| A1 | Per-session secret key on `/`, `/files/*`, and WS (supersedes Host allowlist) | issues #1014, PRs #1110/#1553 | **Do** — chosen approach |
| A2 | Host allowlist; browser WS Origin check | PRs #1110/#1553 | Host allowlist dropped; WS Origin check retained after auth for browser confused-deputy defense |
| A3 | Crash on `null` / non-object WS payload | PR #1504 | Do |
| A4 | Frame-length bound in `decodeFrame` | issue #1446 | Already fixed — verify/close |
| B1 | Dotfile screens served as content (`._*.html`) | PR #950 | Do |
| B2 | `stop-server.sh` kills reused/stale PID | PR #1703 | Do |
| B3 | WS client reconnect backoff + status indicator | PR #856 | Do |
| C1 | Idle timeout too short / not configurable; WS not closed on shutdown | issue #1237 (PR #1689) | Do |
| C2 | Server death is invisible to user/agent | issue #1237 (residual) | Do |
| D1 | Permanent opt-out of the companion | issue #892 | Deferred - not in PR #1720 |
| D2 | Free-text feedback from the browser | issue #957 | Deferred - not in PR #1720 |
| D3 | Auto-open the companion URL | PR #759 (#755) | Done in PR #1720 via `--open` |
| D4 | Light/dark contrast helpers in the frame | PR #1683 | Deferred - not in PR #1720 |
| E1 | Hard-gate terminal-vs-HTML per question | PR #1037 | **Workshop** |
| E2 | Move session state out of the working tree | issue #975 (PR #977) | **Deferred** |
| E3 | Vendor Alpine.js for interactive mockups | PR #1639 | **Dropped** |
| E4 | Shell-lint warnings in start/stop scripts | PR #1677 | Opportunistic only |

---

## A. Server security hardening (`server.cjs`)

### A1 — Per-session secret key (chosen approach)

**Threat model.** Two assets: confidentiality of the served screen (`/`) and
files (`/files/*`), and integrity of `state/events` — a WebSocket client with a
truthy `choice` writes there (`server.cjs:243-246`), and the agent reads it next
turn as the user's selection, i.e. **prompt injection into a live session with
full tool access**. Reachers: with the default `127.0.0.1` bind, a malicious
page in the user's browser (a confused deputy — runs attacker JS *and* can reach
loopback); with a remote bind (`--host 0.0.0.0`, tailnet/LAN), any host that can
route to the port, directly, with no same-origin policy in the way. Today
`handleUpgrade` (`server.cjs:176`) checks only `Sec-WebSocket-Key`, and
`handleRequest` (`server.cjs:138`) checks nothing — both are wide open.

**Why a key, not a Host allowlist.** A Host allowlist only defends the
loopback browser-deputy. A direct remote client just sends the expected `Host`
and forges/omits `Origin`, so the allowlist is theater for exactly the remote
case we must protect. A per-session secret authenticates the client uniformly
across loopback, SSH tunnel, and direct-remote, and it also kills DNS rebinding
(the rebound page neither knows the key nor receives the host-scoped cookie).
So the key **supersedes** A1/A2's Host allowlist entirely — no `BRAINSTORM_ALLOWED_HOSTS`.

**Design.** Random token (`crypto.randomBytes(32)` hex), generated in
`server.cjs` at startup (overridable via `BRAINSTORM_TOKEN` for deterministic
tests):

1. **URL carries it** as `?key=<token>`. The server already builds `url` in its
   `server-started` JSON (`server.cjs:351`) and writes it to `state/server-info`
   — appending `?key=` there means `start-server.sh` (greps and prints that
   JSON) and the skill (hands the user that URL) need **no change**.
2. **Cookie bootstrap.** A valid `?key` on `/` sets
   `brainstorm-key-<port>=<token>; HttpOnly; SameSite=Strict; Path=/`. The
   browser then auto-attaches it to same-origin subresources (`/files/*`) and
   the WebSocket handshake, so the agent can write any URL style and it works,
   and `helper.js` needs no change. Cookie name is **per-port** to avoid the
   Jupyter multi-server collision (cookies aren't port-scoped).
   `SameSite=Strict` is safe for CDN/Unsplash content — that cookie is host-
   scoped, so outbound CDN requests never carry it; SameSite only governs
   requests back to our origin, which are all same-site.
3. **Auth gate** = valid `?key` **OR** valid cookie (compared with
   `crypto.timingSafeEqual`) on `/`, `/files/*`, and the WS upgrade. Missing/bad
   key → friendly **403 HTML page** ("this page needs the full URL your coding
   agent gave you, including `?key=…`" — generic "coding agent", not "Claude",
   since this ships on Codex/Gemini/Copilot too). WS upgrade → destroy socket.

The query token is the source of truth; the cookie is a convenience that never
bears initial-auth load.

**Blast radius.** `server.cjs` (all logic). `helper.js` optional one-liner
(append `?key=` from `location.search` to the WS URL as a cookie-blocked
fallback). `start-server.sh` none. `visual-companion.md` doc note (URL now has
`?key=`; don't strip it). Tests updated to pass the token.

### A2 — Host allowlist dropped; browser WS Origin retained

Subsumed by A1. The secret key closes the WS-injection vector (#1014), the
HTTP/WS DNS-rebinding read vector (PR #1553), and the cross-origin WS vector
(PR #1110) in one mechanism, and unlike an allowlist it actually protects the
remote-bind case. No `BRAINSTORM_ALLOWED_HOSTS` and no Host allowlist. The final
implementation still checks browser WebSocket `Origin` after session auth so a
cross-origin localhost tab cannot ride the companion cookie.

### A3 — Server crashes on `null` / primitive WS payload

**Problem.** `handleMessage` (`server.cjs:233`) does `JSON.parse(text)` then
`if (event.choice)` at `server.cjs:243`. A client that sends the 4-byte text
frame `null` yields `event === null`, and `null.choice` throws. The throw is
**not** caught — `handleMessage` is called from the `socket.on('data')` handler
(`server.cjs:207`) outside the `try/catch`, which only wraps `decodeFrame`. The
result is an uncaught exception and process exit. Any local client can kill the
server.

**Change.** Guard the access: `if (event && event.choice)`. Minimal and exact —
`JSON.parse` can't produce `undefined`, and primitives return `undefined` for
`.choice` without throwing, so only `null` is the live hazard. (Avoid the
broader fixes — a top-level `try/catch` or `process.on('uncaughtException')`
would mask other bugs.)

### A4 — Frame-length bound in `decodeFrame` (adjacent)

Referenced by PR #1504 as #1446. The current code **already** bounds extended
frame lengths: `MAX_FRAME_PAYLOAD_BYTES = 10MB` (`server.cjs:10`) is enforced at
`server.cjs:58-67` before any `Buffer.alloc`. Action: verify #1446 against
current `dev` and close if already resolved, rather than re-implementing.

---

## B. Server robustness / correctness

### B1 — macOS resource-fork dotfiles served as screen content

**Problem.** The newest-screen selector filters on `f.endsWith('.html')` only
(`server.cjs:127-128`). On macOS/ExFAT, `._screen.html` resource-fork files pass
that filter and, being written alongside the real file, can sort newest — so the
browser gets binary metadata instead of the mockup. Four read sites share the
weak filter: `getNewestScreen` (`server.cjs:127`), `knownFiles` init
(`server.cjs:279`), the `fs.watch` handler (`server.cjs:286`), and the `/files/`
endpoint (`server.cjs:154-156`).

**Change.** Reject dotfiles (`!f.startsWith('.')`) at all four sites. Covers
`._*`, `.DS_Store`, etc.

### B2 — `stop-server.sh` can kill a reused PID

**Problem.** `stop-server.sh` reads the PID from `state/server.pid`
(`stop-server.sh:20`) and `kill`s it (`:23`, escalating to `-9` at `:35`)
without confirming the PID still belongs to our server. After a reboot or PID
wraparound the file can point at an unrelated process, which we'd then SIGKILL.

**Change.** Before signalling, verify ownership — the PID's command is `node`
running our `server.cjs`, ideally matching this session. If ownership can't be
proven, fail closed (report `stale_pid`, don't kill). Keep the existing
`stopped` / `not_running` outputs for the real cases.

### B3 — WebSocket client: silent reconnect, stale "Connected"

**Problem.** `helper.js` reconnects on a fixed 1s timer (`helper.js:21-23`),
has no `onerror` handler, never nulls `ws` on close, and never clears a pending
reconnect timer. The frame's status element is hardcoded to "Connected" with the
dot pinned to `var(--success)` (`frame-template.html:77,200`). When the laptop
sleeps or the server restarts, the page shows "Connected" over a dead socket and
queues events with no feedback.

**Change.**
- `helper.js`: exponential backoff (500ms → ×2 → cap 30s, reset on open);
  `onerror` delegating to `onclose`; `ws = null` on close; `clearTimeout` before
  reconnecting.
- `frame-template.html`: drive the status dot from a `--status-color` custom
  property so JS can switch Connected (green) / Reconnecting (yellow) /
  Disconnected (red).

---

## C. Lifecycle / timeout (issue #1237)

### C1 — Idle timeout too short, not configurable, WS keeps process alive

**Problem.** `IDLE_TIMEOUT_MS` is hardcoded to 30 minutes (`server.cjs:258`),
enforced by the 60s lifecycle check (`server.cjs:329-332`). A single brainstorm
question can sit longer than 30 min while the user thinks or steps away, so the
server dies mid-session. Separately, `shutdown()` (`server.cjs:310-321`) calls
`server.close()` but never closes the upgraded sockets in `clients`
(`server.cjs:174`), so an open browser connection can keep the Node process
alive past shutdown.

**Change.**
- Raise the default to 4 hours and make it configurable:
  `--idle-timeout-minutes` in `start-server.sh` → an env var → `IDLE_TIMEOUT_MS`,
  with validation against Node timer overflow.
- Expose the effective timeout in the startup JSON / `state/server-info`.
- In `shutdown()`, close every socket in `clients` so the process actually
  exits.

### C2 — Server death is invisible

**Problem.** When the server exits it writes `state/server-stopped` and removes
`state/server-info` (`server.cjs:312-317`), and the skill is *told* to check
those files (`visual-companion.md:108`) — but it's soft guidance the model skips,
and the browser just shows a generic "can't be reached." The user diagnoses it
manually; the agent keeps referring to a dead URL.

**Change (two parts, independent of C1):**
- **Browser-facing tombstone.** Leave something at the last-served URL that says
  "this companion expired — ask Claude to restart it" instead of a connection
  error. Options to weigh: `helper.js` rendering a banner when the socket stays
  down past backoff (works only while the page is loaded), vs. a more involved
  approach that keeps a minimal responder alive to serve a tombstone page.
- **Harder skill check.** Tighten `visual-companion.md` / `SKILL.md` so
  "check `server-info`/`server-stopped` before referring to the URL or pushing a
  screen" is a required step, not a note. Keep it lightweight — possibly a
  one-line helper the agent always runs.

---

## D. Features

### D1 — Permanent opt-out of the visual companion (issue #892)

**Problem.** The companion is offered as its own message every session
(`SKILL.md:25,151-152`). A user who never wants it pays that round-trip — and
HTML generation — every time. There's no way to say "never offer this."

**Change.** Before the offer step, the skill checks a user-level setting and
skips the offer entirely when opt-out is set.

**Design choice open.** Mechanism isn't settled:
- Env var (e.g. `SUPERPOWERS_VISUAL_COMPANION=off`) the skill is told to read —
  simplest, matches what the issue asks for, lives in `.zshrc`.
- A plugin-settings file (`.claude/superpowers.local.md` frontmatter) — more
  structured, per-project capable, but heavier and project-scoped.
- Reliability caveat from the issue: a separate "no-companion" skill competes on
  trigger words and isn't reliable — rejected.

Pick the mechanism, then it's a small `SKILL.md` change plus a documented knob.

### D2 — Free-text feedback from the browser (issue #957)

**Problem.** The client only captures clicks on `[data-choice]`
(`helper.js:36-62`). A user who wants to annotate a mockup ("wrong shade of
blue") has to switch to the terminal, breaking the visual flow.

**Change.** Add a feedback `<textarea>` whose submit emits
`{"type":"feedback","text":...,"timestamp":...}` via the existing
`window.brainstorm.send` path (`helper.js:82-85`).

**Cross-cutting — server change required.** `handleMessage` only persists events
when `event.choice` is truthy (`server.cjs:243`). A `feedback` event has no
`choice`, so today it would be logged but **never written to `state/events`**,
and the agent wouldn't see it. The persistence condition must also accept
`feedback` events. Document the new event shape in `visual-companion.md`
(Browser Events Format, `:247-259`). Decide the submit trigger (button vs blur
vs both) and where the textarea renders (frame-level vs opt-in per screen).

### D3 — Auto-open the companion URL (PR #759, issue #755)

**Problem.** `start-server.sh` only prints the URL; the user opens it manually.
In WSL2 especially, people expect the browser to open.

**Change.** Best-effort opener after the `server-started` JSON is parsed:
Windows/WSL → `rundll32.exe url.dll,FileProtocolHandler <url>`, macOS → `open`,
Linux → `xdg-open` only when `DISPLAY`/`WAYLAND_DISPLAY` is set. Swallow
failures, never block startup, keep echoing the URL. Document in
`visual-companion.md`. (Consider an opt-out for headless/remote runs where
popping a browser is wrong — ties into D1's config mechanism.)

### D4 — Light/dark contrast helpers (PR #1683)

**Problem.** Content fragments are wrapped in the OS-aware frame
(`frame-template.html`). In dark mode, quick mockups often use white inline
backgrounds while inheriting low-contrast frame text, making cards/panels hard
to read.

**Change.** Add `.light-surface` / `.dark-surface` helper classes plus a
conservative fallback for common inline light backgrounds, and document them in
`visual-companion.md`'s CSS reference. Pure CSS in `frame-template.html`.

---

## E. Workshop / deferred / dropped

### E1 — Hard-gate terminal-vs-HTML per question (PR #1037) — WORKSHOP

The soft guidance already exists: "decide per-question," with browser-vs-terminal
tests in `SKILL.md:156-161` and `visual-companion.md:5-25`. The complaint is that
the model renders HTML for purely textual content (A/B lists, clarifying
questions), wasting tokens and a turn. PR #1037 wraps the decision in a
`<HARD-GATE>`. **Per Jesse, we'll workshop the wording/mechanism together** —
this is behavior-shaping skill content and not specced here.

### E2 — Move session state out of the working tree (issue #975 / PR #977) — DEFERRED

Today `--project-dir` writes session state to `<project>/.superpowers/brainstorm/`
(`start-server.sh:80-84`) and the skill tells the user to gitignore it
(`visual-companion.md:58`). The ask is a `--state-dir` / `SUPERPOWERS_STATE_DIR`
default outside the repo (XDG), keeping `--project-dir` as an alias.
**Deferred by Jesse for now.** Captured so it isn't lost.

### E3 — Vendor Alpine.js for interactive mockups (PR #1639) — DROPPED

Adds a vendored Alpine build so mockups can be interactive (tabs, accordions,
forms) without hand-rolled JS. **Dropped per Jesse** — we are not taking on a
vendored third-party dependency in the companion runtime. The underlying need
(interactive mockups) is not being pursued via this route.

### E4 — Shell-lint warnings (PR #1677) — OPPORTUNISTIC

SC2034 (and friends) in `start-server.sh` / `stop-server.sh`. Trivial; fold into
B2/C1/D3 when we're already editing those scripts rather than as its own change.

---

## Suggested grouping for implementation

These cluster into a few coherent passes (each independently testable against
`tests/brainstorm-server/`):

1. **Security pass** (IN PROGRESS, branch `brainstorm-companion-session-key`) —
   A1 per-session key (supersedes A2) + A3 null-crash guard. Verify/close A4.
   *Highest priority.*
2. **Lifecycle pass** — C1 + C2 together (both touch `shutdown()` and the
   server-death story).
3. **Robustness pass** — B1, B2, B3 (independent, small).
4. **Deferred feature pass** - D1, D2, D4 are not part of PR #1720. D3 is
   shipped through the `--open` flow.

E1 is a separate workshop session. E2/E3 are out of scope for this round.
