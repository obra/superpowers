---
name: ace-hyperdata-app
description: Build and deliver a hosted single-file HTML app for a HyperData hub — either by claiming an App-Workshop build order (hd workshop) or by building one directly on request. Use when the user mentions HyperData app, hosted app, workshop build order, 工坊构建单, 给 hub 造应用, or asks ACE to develop an app against HyperData data.
---

# ACE × HyperData — Hosted App Development

Deliver a single-file HTML app to a [HyperData](https://github.com/hyper-instrument/hyper-data)
hub, as an **external builder** running on the user's own machine. The hub only
sees HTTP + a scoped PAT — it does not care that ACE (or codex under ACE) is
driving.

Two modes:

| Mode | Trigger | Path |
|------|---------|------|
| **A. Claim** | The hub's App Workshop has an open build order | `hd workshop claim` five-step contract |
| **B. Direct** | The user asks you to build an app for a hub, no order exists | build → validate → `POST /api/v1/hosted-apps` |

**Single source of truth:** the authoritative build contract lives in the
HyperData client's bundled skill `hyperdata-workshop-build`, installed by
`hd agent init`. This skill tells you how to get connected, which mode you are
in, and what ACE adds — it does NOT duplicate the contract. When in doubt,
the installed `hyperdata-workshop-build` skill and `hd workshop --help` win.

## Phase 0 — Connect (once per machine/project)

```bash
# 1. Thin client in a clean venv (do not reuse someone else's .venv)
pip install "hyperdata-client @ git+https://github.com/hyper-instrument/hyper-data.git#subdirectory=client"

# 2. PAT with BOTH scopes (ask the hub admin, or self-issue after hd login):
#      workshop:build      — claim / progress / report build orders
#      hosted-apps:write   — submit the app draft
hd connect http://<your-hub>:8021 --token <PAT>
hd auth status                      # must show your identity + endpoint

# 3. Pull the official operating skills into this project (codex shape:
#    AGENTS.md index + MCP config snippet; use plain `hd agent init` for Claude Code)
hd agent init --ide codex
```

Optional but recommended — register the HyperData MCP server so you can query
real data while designing the app (append the snippet `hd agent init` prints
to your codex `config.toml`, or run `claude mcp add hyperdata -- hd mcp`).

**Gate:** do not proceed until `hd auth status` succeeds. If it fails, stop
and fix connectivity/credentials with the user — nothing downstream works.

## Data first, then pixels (hard rule)

Never invent API responses. Before writing any HTML:

1. Probe the real data the app will show — `hd search`, `hd dataset ls`,
   HyperData MCP tools, or plain GET requests against the hub API.
2. Record the exact endpoints and response shapes you observed.
3. The app's `<meta name="hd-app-manifest" content='{"api_paths": [...]}'>`
   must list exactly the API prefixes you verified — no more, no fewer.

An app whose manifest lists unverified paths will fail the hub's static gate
or, worse, render an empty shell for the user.

## Mode A — Claim a workshop build order

Follow the installed `hyperdata-workshop-build` skill's five-step contract.
The short shape (details and failure handling live in that skill):

```bash
hd workshop list                     # what is claimable
hd workshop claim                    # empty result = taken or paused → STOP
hd workshop stage  --id <ID> --note "已认领,开始按需求单构建"
# ... build (see ACE additions below) ...
hd workshop submit --id <ID> --file app.html --title "<name>" \
    --summary "<app>: <one line> gate 自查 OK"
# stuck / slug conflict → hd workshop report --id <ID> --status escalated --summary "<why>"
```

Non-negotiables inherited from the contract: an empty claim means stop; never
force through a 409; `--summary` must be a real sentence; you are the
executor — do not re-delegate the claimed order to another agent.

## Mode B — Direct build (no work order)

When the user asks for an app directly, there is no work item to claim or
report against. Build the file, then:

```bash
# 1. Dry-run the hub's static gate (same checks as submit; fix until ok=true)
curl -s -X POST "$HUB/api/v1/hosted-apps/validate" \
  -H "Authorization: Bearer $PAT" -H "Content-Type: application/json" \
  -d "$(jq -n --rawfile html app.html '{html: $html}')"

# 2. Submit the draft (owner = you; the hub still human-reviews before publish)
curl -s -X POST "$HUB/api/v1/hosted-apps" \
  -H "Authorization: Bearer $PAT" -H "Content-Type: application/json" \
  -d "$(jq -n --rawfile html app.html \
        '{name: "<slug>", title: "<name>", html: $html}')"
```

`name` is a `[a-z0-9-]{3,40}` slug; 409 means the slug belongs to someone
else — pick another, do not fight it. 422 returns a violations list — fix
each item and resubmit.

## App constraints (both modes)

Single-file HTML, everything inlined. The hub's static gate rejects:
external scripts/styles/fonts, admin or management API paths, a missing or
dishonest `hd-app-manifest` meta. The gate's word is final — iterate against
`/hosted-apps/validate` until clean, and only then submit.

## What ACE adds

- **Method, not vibes.** Non-trivial requirement → run `brainstorming` first,
  then `writing-plans`; trivial chart-over-one-endpoint → build directly.
  Before claiming done, run `verification-before-completion`: open the HTML
  in a browser against the live hub and see real data render.
- **Progress is visible.** In Mode A, `hd workshop stage` at every meaningful
  step — the workshop panel streams your `stage_log` to the requesting user.
- **Experience compounds.** Your ACE hooks trace this build session; lessons
  (gate violations you hit, response shapes that surprised you) land in
  gbrain and surface on the next build. Trust the recall when it warns you.
- **Data flows back.** If the app was built around an ACE workflow's output,
  push the run itself to the hub too (`ace workflow run <wf> --push-result`)
  so the app and its source data live side by side.
