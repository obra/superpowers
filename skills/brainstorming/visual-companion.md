# Visual Companion Guide

Browser-based visual brainstorming companion for showing mockups, diagrams, and
visual options during brainstorming.

## When to Use

Decide per-question, not per-session. The test: **would the user understand
this better by seeing it than reading it?**

**Use the browser** when the content itself is visual:

- **UI mockups** - wireframes, layouts, navigation structures, component designs
- **Architecture diagrams** - system components, data flow, relationship maps
- **Side-by-side visual comparisons** - comparing two layouts or design directions
- **Design polish** - look and feel, spacing, hierarchy, density
- **Spatial relationships** - flows, state machines, entity relationships

**Use the terminal** when the content is text or tabular:

- **Requirements and scope questions**
- **Conceptual A/B/C choices**
- **Tradeoff lists**
- **Technical decisions**
- **Clarifying questions**

A question *about* UI is not automatically visual. "What kind of wizard do you
want?" is conceptual. "Which wizard layout feels right?" is visual.

## How It Works

The server watches a directory for HTML files and serves the newest one to the
browser. You write HTML content to `screen_dir`, the user sees it in their
browser, and their selections are recorded to `state_dir/events`.

If your HTML file starts with `<!DOCTYPE` or `<html`, the server serves it
directly after injecting the helper script. Otherwise, it wraps the content with
the frame template automatically. **Write fragments by default.** Only write a
full document when you need complete page-level control.

## Starting a Session

```bash
scripts/start-server.sh --project-dir /path/to/project
```

Returns JSON like:

```json
{
  "type": "server-started",
  "port": 52341,
  "url": "http://localhost:52341",
  "screen_dir": "/path/to/project/.horspowers/brainstorm/12345-1706000000/content",
  "state_dir": "/path/to/project/.horspowers/brainstorm/12345-1706000000/state"
}
```

Save `screen_dir` and `state_dir` from the response. Tell the user to open the
URL.

**Finding connection info:** the server writes its startup JSON to
`$STATE_DIR/server-info`. If the server was launched in the background and
stdout was not captured, read that file.

**Persistence:** always pass `--project-dir` so visual artifacts persist in
`.horspowers/brainstorm/` instead of `/tmp`. If the repo does not already ignore
`.horspowers/`, add it to `.gitignore`.

## Launching by Platform

**Claude Code (macOS / Linux):**

```bash
scripts/start-server.sh --project-dir /path/to/project
```

**Claude Code (Windows):**

```bash
scripts/start-server.sh --project-dir /path/to/project
```

Launch it with background execution on the shell tool if the environment reaps
foreground calls.

**Codex:**

```bash
scripts/start-server.sh --project-dir /path/to/project
```

The script auto-detects `CODEX_CI` and switches to foreground mode when needed.

**Gemini CLI:**

```bash
scripts/start-server.sh --project-dir /path/to/project --foreground
```

If the URL is unreachable from your browser in a remote/containerized setup,
bind a non-loopback host:

```bash
scripts/start-server.sh \
  --project-dir /path/to/project \
  --host 0.0.0.0 \
  --url-host localhost
```

## The Loop

1. **Check the server is alive**, then write HTML to a new file in `screen_dir`
   - Check `$STATE_DIR/server-info` before each push
   - If it is missing, or `$STATE_DIR/server-stopped` exists, restart the server
   - Never reuse filenames

2. **Tell the user what is on screen**
   - Remind them of the URL every step, not just the first one
   - Briefly summarize the visual
   - Ask them to respond in the terminal

3. **On the next turn**
   - Read `$STATE_DIR/events` if it exists
   - Merge browser interaction data with terminal feedback

4. **Iterate or advance**
   - If the current screen needs revision, write a new file
   - Only move forward once the current question is validated

5. **Unload when returning to text-only discussion**
   - Push a waiting screen so the browser is not left on stale content

Example waiting screen:

```html
<div style="display:flex;align-items:center;justify-content:center;min-height:60vh">
  <p class="subtitle">Continuing in terminal...</p>
</div>
```

## Writing Content Fragments

Minimal example:

```html
<h2>Which layout works better?</h2>
<p class="subtitle">Consider readability and visual hierarchy</p>

<div class="options">
  <div class="option" data-choice="a" onclick="toggleSelect(this)">
    <div class="letter">A</div>
    <div class="content">
      <h3>Single Column</h3>
      <p>Clean, focused reading experience</p>
    </div>
  </div>
  <div class="option" data-choice="b" onclick="toggleSelect(this)">
    <div class="letter">B</div>
    <div class="content">
      <h3>Two Column</h3>
      <p>Sidebar navigation with main content</p>
    </div>
  </div>
</div>
```

## CSS Classes Available

The frame template provides a small set of reusable classes.

### Options

```html
<div class="options">
  <div class="option" data-choice="a" onclick="toggleSelect(this)">
    <div class="letter">A</div>
    <div class="content">
      <h3>Title</h3>
      <p>Description</p>
    </div>
  </div>
</div>
```

**Multi-select:** Add `data-multiselect` to the container to allow multiple
simultaneous selections.

```html
<div class="options" data-multiselect>
  <div class="option" data-choice="a" onclick="toggleSelect(this)">
    <div class="letter">A</div>
    <div class="content">
      <h3>Alpha</h3>
      <p>First choice</p>
    </div>
  </div>
</div>
```

### Cards

```html
<div class="cards">
  <div class="card" data-choice="design1" onclick="toggleSelect(this)">
    <div class="card-image"></div>
    <div class="card-body">
      <h3>Name</h3>
      <p>Description</p>
    </div>
  </div>
</div>
```

### Mockup container

```html
<div class="mockup">
  <div class="mockup-header">Preview: Dashboard Layout</div>
  <div class="mockup-body"></div>
</div>
```

### Split view

```html
<div class="split">
  <div class="mockup"></div>
  <div class="mockup"></div>
</div>
```

### Pros / Cons

```html
<div class="pros-cons">
  <div class="pros"><h4>Pros</h4><ul><li>Benefit</li></ul></div>
  <div class="cons"><h4>Cons</h4><ul><li>Drawback</li></ul></div>
</div>
```

### Wireframe helpers

```html
<div class="mock-nav">Logo | Home | About | Contact</div>
<div style="display:flex;">
  <div class="mock-sidebar">Navigation</div>
  <div class="mock-content">Main content area</div>
</div>
<button class="mock-button">Action Button</button>
<input class="mock-input" placeholder="Input field">
<div class="placeholder">Placeholder area</div>
```

### Typography and layout helpers

- `h2` - page title
- `h3` - section heading
- `.subtitle` - secondary text under the title
- `.section` - content block with spacing
- `.label` - compact uppercase label text

## Browser Events Format

The browser writes one JSON object per line to `$STATE_DIR/events`:

```jsonl
{"type":"click","choice":"a","text":"Option A","timestamp":1706000101}
{"type":"click","choice":"b","text":"Option B","timestamp":1706000115}
```

The event stream shows the user's exploration path. The last choice is usually
their final selection, but earlier clicks can reveal hesitation or preference
patterns worth asking about.

If the file does not exist, the user did not interact with the browser and you
should rely only on terminal feedback.

## Design Tips

- **Scale fidelity to the question** - wireframes for layout questions, higher
  polish for look-and-feel questions
- **Explain the question on each page** - "Which layout feels more professional?"
  is better than "Pick one"
- **Iterate before advancing** - if feedback changes the current screen, write a
  new version
- **Use 2-4 options max**
- **Use real content when it matters** - placeholder content can hide design
  problems
- **Keep mockups simple** - optimize for clarity, not pixel-perfect production
  design

## File Naming

- Use semantic names like `platform.html`, `visual-style.html`, `layout.html`
- Never reuse filenames
- The server serves the newest file by modification time

## Cleaning Up

```bash
scripts/stop-server.sh $SESSION_DIR
```

If the session used `--project-dir`, mockup files persist in
`.horspowers/brainstorm/` for later review. Only `/tmp` sessions get deleted.

## Reference

- Frame template: `scripts/frame-template.html`
- Helper script: `scripts/helper.js`
