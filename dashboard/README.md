# Superpowers eval dashboard

Static GitHub Pages dashboard that visualizes per-commit skill eval scores.
Primary purpose: **regression detection**.

## Files

| Path                          | Purpose                                                 |
|-------------------------------|---------------------------------------------------------|
| `index.html`                  | Landing page — grid of all skills + regression callout. |
| `skill.html`                  | Drill-down for one skill (`?name=<skill>`).             |
| `assets/app.js`               | Shared JS — manifest loader, sparkline, chart, tables.  |
| `assets/styles.css`           | Styling (light + dark mode).                            |
| `assets/chart.umd.js`         | Vendored Chart.js v4.5.1 (MIT). Used on drill-down only.|
| `assets/LICENSE.chartjs.md`   | Chart.js license, preserved alongside the bundle.       |

## Chart.js vendoring

| Field    | Value                                                         |
|----------|---------------------------------------------------------------|
| Version  | 4.5.1                                                         |
| Source   | <https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.js> |
| License  | MIT (see `assets/LICENSE.chartjs.md`)                         |
| SHA-256  | `ECC3CD1EEB8C34D2178E3F59FD63EC5A3D84358C11730AF0B9958DC886D7652A` |

To upgrade, re-download from the pinned URL pattern, refresh the hash, and
update this README.

## Data sources

The dashboard fetches files **relative** to its own URL — no absolute paths
and no `window.location` parsing — so it works at any GitHub Pages base
path. It reads:

- `data/manifest.json`             — produced by `scripts/build-manifest.ps1`
- `data/<skill>/history.jsonl`     — produced by `scripts/wrap-eval-output.ps1`
- `data/<skill>/runs/<…>.json`     — produced by `scripts/wrap-eval-output.ps1`

`manifest.json` carries enough summary data (per-skill `sparkline`,
`biggest_drop_last_10`, plus a global `worst_recent_drop`) that the landing
page does a single fetch — full history is only loaded on the drill-down.

The landing page uses `manifest.repository` (e.g. `mthalman/superpowers`)
to build GitHub commit URLs. This avoids guessing the repo from
`location.host` / `location.pathname`, which breaks for forks, user-pages
sites, renamed repos, and custom domains.

## Security

All data is rendered with `textContent` and DOM APIs — never raw HTML
interpolation. `commit_message`, `error`, `metrics`, and adapter strings
are all untrusted.

## Local smoke testing

```powershell
# Stage a fake gh-pages tree.
$pages = New-TemporaryFile | Select-Object -ExpandProperty FullName
Remove-Item $pages; New-Item -ItemType Directory -Path $pages | Out-Null
Copy-Item dashboard/* $pages -Recurse

# Seed minimal data.
New-Item -ItemType Directory -Path "$pages/data/code-review/runs" -Force | Out-Null
Set-Content "$pages/data/code-review/history.jsonl" `
  '{"commit":"abc1234abc","short_sha":"abc1234","timestamp":"2026-05-29T10:00:00Z","pattern":"A","headline_score":75.0,"status":"ok","adapter":"smoke","detail_file":"runs/2026-05-29T10-00-00Z-abc1234.json"}'
Set-Content "$pages/data/code-review/runs/2026-05-29T10-00-00Z-abc1234.json" `
  '{"schema_version":1,"pattern":"A","detail":{"cases":[]}}'
pwsh -File scripts/build-manifest.ps1 -PagesDir $pages -Repository owner/repo

# Serve.
python -m http.server -d $pages 8080
# Open http://localhost:8080/
```

`file://` browsing won't work — most browsers block `fetch()` against
local files for security. Use a real static server (anything: `python -m
http.server`, `npx http-server`, `caddy file-server`, ...).

## How it ships

Files in this directory are committed on `main`. The skill-eval workflow's
`publish` job (`.github/workflows/skill-eval.yml`) copies them onto the
`gh-pages` branch alongside the `data/` directory it writes. Dashboard-only
edits trigger the workflow's publish step too, so changes appear without
needing an eval re-run.
