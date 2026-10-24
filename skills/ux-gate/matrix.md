# Capture matrix

Read this when writing a matrix for `scripts/ux-capture`. Run it from the consuming project with the absolute script path. Paths on the command line resolve from the working directory; a relative `storageState` resolves from `--project-root`.

```json
{
  "baseUrl": "http://localhost:3000",
  "themes": ["light", "dark"],
  "viewports": [{"width": 1440, "height": 900, "dpr": 1}],
  "theme": {"mode": "class", "target": "html", "values": {"light": "", "dark": "dark"}},
  "pathways": [{
    "name": "settings",
    "path": "/settings",
    "steps": [
      {"name": "open", "waitFor": "form"},
      {"name": "name", "action": "fill", "selector": "input[name=name]", "value": "Ada", "capture": false},
      {"name": "save-focus", "action": "press", "key": "Tab", "expectFocus": "button[type=submit]"},
      {"name": "save", "action": "press", "key": "Enter", "waitFor": "text=Saved"}
    ]
  }]
}
```

`baseUrl` and a nonempty `pathways` are required. Each pathway has a unique `name` and a route `path`. Omitted `steps` default to one step named `open`; an explicitly empty step list, theme list, or viewport list is an error. Names and state labels use letters, digits, underscores, or hyphens, and output tags are unique.

A screen the changed surface has to match is captured as its own pathway, not as a `referenceScreens` entry, because reaching the matching state can take steps, such as opening a slide-out panel. Give it the steps that reach the matching state. It is captured at the matrix's themes and viewports, the same as the changed surface. Name it with the `match-` prefix, for example `match-invoice-detail`, only when the diff touches none of what that screen renders through. Then its stills are comparison references, and the gate runner ignores its mechanical results. If the diff changes something that screen renders through, such as the shared component it uses or a shared style or token, name it like any changed pathway, with no prefix: its mechanical results count and its stills are reviewed as changed, and the gate runner still pairs it beside the surface it matches.

Defaults are light and dark themes, and viewports 375×812 at DPR 2, 768×1024 at DPR 1, and 1440×900 at DPR 1. Override them with the project's supported set.

Optional matrix fields:

- `storageState`: a Playwright auth-state JSON path from the project's login procedure. A missing configured file stops the run.
- `theme`: `mode` is `media` (default), `class`, `attribute` (`data-theme`), or `localStorage`. `target` defaults to `html`, and `key` (the localStorage key) to `theme`. `values` maps each theme to the value to set; match the app's theme initialization.
- `fonts`: required web-font families, each with a loaded FontFace. Omit system and generic fallbacks.
- `allowOverflow`, `allowOverlap`, `allowLight`: selectors exempting intentional layouts, descendants included, from those checks.
- `referenceScreens`: unchanged routes captured as design examples, at the first viewport in every theme, on an unfiltered full run.

Step fields:

| Field | Meaning |
|---|---|
| `name` | Unique step label within its pathway. |
| `state` | Output label, default `default`. It creates no UI state; seed or select that separately. |
| `action` | `click`, `hover`, `focus`, `scroll`, `fill`, or `press`; omit for capture/assertions only. |
| `selector` | Playwright selector for the action. Required except for page-level `press`. |
| `value` / `key` | String for `fill` / key combination for `press`, such as `Tab`, `Shift+Tab`, `Enter`, or `Escape`. |
| `expectFocus` | CSS selector that must match the active element after the action. |
| `waitFor` | Playwright selector that must become visible before capture. |
| `capture` | Default true. False keeps actions and checks but skips the step's images. |
| `fullPage` | Default false; true captures the full page. |
| `crops` | Component selectors to capture at DPR 2. |
| `motion` | True adds normal/reduced-motion frames to a filmstrip on full runs. |

Crops and reduced-motion frames replay earlier actions in fresh browser contexts that share the server, so seed resettable fixtures for mutating pathways.

`--pathway <name>` is repeatable. `--baseline <dir>` compares same-named stills; a missing baseline still is `new`. `--video` records local video on a best-effort basis and never changes the exit code; images remain the evidence.

`mechanical.json` records checks and artifact paths per step. Exit 0 means no findings at `should` or above, 1 means findings, and 2 means the capture cannot run. A missing optional axe module is `unavailable`. A failed installed scan or requested capture artifact is a blocker.
